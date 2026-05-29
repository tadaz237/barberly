"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type AppContextValue = {
  counter: number;
  increment: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [counter, setCounter] = useState(0);

  const value = useMemo(
    () => ({
      counter,
      increment: () => setCounter((c) => c + 1),
    }),
    [counter]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within <AppProvider>");
  }
  return ctx;
}
