import React, { useState } from "react";
import algosdk from "algosdk";
import { algorandService } from "../services/algorandService";
import { connectAlgorandWallet, signTransaction } from "../services/algorandWallet";

const AlgorandDashboard = () => {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  const connectWallet = async () => {
    const addr = await connectAlgorandWallet();
    setAddress(addr);
  };

  const checkBalance = async () => {
    const info = await algorandService.getAccountInfo(address);
    setBalance(info.amount / 1_000_000);
  };

  return (
    <div>
      <h2>Algorand Dashboard</h2>
      <button onClick={connectWallet}>Connect Pera Wallet</button>
      <button onClick={checkBalance}>Check Balance</button>

      {address && <p>Address: {address}</p>}
      {balance !== null && <p>Balance: {balance} ALGO</p>}
    </div>
  );
};

export default AlgorandDashboard;