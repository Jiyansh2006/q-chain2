import algosdk from "algosdk";

class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer | null = null;
  private network: 'mainnet' | 'testnet' | 'betanet' = 'testnet';

  constructor() {
    // Initialize with testnet by default
    this.algodClient = new algosdk.Algodv2(
      "",
      "https://testnet-api.algonode.cloud",
      ""
    );
    
    // Initialize indexer for testnet
    this.indexerClient = new algosdk.Indexer(
      "",
      "https://testnet-idx.algonode.cloud",
      ""
    );
  }

  // ================= GETTERS =================

  get client() {
    return this.algodClient;
  }

  get indexer() {
    return this.indexerClient;
  }

  // ================= NETWORK MANAGEMENT =================

  setNetwork(network: 'mainnet' | 'testnet' | 'betanet') {
    this.network = network;
    
    const endpoints: Record<string, { algod: string; indexer: string }> = {
      mainnet: {
        algod: "https://mainnet-api.algonode.cloud",
        indexer: "https://mainnet-idx.algonode.cloud"
      },
      testnet: {
        algod: "https://testnet-api.algonode.cloud",
        indexer: "https://testnet-idx.algonode.cloud"
      },
      betanet: {
        algod: "https://betanet-api.algonode.cloud",
        indexer: "https://betanet-idx.algonode.cloud"
      }
    };

    this.algodClient = new algosdk.Algodv2(
      "",
      endpoints[network].algod,
      ""
    );

    this.indexerClient = new algosdk.Indexer(
      "",
      endpoints[network].indexer,
      ""
    );
  }

  getNetwork(): string {
    return this.network;
  }

  // ================= ACCOUNT OPERATIONS =================

  async getAccountInfo(address: string) {
    try {
      return await this.algodClient.accountInformation(address).do();
    } catch (error) {
      console.error(`Error fetching account info for ${address}:`, error);
      throw new Error(`Failed to fetch account info: ${error}`);
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const account = await this.getAccountInfo(address);
      return Number(account.amount) / 1_000_000; // microAlgo → ALGO
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      return 0;
    }
  }

  async getAssetBalance(address: string, assetId: number): Promise<number> {
    try {
      const account = await this.getAccountInfo(address);
      const asset = account.assets?.find((a: any) => a['asset-id'] === assetId);
      return asset ? Number(asset.amount) : 0;
    } catch (error) {
      console.error(`Error fetching asset balance:`, error);
      return 0;
    }
  }

  // ================= ASSET (NFT) OPERATIONS =================

  async getAssetInfo(assetId: number) {
    try {
      return await this.algodClient.getAssetByID(assetId).do();
    } catch (error) {
      console.error(`Error fetching asset info for ${assetId}:`, error);
      throw new Error(`Failed to fetch asset info: ${error}`);
    }
  }

  async getAccountAssets(address: string) {
    try {
      const account = await this.getAccountInfo(address);
      return account.assets || [];
    } catch (error) {
      console.error(`Error fetching account assets:`, error);
      return [];
    }
  }

  // ================= TRANSACTION CREATION =================

  async getSuggestedParams() {
    try {
      return await this.algodClient.getTransactionParams().do();
    } catch (error) {
      console.error('Error getting suggested params:', error);
      throw new Error(`Failed to get suggested params: ${error}`);
    }
  }

  async createNFTTransaction(
    creatorAddress: string,
    name: string,
    quantumHash: string,
    unitName: string = "QNFT",
    total: number = 1,
    decimals: number = 0,
    defaultFrozen: boolean = false,
    metadataHash?: string | Uint8Array
  ) {
    try {
      const params = await this.getSuggestedParams();

      const txnObj: any = {
        sender: creatorAddress,
        total: total,
        decimals: decimals,
        assetName: name,
        unitName: unitName,
        assetURL: quantumHash,
        defaultFrozen: defaultFrozen,
        suggestedParams: params,
      };

      if (metadataHash) {
        txnObj.metadataHash = typeof metadataHash === 'string' 
          ? new Uint8Array(Buffer.from(metadataHash, 'base64'))
          : metadataHash;
      }

      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(txnObj);

      return txn;
    } catch (error) {
      console.error('Error creating NFT transaction:', error);
      throw new Error(`Failed to create NFT transaction: ${error}`);
    }
  }

  async createOptInTransaction(account: string, assetId: number) {
    try {
      const params = await this.getSuggestedParams();
      
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: account,
        assetIndex: assetId,
        amount: 0,
        suggestedParams: params,
      });

      return txn;
    } catch (error) {
      console.error('Error creating opt-in transaction:', error);
      throw new Error(`Failed to create opt-in transaction: ${error}`);
    }
  }

  async createTransferTransaction(
    from: string,
    to: string,
    assetId: number,
    amount: number
  ) {
    try {
      const params = await this.getSuggestedParams();
      
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: from,
        receiver: to,
        assetIndex: assetId,
        amount: amount,
        suggestedParams: params,
      });

      return txn;
    } catch (error) {
      console.error('Error creating transfer transaction:', error);
      throw new Error(`Failed to create transfer transaction: ${error}`);
    }
  }

  async createPaymentTransaction(
    from: string,
    to: string,
    amount: number,
    note?: string
  ) {
    try {
      const params = await this.getSuggestedParams();
      const noteUint8Array = note ? new Uint8Array(Buffer.from(note)) : undefined;
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: from,
        receiver: to,
        amount: amount * 1_000_000, // Convert ALGO to microAlgo
        note: noteUint8Array,
        suggestedParams: params,
      });

      return txn;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw new Error(`Failed to create payment transaction: ${error}`);
    }
  }

  // ================= TRANSACTION SUBMISSION =================

  async sendTransaction(signedTxn: Uint8Array) {
    try {
      const { txid } = await this.algodClient.sendRawTransaction(signedTxn).do();
      return { txId: txid };
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  // ================= CONFIRMATION =================

  async waitForConfirmation(txId: string, timeout: number = 10) {
    try {
      const status = await this.algodClient.status().do();
      let currentRound = status["last-round"];
      const startRound = currentRound;

      while (currentRound < startRound + timeout) {
        const pendingInfo = await this.algodClient
          .pendingTransactionInformation(txId)
          .do();

        if (pendingInfo["confirmed-round"] && pendingInfo["confirmed-round"] > 0) {
          return pendingInfo;
        }

        currentRound++;
        await this.algodClient.statusAfterBlock(currentRound).do();
      }

      throw new Error(`Transaction not confirmed after ${timeout} rounds`);
    } catch (error) {
      console.error('Error waiting for confirmation:', error);
      throw new Error(`Failed to wait for confirmation: ${error}`);
    }
  }

  async getTransactionInfo(txId: string) {
    try {
      return await this.algodClient.pendingTransactionInformation(txId).do();
    } catch (error) {
      console.error('Error getting transaction info:', error);
      throw new Error(`Failed to get transaction info: ${error}`);
    }
  }

  // ================= INDEXER QUERIES =================

  async lookupAccountTransactions(address: string, limit: number = 100) {
    if (!this.indexerClient) {
      throw new Error('Indexer client not initialized');
    }

    try {
      const response = await this.indexerClient
        .lookupAccountTransactions(address)
        .limit(limit)
        .do();
      return response.transactions;
    } catch (error) {
      console.error('Error looking up account transactions:', error);
      return [];
    }
  }

  async lookupAssetTransactions(assetId: number, limit: number = 100) {
    if (!this.indexerClient) {
      throw new Error('Indexer client not initialized');
    }

    try {
      const response = await this.indexerClient
        .lookupAssetTransactions(assetId)
        .limit(limit)
        .do();
      return response.transactions;
    } catch (error) {
      console.error('Error looking up asset transactions:', error);
      return [];
    }
  }

  async searchAccounts(assetId?: number, limit: number = 100) {
    if (!this.indexerClient) {
      throw new Error('Indexer client not initialized');
    }

    try {
      let query = this.indexerClient.searchAccounts();
      if (assetId) {
        query = query.assetID(assetId);
      }
      const response = await query.limit(limit).do();
      return response.accounts;
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  }

  async getAssetBalances(assetId: number, limit: number = 100) {
    if (!this.indexerClient) {
      throw new Error('Indexer client not initialized');
    }

    try {
      const response = await this.indexerClient
        .lookupAssetBalances(assetId)
        .limit(limit)
        .do();
      return response.balances;
    } catch (error) {
      console.error('Error getting asset balances:', error);
      return [];
    }
  }

  // ================= UTILITY FUNCTIONS =================

  async getStatus() {
    try {
      return await this.algodClient.status().do();
    } catch (error) {
      console.error('Error getting node status:', error);
      throw new Error(`Failed to get node status: ${error}`);
    }
  }

  async getBlock(round: number) {
    try {
      return await this.algodClient.block(round).do();
    } catch (error) {
      console.error('Error getting block:', error);
      throw new Error(`Failed to get block: ${error}`);
    }
  }

  async getSupply() {
    try {
      return await this.algodClient.supply().do();
    } catch (error) {
      console.error('Error getting supply:', error);
      throw new Error(`Failed to get supply: ${error}`);
    }
  }

  // ================= HEALTH CHECK =================

  async checkHealth(): Promise<boolean> {
    try {
      await this.algodClient.status().do();
      return true;
    } catch (error) {
      console.error('Algorand node health check failed:', error);
      return false;
    }
  }

  // ================= ENCODING/DECODING =================

  decodeAddress(address: string): Uint8Array {
    return algosdk.decodeAddress(address).publicKey;
  }

  encodeAddress(publicKey: Uint8Array): string {
    return algosdk.encodeAddress(publicKey);
  }

  // ================= TRANSACTION UTILITIES =================

  calculateTransactionFee(txn: any): number {
    const feePerByte = 1000; // microAlgo per byte (minimum fee)
    const estimatedSize = 200; // Approximate transaction size in bytes
    return Math.max(txn.fee || 0, feePerByte * estimatedSize);
  }

  estimateTransactionSize(txn: any): number {
    // Rough estimation - actual size depends on transaction type and contents
    return 200; // Placeholder
  }
}

export const algorandService = new AlgorandService();