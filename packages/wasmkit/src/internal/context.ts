import { ConfigExtender, WasmkitRuntimeEnvironment } from '../types';
import { ExtenderManager } from './core/config/extenders';
import { WasmkitError } from './core/errors';
import { ERRORS } from './core/errors-list';
import { TasksDSL } from './core/tasks/dsl';

export type GlobalWithWasmkitContext = NodeJS.Global & {
  // eslint-disable-next-line no-use-before-define
  __WasmkitContext: WasmkitContext
};

export class WasmkitContext {
  public static isCreated (): boolean {
    const globalWithWasmkitContext = global as unknown as GlobalWithWasmkitContext;
    return globalWithWasmkitContext.__WasmkitContext !== undefined;
  }

  public static createWasmkitContext (): WasmkitContext {
    if (this.isCreated()) {
      throw new WasmkitError(ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
    }

    const globalWithWasmkitContext = global as unknown as GlobalWithWasmkitContext;
    const ctx = new WasmkitContext();
    globalWithWasmkitContext.__WasmkitContext = ctx;
    return ctx;
  }

  public static getWasmkitContext (): WasmkitContext {
    const globalWithWasmkitContext = global as unknown as GlobalWithWasmkitContext;
    const ctx = globalWithWasmkitContext.__WasmkitContext;

    if (ctx === undefined) {
      throw new WasmkitError(ERRORS.GENERAL.CONTEXT_NOT_CREATED);
    }

    return ctx;
  }

  public static deleteWasmkitContext (): void {
    // eslint-disable-next-line
    const globalAsAny = global as any;

    globalAsAny.__WasmkitContext = undefined;
  }

  public readonly tasksDSL = new TasksDSL();
  public readonly extendersManager = new ExtenderManager();
  public readonly loadedPlugins: string[] = [];
  public environment?: WasmkitRuntimeEnvironment;
  public readonly configExtenders: ConfigExtender[] = [];

  public setRuntimeEnv (env: WasmkitRuntimeEnvironment): void {
    if (this.environment !== undefined) {
      throw new WasmkitError(ERRORS.GENERAL.CONTEXT_PRE_ALREADY_DEFINED);
    }
    this.environment = env;
  }

  public getRuntimeEnv (): WasmkitRuntimeEnvironment {
    if (this.environment === undefined) {
      throw new WasmkitError(ERRORS.GENERAL.CONTEXT_PRE_NOT_DEFINED);
    }
    return this.environment;
  }

  public setPluginAsLoaded (pluginName: string): void {
    this.loadedPlugins.push(pluginName);
  }
}
