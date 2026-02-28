import PeraWalletConnect from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

export const connectAlgorandWallet = async () => {
  const accounts = await peraWallet.connect();
  return accounts[0];
};

export const signTransaction = async (txn: any) => {
  const signedTxn = await peraWallet.signTransaction([
    {
      txn,
      signers: [txn.from],
    },
  ]);
  return signedTxn;
};