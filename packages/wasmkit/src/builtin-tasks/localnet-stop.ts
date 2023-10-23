import { task } from "../internal/core/config/config-env";
import { stopLocalnet } from "../lib/localnet/stop";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_LOCALNET_STOP } from "./task-names";

export default function (): void {
  task(TASK_LOCALNET_STOP, "Stop a running localnetwork")
    .addPositionalParam("nodeType", "Network node type to stop")
    .setAction(localnetTask);
}

export interface TaskArgs {
  nodeType: string
}

async function localnetTask (
  { nodeType }: TaskArgs,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  return await stopLocalnet(nodeType, env);
}
