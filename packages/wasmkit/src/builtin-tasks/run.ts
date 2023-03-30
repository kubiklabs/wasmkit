import debug from "debug";
import fsExtra from "fs-extra";
import path from "path";
import * as ts from "typescript";

import { task } from "../internal/core/config/config-env";
import { WasmkitError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { SCRIPTS_DIR } from "../internal/core/project-structure";
import { runScript } from "../internal/util/script-runner";
import { buildTsScripts } from "../lib/compile/scripts";
import { assertDirChildren } from "../lib/files";
import { WasmkitRuntimeEnvironment } from "../types";
import { TASK_RUN } from "./task-names";

interface Input {
  scripts: string[]
  skipCheckpoints: boolean
}

export function filterNonExistent (scripts: string[]): string[] {
  return scripts.filter(script => !fsExtra.pathExistsSync(script));
}

async function runScripts (
  runtimeEnv: WasmkitRuntimeEnvironment,
  scriptNames: string[],
  force: boolean,
  logDebugTag: string,
  allowWrite: boolean
): Promise<void> {
  const log = debug(logDebugTag);

  // force boolean will be used when we have checkpoint support

  for (const relativeScriptPath of scriptNames) {
    log(`Running script ${relativeScriptPath}`);
    await runScript(
      relativeScriptPath,
      runtimeEnv
    );
  }
}

async function executeRunTask (
  { scripts, skipCheckpoints }: Input,
  runtimeEnv: WasmkitRuntimeEnvironment
  // eslint-disable-next-line
): Promise<any> {
  const logDebugTag = "polar:tasks:run";

  const currDir = process.cwd();

  const nonExistent = filterNonExistent(scripts);
  if (nonExistent.length !== 0) {
    throw new WasmkitError(ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND, {
      scripts: nonExistent
    });
  }

  if (skipCheckpoints) { // used by Contract() class to skip checkpoints
    runtimeEnv.runtimeArgs.useCheckpoints = false;
  }

  await buildTsScripts(
    scripts,
    {
      baseUrl: currDir,
      paths: {
        "*": [
          "node_modules/*"
        ]
      },
      target: ts.ScriptTarget.ES2020,
      outDir: path.join(currDir, "build"),
      experimentalDecorators: true,
      esModuleInterop: true,
      allowJs: true,
      module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      sourceMap: true,
      declaration: true
    }
  );

  await runScripts(
    runtimeEnv,
    assertDirChildren(SCRIPTS_DIR, scripts),
    true,
    logDebugTag,
    false
  );
}

export default function (): void {
  task(TASK_RUN, "Runs a user-defined script after compiling the project")
    .addVariadicPositionalParam(
      "scripts",
      "A js file to be run within polar's environment"
    )
    .addFlag("skipCheckpoints", "do not read from or write checkpoints")
    .setAction((input, env) => executeRunTask(input, env));
}
