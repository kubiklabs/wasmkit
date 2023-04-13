import { assert } from "chai";
import fs from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { compile } from "../../src/lib/compile/compile";
import { useEnvironment } from "../helpers/environment";
import { expectWasmkitErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

describe("Compile task", () => {
  useEnvironment();

  afterEach(() => {
    fs.removeSync("./artifacts");
  });
  describe("Compile simple contract", function () {
    useFixtureProject("testproject");
    it("Should create .wasm files", async function () {
      await compile(false, [], false, false, false, this.env);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(200000);
  });

  describe("Compile multi contract", function () {
    useFixtureProject("multiproject");
    it("Should create .wasm files for  each contract", async function () {
      await compile(false, [], false, false, false, this.env);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project_1.wasm`));
    }).timeout(200000);
  });

  describe("Should not compile multiple contract with same name", function () {
    useFixtureProject("multiproject-error");
    it("Should give an error of same contract names", async function () {
      await expectWasmkitErrorAsync(
        async () => await compile(false, [], false, false, false, this.env),
        ERRORS.GENERAL.SAME_CONTRACT_NAMES
      );
    }).timeout(200000);
  });

  describe("Compile by providing sourceDir", function () {
    useFixtureProject("testproject");
    it("Should create .wasm files of only given contract in sourceDir", async function () {
      await compile(false, ["contracts/"], false, false, false, this.env);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(200000);
  });

  describe("Compile fail when contract has compile errors", function () {
    useFixtureProject("errorproject");
    it("Should raise WasmKit error", async function () {
      // check for Exception
      await expectWasmkitErrorAsync(
        async () => await compile(false, [], false, false, false, this.env),
        ERRORS.GENERAL.RUST_COMPILE_ERROR
      );
    }).timeout(200000);
  });
});
