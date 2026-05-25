import { StyleSheet } from "react-native";
import { themeController } from "./constants/colors";

// Monkey-patch StyleSheet.create to dynamically map color palettes
StyleSheet.create = (styleSheet) => {
  const processedSheet = {};
  for (const key in styleSheet) {
    const rawStyle = styleSheet[key];
    Object.defineProperty(processedSheet, key, {
      get() {
        try {
          const theme = themeController.getCurrentTheme();
          const resolvedStyle = {};
          for (const prop in rawStyle) {
            const val = rawStyle[prop];
            if (typeof val === "string" && typeof prop === "string") {
              resolvedStyle[prop] = themeController.getThemeColor(prop, val, theme);
            } else {
              resolvedStyle[prop] = val;
            }
          }
          return resolvedStyle;
        } catch (err) {
          console.error("StyleSheet override error:", err);
          return rawStyle;
        }
      },
      enumerable: true,
      configurable: true,
    });
  }
  return processedSheet;
};
