import { assert } from "chai";

import { ERRORS } from "../../../../src/internal/core/errors-list";
import {
  getEnvRuntimeArgs,
  getEnvVariablesMap,
  paramNameToEnvVariable
} from "../../../../src/internal/core/params/env-variables";
import { WASMKIT_PARAM_DEFINITIONS } from "../../../../src/internal/core/params/wasmkit-params";
import { expectWasmkitError } from "../../../helpers/errors";

describe("paramNameToEnvVariable", () => {
  it("should convert camelCase to UPPER_CASE and prepend WASMKIT_", () => {
    assert.equal(paramNameToEnvVariable("a"), "WASMKIT_A");
    assert.equal(paramNameToEnvVariable("B"), "WASMKIT_B");
    assert.equal(paramNameToEnvVariable("AC"), "WASMKIT_A_C");
    assert.equal(paramNameToEnvVariable("aC"), "WASMKIT_A_C");
    assert.equal(
      paramNameToEnvVariable("camelCaseRight"),
      "WASMKIT_CAMEL_CASE_RIGHT"
    );
    assert.equal(
      paramNameToEnvVariable("somethingAB"),
      "WASMKIT_SOMETHING_A_B"
    );
  });
});

describe("Env vars arguments parsing", () => {
  it("Should use the default values if arguments are not defined", () => {
    const args = getEnvRuntimeArgs(WASMKIT_PARAM_DEFINITIONS, {
      IRRELEVANT_ENV_VAR: "123"
    });
    assert.equal(args.help, WASMKIT_PARAM_DEFINITIONS.help.defaultValue);
    assert.equal(args.network, WASMKIT_PARAM_DEFINITIONS.network.defaultValue);
    assert.equal(
      args.showStackTraces,
      WASMKIT_PARAM_DEFINITIONS.showStackTraces.defaultValue
    );
    assert.equal(args.version, WASMKIT_PARAM_DEFINITIONS.version.defaultValue);
  });

  it("Should accept values", () => {
    const args = getEnvRuntimeArgs(WASMKIT_PARAM_DEFINITIONS, {
      IRRELEVANT_ENV_VAR: "123",
      WASMKIT_NETWORK: "asd",
      WASMKIT_SHOW_STACK_TRACES: "true",
      WASMKIT_VERSION: "true",
      WASMKIT_HELP: "true"
    });

    assert.equal(args.network, "asd");

    // These are not really useful, but we test them anyway
    assert.equal(args.showStackTraces, true);
    assert.equal(args.version, true);
    assert.equal(args.help, true);
  });

  it("should throw if an invalid value is passed", () => {
    expectWasmkitError(
      () =>
        getEnvRuntimeArgs(WASMKIT_PARAM_DEFINITIONS, {
          WASMKIT_HELP: "123"
        }),
      ERRORS.ARGUMENTS.INVALID_ENV_VAR_VALUE
    );
  });
});

describe("getEnvVariablesMap", () => {
  it("Should return the right map", () => {
    assert.deepEqual(
      getEnvVariablesMap({
        network: "asd",
        help: true,
        showStackTraces: true,
        version: false,
        verbose: true,
        config: undefined // config is optional
      }),
      {
        WASMKIT_NETWORK: "asd",
        WASMKIT_HELP: "true",
        WASMKIT_SHOW_STACK_TRACES: "true",
        WASMKIT_VERSION: "false",
        WASMKIT_VERBOSE: "true"
      }
    );
  });
});
