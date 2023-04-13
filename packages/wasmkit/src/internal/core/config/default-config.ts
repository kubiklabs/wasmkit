import type { Config, WasmKitNetworkUserConfig } from "../../../types";
const SCRT_CHAIN_NAME = "testnet";
const CARGO_COMPILE = "RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown";
const CARGO_SCHEMA = "cargo run --example schema";

const cfg: WasmKitNetworkUserConfig = {
  accounts: [],
  endpoint: SCRT_CHAIN_NAME,
  chainId: "pulsar-3"
};

const defaultConfig: Config = {
  networks: {
    [SCRT_CHAIN_NAME]: cfg
  },
  mocha: {
    timeout: 20000
  },
  commands: {
    compile: CARGO_COMPILE,
    schema: CARGO_SCHEMA
  }
};

export default defaultConfig;
