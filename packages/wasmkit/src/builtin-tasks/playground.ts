import { createPlayground } from "../internal/cli/playground-creation";
import { task } from "../internal/core/config/config-env";
import { TEMPLATES_GIT_REMOTE_PLAYGROUND } from "../lib/constants";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_CREATE_PLAYGROUND } from "./task-names";

export default function (): void {
  task(TASK_CREATE_PLAYGROUND, "Initialize the playground in the project directory")
    .addOptionalParam(
      "templatePath",
      "Repository path of custom playground template",
      TEMPLATES_GIT_REMOTE_PLAYGROUND
    ) // add optional type of value here (example, string) for validation
    .setAction(playgroundTask);
}

export interface TaskArgs {
  templatePath: string
}

async function playgroundTask (
  { templatePath }: TaskArgs,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  const templateName = "playground";
  const destination = process.cwd();
  return await createPlayground(templatePath, templateName, destination, env);
}
