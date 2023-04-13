
// TODO: remove the address and derive the account address
// using chain's derivation page
// find a good way to show user the address based on the network
// they choose to run the script against
const testnet_accounts = [
  {
    name: 'account_0',
    address: 'secret1l0g5czqw7vjvd20ezlk4x7ndgyn0rx5aumr8gk',
    mnemonic: 'snack cable erode art lift better october drill hospital clown erase address'
  },
  {
    name: 'account_1',
    address: 'secret1ddfphwwzqtkp8uhcsc53xdu24y9gks2kug45zv',
    mnemonic: 'sorry object nation also century glove small tired parrot avocado pulp purchase'
  }
];

const localnet_accounts = [
  {
    name: 'account_0',
    address: '',
    mnemonic: ''
  }
];

const mainnet_accounts = [
];

// Default list covers most of the supported network
// Networks which are not required can be removed from here
const networks = {
  localnet: {
    endpoint: 'http://localhost:26657/',
    chainId: 'testing',
    accounts: localnet_accounts,
  },
  secret_testnet: {
    endpoint: 'http://testnet.securesecrets.org:1317/',
    chainId: 'pulsar-2',
    accounts: testnet_accounts,
  },
  secret_mainnet: {
    endpoint: 'https://secretnetwork-lcd.stakely.io/',
    chainId: 'secret-4',
    accounts: mainnet_accounts,
  },
  juno_testnet: {
    endpoint: 'https://rpc.uni.juno.deuslabs.fi/',
    chainId: 'uni-6',
    accounts: testnet_accounts,
  },
  juno_mainnet: {
    endpoint: 'https://juno-rpc.polkachu.com/',
    chainId: 'juno-1',
    accounts: mainnet_accounts,
  },
  neutron_testnet: {
    endpoint: 'https://rpc.baryon.ntrn.info/',
    chainId: 'baryon-1',
    accounts: testnet_accounts,
  },
  neutron_mainnet: {
    endpoint: 'http',
    chainId: 'neutron-1',
    accounts: mainnet_accounts,
  },
};

module.exports = {
  networks: {
    default: networks.juno_testnet,
    testnet: networks.juno_testnet,
    localnet: networks.localnet,
    mainnet: networks.juno_mainnet,
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
