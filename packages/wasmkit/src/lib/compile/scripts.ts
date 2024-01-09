import chalk from "chalk";
import * as ts from "typescript";

export async function buildTsScripts (
  fileNames: string[],
  options: ts.CompilerOptions
): Promise<void> {
  console.log(
    `[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`,
    `🛠 Compiling TS files: ${chalk.gray(fileNames)}`
  );
  console.log("===========================================");
  const program = ts.createProgram(fileNames, options);
  const emitResult = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start! // eslint-disable-line @typescript-eslint/no-non-null-assertion
      );
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });
}
