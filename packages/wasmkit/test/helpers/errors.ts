import { assert, AssertionError } from "chai";

import { WasmkitError } from "../../src/internal/core/errors";
import { ErrorDescriptor } from "../../src/internal/core/errors-list";

export async function expectErrorAsync (
  f: () => Promise<any>,
  matchMessage?: string | RegExp
): Promise<void> {
  const noError = new AssertionError("Async error was expected but no error was thrown");
  const message = `Async error should have had message "${String(matchMessage)}" but got "`;
  const notExactMatch = new AssertionError(message);
  const notRegexpMatch = new AssertionError(message);
  try {
    await f();
  } catch (err) {
    if (matchMessage === undefined) {
      return;
    }
    if (typeof matchMessage === "string") {
      if ((err as WasmkitError).message !== matchMessage) {
        notExactMatch.message += `${String((err as WasmkitError).message)}"`;
        throw notExactMatch; // eslint-disable-line @typescript-eslint/no-throw-literal
      }
    } else {
      if (matchMessage.exec((err as WasmkitError).message) === null) {
        notRegexpMatch.message += `${String((err as WasmkitError).message)}"`;
        throw notRegexpMatch; // eslint-disable-line @typescript-eslint/no-throw-literal
      }
    }
    return;
  }
  throw noError; // eslint-disable-line @typescript-eslint/no-throw-literal
}

export function expectWasmkitError (
  f: () => any,
  errorDescriptor: ErrorDescriptor,
  matchMessage?: string | RegExp,
  errorMessage?: string
): void {
  try {
    const returnValue = f();
    if (returnValue instanceof Promise) {
      throw new Error("Please use expectWasmkitErrorAsync() when working with async code");
    }
  } catch (error) {
    assert.instanceOf(error, WasmkitError, errorMessage);
    assert.equal((error as WasmkitError).number, errorDescriptor.number, errorMessage);
    assert.notMatch(
      (error as WasmkitError).message,
      /%[a-zA-Z][a-zA-Z0-9]*%/,
      "WasmkitError has an non-replaced variable tag"
    );

    if (typeof matchMessage === "string") {
      assert.include((error as WasmkitError).message, matchMessage, errorMessage);
    } else if (matchMessage !== undefined) {
      assert.match((error as WasmkitError).message, matchMessage, errorMessage);
    }

    return;
  }
  throw new AssertionError( // eslint-disable-line @typescript-eslint/no-throw-literal
    `WasmkitError number ${errorDescriptor.number} expected, but no Error was thrown`
  );
}

export async function expectWasmkitErrorAsync (
  f: () => Promise<any>,
  errorDescriptor: ErrorDescriptor,
  matchMessage?: string | RegExp
): Promise<void> {
  const error = new AssertionError(
    `WasmkitError number ${errorDescriptor.number} expected, but no Error was thrown`
  );

  const match = String(matchMessage);
  const notExactMatch = new AssertionError(
    `WasmkitError was correct, but should have include "${match}" but got "`
  );

  const notRegexpMatch = new AssertionError(
    `WasmkitError was correct, but should have matched regex ${match} but got "`
  );

  try {
    await f();
  } catch (error) {
    assert.instanceOf(error, WasmkitError);
    assert.equal((error as WasmkitError).number, errorDescriptor.number);
    assert.notMatch(
      (error as WasmkitError).message,
      /%[a-zA-Z][a-zA-Z0-9]*%/,
      "WasmkitError has an non-replaced variable tag"
    );

    if (matchMessage !== undefined) {
      if (typeof matchMessage === "string") {
        if (!(error as WasmkitError).message.includes(matchMessage)) {
          notExactMatch.message += `${String((error as WasmkitError).message)}`;
          throw notExactMatch; // eslint-disable-line @typescript-eslint/no-throw-literal
        }
      } else {
        if (matchMessage.exec((error as WasmkitError).message) === null) {
          notRegexpMatch.message += `${String((error as WasmkitError).message)}`;
          throw notRegexpMatch; // eslint-disable-line @typescript-eslint/no-throw-literal
        }
      }
    }

    return;
  }

  throw error; // eslint-disable-line @typescript-eslint/no-throw-literal
}
