import { ethers } from "ethers";
import Link from "next/link";
import { createContext, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import CampaignFactory from "../../artifacts/contracts/Campaign.sol/CampaignFactory.json";
import FormLeftWrapper from "./components/FormLeftWrapper";
import FormRightWrapper from "./components/FormRightWrapper";

const FormState = createContext();

const Form = () => {
  const [form, setForm] = useState({
    campaignTitle: "",
    story: "",
    requiredAmount: "",
    category: "education",
  });

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [uploaded, setUploaded] = useState(false);

  const [storyUrl, setStoryUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const FormHandler = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const [image, setImage] = useState(null);

  const ImageHandler = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const startCampaign = async (e) => {
    e.preventDefault();

    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask is not connected. Please install MetaMask!");
      return;
    }

    if (form.campaignTitle.trim() === "") {
      toast.warn("Title field is empty");
      return;
    } 
    if (form.story.trim() === "") {
      toast.warn("Story field is empty");
      return;
    } 
    if (form.requiredAmount.trim() === "" || parseFloat(form.requiredAmount) <= 0) {
      toast.warn("Please enter a valid required amount");
      return;
    } 
    if (!uploaded) {
      toast.warn("Please upload your files to IPFS first!");
      return;
    }

    setLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contractAddress = process.env.NEXT_PUBLIC_ADDRESS;
      if (!contractAddress) {
        throw new Error("Factory contract address is not configured in environment variables.");
      }

      const contract = new ethers.Contract(
        contractAddress,
        CampaignFactory.abi,
        signer
      );

      const CampaignAmount = ethers.utils.parseEther(form.requiredAmount);

      const campaignTx = await contract.createCampaign(
        form.campaignTitle,
        CampaignAmount,
        imageUrl,
        form.category.toLowerCase(), // Unify to lowercase in contract event
        storyUrl
      );

      toast.info("Transaction submitted. Waiting for confirmation...");
      const receipt = await campaignTx.wait();

      // Find the campaignCreated event to extract the campaignAddress
      const event = receipt.events.find((ev) => ev.event === "campaignCreated");
      const newCampaignAddress = event ? event.args.campaignAddress : "";

      if (newCampaignAddress) {
        setAddress(newCampaignAddress);
        toast.success("Campaign deployed successfully!");
      } else {
        setAddress(receipt.to || contractAddress);
        toast.warning("Campaign deployed, but could not retrieve address from events.");
      }
    } catch (error) {
      console.error("Start campaign error:", error);
      toast.error(error.reason || error.message || "Failed to start campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormState.Provider
      value={{
        form,
        setForm,
        image,
        setImage,
        ImageHandler,
        FormHandler,
        setImageUrl,
        setStoryUrl,
        startCampaign,
        setUploaded,
        uploaded,
      }}
    >
      <FormWrapper>
        <FormMain>
          <FormHeader>
            <FormTitle>Start a New Campaign</FormTitle>
            <FormDesc>Fill in the details to launch a crowdfunding smart contract.</FormDesc>
          </FormHeader>
          
          {loading ? (
            <Spinner>
              <LocalSpinner />
              <SpinnerText>Deploying Smart Contract on Blockchain...</SpinnerText>
            </Spinner>
          ) : address !== "" ? (
            <AddressCard>
              <SuccessIcon>🎉</SuccessIcon>
              <SuccessHeading>Campaign Created Successfully!</SuccessHeading>
              <AddressInfo>
                <AddressLabel>Campaign Smart Contract Address</AddressLabel>
                <AddressText>{address}</AddressText>
              </AddressInfo>
              <Link href={"/" + address} passHref legacyBehavior>
                <GoToBtn>Go To Campaign Page</GoToBtn>
              </Link>
              <CreateAnotherBtn onClick={() => setAddress("")}>
                Create Another Campaign
              </CreateAnotherBtn>
            </AddressCard>
          ) : (
            <FormInputsWrapper>
              <FormLeftWrapper />
              <FormRightWrapper />
            </FormInputsWrapper>
          )}
        </FormMain>
      </FormWrapper>
    </FormState.Provider>
  );
};

const FormWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 50px;
`;

const FormMain = styled.div`
  width: 100%;
  max-width: 900px;
  background-color: ${(props) => props.theme.bgDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 24px;
  padding: 40px;
  box-shadow: ${(props) => props.theme.shadow};
  backdrop-filter: blur(12px);
`;

const FormHeader = styled.div`
  margin-bottom: 30px;
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  padding-bottom: 20px;
`;

const FormTitle = styled.h2`
  font-family: "Poppins", sans-serif;
  font-size: 24px;
  font-weight: 700;
`;

const FormDesc = styled.p`
  font-size: 14px;
  opacity: 0.7;
  margin-top: 5px;
`;

const FormInputsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const Spinner = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const SpinnerText = styled.p`
  margin-top: 20px;
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => props.theme.accent};
`;

const AddressCard = styled.div`
  width: 100%;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: ${(props) => props.theme.bgSubDiv};
  border-radius: 16px;
  border: 1px solid ${(props) => props.theme.borderColor};
`;

const SuccessIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const SuccessHeading = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 20px;
`;

const AddressInfo = styled.div`
  background-color: ${(props) => props.theme.bgDiv};
  padding: 15px 25px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.borderColor};
  max-width: 500px;
  width: 100%;
  margin-bottom: 30px;
`;

const AddressLabel = styled.p`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 5px;
`;

const AddressText = styled.p`
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  word-break: break-all;
  color: ${(props) => props.theme.accent};
`;

const GoToBtn = styled.button`
  padding: 12px 30px;
  color: white;
  background: ${(props) => props.theme.buttonBg};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const CreateAnotherBtn = styled.button`
  margin-top: 15px;
  background: transparent;
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.bgDiv};
    border-color: ${(props) => props.theme.accent};
  }
`;

export default Form;
export { FormState };

const LocalSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${(props) => props.theme.bgSubDiv};
  border-top: 4px solid ${(props) => props.theme.accent};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
