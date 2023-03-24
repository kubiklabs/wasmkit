import { task } from "../internal/core/config/config-env";
import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { getChainFromAccount, getClient } from "../lib/client";
import { ChainType, PolarRuntimeEnvironment, TaskArguments } from "../types";
import { TASK_NODE_INFO } from "./task-names";

export default function (): void {
  task(TASK_NODE_INFO, "Prints node info and status")
    .setAction(nodeInfo);
}

async function nodeInfo (_taskArgs: TaskArguments, env: PolarRuntimeEnvironment): Promise<void> {
  const client = await getClient(env.network) as any;
  console.log("Network:", env.network.name);
  console.log("ChainId:", env.network.config.chainId);
  const chain = getChainFromAccount(env.network);

  switch (chain) {
    case ChainType.Secret: {
      console.log("Block height:", await client.query.tendermint.getLatestBlock({}));
      const nodeInfo = await client.query.tendermint.getNodeInfo({})
        // eslint-disable-next-line
        .catch((err: any) => { throw new Error(`Could not fetch node info: ${err}`); });
      console.log('Node Info: ', nodeInfo);
      break;
    }
    case ChainType.Juno: {
      console.log("ChainId:", await client.getChainId());
      console.log("Block height:", await client.getHeight());
      break;
    }
    // case ChainType.Injective: {

    // }
    default: {
      throw new PolarError(ERRORS.NETWORK.UNKNOWN_NETWORK,
        { account: env.network.config.accounts[0].address });
    }
  }
}
