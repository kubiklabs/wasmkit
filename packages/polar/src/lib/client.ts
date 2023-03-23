import { CosmWasmClient, ExecuteResult, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet, makeCosmoshubPath } from "@cosmjs/proto-signing";
import { SecretNetworkClient, Wallet } from "secretjs";

import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { Account, ChainType, Network } from "../types";

export async function getClient (network: Network): Promise<SecretNetworkClient | CosmWasmClient> {
  // get account type from config, also handle error if account not found
  // enum
  return new SecretNetworkClient({
    chainId: network.config.chainId,
    url: network.config.endpoint
  });
}

export function getSigningClient (
  network: Network,
  account: Account
): SecretNetworkClient {
  const wall = new Wallet(account.mnemonic);
  return new SecretNetworkClient({
    url: network.config.endpoint,
    chainId: network.config.chainId,
    wallet: wall,
    walletAddress: account.address
  });
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
