import { CosmWasmClient, ExecuteResult, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet, makeCosmoshubPath } from "@cosmjs/proto-signing";
import { SecretNetworkClient, Wallet } from "secretjs";
import { Coin } from "secretjs/dist/protobuf/cosmos/base/v1beta1/coin";

import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { Account, ChainType, Network, TxnStdFee } from "../types";
import { defaultFees, defaultFeesJuno } from "./constants";

export async function getClient (network: Network): Promise<SecretNetworkClient | CosmWasmClient> {
  const chain = getChainFromAccount(network);
  switch (chain) {
    case ChainType.Secret: {
      return new SecretNetworkClient({
        chainId: network.config.chainId,
        url: network.config.endpoint
      });
    }
    case ChainType.Juno: {
      return await CosmWasmClient.connect(network.config.endpoint);
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: network.config.accounts[0].address });
    }
  }
}

export async function getSigningClient (
  network: Network,
  account: Account
): Promise<SecretNetworkClient | SigningCosmWasmClient> {
  const chain = getChainFromAccount(network);
  switch (chain) {
    case ChainType.Secret: {
      const wall = new Wallet(account.mnemonic);
      return new SecretNetworkClient({
        url: network.config.endpoint,
        chainId: network.config.chainId,
        wallet: wall,
        walletAddress: account.address
      });
    }
    case ChainType.Juno: {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(account.mnemonic, {
        hdPaths: [makeCosmoshubPath(0)],
        prefix: "juno"
      });
      return await SigningCosmWasmClient.connectWithSigner(
        network.config.endpoint,
        wallet
      );
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: network.config.accounts[0].address });
    }
  }
}

function getChainFromAccount (network: Network): ChainType {
  if (network.config.accounts[0].address.startsWith("secret")) {
    return ChainType.Secret;
  } else if (network.config.accounts[0].address.startsWith("juno")) {
    return ChainType.Juno;
    // } else if (network.config.accounts[0].address.startsWith("inj")) {
    //   return ChainType.Injective;
  } else {
    throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
      { account: network.config.accounts[0].address });
  }
}

export async function storeCode (
  network: Network,
  signingClient: any,
  sender: string,
  contractName: string,
  wasmFileContent: Buffer,
  customFees?: TxnStdFee,
  source?: string,
  builder?: string
): Promise<{codeId: number, contractCodeHash: any}> {
  if (network.config.accounts[0].address.startsWith("secret")) {
    const inGasLimit = parseInt(customFees?.gas as string);
    const inGasPrice =
      parseFloat(customFees?.amount[0].amount as string) /
      parseFloat(customFees?.gas as string);

    const uploadReceipt = await signingClient.tx.compute.storeCode(
      {
        sender: sender,
        wasm_byte_code: wasmFileContent,
        source: source ?? "",
        builder: builder ?? ""
      },
      {
        gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
        gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice
      }
    );
    const res = uploadReceipt?.arrayLog?.find(
      (log: any) => log.type === "message" && log.key === "code_id"
    );
    if (res === undefined) {
      throw new PolarError(ERRORS.GENERAL.STORE_RESPONSE_NOT_RECEIVED, {
        jsonLog: JSON.stringify(uploadReceipt, null, 2),
        contractName: contractName
      });
    }
    const codeId = Number(res.value);

    const contractCodeHash = await signingClient.query.compute.codeHashByCodeId({
      code_id: codeId.toString()
    });
    return { contractCodeHash: contractCodeHash, codeId: codeId };
  } else if (network.config.accounts[0].address.startsWith("juno")) {
    const uploadReceipt = await signingClient.upload(
      sender,
      wasmFileContent,
      customFees ?? defaultFeesJuno.upload,
      "uploading"
    );
    const codeId: number = uploadReceipt.codeId;
    return { codeId: codeId, contractCodeHash: { code_hash: "not_required" } };
    // } else if (network.config.accounts[0].address.startsWith("inj")) {
    //   return ChainType.Injective;
  } else {
    throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
      { account: network.config.accounts[0].address });
  }
}

export async function instantiateContract (
  network: Network,
  signingClient: any,
  codeId: number,
  sender: string,
  contractName: string,
  contractCodeHash: string,
  initArgs: Record<string, unknown>,
  label: string,
  transferAmount?: Coin[],
  customFees?: TxnStdFee,
  contractAdmin?: string | undefined
): Promise<string> {
  const chain = getChainFromAccount(network);
  switch (chain) {
    case ChainType.Secret: {
      if (contractCodeHash === "mock_hash") {
        throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_DEPLOYED, {
          param: contractName
        });
      }
      const inGasLimit = parseInt(customFees?.gas as string);
      const inGasPrice =
        parseFloat(customFees?.amount[0].amount as string) /
        parseFloat(customFees?.gas as string);

      const tx = await signingClient.tx.compute.instantiateContract(
        {
          code_id: codeId,
          sender: sender,
          code_hash: contractCodeHash,
          init_msg: initArgs,
          label: label,
          init_funds: transferAmount
        },
        {
          gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
          gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice
        }
      );

      // Find the contract_address in the logs
      const res = tx?.arrayLog?.find(
        (log: any) => log.type === "message" && log.key === "contract_address"
      );
      if (res === undefined) {
        throw new PolarError(ERRORS.GENERAL.INIT_RESPONSE_NOT_RECEIVED, {
          jsonLog: JSON.stringify(tx, null, 2),
          contractName: contractName
        });
      }
      return res.value;
    }
    case ChainType.Juno: {
      const contract = await signingClient.instantiate(
        sender,
        codeId,
        initArgs,
        label,
        customFees ?? defaultFeesJuno.init,
        {
          funds: transferAmount,
          admin: contractAdmin
        }
      );
      return contract.contractAddress;
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: network.config.accounts[0].address });
    }
  }
}
export async function executeTransaction (
  network: Network,
  signingClient: any,
  sender: string,
  contractAddress: string,
  contractCodeHash: string,
  msgData: Record<string, unknown>,
  transferAmount?: readonly Coin[],
  customFees?: TxnStdFee,
  memo?: string
): Promise<any> {
  const chain = getChainFromAccount(network);

  switch (chain) {
    case ChainType.Secret: {
      const inGasLimit = parseInt(customFees?.gas as string);
      const inGasPrice =
        parseFloat(customFees?.amount[0].amount as string) /
        parseFloat(customFees?.gas as string);
      return signingClient.tx.compute.executeContract(
        {
          sender: sender,
          contract_address: contractAddress,
          code_hash: contractCodeHash,
          msg: msgData,
          sent_funds: transferAmount as Coin[] | undefined
        },
        {
          gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
          gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice,
          memo: memo
        }
      );
    }
    case ChainType.Juno: {
      const customFeesVal: TxnStdFee | undefined = customFees !== undefined
        ? customFees : network.config.fees?.exec;
      return signingClient.execute(
        sender,
        contractAddress,
        msgData,
        customFeesVal ?? defaultFeesJuno.exec,
        memo === undefined ? "executing" : memo,
        transferAmount
      );
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: network.config.accounts[0].address });
    }
  }
}

export async function sendQuery (
  client: any,
  network: Network,
  msgData: any,
  contractAddress: string,
  contractHash: string
): Promise<any> {
  const chain = getChainFromAccount(network);

  switch (chain) {
    case ChainType.Secret: {
      return client.query.compute.queryContract({
        contract_address: contractAddress,
        query: msgData,
        code_hash: contractHash
      });
    }
    case ChainType.Juno: {
      return client.queryContractSmart(contractAddress, msgData);
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: network.config.accounts[0].address });
    }
  }
}
