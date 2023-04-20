export const WASMKIT_NAME = "wasmkit";

export const defaultFees = {
  upload: {
    amount: [{ amount: "250000", denom: "uscrt" }],
    gas: String(1000000)
  },
  init: {
    amount: [{ amount: "125000", denom: "uscrt" }],
    gas: String(500000)
  },
  exec: {
    amount: [{ amount: "50000", denom: "uscrt" }],
    gas: String(200000)
  },
  send: {
    amount: [{ amount: "20000", denom: "uscrt" }],
    gas: String(80000)
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
