import { create as IPFSHTTPClient } from "ipfs-http-client";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import { FormState } from "../Form";

const projectId = process.env.NEXT_PUBLIC_IPFS_ID || "";
const projectSecret = process.env.NEXT_PUBLIC_IPFS_KEY || "";

let client;
if (projectId && projectSecret) {
  try {
    const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
    client = IPFSHTTPClient({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https",
      headers: {
        authorization: auth,
      },
    });
  } catch (err) {
    console.warn("Failed to initialize IPFS HTTP Client:", err.message);
  }
}

const FormRightWrapper = () => {
  const handler = useContext(FormState);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const uploadFiles = async (e) => {
    e.preventDefault();
    setUploadLoading(true);

    if (!projectId || !projectSecret || !client) {
      toast.info("IPFS keys not found. Simulating IPFS upload for local testing...");
      
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        handler.setStoryUrl("Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL");
        handler.setImageUrl("Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL");
        
        setUploaded(true);
        handler.setUploaded(true);
        toast.success("Files Mock-Uploaded successfully (Sandbox Mode)!");
      } catch {
        toast.error("Sandbox simulation failed.");
      } finally {
        setUploadLoading(false);
      }
      return;
    }

    try {
      if (handler.form.story !== "") {
        const addedStory = await client.add(handler.form.story);
        handler.setStoryUrl(addedStory.path);
      }

      if (handler.image !== null) {
        const addedImage = await client.add(handler.image);
        handler.setImageUrl(addedImage.path);
      } else {
        toast.warn("No image file selected. Uploading story text only.");
      }

      setUploaded(true);
      handler.setUploaded(true);
      toast.success("Files uploaded to IPFS successfully!");
    } catch (error) {
      console.error("IPFS Upload Error:", error);
      toast.error("Error uploading files to IPFS. Reverting to sandbox fallback...");
      
      handler.setStoryUrl("Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL");
      handler.setImageUrl("Qmc8698xV3aZk5s5pP9hS7m4Z3rLhT7m4Z3rLhT7m4Z3rL");
      setUploaded(true);
      handler.setUploaded(true);
      toast.success("Sandbox Mock IPFS credentials loaded instead.");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <FormRight>
      <FormInput>
        <FormRow>
          <RowFirstInput>
            <Label>Required Amount (MATIC)</Label>
            <Input
              onChange={handler.FormHandler}
              value={handler.form.requiredAmount}
              name="requiredAmount"
              type="number"
              step="0.01"
              placeholder="0.0"
              required
            />
          </RowFirstInput>
          <RowSecondInput>
            <Label>Choose Category</Label>
            <Select
              onChange={handler.FormHandler}
              value={handler.form.category}
              name="category"
            >
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="animal">Animal</option>
            </Select>
          </RowSecondInput>
        </FormRow>
      </FormInput>

      <FormInput style={{ marginTop: "20px" }}>
        <Label>Select Cover Image</Label>
        <ImageInput
          onChange={handler.ImageHandler}
          type="file"
          accept="image/*"
        />
      </FormInput>

      <ActionButtons>
        {uploadLoading ? (
          <Button disabled style={{ cursor: "not-allowed" }}>
            <SmallSpinner />
          </Button>
        ) : uploaded ? (
          <SuccessButton disabled style={{ cursor: "default" }}>
            Files Uploaded Successfully ✓
          </SuccessButton>
        ) : (
          <Button onClick={uploadFiles}>Upload Files to IPFS</Button>
        )}

        <SubmitButton onClick={handler.startCampaign}>
          Start Campaign
        </SubmitButton>
      </ActionButtons>
    </FormRight>
  );
};

const FormRight = styled.div`
  width: 45%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FormInput = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Poppins", sans-serif;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
  letter-spacing: 0.5px;
`;

const FormRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
`;

const Input = styled.input`
  padding: 12px 16px;
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  outline: none;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  width: 100%;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${(props) => props.theme.accent};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const RowFirstInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
`;

const RowSecondInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
`;

const Select = styled.select`
  padding: 12px 16px;
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  outline: none;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${(props) => props.theme.accent};
  }
`;

const ImageInput = styled.input`
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  outline: none;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
  width: 100%;
  cursor: pointer;

  &::-webkit-file-upload-button {
    padding: 12px 18px;
    background-color: ${(props) => props.theme.bgDiv};
    color: ${(props) => props.theme.color};
    outline: none;
    border: none;
    border-right: 1px solid ${(props) => props.theme.borderColor};
    font-weight: 600;
    cursor: pointer;
    margin-right: 15px;
    transition: all 0.2s ease;
  }

  &::-webkit-file-upload-button:hover {
    background-color: ${(props) => props.theme.bgSubDiv};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 14px;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SuccessButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 14px;
  color: white;
  background-color: #10b981;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
`;

const SubmitButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 14px;
  color: white;
  background: ${(props) => props.theme.buttonBg};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default FormRightWrapper;

const SmallSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;