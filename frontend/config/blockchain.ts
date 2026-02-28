import { ethers } from 'ethers';
import { NetworkConfig } from '../types/blockchain';
import { NETWORKS, DEFAULT_NETWORK } from './networks';

// ==================== CONTRACT ADDRESSES ====================

export const QTOKEN_CONTRACT_ADDRESSES: Record<number, string> = {
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  11155111: import.meta.env.VITE_QTOKEN_ADDRESS,
  1: '',
};

export const QUANTUM_NFT_CONTRACT_ADDRESSES: Record<number, string> = {
  31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  11155111: import.meta.env.VITE_QUANTUM_NFT_ADDRESS,
  1: '',
};

// ==================== CONTRACT ABIs ====================

export const QTOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferWithPQC(address to, uint256 amount) returns (bool)",
];

export const QUANTUM_NFT_ABI = [
  "function mintNFT(string name, string description, string tokenURI, string quantumHash) payable returns (uint256)",
  "function getNFTDetails(uint256 tokenId) view returns (string, string, string, uint256, address, bool, string)",
  "function verifyQuantumHash(uint256 tokenId, string quantumHash) view returns (bool)",
  "function totalMinted() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
];

// ==================== NETWORK HELPERS ====================

export const getNetworkConfig = (networkKey: string): NetworkConfig | null => {
  return NETWORKS[networkKey] || null;
};

export const getCurrentEvmNetwork = async (): Promise<NetworkConfig | null> => {
  if (typeof window.ethereum === 'undefined') return DEFAULT_NETWORK;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return NETWORKS[network.chainId.toString()] || DEFAULT_NETWORK;
  } catch {
    return DEFAULT_NETWORK;
  }
};

// ==================== CONTRACT ADDRESS HELPERS ====================

export const getQTokenAddress = (chainId: number): string => {
  return QTOKEN_CONTRACT_ADDRESSES[chainId] || '';
};

export const getQuantumNFTAddress = (chainId: number): string => {
  return QUANTUM_NFT_CONTRACT_ADDRESSES[chainId] || '';
};

// ==================== CONTRACT FACTORY ====================

export const getEvmContract = (
  contractType: 'qtoken' | 'quantum-nft',
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract | null => {

  if (typeof window.ethereum === 'undefined') return null;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = signerOrProvider || provider;

    const chainIdHex = (window as any).ethereum.chainId;
    const chainId = parseInt(chainIdHex, 16);

    if (!NETWORKS[chainId.toString()] || NETWORKS[chainId.toString()].type !== 'EVM') {
      console.warn("Current network is not EVM compatible");
      return null;
    }

    const address =
      contractType === 'qtoken'
        ? getQTokenAddress(chainId)
        : getQuantumNFTAddress(chainId);

    const abi =
      contractType === 'qtoken'
        ? QTOKEN_ABI
        : QUANTUM_NFT_ABI;

    if (!address) {
      console.warn("Contract not deployed on this network");
      return null;
    }

    return new ethers.Contract(address, abi, signer);

  } catch (error) {
    console.error("Contract creation failed:", error);
    return null;
  }
};

// ==================== FORMATTERS ====================

export const formatAddress = (address: string, start = 6, end = 4): string => {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const formatBalance = (balance: number, decimals = 4): string => {
  return balance.toFixed(decimals);
};

// ==================== NETWORK SWITCHING (EVM ONLY) ====================

export const switchToNetwork = async (chainId: number): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    console.error("Switch failed:", error);
    return false;
  }
};