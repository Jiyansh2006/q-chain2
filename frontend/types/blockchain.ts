import { ethers } from "ethers";

export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorer: string;
    currency: string;
    currencySymbol: string;
    isTestnet: boolean;
    type: 'EVM' | 'ALGORAND';
}

export interface WalletState {
    address: string | null;
    signer: any | null;
    provider: any | null;
    network: ethers.Network | NetworkConfig | null;
    balance: {
        native: string;
        qToken: string;
    };
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    amount: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
    type: 'transfer' | 'pqc_transfer';
    explorerUrl: string;
}

export interface ContractConnection {
    connected: boolean;
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    totalSupply: string;
    pqcEnabled: boolean;
}

export interface SendTransactionParams {
    to: string;
    amount: string;
    usePQC?: boolean;
}

export interface TransactionResult {
    success: boolean;
    hash?: string;
    error?: string;
    receipt?: any;
}