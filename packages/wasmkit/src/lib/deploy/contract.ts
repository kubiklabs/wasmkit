import { ArchwayClient } from "@archwayhq/arch3.js/build";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import fs from "fs-extra";
import path from "path";
import { SecretNetworkClient } from "secretjs";

import { WasmkitContext } from "../../internal/context";
import { WasmkitError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import { ARTIFACTS_DIR } from "../../internal/core/project-structure";
import { replaceAll } from "../../internal/util/strings";
import { compress } from "../../lib/deploy/compress";
import type {
  Account,
  Checkpoints,
  Coin,
  DeployInfo,
  InstantiateInfo,
  TxnStdFee,
  UserAccount,
  WasmkitRuntimeEnvironment
} from "../../types";
import { loadCheckpoint, persistCheckpoint } from "../checkpoints";
import { executeTransaction, getClient, getSigningClient, instantiateContract, sendQuery, storeCode } from "../client";

export interface ExecArgs {
  account: Account | UserAccount
  transferAmount: readonly Coin[] | undefined
  customFees: TxnStdFee | undefined
}

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;

  private readonly env: WasmkitRuntimeEnvironment =
  WasmkitContext.getWasmkitContext().getRuntimeEnv();

  private client?: SecretNetworkClient | CosmWasmClient | ArchwayClient;

  public codeId: number;
  public contractCodeHash: string;
  public contractAddress: string;
  public instantiateTag: string;
  private checkpointData: Checkpoints;
  private readonly checkpointPath: string;

  constructor (contractName: string, instantiateTag?: string) {
    this.contractName = replaceAll(contractName, "-", "_");
    this.codeId = 0;
    this.contractCodeHash = "mock_hash";
    this.contractAddress = "mock_address";
    this.contractPath = path.join(
      ARTIFACTS_DIR,
      "contracts",
      `${this.contractName}_compressed.wasm`
    );
    this.instantiateTag = instantiateTag ?? "default_instantiate";

    // Load checkpoints
    this.checkpointPath = path.join(ARTIFACTS_DIR, "checkpoints", `${this.contractName}.yaml`);
    // file exist load it else create new checkpoint
    // skip checkpoints if test command is run, or skip-checkpoints is passed
    if (fs.existsSync(this.checkpointPath) && this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData = loadCheckpoint(this.checkpointPath);
      const contractHash =
        this.checkpointData[this.env.network.name]?.deployInfo?.contractCodeHash;
      const contractCodeId = this.checkpointData[this.env.network.name]?.deployInfo?.codeId;
      let contractAddr;
      // Load instantiate info for tag
      for (const value of this.checkpointData[this.env.network.name]?.instantiateInfo ?? []) {
        if (value.instantiateTag === this.instantiateTag) {
          contractAddr = value.contractAddress;
        }
      }
      this.contractCodeHash = contractHash ?? "mock_hash";
      this.codeId = contractCodeId ?? 0;
      this.contractAddress = contractAddr ?? "mock_address";
    } else {
      this.checkpointData = {};
    }
  }

  async setupClient (): Promise<void> {
    this.client = await getClient(this.env.network);
  }

  async deploy (
    account: Account | UserAccount,
    customFees?: TxnStdFee,
    source?: string,
    builder?: string
  ): Promise<DeployInfo> {
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    const info = this.checkpointData[this.env.network.name]?.deployInfo;
    if (info) {
      console.log("Warning: contract already deployed, using checkpoints");
      return info;
    }
    await compress(this.contractName, this.env);

    const wasmFileContent: Buffer = fs.readFileSync(this.contractPath);
    const signingClient = await getSigningClient(this.env.network, accountVal);

    const { codeId, contractCodeHash } = await storeCode(
      this.env.network,
      signingClient,
      accountVal.address,
      this.contractName,
      wasmFileContent,
      customFees,
      source,
      builder
    );
    this.codeId = codeId;
    const deployInfo: DeployInfo = {
      codeId: codeId,
      contractCodeHash: contractCodeHash.code_hash as string,
      deployTimestamp: String(new Date())
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData[this.env.network.name] = {
        ...this.checkpointData[this.env.network.name],
        deployInfo
      };
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    this.contractCodeHash = contractCodeHash.code_hash as string;

    return deployInfo;
  }

  instantiatedWithAddress (
    address: string,
    timestamp?: Date | undefined
  ): void {
    const initTimestamp = timestamp !== undefined ? String(timestamp) : String(new Date());

    // contract address already exists
    if (this.contractAddress !== "mock_address") {
      console.log(
        `Contract ${this.contractName} already has address: ${this.contractAddress}, skipping`
      );
      return;
    } else {
      this.contractAddress = address;
    }

    const instantiateInfo: InstantiateInfo = {
      instantiateTag: this.instantiateTag,
      contractAddress: address,
      instantiateTimestamp: initTimestamp
    };
    // set init data (contract address, init timestamp) in checkpoints
    const instInfo = this.checkpointData[this.env.network.name].instantiateInfo;
    if (instInfo) {
      this.checkpointData[this.env.network.name].instantiateInfo?.push(instantiateInfo);
    } else {
      this.checkpointData[this.env.network.name].instantiateInfo = [instantiateInfo];
    }
    persistCheckpoint(this.checkpointPath, this.checkpointData);
  }

  async instantiate (
    initArgs: Record<string, unknown>,
    label: string,
    account: Account | UserAccount,
    transferAmount?: Coin[],
    customFees?: TxnStdFee,
    contractAdmin?: string | undefined
  ): Promise<InstantiateInfo> {
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    // if (this.contractCodeHash === "mock_hash") {
    //   throw new WasmkitError(ERRORS.GENERAL.CONTRACT_NOT_DEPLOYED, {
    //     param: this.contractName
    //   });
    // }
    let info;
    // Load instantiate info for tag
    if (this.checkpointData[this.env.network.name] !== undefined) {
      for (const value of this.checkpointData[this.env.network.name].instantiateInfo ?? []) {
        if (value.instantiateTag === this.instantiateTag) {
          info = value;
        }
      }
    }
    if (info) {
      console.log("Warning: contract already instantiated, using checkpoints");
      return info;
    }
    const signingClient = await getSigningClient(this.env.network, accountVal);
    const initTimestamp = String(new Date());
    label =
      this.env.runtimeArgs.command === "test"
        ? `deploy ${this.contractName} ${initTimestamp}`
        : label;
    console.log(`Instantiating with label: ${label}`);

    this.contractAddress = await instantiateContract(
      this.env.network,
      signingClient,
      this.codeId,
      accountVal.address,
      this.contractName,
      this.contractCodeHash,
      initArgs,
      label,
      transferAmount,
      customFees,
      contractAdmin
    );

    const instantiateInfo: InstantiateInfo = {
      instantiateTag: this.instantiateTag,
      contractAddress: this.contractAddress,
      instantiateTimestamp: initTimestamp
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      const instInfo = this.checkpointData[this.env.network.name].instantiateInfo;
      if (instInfo) {
        this.checkpointData[this.env.network.name].instantiateInfo?.push(instantiateInfo);
      } else {
        this.checkpointData[this.env.network.name].instantiateInfo = [instantiateInfo];
      }
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    return instantiateInfo;
  }

  async queryMsg (msgData: Record<string, unknown>): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (this.contractAddress === "mock_address") {
      throw new WasmkitError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Query the contract
    console.log("Querying", this.contractAddress, "=>", Object.keys(msgData)[0]);
    console.log(this.contractAddress, msgData);

    if (this.client === undefined) {
      throw new WasmkitError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
    }

    return await sendQuery(
      this.client, this.env.network, msgData, this.contractAddress, this.contractCodeHash
    );
  }

  async executeMsg (
    msgData: Record<string, unknown>,
    account: Account | UserAccount,
    customFees?: TxnStdFee,
    memo?: string,
    transferAmount?: readonly Coin[]
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    if (this.contractAddress === "mock_address") {
      throw new WasmkitError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Send execute msg to the contract
    const signingClient = await getSigningClient(this.env.network, accountVal);
    console.log("Executing", this.contractAddress, msgData);

    return await executeTransaction(
      this.env.network,
      signingClient,
      accountVal.address,
      this.contractAddress,
      this.contractCodeHash,
      msgData,
      transferAmount,
      customFees,
      memo
    );
  }
}
