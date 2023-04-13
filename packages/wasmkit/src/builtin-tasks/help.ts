import { HelpPrinter } from "../internal/cli/help-printer";
import { task } from "../internal/core/config/config-env";
import { WASMKIT_PARAM_DEFINITIONS } from "../internal/core/params/wasmkit-params";
import { getPackageJson } from "../internal/util/packageInfo";
import { WasmkitRuntimeEnvironment } from "../types";
import { TASK_HELP } from "./task-names";

const WASMKIT_NAME = "wasmKit";
export default function (): void {
  task(TASK_HELP, "Prints this message")
    .addOptionalPositionalParam(
      "task",
      "An optional task to print more info about"
    )
    .setAction(help);
}

async function help (
  { task: taskName }: { task?: string }, env: WasmkitRuntimeEnvironment
): Promise<void> {
  const packageJson = await getPackageJson();
  const helpPrinter = new HelpPrinter(
    WASMKIT_NAME,
    packageJson.version,
    WASMKIT_PARAM_DEFINITIONS,
    env.tasks
  );

  if (taskName !== undefined) {
    helpPrinter.printTaskHelp(taskName);
    return;
  }

  helpPrinter.printGlobalHelp();
}
