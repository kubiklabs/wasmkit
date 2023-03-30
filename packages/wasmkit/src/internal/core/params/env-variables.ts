import { ParamDefinitions, RuntimeArgs } from "../../../types";
import { ArgumentsParser } from "../../cli/arguments-parser";
import { unsafeObjectKeys } from "../../util/unsafe";
import { WasmkitError } from "../errors";
import { ERRORS } from "../errors-list";

import ProcessEnv = NodeJS.ProcessEnv;

const POLAR_ENV_ARGUMENT_PREFIX = "POLAR_";

export function paramNameToEnvVariable (paramName: string): string {
  // We create it starting from the result of ArgumentsParser.paramNameToCLA
  // so it's easier to explain and understand their equivalences.
  return ArgumentsParser.paramNameToCLA(paramName)
    .replace(ArgumentsParser.PARAM_PREFIX, POLAR_ENV_ARGUMENT_PREFIX)
    .replace(/-/g, "_")
    .toUpperCase();
}

export function getEnvVariablesMap (
  runtimeArgs: RuntimeArgs
): { [envVar: string]: string } {
  const values: { [envVar: string]: string } = {};

  for (const [name, value] of Object.entries(runtimeArgs)) {
    if (value === undefined) {
      continue;
    }

    values[paramNameToEnvVariable(name)] = value.toString();
  }

  return values;
}

export function getEnvRuntimeArgs (
  paramDefinitions: ParamDefinitions,
  envVariables: ProcessEnv
): RuntimeArgs {
  const envArgs: any = {};  // eslint-disable-line

  for (const paramName of unsafeObjectKeys(paramDefinitions)) {
    const definition = paramDefinitions[paramName];
    const envVarName = paramNameToEnvVariable(paramName);
    const rawValue = envVariables[envVarName];

    if (rawValue !== undefined) {
      try {
        envArgs[paramName] = definition.type.parse(paramName, rawValue);
      } catch (error) {
        throw new WasmkitError(
          ERRORS.ARGUMENTS.INVALID_ENV_VAR_VALUE,
          {
            varName: envVarName,
            value: rawValue
          },
          error as Error
        );
      }
    } else {
      envArgs[paramName] = definition.defaultValue;
    }
  }

  delete envArgs.config;

  return envArgs as RuntimeArgs;
}