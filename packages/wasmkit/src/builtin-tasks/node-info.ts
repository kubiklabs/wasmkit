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

async function nodeInfo (_taskArgs: TaskArguments, env: WasmkitRuntimeEnvironment): Promise<void> {
  const client = await getClient(env.network) as any;
  console.log("Network: ", env.network.name);
  const chain = getChainFromAccount(env.network);

  switch (chain) {
    case ChainType.Secret: {
      const tendermintClient = client.query.tendermint;
      const blockInfo = await tendermintClient.getLatestBlock({});
      console.log("Block height: ", blockInfo);
      console.log("ChainId: ", await tendermintClient.getChainId());

      const nodeInfo = await tendermintClient.getNodeInfo({})
        // eslint-disable-next-line
        .catch((err: any) => { throw new Error(`Could not fetch node info: ${err}`); });
      console.log("Node Info: ", nodeInfo);
      break;
    }
    case ChainType.Juno:
    case ChainType.Archway:
    case ChainType.Neutron:
    case ChainType.Terra: {
      console.log("ChainId: ", await client.getChainId());
      console.log("Block height: ", await client.getHeight());
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
