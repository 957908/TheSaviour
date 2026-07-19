require("@nomiclabs/hardhat-waffle");
require( 'dotenv').config({path: './.env.local'});

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

let privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY || "";
privateKey = privateKey.trim();

// Strip any leading 0x to clean it up first
if (privateKey.startsWith("0x")) {
  privateKey = privateKey.slice(2);
}

// Check if private key is a valid 64-char hex string. If not, use Hardhat's default account 0 key
const hexRegex = /^[0-9a-fA-F]{64}$/;
if (!hexRegex.test(privateKey)) {
  privateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat Account 0 key
}

// Add the 0x prefix back
privateKey = "0x" + privateKey;

module.exports = {
  solidity: "0.8.10",
  defaultNetwork: "polygon",
  networks: {
    hardhat: {},
    polygon: {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: [privateKey],
    },
  },
};

