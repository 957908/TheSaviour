import styled from "styled-components";
import HeaderLogo from "./components/HeaderLogo";
import HeaderNav from "./components/HeaderNav";
import HeaderRight from "./components/HeaderRight";

const Header = () => {
  return (
    <HeaderOuter>
      <HeaderInner>
        <HeaderLogo />
        <HeaderNav />
        <HeaderRight />
      </HeaderInner>
    </HeaderOuter>
  );
};

const HeaderOuter = styled.header`
  width: 100%;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  background-color: ${(props) => props.theme.bgDiv};
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
`;

const HeaderInner = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`;

export default Header;