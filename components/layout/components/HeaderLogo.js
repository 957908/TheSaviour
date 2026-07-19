import Link from "next/link";
import styled from "styled-components";

const HeaderLogo = () => {
  return (
    <Link href="/" passHref style={{ textDecoration: 'none' }}>
      <Logo>The Saviour</Logo>
    </Link>
  );
};

const Logo = styled.h1`
  font-weight: bold;
  font-size: 36px;
  font-family: "Praise", cursive;
  letter-spacing: 2px;
  cursor: pointer;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  user-select: none;
  
  &:hover {
    filter: brightness(1.2);
    transform: scale(1.02);
    transition: all 0.2s ease;
  }
`;

export default HeaderLogo;