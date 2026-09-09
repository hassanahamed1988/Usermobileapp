import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigation, SLIDE_MS } from '../contexts/NavigationContext';

interface RenderedOverlay {
  id: string;
  label: string;
  element: React.ReactNode;
  state: 'entering' | 'active' | 'exiting' | 'receding' | 're-entering' | 'hidden';
}

export const NavigationOverlayOutlet: React.FC = () => {
  const { overlays } = useNavigation();
  const [renderedOverlays, setRenderedOverlays] = useState<RenderedOverlay[]>([]);
  const prevOverlaysRef = useRef(overlays);
  const timeoutRef = useRef<any>(null);

  useLayoutEffect(() => {
    if (overlays.length === 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setRenderedOverlays([]);
      prevOverlaysRef.current = [];
      return;
    }

    const prevOverlays = prevOverlaysRef.current;
    const isPush = overlays.length > prevOverlays.length;
    const isPop = overlays.length < prevOverlays.length;

    if (isPush) {
      // Clear any pending cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setRenderedOverlays((currentRendered) => {
        const nextRendered = [...currentRendered];
        
        // Update existing overlays
        nextRendered.forEach((overlay, idx) => {
          if (idx === nextRendered.length - 1 && overlay.state !== 'exiting') {
            overlay.state = 'receding';
          } else if (overlay.state !== 'exiting') {
            overlay.state = 'hidden';
          }
        });

        // Add the new overlay
        const newOverlay = overlays[overlays.length - 1];
        nextRendered.push({
          ...newOverlay,
          state: 'entering'
        });

        return nextRendered;
      });

      // After animation, set to active
      timeoutRef.current = setTimeout(() => {
        setRenderedOverlays((current) => 
          current.map((o, idx) => 
            idx === current.length - 1 ? { ...o, state: 'active' } : 
            (idx === current.length - 2 && o.state === 'receding' ? { ...o, state: 'hidden' } : o)
          )
        );
      }, SLIDE_MS);

    } else if (isPop) {
      // Clear any pending cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setRenderedOverlays((currentRendered) => {
        const nextRendered = [...currentRendered];
        
        // The one that was popped should exit
        const poppedOverlay = nextRendered[nextRendered.length - 1];
        if (poppedOverlay) {
          poppedOverlay.state = 'exiting';
        }

        // The one below it should re-enter
        const belowOverlay = nextRendered[nextRendered.length - 2];
        if (belowOverlay) {
          belowOverlay.state = 're-entering';
        }

        return nextRendered;
      });

      timeoutRef.current = setTimeout(() => {
        setRenderedOverlays((current) => {
          const next = current.slice(0, -1);
          if (next.length > 0) {
            next[next.length - 1].state = 'active';
          }
          return next;
        });
      }, SLIDE_MS);

    } else {
      // Just a re-render or update of content without length change
      // Sync the element contents for any active overlays
      setRenderedOverlays((currentRendered) => {
        if (currentRendered.length === 0) return currentRendered;
        
        let changed = false;
        const nextRendered = currentRendered.map(renderedMatch => {
          const o = overlays.find(o => o.id === renderedMatch.id);
          if (o && (renderedMatch.element !== o.element || renderedMatch.label !== o.label)) {
            changed = true;
            return {
              ...renderedMatch,
              element: o.element,
              label: o.label
            };
          }
          return renderedMatch;
        });
        
        return changed ? nextRendered : currentRendered;
      });
    }

    prevOverlaysRef.current = overlays;
    
    return () => {
      // Don't clear timeout on cleanup unless unmounting
    }
  }, [overlays]);
  
  useLayoutEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (renderedOverlays.length === 0) return null;

  return (
    <>
      {renderedOverlays.map((overlay, index) => {
        let animationClass = '';
        if (overlay.state === 'entering') animationClass = 'tms-page-enter-fwd';
        else if (overlay.state === 'exiting') animationClass = 'tms-page-exit-back';
        else if (overlay.state === 'receding') animationClass = 'tms-page-exit-fwd pointer-events-none';
        else if (overlay.state === 're-entering') animationClass = 'tms-page-enter-back';
        
        const isHidden = overlay.state === 'hidden';
        
        return (
          <div
            key={overlay.id}
            className={`fixed inset-0 z-[100] flex flex-col overflow-hidden ${animationClass} ${isHidden ? 'hidden' : ''}`}
            style={{
              ...(isHidden ? { display: 'none' } : {}),
              backgroundColor: 'var(--page-bg-solid, #f8fafc)',
              background: 'var(--theme-bg, var(--page-bg-solid, #f8fafc))',
            }}
          >
            {overlay.element}
          </div>
        );
      })}
    </>
  );
};
