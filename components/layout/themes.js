const light = {
  color: "#1e1b4b", // Indigo 950
  bgColor: "#f5f3ff", // Violet 50
  bgImage: "linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)",
  bgDiv: "rgba(255, 255, 255, 0.7)",
  bgSubDiv: "rgba(245, 243, 255, 0.8)",
  borderColor: "rgba(224, 231, 255, 0.8)",
  buttonBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  accent: "#8b5cf6",
  shadow: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
};

const dark = {
  color: "#f8fafc", // Slate 50
  bgColor: "#090d16", // Deep dark space
  bgImage: "linear-gradient(135deg, #090d16 0%, #020617 100%)",
  bgDiv: "rgba(15, 23, 42, 0.7)",
  bgSubDiv: "rgba(30, 41, 59, 0.5)",
  borderColor: "rgba(51, 65, 85, 0.4)",
  buttonBg: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  accent: "#a78bfa",
  shadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
};

const themes = {
  light: light,
  dark: dark,
};

export default themes;