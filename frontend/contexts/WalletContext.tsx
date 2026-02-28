import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { WalletState, NFT } from "../types";
import { NETWORKS, DEFAULT_NETWORK } from "../config/networks";
import {
  getEvmContract,
  getQTokenAddress,
  getQuantumNFTAddress,
} from "../config/blockchain";
import { algorandService } from "../services/algorandService";
import { connectAlgorandWallet } from "../services/algorandWallet";

interface WalletContextType extends WalletState {
  loading: boolean;
  selectedNetworkKey: string;
  setSelectedNetworkKey: (key: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const defaultState: WalletState = {
  provider: null,
  signer: null,
  address: null,
  network: null,
  qTokenBalance: "0",
  nfts: [],
};

export const WalletContext = createContext<WalletContextType>({
  ...defaultState,
  loading: false,
  selectedNetworkKey: "11155111",
  setSelectedNetworkKey: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
  refreshBalance: async () => {},
});

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<WalletState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [selectedNetworkKey, setSelectedNetworkKey] =
    useState<string>("11155111");

  const selectedNetwork = NETWORKS[selectedNetworkKey];

  // ================= EVM FETCH =================
  const fetchEvmData = useCallback(
    async (
      provider: ethers.BrowserProvider,
      signer: ethers.JsonRpcSigner,
      address: string
    ) => {
      try {
        const network = await provider.getNetwork();

        const qTokenContract = getEvmContract("qtoken", provider);
        let qTokenBalance = "0";

        if (qTokenContract) {
          const rawBalance = await qTokenContract.balanceOf(address);
          const decimals = await qTokenContract.decimals();
          qTokenBalance = ethers.formatUnits(rawBalance, decimals);
        }

        const nftContract = getEvmContract("quantum-nft", provider);
        const nfts: NFT[] = [];

        if (nftContract) {
          const balance = await nftContract.balanceOf(address);

          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(
                address,
                i
              );
              const tokenURI = await nftContract.tokenURI(tokenId);

              nfts.push({
                id: tokenId.toString(),
                name: `Quantum NFT #${tokenId}`,
                description: "Quantum secured NFT",
                image: tokenURI,
              });
            } catch {
              continue;
            }
          }
        }

        setWallet({
          provider,
          signer,
          address,
          network,
          qTokenBalance,
          nfts,
        });
      } catch (error) {
        console.error("EVM fetch error:", error);
      }
    },
    []
  );

  // ================= ALGOrand FETCH =================
  const fetchAlgorandData = useCallback(
    async (address: string) => {
      try {
        // Replace 'getBalance' with the correct method name from AlgorandService
        const balance = await algorandService.getBalance(address);

        setWallet({
          provider: null,
          signer: null,
          address,
          network: selectedNetwork,
          qTokenBalance: balance.toString(),
          nfts: [],
        });
      } catch (error) {
        console.error("Algorand fetch error:", error);
      }
    },
    [selectedNetwork]
  );

  // ================= CONNECT WALLET =================
  const connectWallet = async () => {
    try {
      setLoading(true);

      // ----------- EVM -----------
      if (selectedNetwork.type === "EVM") {
        if (!(window as any).ethereum) {
          alert("Please install MetaMask");
          return;
        }

        const provider = new ethers.BrowserProvider(
          (window as any).ethereum
        );

        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        await fetchEvmData(provider, signer, address);
      }

      // ----------- ALGOrand -----------
      if (selectedNetwork.type === "ALGORAND") {
        const address = await connectAlgorandWallet();
        await fetchAlgorandData(address);
      }
    } catch (error) {
      console.error("Wallet connect failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(defaultState);
  };

  const refreshBalance = async () => {
    if (!wallet.address) return;

    if (selectedNetwork.type === "EVM" && wallet.provider && wallet.signer) {
      await fetchEvmData(
        wallet.provider,
        wallet.signer,
        wallet.address
      );
    }

    if (selectedNetwork.type === "ALGORAND") {
      await fetchAlgorandData(wallet.address);
    }
  };

  // ================= MetaMask Listeners =================
  useEffect(() => {
    if (!(window as any).ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    (window as any).ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      (window as any).ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, [selectedNetworkKey]);

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        loading,
        selectedNetworkKey,
        setSelectedNetworkKey,
        connectWallet,
        disconnectWallet,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};