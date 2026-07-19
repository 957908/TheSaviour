import DarkModeIcon from "@mui/icons-material/DarkMode";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { useContext } from "react";
import styled from "styled-components";
import { App } from "../Layout";
import Wallet from "./Wallet";

const HeaderRight = () => {
  const themeContext = useContext(App);

  return (
    <HeaderRightWrapper>
      <Wallet />
      <ThemeToggle onClick={themeContext.changeTheme} aria-label="Toggle theme">
        {themeContext.theme === "light" ? (
          <DarkModeIcon style={{ fontSize: 20 }} />
        ) : (
          <WbSunnyIcon style={{ fontSize: 20 }} />
        )}
      </ThemeToggle>
    </HeaderRightWrapper>
  );
};

const HeaderRightWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
`;

const ThemeToggle = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.bgSubDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  color: ${(props) => props.theme.color};
  height: 40px;
  width: 40px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    transform: rotate(15deg) scale(1.05);
    background-color: ${(props) => props.theme.bgDiv};
    color: ${(props) => props.theme.accent};
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default HeaderRight;