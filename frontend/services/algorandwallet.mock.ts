import algosdk from "algosdk";

// Mock implementation for testing when Pera Wallet is not available
class AlgorandWalletService {
  private static readonly STORAGE_KEY = "mock_algorand_account";
  private accounts: string[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      const storedAccount = window.localStorage.getItem(
        AlgorandWalletService.STORAGE_KEY
      );
      if (storedAccount) {
        this.accounts = [storedAccount];
      }
    }
  }

  async connect(): Promise<string> {
    if (this.accounts.length) {
      return this.accounts[0];
    }

    // Generate a mock Algorand address for testing
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAccount = algosdk.generateAccount();
        const address = mockAccount.addr.toString();
        this.accounts = [address];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AlgorandWalletService.STORAGE_KEY, address);
        }
        resolve(address);
      }, 1000);
    });
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AlgorandWalletService.STORAGE_KEY);
    }
  }

  async reconnectSession(): Promise<string | null> {
    if (!this.accounts.length && typeof window !== "undefined") {
      const storedAccount = window.localStorage.getItem(
        AlgorandWalletService.STORAGE_KEY
      );
      if (storedAccount) {
        this.accounts = [storedAccount];
      }
    }
    return this.accounts.length ? this.accounts[0] : null;
  }

  getActiveAccount(): string | null {
    return this.accounts.length ? this.accounts[0] : null;
  }

  async signTransaction(txn: algosdk.Transaction): Promise<Uint8Array> {
    this.ensureConnected();
    // Return serialized txn bytes in mock mode.
    return txn.toByte();
  }

  async signGroupedTransactions(txns: algosdk.Transaction[]): Promise<Uint8Array[]> {
    this.ensureConnected();
    return txns.map((txn) => txn.toByte());
  }

  isAvailable(): boolean {
    return true;
  }

  private ensureConnected() {
    if (!this.accounts.length) {
      throw new Error("No mock Algorand account connected");
    }
  }
}

export const algorandWallet = new AlgorandWalletService();
export const connectAlgorandWallet = async (): Promise<string> => {
  return algorandWallet.connect();
};
