export const POLAR_NAME = "polar";

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

export const JUNOKIT_NAME = "junokit";

// map fees struct with chain id
// mainnet => juno-1 => defaultFeesMainnet
// else => defaultFees

export const defaultFeesJuno = {
  upload: {
    amount: [{ amount: "2000000", denom: "ujunox" }],
    gas: "20000000"
  },

  init: {
    amount: [{ amount: "300000", denom: "ujunox" }],
    gas: "500000"
  },

  exec: {
    amount: [{ amount: "300000", denom: "ujunox" }],
    gas: "500000"
  },

  send: {
    amount: [{ amount: "80000", denom: "ujunox" }],
    gas: "80000"
  }
};

export const defaultFeesMainnetJuno = {
  upload: {
    amount: [{ amount: "2000000", denom: "ujuno" }],
    gas: "20000000"
  },

  init: {
    amount: [{ amount: "300000", denom: "ujuno" }],
    gas: "500000"
  },

  exec: {
    amount: [{ amount: "300000", denom: "ujuno" }],
    gas: "500000"
  },

  send: {
    amount: [{ amount: "80000", denom: "ujuno" }],
    gas: "80000"
  }
};
