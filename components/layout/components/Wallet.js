import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";

const networks = {
  polygon: {
    chainId: `0x${Number(80002).toString(16)}`,
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-amoy.polygon.technology/"],
    blockExplorerUrls: ["https://amoy.polygonscan.com/"],
  },
};

const Wallet = () => {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  const checkConnection = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const walletAddress = await signer.getAddress();
          setAddress(walletAddress);
          const walletBalance = ethers.utils.formatEther(await signer.getBalance());
          setBalance(walletBalance);
        }
      } catch (err) {
        console.error("Wallet check error:", err);
      }
    }
  };

  useEffect(() => {
    checkConnection();
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          checkConnection();
        } else {
          setAddress("");
          setBalance("");
        }
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.warn("MetaMask is not installed. Please install it to interact with this DApp.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const network = await provider.getNetwork();

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "";
      const isLocalhost = rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1");

      if (isLocalhost) {
        if (network.chainId !== 31337) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x7a69" }],
            });
          } catch {
            toast.warn("Please switch MetaMask network to Localhost (8545).");
          }
        }
      } else {
        if (network.chainId !== 80002) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${Number(80002).toString(16)}` }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [networks["polygon"]],
                });
              } catch {
                toast.error("Failed to add Polygon Amoy network to MetaMask.");
              }
            } else {
              toast.error("Failed to switch network. Please switch manually.");
            }
          }
        }
      }

      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      setAddress(walletAddress);
      const walletBalance = ethers.utils.formatEther(await signer.getBalance());
      setBalance(walletBalance);
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet.");
    }
  };

  return (
    <ConnectWalletWrapper onClick={connectWallet}>
      {balance === "" ? null : (
        <Balance>{parseFloat(balance).toFixed(4)} MATIC</Balance>
      )}
      {address === "" ? (
        <AddressBtn>Connect Wallet</AddressBtn>
      ) : (
        <AddressBtn>
          {address.slice(0, 6)}...{address.slice(-4)}
        </AddressBtn>
      )}
    </ConnectWalletWrapper>
  );
};

const ConnectWalletWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.theme.bgSubDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  padding: 4px 10px;
  height: 40px;
  color: ${(props) => props.theme.color};
  border-radius: 10px;
  margin-right: 15px;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: ${(props) => props.theme.shadow};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.bgDiv};
    border-color: ${(props) => props.theme.accent};
  }
`;

const AddressBtn = styled.span`
  background-color: ${(props) => props.theme.accent};
  color: #fff;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 8px;
  margin-left: 5px;
  transition: all 0.2s ease;
`;

const Balance = styled.span`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
`;

export default Wallet;