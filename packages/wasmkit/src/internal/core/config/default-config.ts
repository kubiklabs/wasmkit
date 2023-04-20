import type { Config, WasmKitNetworkUserConfig } from "../../../types";
const CARGO_COMPILE = "RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown";
const CARGO_SCHEMA = "cargo run --example schema";

const defaultConfig: Config = {
  mocha: {
    timeout: 20000
  },
  commands: {
    compile: CARGO_COMPILE,
    schema: CARGO_SCHEMA
  }
};

export default defaultConfig;
