import chalk from "chalk";
import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import fs from "fs-extra";
import path from "path";
import { parse as tomlParse } from "toml";

import { WasmkitError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import {
  ARTIFACTS_DIR,
  assertDir,
  CACHE_DIR,
  CONTRACTS_DIR,
  SCHEMA_DIR,
  TARGET_DIR,
  TS_SCHEMA_DIR
} from "../../internal/core/project-structure";
import { replaceAll } from "../../internal/util/strings";
import { WasmkitRuntimeEnvironment } from "../../types";
import { generateTsSchema } from "./tsSchema";
import { readSchemas } from "./utils";

function parseProjectToml (
  contractsDirPrefix: string
): string[] {
  // read Cargo.toml in project's root dir
  const projectTomlFile = readFileSync('Cargo.toml');
  const tomlContent = tomlParse(projectTomlFile.toString());

  const workspacesPath: string[] = [];
  tomlContent.workspace.members.forEach((workspace: string) => {
    if (path.parse(workspace).name === '*') {
      const dirsInWorkspace = readdirSync(path.parse(workspace).dir);
      dirsInWorkspace.forEach((dir: string) => {
        const dirPath = path.join(path.parse(workspace).dir, path.basename(dir));
        workspacesPath.push(dirPath);
      });
    } else {
      workspacesPath.push(workspace);
    }
  });

  return workspacesPath.filter((workspace: string) => {
    return workspace.startsWith(contractsDirPrefix);
  });
}

export async function compile (
  docker: boolean,
  sourceDir: string[],
  force: boolean,
  skipSchema: boolean,
  skipSchemaErrors: boolean,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  await assertDir(CACHE_DIR);
  let contractDirs: string[] = [];
  const toml = "Cargo.toml";
  // Contract(s) path given
  if (sourceDir.length > 0) {
    contractDirs = sourceDir;
  } else {
    const paths = parseProjectToml(CONTRACTS_DIR);
    // Only one contract in the contracts dir and compile in contracts dir only
    if (paths.includes(toml)) {
      contractDirs.push(CONTRACTS_DIR);
    } else {
      // Multiple contracts and each should be compiled by going inside each of them

      const contractNames = new Set();
      for (const contractPath of paths) {
        const contractName = readContractName(path.join(contractPath, toml));

        // Check for similar contract names before compiling contracts.
        // For contract with same names raise an error.
        if (contractNames.has(contractName)) {
          throw new WasmkitError(ERRORS.GENERAL.SAME_CONTRACT_NAMES, {
            contractName
          });
        } else {
          contractNames.add(contractName);
          contractDirs.push(contractPath);
        }
      }
    }
  }

  for (const dir of contractDirs) {
    compileContract(dir, docker, env);
    const contractName = readContractName(path.join(dir, toml));
    if (!skipSchema) { // only generate schema if this flag is not passed
      await generateSchema(contractName, dir, docker, skipSchemaErrors, env);
    }
    createArtifacts(
      TARGET_DIR, path.join(SCHEMA_DIR, contractName), path.join(ARTIFACTS_DIR, CONTRACTS_DIR), path.join(dir, "schema"), docker, skipSchema
    );
  }
}

export function readContractName (tomlFilePath: string): string {
  const tomlFileContent = tomlParse(readFileSync(tomlFilePath).toString());

  return replaceAll(tomlFileContent.package.name, '-', '_');
}

export function compileContract (
  contractDir: string,
  docker: boolean,
  env: WasmkitRuntimeEnvironment
): void {
  const cargoCommands = env.config.commands;
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `🛠 Compiling your contract in directory: ${chalk.gray(contractDir)}`);
  console.log("=============================================");
  // Compiles the contract and creates .wasm file alongside others
  try {
    execSync(cargoCommands.compile, { stdio: 'inherit' });
  } catch (error) {
    if (error instanceof Error) {
      throw new WasmkitError(ERRORS.GENERAL.RUST_COMPILE_ERROR);
    } else {
      throw error;
    }
  }

  process.chdir(currDir);
}

export async function generateSchema (
  contractName: string,
  contractDir: string,
  docker: boolean,
  skipSchemaErrors: boolean,
  env: WasmkitRuntimeEnvironment
): Promise<void> {
  const cargoCommands = env.config.commands;
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `Creating schema for contract in directory: ${chalk.gray(contractDir)}`);

  // Creates schema .json files
  execSync(cargoCommands.schema, { stdio: 'inherit' });

  process.chdir(currDir);

  // Creates typescript objects for execute and query msgs from json schema files
  const contractTsSchemaDir = TS_SCHEMA_DIR;
  // create nested dirs if not present
  if (!fs.existsSync(contractTsSchemaDir)) {
    fs.mkdirSync(contractTsSchemaDir, { recursive: true });
  }
  console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `Creating TS schema objects for contract in directory: ${chalk.gray(contractTsSchemaDir)}`);

  const srcSchemas = readSchemas(
    path.join(contractDir, "schema"),
    path.join(contractDir, "schema", "raw")
  );
  await generateTsSchema(contractName, srcSchemas, contractTsSchemaDir, skipSchemaErrors);
}

export function createArtifacts (
  targetDir: string,
  schemaDir: string,
  artifactsDir: string,
  sourceSchemaDir: string,
  docker: boolean,
  skipSchema: boolean
): void {
  const paths = fs.readdirSync(targetDir);

  // create nested dirs if not present
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  for (const p of paths) {
    const filename = path.basename(p);
    if (filename.split('.')[filename.split('.').length - 1] !== "wasm") {
      continue;
    }

    console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `Copying file ${filename} from ${chalk.gray(targetDir)} to ${chalk.gray(artifactsDir)}`);
    const sourcePath = path.resolve(targetDir, filename);
    const destPath = path.resolve(artifactsDir, filename);
    fs.copyFileSync(sourcePath, destPath);
  }

  if (skipSchema) { // do not copy schema to artifacts as there is none
    return;
  }

  const schemaPaths = fs.readdirSync(sourceSchemaDir);

  for (const p of schemaPaths) {
    const filename = path.basename(p);
    if (filename.split('.')[filename.split('.').length - 1] !== "json") {
      continue;
    }

    console.log(
      `[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`,
      `Copying file ${filename} from ${chalk.gray(sourceSchemaDir)} to ${chalk.gray(schemaDir)}`
    );
    const sourcePath = path.resolve(sourceSchemaDir, filename);
    const destPath = path.resolve(schemaDir, filename);
    fs.copyFileSync(sourcePath, destPath);
  }
}
