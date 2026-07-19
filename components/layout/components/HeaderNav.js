import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";

const HeaderNav = () => {
  const router = useRouter();

  return (
    <HeaderNavWrapper>
      <Link passHref href="/" legacyBehavior>
        <HeaderNavLinks active={router.pathname === "/"}>
          Campaigns
        </HeaderNavLinks>
      </Link>
      <Link passHref href="/createcampaign" legacyBehavior>
        <HeaderNavLinks active={router.pathname === "/createcampaign"}>
          Create Campaign
        </HeaderNavLinks>
      </Link>
      <Link passHref href="/dashboard" legacyBehavior>
        <HeaderNavLinks active={router.pathname === "/dashboard"}>
          Dashboard
        </HeaderNavLinks>
      </Link>
    </HeaderNavWrapper>
  );
};

const HeaderNavWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.theme.bgSubDiv};
  border: 1px solid ${(props) => props.theme.borderColor};
  padding: 4px;
  border-radius: 12px;
`;

const HeaderNavLinks = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.active
      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
      : "transparent"};
  color: ${(props) => (props.active ? "#ffffff" : props.theme.color)};
  box-shadow: ${(props) =>
    props.active ? "0 4px 12px rgba(139, 92, 246, 0.25)" : "none"};
  font-family: "Poppins", sans-serif;
  margin: 2px 4px;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;

  &:hover {
    background: ${(props) =>
      props.active
        ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
        : props.theme.bgDiv};
    color: ${(props) => (props.active ? "#ffffff" : props.theme.accent)};
    transform: translateY(-1px);
  }
`;

export default HeaderNav;