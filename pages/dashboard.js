import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EventIcon from "@mui/icons-material/Event";
import PaidIcon from "@mui/icons-material/Paid";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import CampaignFactory from "../artifacts/contracts/Campaign.sol/CampaignFactory.json";

// Helper to get IPFS URL using public gateway fallback
const getIpfsUrl = (cid) => {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  return `https://cloudflare-ipfs.com/ipfs/${cid}`;
};

export default function Dashboard() {
  const [campaignsData, setCampaignsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const fetchUserCampaigns = async () => {
      if (typeof window.ethereum === "undefined") {
        setLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length === 0) {
          setLoading(false);
          return;
        }

        setWalletConnected(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology/";
        const factoryAddress = process.env.NEXT_PUBLIC_ADDRESS;

        if (!factoryAddress) {
          throw new Error("Factory contract address is not configured.");
        }

        const readProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(
          factoryAddress,
          CampaignFactory.abi,
          readProvider
        );

        // Fetch campaign details
        const fetchCampaignDetails = async (campaignAddress) => {
          try {
            const campContract = new ethers.Contract(
              campaignAddress,
              [
                "function receivedAmount() view returns (uint256)",
                "function requiredAmount() view returns (uint256)"
              ],
              readProvider
            );
            const received = await campContract.receivedAmount();
            return ethers.utils.formatEther(received);
          } catch {
            return "0";
          }
        };

        // Fix: campaignCreated topics are [owner, timestamp, category]
        // To filter by owner (which is the first indexed parameter), we pass address as the first argument.
        const getUserCampaignsFilter = contract.filters.campaignCreated(address);
        const userCampaignEvents = await contract.queryFilter(getUserCampaignsFilter);

        const data = await Promise.all(
          userCampaignEvents.map(async (e) => {
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

        setCampaignsData(data);
      } catch (err) {
        console.error("Dashboard data fetching error:", err);
        toast.error("Failed to load dashboard data from blockchain.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCampaigns();
  }, []);

  return (
    <DashboardWrapper>
      <DashboardHeader>
        <Title>Your Campaign Dashboard</Title>
        <Subtitle>Manage and monitor all the campaigns you have launched on the blockchain.</Subtitle>
      </DashboardHeader>

      {loading ? (
        <LoadingWrapper>
          <LoadingSpinner />
          <p>Fetching your campaign details...</p>
        </LoadingWrapper>
      ) : !walletConnected ? (
        <AlertCard>
          <h3>Wallet not connected</h3>
          <p>Please connect your MetaMask wallet to view your personal dashboard.</p>
        </AlertCard>
      ) : campaignsData.length === 0 ? (
        <AlertCard>
          <h3>No campaigns launched yet</h3>
          <p>You haven&apos;t created any fundraising campaigns yet. Start a new one today!</p>
          <Link href="/createcampaign" passHref legacyBehavior>
            <CreateBtn>Create Campaign</CreateBtn>
          </Link>
        </AlertCard>
      ) : (
        <CardsWrapper>
          {campaignsData.map((e) => {
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
                  <CardTitle title={e.title}>{e.title}</CardTitle>
                  
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
                      <EventIcon style={{ fontSize: 16 }} /> Launched
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
                    <Button>View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </CardsWrapper>
      )}
    </DashboardWrapper>
  );
}

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const DashboardHeader = styled.div`
  text-align: center;
  margin: 40px 0 20px 0;
  max-width: 800px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, ${(props) => props.theme.accent} 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 1.05rem;
  opacity: 0.8;
  font-family: 'Poppins', sans-serif;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.accent};
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid ${(props) => props.theme.bgSubDiv};
  border-top: 5px solid ${(props) => props.theme.accent};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AlertCard = styled.div`
  text-align: center;
  padding: 50px 20px;
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  margin-top: 40px;
  width: 100%;
  max-width: 600px;

  h3 {
    font-size: 20px;
    margin-bottom: 10px;
  }

  p {
    opacity: 0.8;
    font-size: 14px;
    margin-bottom: 20px;
  }
`;

const CreateBtn = styled.button`
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

const CardTitle = styled.h3`
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