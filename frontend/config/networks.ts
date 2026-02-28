import { NetworkConfig } from '../types/blockchain';

export const NETWORKS: { [key: string]: NetworkConfig } = {

  // 🟢 Ethereum Local
  '31337': {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
    currency: 'ETH',
    currencySymbol: 'ETH',
    isTestnet: true,
    type: 'EVM'
  },

  // 🟢 Ethereum Sepolia
  '11155111': {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/5b14f5b4f5764ca2b2d6149096cd39e3',
    explorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    currencySymbol: 'ETH',
    isTestnet: true,
    type: 'EVM'
  },

  // 🔵 Ethereum Mainnet
  '1': {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorer: 'https://etherscan.io',
    currency: 'ETH',
    currencySymbol: 'ETH',
    isTestnet: false,
    type: 'EVM'
  },

  // 🟡 Algorand Testnet
  'algorand-testnet': {
    chainId: 0,
    name: 'Algorand Testnet',
    rpcUrl: 'https://testnet-api.algonode.cloud',
    explorer: 'https://testnet.algoexplorer.io',
    currency: 'ALGO',
    currencySymbol: 'ALGO',
    isTestnet: true,
    type: 'ALGORAND'
  }
};

export const DEFAULT_NETWORK = NETWORKS['11155111'];