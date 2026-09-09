
export const getContrastColor = (hexColor: any) => {
  if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
  
  if (hexColor.startsWith('rgb')) {
    const match = hexColor.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 150) ? '#000000' : '#ffffff';
    }
    return '#ffffff';
  }

  let hex = hexColor;

  if (hexColor.startsWith('bg-')) {
    const colorMap: Record<string, string> = {
      'bg-yellow-400': '#facc15',
      'bg-teal-400': '#2dd4bf',
      'bg-red-400': '#f87171',
      'bg-orange-500': '#f97316',
      'bg-cyan-400': '#22d3ee',
      'bg-emerald-400': '#34d399',
      'bg-rose-400': '#fb7185',
      'bg-indigo-400': '#818cf8',
      'bg-lime-400': '#a3e635',
      'bg-amber-400': '#fbbf24',
      'bg-green-400': '#4ade80',
      'bg-gray-400': '#9ca3af',
      'bg-pink-400': '#f472b6',
      'bg-blue-400': '#60a5fa',
      'bg-purple-400': '#c084fc',
      'bg-fuchsia-400': '#e879f9',
      'bg-sky-400': '#38bdf8',
      'bg-violet-400': '#a78bfa',
      'bg-[var(--primary)]': '#000000',
      'bg-sky-500': '#0ea5e9',
      'bg-indigo-500': '#6366f1',
      'bg-red-500': '#ef4444',
      'bg-rose-500': '#f43f5e',
    };
    hex = colorMap[hexColor] || '#ffffff';
  }

  if (hex.includes('gradient')) {
    // Average the brightness of every color stop in the gradient, not just the
    // first one — a multi-color gradient (e.g. from the Multi-Color Mixer) can
    // have a light first stop and dark later stops (or vice versa), and using
    // only the first stop can pick a text color that's illegible over the rest
    // of the gradient.
    const hexMatches = hex.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g);
    if (hexMatches && hexMatches.length > 0) {
      let totalYiq = 0;
      let count = 0;
      for (let stop of hexMatches) {
        let stopHex = stop.replace('#', '');
        if (stopHex.length === 3) stopHex = stopHex[0] + stopHex[0] + stopHex[1] + stopHex[1] + stopHex[2] + stopHex[2];
        if (stopHex.length !== 6) continue;
        const r = parseInt(stopHex.substr(0, 2), 16);
        const g = parseInt(stopHex.substr(2, 2), 16);
        const b = parseInt(stopHex.substr(4, 2), 16);
        totalYiq += ((r * 299) + (g * 587) + (b * 114)) / 1000;
        count++;
      }
      if (count > 0) {
        const avgYiq = totalYiq / count;
        return (avgYiq >= 150) ? '#000000' : '#ffffff';
      }
    }
    return '#ffffff';
  }
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 150) ? '#000000' : '#ffffff';
};

export const getHexColor = (colorStr: string, fallback: string): string => {
  if (!colorStr || typeof colorStr !== 'string') return fallback;
  let trimmed = colorStr.trim();
  if (trimmed.startsWith('var(')) {
    return fallback;
  }
  if (trimmed.includes('gradient')) {
    const hexMatch = trimmed.match(/#[0-9a-fA-F]{3,6}/);
    if (hexMatch) {
      trimmed = hexMatch[0];
    } else {
      const rgbMatch = trimmed.match(/rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/);
      if (rgbMatch) trimmed = rgbMatch[0];
      else return fallback;
    }
  }
  if (trimmed.startsWith('rgb')) {
    const match = trimmed.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = Math.max(0, Math.min(255, parseInt(match[0])));
      const g = Math.max(0, Math.min(255, parseInt(match[1])));
      const b = Math.max(0, Math.min(255, parseInt(match[2])));
      const toHex = (c: number) => {
        const h = c.toString(16);
        return h.length === 1 ? '0' + h : h;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return fallback;
  }
  if (trimmed.startsWith('#')) {
    let hex = trimmed.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6) {
      return `#${hex}`;
    }
  }
  return fallback;
};

export const isColorLight = (colorStr: string): boolean => {
  const hex = getHexColor(colorStr, '#000000').replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 150;
  }
  return false;
};

