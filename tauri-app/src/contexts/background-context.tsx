import { createContext, useContext, ReactNode } from "react";
import { useState } from "react";

interface BackgroundContextType {
  bgColor: string;
  setBgColor: (color: string) => void;
}

const defaultContext: BackgroundContextType = {
  bgColor: "#fafafa",
  setBgColor: () => {},
};

const BackgroundContext = createContext<BackgroundContextType>(defaultContext);

export const useBackground = () => useContext(BackgroundContext);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [bgColor, setBgColor] = useState("#fafafa");
  return (
    <BackgroundContext.Provider value={{ bgColor, setBgColor }}>
      {children}
    </BackgroundContext.Provider>
  );
};