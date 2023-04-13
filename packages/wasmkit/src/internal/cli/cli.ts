#!/usr/bin/env node
// -*- mode: typescript -*- // https://github.com/syl20bnr/spacemacs/issues/13715
import "source-map-support/register";

import chalk from "chalk";
import debug from "debug";
import semver from "semver";

import { TASK_HELP } from "../../builtin-tasks/task-names";
import { RuntimeArgs, TaskArguments, WasmkitRuntimeEnvironment } from "../../types";
import { WasmkitContext } from "../context";
import { loadConfigAndTasks } from "../core/config/config-loading";
import { WasmkitError, WasmKitPluginError } from "../core/errors";
import { ERRORS } from "../core/errors-list";
import { getEnvRuntimeArgs } from "../core/params/env-variables";
import {
  WASMKIT_PARAM_DEFINITIONS,
  WASMKIT_SHORT_PARAM_SUBSTITUTIONS
} from "../core/params/wasmkit-params";
import { isCwdInsideProject } from "../core/project-structure";
import { Environment } from "../core/runtime-env";
import { isSetupTask } from "../core/tasks/builtin-tasks";
import { getPackageJson, PackageJson } from "../util/packageInfo";
import { ArgumentsParser } from "./arguments-parser";

const WASMKIT_NAME = "wasmKit";
const log = debug("wamkit:core:cli");

async function printVersionMessage (packageJson: PackageJson): Promise<void> {
  console.log(packageJson.version);
}

function ensureValidNodeVersion (packageJson: PackageJson): void {
  const requirement = packageJson.engines.node;
  if (!semver.satisfies(process.version, requirement)) {
    throw new WasmkitError(ERRORS.GENERAL.INVALID_NODE_VERSION, {
      requirement
    });
  }
}

function printErrRecur (error: WasmkitError): void {
  if (error.parent) {
    if (error.parent instanceof WasmkitError) {
      printErrRecur(error.parent);
    } else {
      console.error(error.parent);
    }
  }
}

function printStackTraces (showStackTraces: boolean, error: WasmkitError): void {
  if (error === undefined) { return; }
  if (showStackTraces) {
    printErrRecur(error);
  } else {
    console.error(`For more info run ${WASMKIT_NAME} with --show-stack-traces or add --help to display task-specific help.`);
  }
}

interface EnvAndArgs {
  env: WasmkitRuntimeEnvironment
  taskName: string
  taskArguments: TaskArguments
}

interface RuntimeArgsAndPackageJson {
  runtimeArgs: RuntimeArgs
  unparsedCLAs: string[]
  maybeTaskName: string | undefined
  showStackTraces: boolean
  packageJson: PackageJson
  argumentsParser: ArgumentsParser
}

export async function gatherArguments (): Promise<RuntimeArgsAndPackageJson> {
  // We first accept this argument anywhere, so we know if the user wants
  // stack traces before really parsing the arguments.
  let showStackTraces = process.argv.includes("--show-stack-traces");

  const packageJson = await getPackageJson();

  ensureValidNodeVersion(packageJson);

  const envVariableArguments = getEnvRuntimeArgs(
    WASMKIT_PARAM_DEFINITIONS,
    process.env);

  const argumentsParser = new ArgumentsParser();
  const {
    runtimeArgs,
    taskName: maybeTaskName,
    unparsedCLAs
  } = argumentsParser.parseRuntimeArgs(
    WASMKIT_PARAM_DEFINITIONS,
    WASMKIT_SHORT_PARAM_SUBSTITUTIONS,
    envVariableArguments,
    process.argv.slice(2)
  );

  if (runtimeArgs.verbose) {
    debug.enable("wasmkit*");
  }

  showStackTraces = runtimeArgs.showStackTraces;

  return {
    runtimeArgs: runtimeArgs,
    unparsedCLAs: unparsedCLAs,
    maybeTaskName: maybeTaskName,
    showStackTraces: showStackTraces,
    packageJson: packageJson,
    argumentsParser: argumentsParser
  };
}

export async function loadEnvironmentAndArgs (
  maybeTaskName: string | undefined,
  runtimeArgs: RuntimeArgs,
  argumentsParser: ArgumentsParser,
  unparsedCLAs: string[]
): Promise<EnvAndArgs> {
  const ctx = WasmkitContext.createWasmkitContext();
  const config = await loadConfigAndTasks(runtimeArgs);
  const envExtenders = ctx.extendersManager.getExtenders();
  const taskDefinitions = ctx.tasksDSL.getTaskDefinitions();
  let taskName = maybeTaskName ?? TASK_HELP;
  if (taskDefinitions[taskName] == null) {
    throw new WasmkitError(ERRORS.ARGUMENTS.UNRECOGNIZED_TASK, {
      task: taskName
    });
  }
  const origTaskName = taskName;

  // --help is a also special case
  let taskArguments: TaskArguments;
  if (runtimeArgs.help && taskName !== TASK_HELP) {
    taskArguments = { task: taskName };
    taskName = TASK_HELP;
  } else {
    taskArguments = argumentsParser.parseTaskArguments(
      taskDefinitions[taskName],
      unparsedCLAs
    );
  }

  // we can't do it earlier because we above we need to check the special case with `--help`
  const isSetup = isSetupTask(taskName);

  // Being inside of a project is non-mandatory for help and init
  if (!isSetup && !isCwdInsideProject()) {
    throw new WasmkitError(ERRORS.GENERAL.NOT_INSIDE_PROJECT, { task: origTaskName });
  }

  const env = new Environment(
    config,
    runtimeArgs,
    taskDefinitions,
    envExtenders,
    !isSetup);

  ctx.setRuntimeEnv(env);

  return {
    env: env,
    taskName: taskName,
    taskArguments: taskArguments
  };
}

/* eslint-disable sonarjs/cognitive-complexity */
async function main (): Promise<void> {
  log(`Initiating wasmKit task !`);
  let showStackTraces = false;
  try {
    const {
      runtimeArgs,
      unparsedCLAs,
      showStackTraces: showStackTracesUpdate,
      packageJson,
      maybeTaskName,
      argumentsParser
    } = await gatherArguments();
    showStackTraces = showStackTracesUpdate;
    // --version is a special case
    if (runtimeArgs.version) {
      await printVersionMessage(packageJson);
      return;
    }
    const {
      env,
      taskName,
      taskArguments
    } = await loadEnvironmentAndArgs(
      maybeTaskName, runtimeArgs, argumentsParser, unparsedCLAs
    );
    await env.run(taskName, taskArguments);

    log(`Quitting wasmKit after successfully running task ${taskName}`);
  } catch (error) {
    if (WasmkitError.isWasmkitError(error)) {
      console.error(chalk.red(`Error ${error.message}`));
    } else if (WasmKitPluginError.isWasmKitPluginError(error)) {
      console.error(
        chalk.red(`Error in plugin ${error.pluginName ?? ""}: ${error.message}`)
      );
    } else if (error instanceof Error) {
      console.error(chalk.red("An unexpected error occurred:"), error);
      showStackTraces = true;
    } else {
      console.error(chalk.red("An unexpected error occurred."));
      showStackTraces = true;
    }

    console.log("");

    printStackTraces(showStackTraces, error as WasmkitError);

    process.exit(1);
  }
}

main()
  .then(() => process.exit(process.exitCode))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
