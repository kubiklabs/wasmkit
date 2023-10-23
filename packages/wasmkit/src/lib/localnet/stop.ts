import chalk from "chalk";
import { execSync } from "child_process";

import { WasmkitError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import { WasmkitRuntimeEnvironment } from "../../types";

export async function stopLocalnet (
  nodeType: string,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  // read the wasmkit config for "localnetwork"
  if (!(nodeType in env.config.localnetworks)) {
    throw new WasmkitError(ERRORS.NETWORK.UNKNOWN_LOCAL_NETWORK, {
      nodeType: nodeType
    });
  }
  const containerExists = execSync(`docker ps -a -q -f name=${nodeType}`);

  // stop the node container if running
  if (containerExists.toString().length > 0) {
    console.log(`Stopping container: ${chalk.green(nodeType)}`);

    // stop container if running
    execSync(`docker container stop ${nodeType}`);
  } else {
    console.log(`Container not running: ${chalk.green(nodeType)}`);
  }
}
