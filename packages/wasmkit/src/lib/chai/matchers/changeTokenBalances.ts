import chalk from "chalk";

import { WasmkitContext } from "../../../internal/context";
import { WasmkitError } from "../../../internal/core/errors";
import { ERRORS } from "../../../internal/core/errors-list";
import type {
  Account, Coin, UserAccount
} from "../../../types";
import { getBalance, getClient } from "../../client";

export function supportChangeTokenBalances (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeTokenBalances', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    accounts: UserAccount[] | Account[] | string[],
    token: string,
    balanceChanges: number[],
    logResponse?: boolean
  ) {
    const subject = this._obj;

    if ((accounts as UserAccount[])[0].account !== undefined) {
      accounts = accounts.map((account: UserAccount | string | Account) =>
        (account as UserAccount).account
      );
    }

    const accountAddresses = accounts.map((account: UserAccount | string | Account) =>
      (account as Account).address !== undefined
        ? (account as Account).address : (account as string));

    const derivedPromise = Promise.all([
      getBalanceChanges(subject, accountAddresses, token, logResponse)
    ]).then(([actualChanges]) => {
      this.assert(
        actualChanges.every((change, ind) =>
          change === balanceChanges[ind]
        ),
          `Expected ${accountAddresses.toString()} to change balance by ${balanceChanges.toString()} ${token}, ` +
            `but it has changed by ${actualChanges.toString()} ${token}`,
          `Expected ${accountAddresses.toString()} to not change balance by ${balanceChanges.toString()} ${token},`,
          balanceChanges.map((balanceChange) => balanceChange.toString()),
          actualChanges.map((actualChange) => actualChange.toString())
      );
    });

    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

function extractTokenBalance (
  balances: Coin[],
  denom: string
): number {
  for (const coin of balances) {
    if (coin.denom === denom) {
      return Number(coin.amount);
    }
  }
  return 0;
}

async function getBalances (
  accountAddresses: string[],
  token: string
): Promise<number[]> {
  const client = await getClient(WasmkitContext.getWasmkitContext().getRuntimeEnv().network);
  if (client === undefined) {
    throw new WasmkitError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
  }

  return await Promise.all(
    accountAddresses.map(async (accountAddr) => {
      return extractTokenBalance(
        await getBalance(
          client, accountAddr, WasmkitContext.getWasmkitContext().getRuntimeEnv().network),
        token
      );
    })
  );
}

export async function getBalanceChanges (
  transaction: (() => Promise<any>), // eslint-disable-line  @typescript-eslint/no-explicit-any
  accountAddresses: string[],
  token: string,
  logResponse?: boolean
): Promise<number[]> {
  if (typeof transaction !== 'function') {
    throw new WasmkitError(ERRORS.GENERAL.NOT_A_FUNCTION, {
      param: transaction
    });
  }

  const balancesBefore = await getBalances(accountAddresses, token);

  const txResponse = await transaction();
  if (logResponse === true) {
    console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `${chalk.green("Transaction response:")} ${txResponse as string}`);
  }

  const balancesAfter = await getBalances(accountAddresses, token);

  return balancesAfter.map((balance, ind) => balance - balancesBefore[ind]);
}
