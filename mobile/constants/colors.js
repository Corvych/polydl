import { Appearance } from "react-native";

export const lightColors = {
  primary: "#2fd660",
  primaryDim: "rgba(47, 214, 96, 0.15)",
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceElevated: "#f1f5f9",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#64748b",
  border: "#cbd5e1",
  gray: "#94a3b8",
  error: "#ef4444",
};

export const darkColors = {
  primary: "#2fd660",
  primaryDim: "rgba(47, 214, 96, 0.15)",
  background: "#000000",
  surface: "#0a0e18",
  surfaceElevated: "#0f1424",
  text: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "#1a2233",
  gray: "#6b7280",
  error: "#ff4444",
};

export const themeController = {
  userTheme: null, // 'light', 'dark', or 'system'
  systemTheme: Appearance.getColorScheme() || "dark",
  getCurrentTheme() {
    if (this.userTheme === "light" || this.userTheme === "dark") {
      return this.userTheme;
    }
    return this.systemTheme;
  },
  getThemeColor(prop, value, targetTheme) {
    if (typeof value !== "string") return value;
    if (typeof prop !== "string") return value;

    const val = value.toLowerCase().trim();

    // Map white-transparency to black-transparency in light theme
    if (targetTheme === "light" && (val.includes("rgba(255,255,255") || val.includes("rgba(255, 255, 255"))) {
      return val.replace(/255,\s*255,\s*255/g, "0, 0, 0");
    }

    // 1. Text color property overrides
    if (prop === "color") {
      if (val === "#ffffff" || val === "#fff" || val === "white") {
        return targetTheme === "light" ? "#0f172a" : "#ffffff";
      }
      if (val === "#94a3b8" || val === "#aaa" || val === "#cbd5e1" || val === "#9ca3af") {
        return targetTheme === "light" ? "#475569" : "#94a3b8";
      }
      if (val === "#64748b" || val === "slate") {
        return targetTheme === "light" ? "#64748b" : "#94a3b8";
      }
      if (val === "#000000" || val === "#000" || val === "black") {
        return targetTheme === "light" ? "#ffffff" : "#0f172a";
      }
    }

    // 2. Background / Border / Shadow property overrides
    if (prop === "backgroundColor" || prop === "borderColor" || prop.endsWith("Color")) {
      if (val === "#000000" || val === "#000" || val === "black") {
        return targetTheme === "light" ? "#f8fafc" : "#000000";
      }
      if (val === "#0a0e18") {
        return targetTheme === "light" ? "#ffffff" : "#0a0e18";
      }
      if (val === "#0f1424") {
        return targetTheme === "light" ? "#f1f5f9" : "#0f1424";
      }
      if (val === "#1a2233") {
        return targetTheme === "light" ? "#cbd5e1" : "#1a2233";
      }
    }

    // 3. General fallback lookup
    try {
      const themeKey = Object.keys(lightColors).find(key => 
        typeof lightColors[key] === "string" && lightColors[key].toLowerCase() === val
      ) || Object.keys(darkColors).find(key => 
        typeof darkColors[key] === "string" && darkColors[key].toLowerCase() === val
      );

      if (themeKey) {
        if (prop === "color" && (themeKey === "surface" || themeKey === "background")) {
          return targetTheme === "light" ? "#0f172a" : "#ffffff";
        }
        return targetTheme === "light" ? lightColors[themeKey] : darkColors[themeKey];
      }
    } catch (_e) {
      // Ignore errors in fallback lookup
    }
    return value;
  }
};

Appearance.addChangeListener(({ colorScheme }) => {
  themeController.systemTheme = colorScheme || "dark";
});

const colors = new Proxy({}, {
  get(target, prop) {
    const theme = themeController.getCurrentTheme();
    const activeColors = theme === "light" ? lightColors : darkColors;
    return activeColors[prop];
  }
});

export default colors;