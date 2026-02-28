import algosdk from "algosdk";

class AlgorandService {
  private algodClient;

  constructor() {
    this.algodClient = new algosdk.Algodv2(
      "",
      "https://testnet-api.algonode.cloud",
      ""
    );
  }

  async getAccountInfo(address: string) {
    return await this.algodClient.accountInformation(address).do();
  }

  async getSuggestedParams() {
    return await this.algodClient.getTransactionParams().do();
  }

  async waitForConfirmation(txId: string) {
    const status = await this.algodClient.status().do();
    let lastRound = status["last-round"];
    while (true) {
      const pending = await this.algodClient.pendingTransactionInformation(txId).do();
      if (pending["confirmed-round"] && pending["confirmed-round"] > 0) {
        return pending;
      }
      lastRound++;
      await this.algodClient.statusAfterBlock(lastRound).do();
    }
  }
}

export const algorandService = new AlgorandService();