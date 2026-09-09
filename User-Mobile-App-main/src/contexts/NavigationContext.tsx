import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export const SLIDE_MS = 0;

export interface OverlayConfig {
  id: string;
  label: string;
  element: React.ReactNode;
}

export interface NavigationContextType {
  overlays: OverlayConfig[];
  push: (label: string, element: React.ReactNode) => void;
  pop: () => void;
  clear: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);

  const push = useCallback((label: string, element: React.ReactNode) => {
    const id = `overlay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setOverlays((prev) => [...prev, { id, label, element }]);
  }, []);

  const pop = useCallback(() => {
    setOverlays((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  }, []);

  const clear = useCallback(() => {
    setOverlays((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const value = useMemo(() => ({
    overlays,
    push,
    pop,
    clear,
  }), [overlays, push, pop, clear]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

