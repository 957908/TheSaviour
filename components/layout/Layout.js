import { createContext, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";

import Header from "./Header";
import themes from "./themes";

const App = createContext();

const Layout = ({ children }) => {
  const [theme, setTheme] = useState("dark"); // Default to premium dark mode

  const changeTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <App.Provider value={{ changeTheme, theme }}>
      <ThemeProvider theme={themes[theme]}>
        <ToastContainer position="top-right" autoClose={4000} theme={theme} />
        <LayoutWrapper>
          <GlobalStyle />
          <Header />
          <ContentContainer>{children}</ContentContainer>
        </LayoutWrapper>
      </ThemeProvider>
    </App.Provider>
  );
};

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
`;

const LayoutWrapper = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.bgColor};
  background-image: ${(props) => props.theme.bgImage};
  color: ${(props) => props.theme.color};
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
`;

const ContentContainer = styled.main`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  flex-grow: 1;
`;

export default Layout;
export { App };
