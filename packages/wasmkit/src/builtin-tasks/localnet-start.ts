import { task } from "../internal/core/config/config-env";
import { startLocalnet } from "../lib/localnet/start";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_LOCALNET_START } from "./task-names";

export default function (): void {
  task(TASK_LOCALNET_START, "Spinup a localnetwork")
    .addPositionalParam("nodeType", "Network node type to run")
    .addFlag("clean", "Clean any previous run and start from block 1")
    .addFlag("withExplorer", "Start a native-GUI based explorer for localnetwork")
    .setAction(localnetTask);
}

export interface TaskArgs {
  nodeType: string
  clean: boolean
  withExplorer: boolean
}

async function localnetTask (
  { nodeType, clean, withExplorer }: TaskArgs,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  return await startLocalnet(nodeType, clean, withExplorer, env);
}
