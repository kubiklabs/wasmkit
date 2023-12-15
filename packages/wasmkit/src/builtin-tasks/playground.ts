import { createPlayground } from "../internal/cli/playground-creation";
import { task } from "../internal/core/config/config-env";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_CREATE_PLAYGROUND } from "./task-names";

export default function (): void {
  task(TASK_CREATE_PLAYGROUND, "Initialize the playground in the project directory").setAction(
    playgroundTask
  );
}

export interface TaskArgs {
  projectName: string
  templateName: string
  destination: string
}

async function playgroundTask (
  { projectName, templateName, destination }: TaskArgs,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  projectName = "playground";
  templateName = "playground";
  destination = process.cwd();
  return await createPlayground(projectName, templateName, destination, env);
}
