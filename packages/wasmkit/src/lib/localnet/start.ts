import chalk from "chalk";
import { execSync } from "child_process";

import { WasmkitError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import { WasmkitRuntimeEnvironment } from "../../types";

export async function startLocalnet (
  nodeType: string,
  clean: boolean,
  withExplorer: boolean,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  // read the wasmkit config for "localnetwork"
  if (!(nodeType in env.config.localnetworks)) {
    throw new WasmkitError(ERRORS.NETWORK.UNKNOWN_LOCAL_NETWORK, {
      nodeType: nodeType
    });
  }
  const localNetworkCfg = env.config.localnetworks[nodeType];

  const localNetworkImage = localNetworkCfg.docker_image;
  const rpcPort = localNetworkCfg.rpc_port;
  const restPort = localNetworkCfg.rest_port;
  const flags = (localNetworkCfg.flags ?? []).map(val => `-e ${val}`).join(' ');
  const command = (localNetworkCfg.docker_command ?? '');

  // TODO: check if docker image is present for <image_name>

  const containerExists = execSync(`docker ps -a -q -f name=${nodeType}`);

  // start the node with proper flags and env variables
  if (clean && containerExists.toString().length > 0) {
    console.log(`Removing existing container: ${chalk.green(nodeType)}`);

    // stop container if running
    execSync(`docker container stop ${nodeType}`);

    // remove container
    execSync(`docker container rm ${nodeType}`);
  }

  console.log(`Starting container: ${chalk.green(nodeType)}`);

  execSync(`
  docker run -d --name ${nodeType} -p ${restPort}:1317 -p ${rpcPort}:26657 ${flags} ${localNetworkImage}:latest ${command}
  `);

  // if started, prompt the user with endpoints
  console.log(`Local network started with RPC port: ${chalk.green(rpcPort)}, REST port: ${chalk.green(restPort)}`);

  // if explorer yes then start a wasmkit-explorer with same localnetwork cfg
}
