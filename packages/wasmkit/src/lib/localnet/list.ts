import chalk from "chalk";
import { execSync } from "child_process";

import { WasmkitRuntimeEnvironment } from "../../types";

export async function listLocalnet (
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  // read all available localnetworks in cfg
  for (const networkName in env.config.localnetworks) {
    const localNetworkCfg = env.config.localnetworks[networkName];

    const localNetworkImage = localNetworkCfg.docker_image;
    const rpcPort = localNetworkCfg.rpc_port;
    const restPort = localNetworkCfg.rest_port;
    const flags = (localNetworkCfg.flags ?? []).map(val => `-e ${val}`).join(' ');
    const command = (localNetworkCfg.docker_command ?? '');
    console.log(`Node: ${chalk.green(networkName)}`);
    console.log(`  Docker image: ${localNetworkImage}`);
    console.log(`  RPC port: ${rpcPort}`);
    console.log(`  REST port: ${restPort}`);
    console.log(`  Flags: ${flags}`);
    console.log(`  Command: ${command}`);

    // check if any of the available localnetworks is running as a container
    const containerExists = execSync(`docker ps -q -f name=${networkName}`);

    if (containerExists.toString().length > 0) {
      const containerId = containerExists.toString().trim();
      console.log(`  Running with container ID: ${containerId}`);
    } else {
      console.log(`  Running: false`);
    }
  }
}
