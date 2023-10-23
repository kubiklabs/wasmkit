import { task } from "../internal/core/config/config-env";
import { listLocalnet } from "../lib/localnet/list";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_LOCALNET_LIST } from "./task-names";

export default function (): void {
  task(TASK_LOCALNET_LIST, "List available localnetworks")
    .setAction(localnetTask);
}

export interface TaskArgs {
}

async function localnetTask (
  {}: TaskArgs,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  return await listLocalnet(env);
}
