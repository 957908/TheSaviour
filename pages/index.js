import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EventIcon from "@mui/icons-material/Event";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PaidIcon from "@mui/icons-material/Paid";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import CampaignFactory from "../artifacts/contracts/Campaign.sol/CampaignFactory.json";

// Helper to get IPFS URL using public gateway fallback
const getIpfsUrl = (cid) => {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  return `https://cloudflare-ipfs.com/ipfs/${cid}`;
};

export default function Index({ AllData, HealthData, EducationData, AnimalData }) {
  const [filter, setFilter] = useState(AllData || []);
  const [activeCategory, setActiveCategory] = useState("all");

  const handleCategorySelect = (category, data) => {
    setActiveCategory(category);
    setFilter(data || []);
  };

  return (
    <HomeWrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroTitle>Empower Change, Save Lives</HeroTitle>
        <HeroSubtitle>
          Support meaningful campaigns, donate securely with crypto, and make a real difference in the world.
        </HeroSubtitle>
      </HeroSection>

      {/* Filter Section */}
      <FilterWrapper>
        <FilterIconWrapper>
          <FilterAltIcon />
          <span>Filter</span>
        </FilterIconWrapper>
        <CategoryList>
          <Category
            active={activeCategory === "all"}
            onClick={() => handleCategorySelect("all", AllData)}
          >
            All
          </Category>
          <Category
            active={activeCategory === "health"}
            onClick={() => handleCategorySelect("health", HealthData)}
          >
            Health
          </Category>
          <Category
            active={activeCategory === "education"}
            onClick={() => handleCategorySelect("education", EducationData)}
          >
            Education
          </Category>
          <Category
            active={activeCategory === "animal"}
            onClick={() => handleCategorySelect("animal", AnimalData)}
          >
            Animal
          </Category>
        </CategoryList>
      </FilterWrapper>

      {/* Cards Container */}
      {filter.length === 0 ? (
        <NoCampaigns>
          <h3>No campaigns found in this category.</h3>
          <p>Be the first to launch a campaign!</p>
          <Link href="/createcampaign" passHref legacyBehavior>
            <CreateBtn>Create Campaign</CreateBtn>
          </Link>
        </NoCampaigns>
      ) : (
        <CardsWrapper>
          {filter.map((e) => {
            const required = parseFloat(e.amount) || 0;
            const received = parseFloat(e.receivedAmount) || 0;
            const percentage = Math.min((received / required) * 100, 100).toFixed(0);

            return (
              <Card key={e.address}>
                <CardImg>
                  <Image
                    alt={e.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                    src={getIpfsUrl(e.image)}
                    onError={(event) => {
                      event.target.src = "/campaign-fallback.png";
                    }}
                  />
                  <CategoryBadge>{e.category || "General"}</CategoryBadge>
                </CardImg>
                <CardContent>
                  <Title title={e.title}>{e.title}</Title>
                  
                  <CardData>
                    <DataLabel>
                      <AccountBoxIcon style={{ fontSize: 16 }} /> Owner
                    </DataLabel>
                    <DataVal>
                      {e.owner.slice(0, 6)}...{e.owner.slice(-4)}
                    </DataVal>
                  </CardData>

                  <CardData>
                    <DataLabel>
                      <PaidIcon style={{ fontSize: 16 }} /> Goal
                    </DataLabel>
                    <DataVal>{e.amount} MATIC</DataVal>
                  </CardData>

                  <CardData>
                    <DataLabel>
                      <EventIcon style={{ fontSize: 16 }} /> Date
                    </DataLabel>
                    <DataVal>
                      {new Date(e.timeStamp * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </DataVal>
                  </CardData>

                  <ProgressWrapper>
                    <ProgressBar style={{ width: `${percentage}%` }} />
                  </ProgressWrapper>
                  <ProgressText>
                    <span>{percentage}% Funded</span>
                    <span>{received.toFixed(2)} MATIC</span>
                  </ProgressText>

                  <Link passHref href={"/" + e.address} legacyBehavior>
                    <Button>Go to Campaign</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </CardsWrapper>
      )}
    </HomeWrapper>
  );
}

export async function getStaticProps() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology/";
  const address = process.env.NEXT_PUBLIC_ADDRESS;

  let AllData = [];
  let HealthData = [];
  let EducationData = [];
  let AnimalData = [];

  if (address && address !== "0x5FbDB2315678afecb367f032d93F642f64180aa3") {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(address, CampaignFactory.abi, provider);

      const getAllCampaigns = contract.filters.campaignCreated();
      const AllCampaigns = await contract.queryFilter(getAllCampaigns);
      
      const fetchCampaignDetails = async (campaignAddress) => {
        try {
          const campContract = new ethers.Contract(
            campaignAddress,
            [
              "function receivedAmount() view returns (uint256)",
              "function requiredAmount() view returns (uint256)"
            ],
            provider
          );
          const received = await campContract.receivedAmount();
          return ethers.utils.formatEther(received);
        } catch {
          return "0";
        }
      };

      const processCampaigns = async (campaigns) => {
        return Promise.all(
          campaigns.map(async (e) => {
            const receivedAmount = await fetchCampaignDetails(e.args.campaignAddress);
            return {
              title: e.args.title,
              image: e.args.imgURI,
              owner: e.args.owner,
              timeStamp: parseInt(e.args.timestamp),
              amount: ethers.utils.formatEther(e.args.requiredAmount),
              address: e.args.campaignAddress,
              category: e.args.category,
              receivedAmount
            };
          })
        );
      };

      AllData = await processCampaigns(AllCampaigns);

      const getHealthCampaigns = contract.filters.campaignCreated(null, null, "health");
      const HealthCampaigns = await contract.queryFilter(getHealthCampaigns);
      HealthData = await processCampaigns(HealthCampaigns);

      const getEducationCampaigns = contract.filters.campaignCreated(null, null, "education");
      const EducationCampaigns = await contract.queryFilter(getEducationCampaigns);
      EducationData = await processCampaigns(EducationCampaigns);

      const getAnimalCampaigns = contract.filters.campaignCreated(null, null, "animal");
      const AnimalCampaigns = await contract.queryFilter(getAnimalCampaigns);
      AnimalData = await processCampaigns(AnimalCampaigns);

    } catch (error) {
      console.error("Error fetching getStaticProps blockchain data:", error);
    }
  } else {
    console.warn("Contract address is set to default Hardhat deploy address. Using mock fallback data for static paths.");
    AllData = [
      {
        title: "Support Education for Children in Rural India",
        image: "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL",
        owner: "0x3C44Cd35a2DD81F29e6307791D75C847E240c44c",
        timeStamp: Math.floor(Date.now() / 1000) - 86400 * 5,
        amount: "5.5",
        address: "0x1111111111111111111111111111111111111111",
        category: "education",
        receivedAmount: "2.1"
      },
      {
        title: "Emergency Surgery Funding for Stray Animals Rescue",
        image: "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL",
        owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        timeStamp: Math.floor(Date.now() / 1000) - 86400 * 2,
        amount: "2.0",
        address: "0x2222222222222222222222222222222222222222",
        category: "animal",
        receivedAmount: "1.8"
      },
      {
        title: "Clean Water and Healthcare Camp in Rural Village",
        image: "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL",
        owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        timeStamp: Math.floor(Date.now() / 1000) - 86400 * 10,
        amount: "10.0",
        address: "0x3333333333333333333333333333333333333333",
        category: "health",
        receivedAmount: "4.5"
      }
    ];
    HealthData = AllData.filter(e => e.category === "health");
    EducationData = AllData.filter(e => e.category === "education");
    AnimalData = AllData.filter(e => e.category === "animal");
  }

  return {
    props: {
      AllData,
      HealthData,
      EducationData,
      AnimalData,
    },
    revalidate: 10,
  };
}

const HomeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const HeroSection = styled.div`
  text-align: center;
  margin: 40px 0 20px 0;
  max-width: 800px;
`;

const HeroTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 15px;
  background: linear-gradient(135deg, ${(props) => props.theme.accent} 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroSubtitle = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.8;
  font-family: 'Poppins', sans-serif;
`;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 30px;
  padding: 10px 20px;
  background-color: ${(props) => props.theme.bgDiv};
  backdrop-filter: blur(12px);
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 16px;
  flex-wrap: wrap;
  gap: 15px;
`;

const FilterIconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: ${(props) => props.theme.accent};
`;

const CategoryList = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Category = styled.button`
  padding: 8px 16px;
  background-color: ${(props) => (props.active ? props.theme.accent : props.theme.bgSubDiv)};
  color: ${(props) => (props.active ? "#fff" : props.theme.color)};
  border: 1px solid ${(props) => (props.active ? props.theme.accent : props.theme.borderColor)};
  border-radius: 10px;
  font-family: "Poppins", sans-serif;
  font-weight: 550;
  font-size: 14px;
  cursor: pointer;
  box-shadow: ${(props) => (props.active ? "0 4px 12px rgba(139, 92, 246, 0.2)" : "none")};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    background-color: ${(props) => (props.active ? props.theme.accent : props.theme.bgDiv)};
    border-color: ${(props) => props.theme.accent};
  }
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
  width: 100%;
  margin-top: 30px;
`;

const Card = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.shadow};
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    border-color: ${(props) => props.theme.accent};
  }
`;

const CardImg = styled.div`
  position: relative;
  height: 180px;
  width: 100%;
`;

const CategoryBadge = styled.span`
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Title = styled.h3`
  font-family: "Poppins", sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 15px;
  height: 50px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: ${(props) => props.theme.color};
`;

const CardData = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
`;

const DataLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.7;
`;

const DataVal = styled.span`
  font-weight: 600;
`;

const ProgressWrapper = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${(props) => props.theme.bgSubDiv};
  border-radius: 4px;
  margin-top: 15px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
  margin-bottom: 20px;
  opacity: 0.9;
`;

const Button = styled.button`
  padding: 12px;
  text-align: center;
  width: 100%;
  background: ${(props) => props.theme.buttonBg};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  text-transform: uppercase;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
  transition: all 0.2s ease;
  margin-top: auto;

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NoCampaigns = styled.div`
  text-align: center;
  padding: 60px 20px;
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  margin-top: 40px;
  width: 100%;
`;

const CreateBtn = styled.button`
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, ${(props) => props.theme.accent} 0%, #7c3aed 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;