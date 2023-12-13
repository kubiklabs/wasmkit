import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SecretNetworkClient } from "secretjs";

import { task } from "../internal/core/config/config-env";
import { WasmkitError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { getChainFromAccount, getClient } from "../lib/client";
import { ChainType, TaskArguments, WasmkitRuntimeEnvironment } from "../types";
import { TASK_NODE_INFO } from "./task-names";

export default function (): void {
  task(TASK_NODE_INFO, "Prints node info and status")
    .setAction(nodeInfo);
}

async function nodeInfo (
  _taskArgs: TaskArguments,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  const client = await getClient(env.network);
  console.log("Network: ", env.network.name);
  const chain = getChainFromAccount(env.network);

  switch (chain) {
    case ChainType.Secret: {
      const tendermintClient = (client as SecretNetworkClient).query.tendermint;
      const blockInfo = await tendermintClient.getLatestBlock({});
      console.log("Block height: ", blockInfo);
      // console.log("ChainId: ", await tendermintClient.getChainId()); // TODO: replace this

      const nodeInfo = await tendermintClient.getNodeInfo({})
        // eslint-disable-next-line
        .catch((err: any) => { throw new Error(`Could not fetch node info: ${err}`); });
      console.log("Node Info: ", nodeInfo);
      break;
    }
    case ChainType.Juno:
    case ChainType.Osmosis:
    case ChainType.Archway:
    case ChainType.Neutron:
    case ChainType.Atom:
    case ChainType.Umee:
    case ChainType.Nibiru:
    case ChainType.Terra: {
      console.log("ChainId: ", await (client as CosmWasmClient).getChainId());
      console.log("Block height: ", await (client as CosmWasmClient).getHeight());
      break;
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new WasmkitError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: env.network.config.accounts[0].address });
    }
  }
}
