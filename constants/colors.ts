const tintColorLight = "#169976";
const tintColorDark = "#169976"; // Can be same or different for dark theme

export default {
  light: {
    text: "#fff",
    background: "#222222",
    tint: tintColorLight,
    tabIconDefault: "#1DCD9F",
    tabIconSelected: tintColorLight,
    buttonColor: "#169976",
  },
  dark: {
    text: "#fff",        // Light green text on dark background
    background: "#222222", // Dark gray background
    tint: tintColorDark,
    tabIconDefault: "#1DCD9F", // Muted green default icon
    tabIconSelected: tintColorDark,
    buttonColor: "#169976",
  },
};
