import { createContext, useContext, ReactNode } from "react";

interface ThemeColorContextType {
  primaryColor: string;
  getActiveColor: () => string;
  getHoverColor: () => string;
  getContrastTextColor: () => string;
}

const defaultTheme: ThemeColorContextType = {
  primaryColor: "#6366f1",
  getActiveColor: () => "#6366f1",
  getHoverColor: () => "rgba(99, 102, 241, 0.1)",
  getContrastTextColor: () => "#ffffff",
};

const ThemeColorContext = createContext<ThemeColorContextType>(defaultTheme);

export const useThemeColor = () => useContext(ThemeColorContext);

export const ThemeColorProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeColorContext.Provider value={defaultTheme}>
      {children}
    </ThemeColorContext.Provider>
  );
};