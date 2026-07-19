import { ethers } from "ethers";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import CampaignContract from "../artifacts/contracts/Campaign.sol/Campaign.json";

// Helper to get IPFS URL using public gateway fallback
const getIpfsUrl = (cid) => {
  if (!cid) return "";
  if (cid.startsWith("http")) return cid;
  if (cid === "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL") {
    return "https://images.unsplash.com/photo-1532629345422-7515f3d16bb8?q=80&w=600";
  }
  return `https://cloudflare-ipfs.com/ipfs/${cid}`;
};

export default function Detail({ Data, DonationsData }) {
  const [mydonations, setMydonations] = useState([]);
  const [story, setStory] = useState("");
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);

  useEffect(() => {
    const fetchDynamicData = async () => {
      if (!Data || !Data.address) return;

      let storyText = "";
      
      if (Data.storyUrl === "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL") {
        storyText = "This is a sandbox mock campaign story. You are running in Mock Mode because the IPFS credentials were not set or the public IPFS gateway timed out. This campaign aims to provide critical funding for community resources, offering hope and relief to those in need. Join us in supporting this cause and making a difference today!";
        setStory(storyText);
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(getIpfsUrl(Data.storyUrl), { signal: controller.signal });
          clearTimeout(timeoutId);
          storyText = await res.text();
          setStory(storyText);
        } catch {
          console.warn("Failed to fetch story from IPFS gateway, using default fallback text.");
          setStory("We are raising funds for this crucial campaign. Every donation brings us closer to our goal. Thank you for your support!");
        }
      }

      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            const contract = new ethers.Contract(
              Data.address,
              CampaignContract.abi,
              provider
            );

            const myDonationsFilter = contract.filters.donated(userAddress);
            const myAllDonations = await contract.queryFilter(myDonationsFilter);

            setMydonations(
              myAllDonations.map((e) => ({
                donar: e.args.donar,
                amount: ethers.utils.formatEther(e.args.amount),
                timestamp: parseInt(e.args.timestamp),
              }))
            );
          }
        } catch (err) {
          console.error("Error fetching personal donations:", err);
        }
      }
    };

    fetchDynamicData();
  }, [Data, change]);

  const donateFunds = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask is not connected. Please install MetaMask!");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.warn("Please enter a valid amount to donate.");
      return;
    }

    setDonateLoading(true);

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(Data.address, CampaignContract.abi, signer);

      const tx = await contract.donate({
        value: ethers.utils.parseEther(amount),
      });

      toast.info("Donation transaction submitted. Waiting for confirmation...");
      await tx.wait();

      toast.success("Thank you for your generous donation!");
      setAmount("");
      setChange(!change);
    } catch (error) {
      console.error("Donation failed:", error);
      toast.error(error.reason || error.message || "Donation failed.");
    } finally {
      setDonateLoading(false);
    }
  };

  if (!Data) {
    return (
      <LoadingWrapper>
        <h3>Loading campaign...</h3>
      </LoadingWrapper>
    );
  }

  const required = parseFloat(Data.requiredAmount) || 0;
  const received = parseFloat(Data.receivedAmount) || 0;
  const percentage = Math.min((received / required) * 100, 100).toFixed(1);

  return (
    <DetailWrapper>
      <LeftContainer>
        <ImageSection>
          <Image
            alt={Data.title}
            fill
            style={{ objectFit: "cover" }}
            src={getIpfsUrl(Data.image)}
            onError={(event) => {
              event.target.src = "/campaign-fallback.png";
            }}
          />
        </ImageSection>
        <StoryCard>
          <StoryHeader>The Story</StoryHeader>
          <StoryText>{story}</StoryText>
        </StoryCard>
      </LeftContainer>

      <RightContainer>
        <CampaignHeader>
          <Title>{Data.title}</Title>
          <OwnerBadge>
            Created by: <span>{Data.owner.slice(0, 8)}...{Data.owner.slice(-6)}</span>
          </OwnerBadge>
        </CampaignHeader>

        <StatusCard>
          <ProgressSection>
            <ProgressLabel>
              <span>Progress</span>
              <span>{percentage}% complete</span>
            </ProgressLabel>
            <ProgressBarContainer>
              <ProgressBar style={{ width: `${percentage}%` }} />
            </ProgressBarContainer>
          </ProgressSection>

          <FundsData>
            <FundsBox>
              <FundLabel>Target Goal</FundLabel>
              <FundValue>{Data.requiredAmount} MATIC</FundValue>
            </FundsBox>
            <FundsBox>
              <FundLabel>Received</FundLabel>
              <FundValue className="received">{Data.receivedAmount} MATIC</FundValue>
            </FundsBox>
          </FundsData>
        </StatusCard>

        <DonateSection>
          <DonateTitle>Support this Campaign</DonateTitle>
          <DonateInputGroup>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.0 MATIC"
              disabled={donateLoading}
            />
            <DonateBtn onClick={donateFunds} disabled={donateLoading}>
              {donateLoading ? "Donating..." : "Donate Now"}
            </DonateBtn>
          </DonateInputGroup>
        </DonateSection>

        <DonationsGrid>
          <DonationListContainer>
            <ListHeader>Recent Donations</ListHeader>
            <ListBody>
              {DonationsData.length === 0 ? (
                <EmptyMessage>No donations yet. Be the first!</EmptyMessage>
              ) : (
                DonationsData.map((e, index) => (
                  <DonationRow key={index}>
                    <DonorAddr title={e.donar}>
                      {e.donar.slice(0, 6)}...{e.donar.slice(-4)}
                    </DonorAddr>
                    <DonationAmt>{e.amount} MATIC</DonationAmt>
                    <DonationTime>
                      {new Date(e.timestamp * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </DonationTime>
                  </DonationRow>
                ))
              )}
            </ListBody>
          </DonationListContainer>

          <DonationListContainer>
            <ListHeader>My Past Donations</ListHeader>
            <ListBody>
              {mydonations.length === 0 ? (
                <EmptyMessage>You haven&apos;t donated to this campaign.</EmptyMessage>
              ) : (
                mydonations.map((e, index) => (
                  <DonationRow key={index} className="my-donation">
                    <DonorAddr title={e.donar}>You</DonorAddr>
                    <DonationAmt>{e.amount} MATIC</DonationAmt>
                    <DonationTime>
                      {new Date(e.timestamp * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </DonationTime>
                  </DonationRow>
                ))
              )}
            </ListBody>
          </DonationListContainer>
        </DonationsGrid>
      </RightContainer>
    </DetailWrapper>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps(context) {
  const address = context.params.address;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology/";

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, CampaignContract.abi, provider);

    const title = await contract.title();
    const requiredAmount = await contract.requiredAmount();
    const image = await contract.image();
    const storyUrl = await contract.story();
    const owner = await contract.owner();
    const receivedAmount = await contract.receivedAmount();

    const donationsFilter = contract.filters.donated();
    const allDonations = await contract.queryFilter(donationsFilter);

    const Data = {
      address,
      title,
      requiredAmount: ethers.utils.formatEther(requiredAmount),
      image,
      receivedAmount: ethers.utils.formatEther(receivedAmount),
      storyUrl,
      owner,
    };

    const DonationsData = allDonations.map((e) => ({
      donar: e.args.donar,
      amount: ethers.utils.formatEther(e.args.amount),
      timestamp: parseInt(e.args.timestamp),
    }));

    return {
      props: {
        Data,
        DonationsData,
      },
      revalidate: 10,
    };
  } catch (error) {
    console.error("Error in getStaticProps for campaign details:", error);
    const mockData = {
      address,
      title: "Support Children Healthcare and Education (Mock Details)",
      requiredAmount: "10.0",
      image: "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL",
      receivedAmount: "3.5",
      storyUrl: "Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL",
      owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    };
    return {
      props: {
        Data: mockData,
        DonationsData: [
          {
            donar: "0x3C44Cd35a2DD81F29e6307791D75C847E240c44c",
            amount: "1.5",
            timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
          },
          {
            donar: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            amount: "2.0",
            timestamp: Math.floor(Date.now() / 1000) - 86400,
          },
        ],
      },
      revalidate: 10,
    };
  }
}

const DetailWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 40px;
  margin-top: 30px;
  margin-bottom: 50px;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const LeftContainer = styled.div`
  width: 48%;
  display: flex;
  flex-direction: column;
  gap: 25px;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const RightContainer = styled.div`
  width: 48%;
  display: flex;
  flex-direction: column;
  gap: 25px;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const ImageSection = styled.div`
  width: 100%;
  position: relative;
  height: 380px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.borderColor};
  box-shadow: ${(props) => props.theme.shadow};
`;

const StoryCard = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  padding: 25px;
  box-shadow: ${(props) => props.theme.shadow};
  backdrop-filter: blur(12px);
`;

const StoryHeader = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 15px;
  color: ${(props) => props.theme.accent};
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  padding-bottom: 10px;
`;

const StoryText = styled.p`
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.9;
  text-align: justify;
  white-space: pre-line;
`;

const CampaignHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: ${(props) => props.theme.color};
`;

const OwnerBadge = styled.div`
  font-size: 13px;
  opacity: 0.7;
  span {
    font-weight: 600;
    color: ${(props) => props.theme.accent};
  }
`;

const StatusCard = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  padding: 25px;
  box-shadow: ${(props) => props.theme.shadow};
  backdrop-filter: blur(12px);
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 10px;
  background-color: ${(props) => props.theme.bgSubDiv};
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
`;

const FundsData = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 20px;
`;

const FundsBox = styled.div`
  flex: 1;
  background-color: ${(props) => props.theme.bgSubDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  padding: 15px;
  border-radius: 12px;
  text-align: center;
`;

const FundLabel = styled.p`
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 5px;
`;

const FundValue = styled.p`
  font-size: 18px;
  font-weight: 700;

  &.received {
    color: #10b981;
  }
`;

const DonateSection = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  padding: 25px;
  box-shadow: ${(props) => props.theme.shadow};
  backdrop-filter: blur(12px);
`;

const DonateTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 15px;
`;

const DonateInputGroup = styled.div`
  display: flex;
  gap: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  outline: none;
  font-size: 16px;
  font-family: "Poppins", sans-serif;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${(props) => props.theme.accent};
  }
`;

const DonateBtn = styled.button`
  padding: 12px 28px;
  color: white;
  background: ${(props) => props.theme.buttonBg};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 15px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DonationsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DonationListContainer = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.shadow};
  height: 250px;
  display: flex;
  flex-direction: column;
`;

const ListHeader = styled.div`
  background-color: ${(props) => props.theme.bgSubDiv};
  padding: 12px 15px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  color: ${(props) => props.theme.accent};
`;

const ListBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.borderColor};
    border-radius: 3px;
  }
`;

const DonationRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px dashed ${(props) => props.theme.borderColor};
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  &.my-donation {
    background-color: rgba(139, 92, 246, 0.05);
  }
`;

const DonorAddr = styled.span`
  font-family: monospace;
  font-weight: 600;
`;

const DonationAmt = styled.span`
  font-weight: 700;
  color: #10b981;
`;

const DonationTime = styled.span`
  opacity: 0.6;
  font-size: 11px;
`;

const EmptyMessage = styled.p`
  text-align: center;
  opacity: 0.6;
  font-size: 13px;
  margin-top: 50px;
  padding: 0 10px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  font-weight: 600;
`;