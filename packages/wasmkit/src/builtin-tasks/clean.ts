import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";

import { task } from "../internal/core/config/config-env";
import { WasmkitError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../internal/core/project-structure";
import type { WasmkitRuntimeEnvironment } from "../types";
import { TASK_CLEAN } from "./task-names";

export interface TaskCleanArg {
  contractName: string
}

export default function (): void {
  task(TASK_CLEAN, "Clears the cache and deletes specified artifacts files")
    .addOptionalVariadicPositionalParam(
      "contractName",
      "Name of the contract to be cleaned",
      []
    )
    .setAction(async (
      { contractName }: TaskCleanArg,
      env: WasmkitRuntimeEnvironment
    ) => {
      const contractNameNew = contractName.toString().replace(/-/g, '_');
      const comp = './artifacts/contracts/' + contractNameNew + '.wasm';
      if (!isCwdProjectDir()) {
        console.log(`Not in a valid WasmKit project repo, exiting`);
        process.exit(1);
      } else if (!fsExtra.existsSync(`./${ARTIFACTS_DIR}`) && contractName.length) {
        throw new WasmkitError(ERRORS.GENERAL.ARTIFACTS_NOT_FOUND);
      } else if (contractNameNew.length !== 0 && fsExtra.existsSync(comp)) {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning Artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove(comp);
        await fsExtra.remove('./artifacts/schema/' + contractNameNew + '/');
        await fsExtra.remove('./artifacts/checkpoints/' + contractNameNew + '.yaml}');
      } else if (contractNameNew.length !== 0 && !(fsExtra.existsSync(comp))) {
        throw new WasmkitError(ERRORS.GENERAL.INCORRECT_CONTRACT_NAME);
      } else {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning Artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove(ARTIFACTS_DIR);
      }
    });
}
