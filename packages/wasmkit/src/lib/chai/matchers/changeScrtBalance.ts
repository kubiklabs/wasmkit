import chalk from "chalk";

import { WasmkitContext } from "../../../internal/context";
import { WasmkitError } from "../../../internal/core/errors";
import { ERRORS } from "../../../internal/core/errors-list";
import type {
  Account, Coin, UserAccount,
  WasmkitRuntimeEnvironment
} from "../../../types";
import { getBalance, getClient } from "../../client";
import { defaultFees } from "../../constants";

export function supportChangeScrtBalance (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeScrtBalance', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    account: UserAccount | Account | string,
    balanceChange: number,
    includeFee?: boolean,
    logResponse?: boolean
  ) {
    const subject = this._obj;

    if ((account as UserAccount).account !== undefined) {
      account = (account as UserAccount).account;
    }

    const accountAddr: string = (account as Account).address !== undefined
      ? (account as Account).address : (account as string);
    const derivedPromise = Promise.all([
      getBalanceChange(subject, accountAddr, includeFee, logResponse)
    ]).then(([actualChange]) => {
      this.assert(
        actualChange === balanceChange,
        `Expected "${accountAddr}" to change balance by ${balanceChange} uscrt, ` +
        `but it has changed by ${actualChange} uscrt`,
        `Expected "${accountAddr}" to not change balance by ${balanceChange} uscrt,`,
        balanceChange,
        actualChange
      );
    });

    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

function extractScrtBalance (
  balances: Coin[]
): number {
  console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, balances);
  for (const coin of balances) {
    if (coin.denom === 'uscrt') {
      return Number(coin.amount);
    }
  }
  return 0;
}

export async function getBalanceChange ( // eslint-disable-line sonarjs/cognitive-complexity
  transaction: (() => Promise<any>), // eslint-disable-line  @typescript-eslint/no-explicit-any
  accountAddr: string,
  includeFee?: boolean,
  logResponse?: boolean
): Promise<number> {
  if (typeof transaction !== 'function') {
    throw new WasmkitError(ERRORS.GENERAL.NOT_A_FUNCTION, {
      param: transaction
    });
  }

  const client = await getClient(WasmkitContext.getWasmkitContext().getRuntimeEnv().network);
  if (client === undefined) {
    throw new WasmkitError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
  }
  const env: WasmkitRuntimeEnvironment = WasmkitContext.getWasmkitContext().getRuntimeEnv();
  const balanceBefore = extractScrtBalance(
    await getBalance(client, accountAddr, env.network)
  );

  const txResponse = await transaction();
  if (logResponse === true) {
    console.log(`[${chalk.gray("wasmkit")}] ${chalk.green("INF")}`, `${chalk.green("Transaction response:")} ${txResponse as string}`);
  }
  const txnEvents = txResponse.logs[0].events;
  let msgEvent;
  for (const event of txnEvents) {
    if (event.type === 'message') {
      msgEvent = event;
      break;
    }
  }
  const msgEventKeys: { [key: string]: string } = {};
  for (const attr of msgEvent.attributes) {
    msgEventKeys[attr.key] = attr.value;
  }

  const balanceAfter = extractScrtBalance(
    await getBalance(client, accountAddr, env.network)
  );

  const fees = Object.assign(
    Object.assign({}, defaultFees),
    (WasmkitContext.getWasmkitContext().getRuntimeEnv().network.config.fees ?? {})
  );

  if (
    includeFee !== true &&
    accountAddr === msgEventKeys.signer
  ) {
    if (accountAddr === msgEventKeys.signer) {
      return balanceAfter - balanceBefore;
    } else {
      let txnFees = 0;
      for (const [key, value] of Object.entries(fees)) {
        if (key === msgEventKeys.action) {
          txnFees = Number(value);
          break;
        }
      }
      return balanceAfter + txnFees - balanceBefore;
    }
  } else {
    return balanceBefore - balanceAfter;
  }
}
