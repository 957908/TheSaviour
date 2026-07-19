import { useContext } from "react";
import styled from "styled-components";
import { FormState } from "../Form";

const FormLeftWrapper = () => {
  const handler = useContext(FormState);

  return (
    <FormLeft>
      <FormInput>
        <Label>Campaign Title</Label>
        <Input
          onChange={handler.FormHandler}
          value={handler.form.campaignTitle}
          placeholder="Enter a descriptive campaign title"
          name="campaignTitle"
          required
        />
      </FormInput>
      <FormInput>
        <Label>Story</Label>
        <TextArea
          onChange={handler.FormHandler}
          value={handler.form.story}
          name="story"
          placeholder="Describe your story, motivation, and why people should donate..."
          required
        />
      </FormInput>
    </FormLeft>
  );
};

const FormLeft = styled.div`
  width: 48%;
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

const TextArea = styled.textarea`
  padding: 12px 16px;
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  outline: none;
  font-size: 15px;
  font-family: "Poppins", sans-serif;
  width: 100%;
  min-height: 200px;
  resize: vertical;
  line-height: 1.5;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${(props) => props.theme.accent};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

export default FormLeftWrapper;