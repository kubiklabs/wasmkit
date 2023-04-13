import type { Config, WasmKitNetworkUserConfig } from "../../../types";
const SCRT_CHAIN_NAME = "testnet";

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
  }
};

export default defaultConfig;
