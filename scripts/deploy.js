const hre = require('hardhat');

async function main() {
  const CampaignFactory= await hre.ethers.getContractFactory("CampaignFactory");
  const campaignFactory = await CampaignFactory.deploy();

  await campaignFactory.deployed();
  console.log("CampaignFactory deployed to:", campaignFactory.address);
}

main()
 .catch((error) => {
  console.error("Error deploying CampaignFactory:", error);
  process.exit(1);
});