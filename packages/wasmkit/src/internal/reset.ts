/**
 * This function resets the WasmKit context.
 *
 * This doesn't unload any loaded WasmKit plugin, so those have to be unloaded
 * manually with `unloadModule`.
 */
import { WasmkitContext } from "./context";
import { getUserConfigPath } from "./core/project-structure";

export function resetWasmkitContext (): void {
  if (WasmkitContext.isCreated()) {
    const ctx = WasmkitContext.getWasmkitContext();
    const globalAsAny = global as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (ctx.environment !== undefined) {
      for (const key of Object.keys(ctx.environment)) {
        globalAsAny[key] = undefined;
      }
      // unload config file too.
      if (ctx.environment.config.paths != null) {
        unloadModule(ctx.environment.config.paths.configFile);
      }
    } else {
      // We may get here if loading the config has thrown, so be unload it
      let configPath: string | undefined;

      try {
        configPath = getUserConfigPath();
      } catch (error) {
        // We weren't in a WasmKit project
      }

      if (configPath !== undefined) {
        unloadModule(configPath);
      }
    }
    WasmkitContext.deleteWasmkitContext();
  }

  // Unload all the WasmKit's entry-points.
  unloadModule("../register");
  unloadModule("./cli/cli");
  unloadModule("./lib/lib");
}

function unloadModule (path: string): void {
  try {
    delete require.cache[require.resolve(path)];
  } catch (err) {
    // module wasn't loaded
  }
}
