import algosdk from "algosdk";

class AlgorandService {
  private algodClient;

  constructor() {
    this.algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );
  }

  async getAccountInfo(address: string) {
    return await this.algodClient.accountInformation(address).do();
  }

  async getSuggestedParams() {
    return await this.algodClient.getTransactionParams().do();
  }
}

export const algorandService = new AlgorandService();