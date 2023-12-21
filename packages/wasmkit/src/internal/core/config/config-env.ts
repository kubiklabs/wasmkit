import {
  ActionType,
  ConfigExtender,
  ConfigurableTaskDefinition,
  EnvironmentExtender,
  TaskArguments
} from "../../../types";
import { WasmkitContext } from "../../context";
import * as argumentTypes from "../params/argument-types";
import { usePlugin as usePluginImplementation } from "../plugins";

/**
 * Creates a task, overriding any previous task with the same name.
 *
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param description The task's description.
 * @param action The task's action.
 * @returns A task definition.
 */
export function task<ArgsT extends TaskArguments> (
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

/**
 * Creates a task without description, overriding any previous task
 * with the same name.
 *
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param action The task's action.
 *
 * @returns A task definition.
 */
export function task<ArgsT extends TaskArguments> (
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function task<ArgsT extends TaskArguments> (
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = WasmkitContext.getWasmkitContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.task(name);
  }

  if (typeof descriptionOrAction !== "string") {
    return dsl.task(name, descriptionOrAction);
  }

  return dsl.task(name, descriptionOrAction, action);
}

/**
 * Creates a internaltask, overriding any previous task with the same name.
 *
 * @remarks The internaltasks won't be displayed in the CLI help messages.
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param description The task's description.
 * @param action The task's action.
 * @returns A task definition.
 */
export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

/**
 * Creates a internaltask without description, overriding any previous
 * task with the same name.
 *
 * @remarks The internaltasks won't be displayed in the CLI help messages.
 * @remarks The action must await every async call made within it.
 *
 * @param name The task's name.
 * @param action The task's action.
 * @returns A task definition.
 */
export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = WasmkitContext.getWasmkitContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.internalTask(name);
  }

  if (typeof descriptionOrAction !== "string") {
    return dsl.internalTask(name, descriptionOrAction);
  }

  return dsl.internalTask(name, descriptionOrAction, action);
}

export const types = argumentTypes;

/**
 * Register an environment extender what will be run after the
 * WasmKit Runtime Environment is initialized.
 *
 * @param extender A function that receives the WasmKit Runtime
 * Environment.
 */
export function extendEnvironment (extender: EnvironmentExtender): void {
  const ctx = WasmkitContext.getWasmkitContext();
  const extenderManager = ctx.extendersManager;
  extenderManager.add(extender);
}

export function extendConfig (extender: ConfigExtender): void {
  const ctx = WasmkitContext.getWasmkitContext();
  ctx.configExtenders.push(extender);
}

/**
 * Loads a WasmKit plugin
 * @param pluginName The plugin name.
 */
export function usePlugin (pluginName: string): void {
  const ctx = WasmkitContext.getWasmkitContext();
  usePluginImplementation(ctx, pluginName);
}
