
// TODO: remove the address and derive the account address
// using chain's derivation page
// find a good way to show user the address based on the network
// they choose to run the script against
const juno_testnet_accounts = [
  {
    name: 'account_0',
    address: 'juno1evpfprq0mre5n0zysj6cf74xl6psk96gus7dp5',
    mnemonic: 'omit sphere nurse rib tribe suffer web account catch brain hybrid zero act gold coral shell voyage matter nose stick crucial fog judge text'
  },
  {
    name: 'account_1',
    address: 'juno1njamu5g4n0vahggrxn4ma2s4vws5x4w3u64z8h',
    mnemonic: 'student prison fresh dwarf ecology birth govern river tissue wreck hope autumn basic trust divert dismiss buzz play pistol focus long armed flag bicycle'
  }
];

const neutron_testnet_accounts = [
  {
    name: 'account_0',
    address: 'neutron1jtdje5vq42sknl22r4wu9sahryu5wcrdqsccjh',
    mnemonic: 'category fine rapid trumpet dune early wish under nothing dance property wreck'
  },
];

const archway_testnet_accounts = [
  {
    name: 'account_0',
    address: 'archway1jtdje5vq42sknl22r4wu9sahryu5wcrd3yd7z8',
    mnemonic: 'category fine rapid trumpet dune early wish under nothing dance property wreck'
  },
];

const osmosis_testnet_accounts = [
  {
    name: 'account_0',
    address: 'osmosis1jtdje5vq42sknl22r4wu9sahryu5wcrdztt62s',
    mnemonic: 'category fine rapid trumpet dune early wish under nothing dance property wreck'
  },
];

const localnet_accounts = [
  {
    name: 'account_0',
    address: '',
    mnemonic: ''
  },
  {
    name: 'account_1',
    address: '',
    mnemonic: ''
  }
];

const juno_mainnet_accounts = [
];
const osmosis_mainnet_accounts = [
];

// Default list covers most of the supported network
// Networks which are not required can be removed from here
const networks = {
  localnet: {
    endpoint: 'http://localhost:26657/',
    chainId: 'testing-1',
    accounts: localnet_accounts,
  },
  juno_testnet: {
    endpoint: 'https://rpc.uni.juno.deuslabs.fi/',
    chainId: 'uni-6',
    accounts: juno_testnet_accounts,
  },
  juno_mainnet: {
    endpoint: 'https://juno-rpc.polkachu.com/',
    chainId: 'juno-1',
    accounts: juno_mainnet_accounts,
  },
  neutron_testnet: {
    endpoint: 'https://rpc.baryon.ntrn.info/',
    chainId: 'baryon-1',
    accounts: neutron_testnet_accounts,
  },
  archway_testnet: {
    endpoint: 'https://rpc.constantine-2.archway.tech',
    chainId: 'constantine-2',
    accounts: archway_testnet_accounts,
  },
  osmosis_testnet: {
    endpoint: 'https://rpc.testnet.osmosis.zone/',
    chainId: 'osmo-test-4',
    accounts: osmosis_testnet_accounts,
    fees: {
      upload: {
        amount: [{ amount: "100000", denom: "uluna" }],
        gas: "500000",
      },
      init: {
        amount: [{ amount: "50000", denom: "uluna" }],
        gas: "250000",
      },
      exec: {
        amount: [{ amount: "50000", denom: "uluna" }],
        gas: "250000",
      }
    },
  },
  osmosis_mainnet: {
    endpoint: 'https://rpc.osmosis.zone/',
    chainId: 'osmosis-1',
    accounts: osmosis_mainnet_accounts,
  }
};

module.exports = {
  networks: {
    default: networks.juno_testnet,
    testnet: networks.juno_testnet,
    localnet: networks.localnet,
    mainnet: networks.juno_mainnet,
  },
  localnetworks: {
    juno: {
      docker_image: "uditgulati0/juno-node",
      rpc_port: 26657,
      rest_port: 1317,
      flags: ["GAS_LIMIT=10000000", "STAKE_TOKEN=ujunox", "TIMEOUT_COMMIT=5s"],
      docker_command: "./setup_and_run.sh juno16g2rahf5846rxzp3fwlswy08fz8ccuwk03k57y",
    },
    neutron: {
      docker_image: "uditgulati0/neutron-node",
      rpc_port: 26657,
      rest_port: 1317,
      flags: ["RUN_BACKGROUND=0"],
    },
    osmosis: {
      docker_image: "uditgulati0/osmosis-node",
      rpc_port: 26657,
      rest_port: 1317,
      flags: [],
      docker_command: "/osmosis/setup.sh",
    },
  },
  mocha: {
    timeout: 60000
  },
  rust: {
    version: "1.63.0",
  },
  commands: {
    compile: "RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown",
    schema: "cargo run --example schema",
  }
};
