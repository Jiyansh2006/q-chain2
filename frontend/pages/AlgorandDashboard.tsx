import React, { useState } from "react";
import algosdk from "algosdk";
import { algorandService } from "../services/algorandService";
import { algorandWallet } from "../services/algorandWallet";

const AlgorandDashboard = () => {
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const connectWallet = async () => {
        setLoading(true);
        try {
            const addr = await algorandWallet.connect();
            setAddress(addr);
        } catch (error) {
            console.error("Failed to connect:", error);
            alert("Failed to connect to Pera Wallet");
        } finally {
            setLoading(false);
        }
    };

    const checkBalance = async () => {
        if (!address) {
            alert("Connect wallet first");
            return;
        }
        try {
            const info = await algorandService.getAccountInfo(address);
            setBalance(Number(info.amount) / 1_000_000);
        } catch (error) {
            console.error("Failed to get balance:", error);
        }
    };

    const sendAlgo = async () => {
        if (!address) {
            alert("Connect wallet first");
            return;
        }
        
        try {
            setLoading(true);
            const suggestedParams = await algorandService.getSuggestedParams();

            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: address,
                receiver: "RECEIVER_ADDRESS", // Replace with actual receiver
                amount: 1_000_000, // 1 ALGO
                suggestedParams,
            });

            const signed = await algorandWallet.signTransaction(txn);
            const response = await algorandService.sendTransaction(signed);
            const txId = response.txId;

            await algorandService.waitForConfirmation(txId);
            alert("Transaction successful!");
            
            // Update balance
            await checkBalance();
        } catch (error) {
            console.error("Transaction failed:", error);
            alert("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const mintNFT = async () => {
        if (!address) {
            alert("Connect wallet first");
            return;
        }
        
        try {
            setLoading(true);
            const suggestedParams = await algorandService.getSuggestedParams();

            const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
                sender: address,
                total: 1,
                decimals: 0,
                assetName: "Quantum NFT",
                unitName: "QNFT",
                assetURL: "ipfs://QmHash", // Replace with actual hash
                defaultFrozen: false,
                suggestedParams,
            });

            const signed = await algorandWallet.signTransaction(txn);
            const response = await algorandService.sendTransaction(signed);
            const txId = response.txId;

            await algorandService.waitForConfirmation(txId);
            alert("NFT Minted on Algorand!");
        } catch (error) {
            console.error("NFT minting failed:", error);
            alert("NFT minting failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                Algorand Dashboard
            </h1>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <button
                        onClick={connectWallet}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Connecting..." : "Connect Pera Wallet"}
                    </button>
                    
                    <button
                        onClick={checkBalance}
                        disabled={!address || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Check Balance
                    </button>
                </div>

                {address && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Connected Address:</p>
                        <p className="font-mono text-white break-all">{address}</p>
                    </div>
                )}
                
                {balance !== null && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Balance:</p>
                        <p className="text-2xl font-bold text-white">{balance} ALGO</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={sendAlgo}
                        disabled={!address || loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        Send 1 ALGO
                    </button>
                    
                    <button
                        onClick={mintNFT}
                        disabled={!address || loading}
                        className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                        Mint NFT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlgorandDashboard;