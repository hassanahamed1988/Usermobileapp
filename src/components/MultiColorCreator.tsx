import React, { useState, useEffect } from 'react';

import { Plus, X, Copy, Clipboard } from 'lucide-react';
import { PRESET_BACKGROUNDS } from '../constants';

interface MultiColorCreatorProps {
  onApply: (gradient: string) => void;
  showFeedback: (message: string) => void;
  initialGradient?: string;
  hidePresets?: boolean;
}

const MultiColorCreator: React.FC<MultiColorCreatorProps> = ({ onApply, showFeedback, initialGradient, hidePresets }) => {
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [colors, setColors] = useState(['#10b981', '#8b5cf6']);
  const [textValues, setTextValues] = useState<string[]>(['#10b981', '#8b5cf6']);

  // Load and parse initial gradient if available
  useEffect(() => {
    if (initialGradient) {
      const hexMatches = initialGradient.match(/#[0-9a-fA-F]{3,6}/g);
      if (hexMatches && hexMatches.length >= 2) {
        setColors(hexMatches);
        setTextValues(hexMatches);
      } else {
        const rgbMatches = initialGradient.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g);
        if (rgbMatches && rgbMatches.length >= 2) {
          const hexes = rgbMatches.map(rgb => {
            const parts = rgb.match(/\d+/g);
            if (parts && parts.length >= 3) {
              const r = parseInt(parts[0]).toString(16).padStart(2, '0');
              const g = parseInt(parts[1]).toString(16).padStart(2, '0');
              const b = parseInt(parts[2]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`;
            }
            return '#ffffff';
          });
          setColors(hexes);
          setTextValues(hexes);
        }
      }
      
      if (initialGradient.includes('radial-gradient')) {
        setGradientType('radial');
      } else {
        setGradientType('linear');
        const angleMatch = initialGradient.match(/(\d+)deg/);
        if (angleMatch) {
          setAngle(parseInt(angleMatch[1]));
        }
      }
    }
  }, [initialGradient]);

  // Keep text values state in sync with colors when color state updates (e.g. from picker or preset)
  useEffect(() => {
    setTextValues(colors);
  }, [colors]);
  
  const generateGradient = (type: string, ang: number, cols: string[]) => {
    if (type === 'linear') {
      return `linear-gradient(${ang}deg, ${cols.join(', ')})`;
    }
    return `radial-gradient(circle, ${cols.join(', ')})`;
  };

  const handleApply = () => {
    const gradient = generateGradient(gradientType, angle, colors);
    onApply(gradient);
    showFeedback('Multi-color theme applied');
  };

  const addColor = () => {
    if (colors.length < 5) {
      setColors([...colors, '#ffffff']);
    } else {
      showFeedback('Maximum 5 colors allowed');
    }
  };

  const removeColor = (index: number) => {
    if (colors.length > 2) {
      const newColors = colors.filter((_, i) => i !== index);
      setColors(newColors);
    } else {
      showFeedback('Minimum 2 colors required');
    }
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const handleTextChange = (index: number, value: string) => {
    const newTextValues = [...textValues];
    newTextValues[index] = value;
    setTextValues(newTextValues);

    let hex = value.trim();
    if (hex && !hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    const isValidHex = /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
    if (isValidHex) {
      if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      const newColors = [...colors];
      newColors[index] = hex.toLowerCase();
      setColors(newColors);
    }
  };

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    showFeedback(`Copied ${color.toUpperCase()} to clipboard`);
  };

  const handlePaste = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleTextChange(index, text);
        showFeedback(`Pasted ${text.toUpperCase()}`);
      }
    } catch (err) {
      showFeedback('Please paste manually into the text field');
    }
  };

  const currentGradient = generateGradient(gradientType, angle, colors);

  return (
    <div className="space-y-6">
      {/* Preview Area Integrated into Main Card */}
      <div 
        className="w-full h-32 rounded-xl shadow-inner border border-white/10 overflow-hidden relative"
        style={{ background: currentGradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] drop-shadow-lg opacity-60">Preview</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
          <button 
            onClick={() => setGradientType('linear')}
            className={`flex-1 h-10 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${gradientType === 'linear' ? 'bg-white dark:bg-white/10 text-cyan-500 shadow-sm' : 'text-text-muted'}`}
          >
            Linear
          </button>
          <button 
            onClick={() => setGradientType('radial')}
            className={`flex-1 h-10 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${gradientType === 'radial' ? 'bg-white dark:bg-white/10 text-cyan-500 shadow-sm' : 'text-text-muted'}`}
          >
            Radial
          </button>
        </div>

        {gradientType === 'linear' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-text-main uppercase tracking-wider">Gradient Angle</label>
              <span className="text-[10px] font-bold text-cyan-500">{angle}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="360" 
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-text-main uppercase tracking-wider">Color Stops</label>
            <button 
              onClick={addColor}
              className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg hover:bg-cyan-500/20 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center gap-2 animate-scale-in bg-[#f2f2f2] dark:bg-white/5 p-2 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 relative">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="absolute -inset-2 w-12 h-12 cursor-pointer bg-transparent border-0 outline-none p-0"
                  />
                </div>
                <input 
                  type="text"
                  value={textValues[index] || ''}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-8 px-2 bg-white dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-text-main uppercase outline-none focus:border-cyan-500 transition-all"
                />
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleCopy(color)}
                    title="Copy Color"
                    className="p-1.5 text-text-muted hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={() => handlePaste(index)}
                    title="Paste Color"
                    className="p-1.5 text-text-muted hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
                {colors.length > 2 && (
                  <button 
                    onClick={() => removeColor(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button 
          
          onClick={handleApply}
          className="w-full h-12 bg-cyan-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 mt-2"
        >
          Apply Multi-Color Theme
        </button>
      </div>

      {!hidePresets && (
        <div className="pt-6 border-t border-gray-100 dark:border-white/5">
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-4">Popular Presets</p>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_BACKGROUNDS.filter(p => p.color.includes('gradient')).slice(0, 12).map((preset, idx) => (
              <button
                key={idx}
                
                onClick={() => onApply(preset.color)}
                className="aspect-square rounded-lg shadow-sm border border-white/10 overflow-hidden relative group"
                style={{ background: preset.color }}
              >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus size={12} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiColorCreator;
