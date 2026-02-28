import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

const ALGORAND_CHAIN_IDS = {
  MAINNET: 416001,
  TESTNET: 416002,
  BETANET: 416003,
  FNET: 4160,
} as const;

class AlgorandWalletService {
  private peraWallet: PeraWalletConnect | null = null;
  private accounts: string[] = [];

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializePeraWallet();
    }
  }

  private initializePeraWallet() {
    try {
      this.peraWallet = new PeraWalletConnect({
        // Pera expects numeric Algorand chain IDs.
        chainId: ALGORAND_CHAIN_IDS.TESTNET,
        shouldShowSignTxnToast: true
      });
      
      // Try to reconnect session
      this.reconnectSession().catch(() => {
        // Silently fail - user will need to connect manually
      });
    } catch (error) {
      console.error("Failed to initialize Pera Wallet:", error);
    }
  }

  // ================= CONNECT =================
  async connect(): Promise<string> {
    this.ensureInitialized();
    
    try {
      const accounts = await this.peraWallet!.connect();
      if (!accounts.length) {
        throw new Error("No Algorand account returned by Pera Wallet");
      }
      this.accounts = accounts;
      return accounts[0];
    } catch (error) {
      console.error("Pera Wallet connection error:", error);
      throw error;
    }
  }

  // ================= DISCONNECT =================
  async disconnect(): Promise<void> {
    if (this.peraWallet) {
      try {
        await this.peraWallet.disconnect();
      } catch (error) {
        console.error("Error disconnecting Pera Wallet:", error);
      }
    }
    this.accounts = [];
  }

  // ================= RECONNECT SESSION =================
  async reconnectSession(): Promise<string | null> {
    if (!this.peraWallet) return null;
    
    try {
      const accounts = await this.peraWallet.reconnectSession();
      if (accounts && accounts.length) {
        this.accounts = accounts;
        return accounts[0];
      }
      this.accounts = [];
      return null;
    } catch (error) {
      console.error("Failed to reconnect Pera Wallet session:", error);
      return null;
    }
  }

  getActiveAccount(): string | null {
    return this.accounts.length ? this.accounts[0] : null;
  }

  // ================= SIGN SINGLE TX =================
  async signTransaction(txn: algosdk.Transaction): Promise<Uint8Array> {
    this.ensureInitialized();
    this.ensureConnected();
    
    try {
      const activeAccount = this.accounts[0];
      const signedTxns = await this.peraWallet!.signTransaction([
        [{ txn, signers: [activeAccount] }],
      ]);

      if (!signedTxns.length) {
        throw new Error("No signed transaction returned by Pera Wallet");
      }

      return signedTxns[0]!;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  // ================= SIGN GROUP =================
  async signGroupedTransactions(txns: algosdk.Transaction[]): Promise<Uint8Array[]> {
    this.ensureInitialized();
    this.ensureConnected();
    
    try {
      const activeAccount = this.accounts[0];
      const txGroup = txns.map((txn) => ({ txn, signers: [activeAccount] }));
      const signedTxns = await this.peraWallet!.signTransaction([txGroup]);
      if (!signedTxns.length) {
        throw new Error("No signed grouped transactions returned by Pera Wallet");
      }
      return signedTxns;
    } catch (error) {
      console.error("Error signing grouped transactions:", error);
      throw error;
    }
  }

  // ================= HELPER METHODS =================
  private ensureInitialized() {
    if (typeof window === 'undefined') {
      throw new Error("Pera Wallet can only be used in browser environment");
    }
    if (!this.peraWallet) {
      this.initializePeraWallet();
      if (!this.peraWallet) {
        throw new Error("Failed to initialize Pera Wallet");
      }
    }
  }

  private ensureConnected() {
    if (!this.accounts.length) {
      throw new Error("No account connected");
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && this.peraWallet !== null;
  }
}

export const algorandWallet = new AlgorandWalletService();
export const connectAlgorandWallet = async (): Promise<string> => {
  return algorandWallet.connect();
};
