export const WASMKIT_NAME = "wasmkit";

// TODO: read denom from network type

export const defaultFees = {
  upload: {
    amount: [{ amount: "250000", denom: "ujuno" }],
    gas: "1000000"
  },
  init: {
    amount: [{ amount: "125000", denom: "ujuno" }],
    gas: "500000"
  },
  exec: {
    amount: [{ amount: "50000", denom: "ujuno" }],
    gas: "200000"
  },
  send: {
    amount: [{ amount: "20000", denom: "ujuno" }],
    gas: "80000"
  }
};

// map fees struct with chain id
// mainnet => juno-1 => defaultFeesMainnet
// else => defaultFees

export const defaultFeesTerra = {
  upload: {
    amount: [{ amount: "350000", denom: "uluna" }],
    gas: "2000000"
  },
  init: {
    amount: [{ amount: "250000", denom: "uluna" }],
    gas: "1250000"
  },
  exec: {
    amount: [{ amount: "250000", denom: "uluna" }],
    gas: "1250000"
  }
};
