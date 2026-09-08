import React from 'react';

interface ViewTransitionProps {
  currentKey: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewTransition: React.FC<ViewTransitionProps> = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div className={`w-full h-full relative ${className}`} style={style}>
      {children}
    </div>
  );
};
