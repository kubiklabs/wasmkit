import debug from "debug";

import { WasmkitContext } from "../../src/internal/context";
import { loadConfigAndTasks } from "../../src/internal/core/config/config-loading";
import { WasmkitError } from "../../src/internal/core/errors";
import { ERRORS } from "../../src/internal/core/errors-list";
import { getEnvRuntimeArgs } from "../../src/internal/core/params/env-variables";
import { WASMKIT_PARAM_DEFINITIONS } from "../../src/internal/core/params/polar-params";
import { Environment } from "../../src/internal/core/runtime-env";
import { resetWasmkitContext } from "../../src/internal/reset";
import { NetworkConfig, WasmkitNetworkConfig, WasmkitRuntimeEnvironment, PromiseAny } from "../../src/types";

declare module "mocha" {
  interface Context {
    env: WasmkitRuntimeEnvironment
  }
}

let ctx: WasmkitContext;

export const defaultNetCfg: WasmkitNetworkConfig = {
  accounts: [],
  endpoint: "http://localhost:1337/",
  chainId: "local"
};

export function useEnvironment (
  beforeEachFn?: (wasmkitRuntimeEnv: WasmkitRuntimeEnvironment) => PromiseAny
): void {
  beforeEach("Load environment", async function () {
    this.env = await getEnv(defaultNetCfg);
    if (beforeEachFn) {
      return await beforeEachFn(this.env);
    }
  });

  afterEach("reset builder context", function () {
    resetWasmkitContext();
  });
}

export async function getEnv (
  defaultNetworkCfg?: NetworkConfig): Promise<WasmkitRuntimeEnvironment> {
  if (WasmkitContext.isCreated()) {
    ctx = WasmkitContext.getWasmkitContext();

    // The most probable reason for this to happen is that this file was imported
    // from the config file
    if (ctx.environment === undefined) {
      throw new WasmkitError(ERRORS.GENERAL.LIB_IMPORTED_FROM_THE_CONFIG);
    }

    return ctx.environment;
  }

  ctx = WasmkitContext.createWasmkitContext();
  const runtimeArgs = getEnvRuntimeArgs(
    WASMKIT_PARAM_DEFINITIONS,
    process.env
  );

  if (runtimeArgs.verbose) {
    debug.enable("polar*");
  }

  const config = await loadConfigAndTasks(runtimeArgs);

  if (runtimeArgs.network == null) {
    throw new Error("INTERNAL ERROR. Default network should be registered in `register.ts` module");
  }

  if (defaultNetworkCfg !== undefined) {
    config.networks.default = defaultNetworkCfg;
  }

  const env = new Environment(
    config,
    runtimeArgs,
    ctx.tasksDSL.getTaskDefinitions(),
    ctx.extendersManager.getExtenders(),
    true);
  ctx.setRuntimeEnv(env);

  return env;
}
