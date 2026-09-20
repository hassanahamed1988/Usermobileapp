import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Plus, 
  Lock as LockIcon, 
  X
} from 'lucide-react';

export interface PageSizeOption {
  id: string;
  name: string;
  dimensions?: string;
  widthCm?: number;
  heightCm?: number;
}

export const DEFAULT_PAGE_SIZES: PageSizeOption[] = [
  { id: 'auto', name: 'Auto Fit', dimensions: '' },
  { id: 'A3', name: 'A3', dimensions: '29.7cm × 42.0cm', widthCm: 29.7, heightCm: 42.0 },
  { id: 'A4', name: 'A4', dimensions: '21.0cm × 29.7cm', widthCm: 21.0, heightCm: 29.7 },
  { id: 'A5', name: 'A5', dimensions: '14.8cm × 21.0cm', widthCm: 14.8, heightCm: 21.0 },
  { id: 'B4', name: 'B4', dimensions: '25.0cm × 35.3cm', widthCm: 25.0, heightCm: 35.3 },
  { id: 'B5', name: 'B5', dimensions: '17.6cm × 25.0cm', widthCm: 17.6, heightCm: 25.0 },
  { id: 'Letter', name: 'Letter', dimensions: '21.6cm × 27.9cm', widthCm: 21.6, heightCm: 27.9 },
  { id: 'Tabloid', name: 'Tabloid', dimensions: '27.9cm × 43.2cm', widthCm: 27.9, heightCm: 43.2 },
  { id: 'Legal', name: 'Legal', dimensions: '21.6cm × 35.6cm', widthCm: 21.6, heightCm: 35.6 },
  { id: 'Executive', name: 'Executive', dimensions: '18.4cm × 26.7cm', widthCm: 18.4, heightCm: 26.7 },
  { id: 'Postcard', name: 'Postcard', dimensions: '10.0cm × 14.7cm', widthCm: 10.0, heightCm: 14.7 },
  { id: 'American Foolscap', name: 'American Foolscap', dimensions: '21.6cm × 33.0cm', widthCm: 21.6, heightCm: 33.0 },
  { id: 'Europe Foolscap', name: 'Europe Foolscap', dimensions: '22.9cm × 33.0cm', widthCm: 22.9, heightCm: 33.0 },
];

export interface PdfSettingsConfig {
  isLocked: boolean;
  password?: string;
  pageNumber: string;
  direction: 'auto' | 'portrait' | 'landscape';
  pageSize: string;
  hasMargin: boolean;
}

interface PdfSettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  config: PdfSettingsConfig;
  onChange: (config: PdfSettingsConfig) => void;
  language?: string;
}

export const PdfSettingsScreen: React.FC<PdfSettingsScreenProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  language = 'en'
}) => {
  if (!isOpen) return null;

  // Navigation subscreen state ('main' | 'page_size')
  const [currentScreen, setCurrentScreen] = useState<'main' | 'page_size'>('main');

  // Modals state
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showPageNumberModal, setShowPageNumberModal] = useState(false);
  const [showAddCustomSizeModal, setShowAddCustomSizeModal] = useState(false);

  // Custom size form
  const [customSizes, setCustomSizes] = useState<PageSizeOption[]>([]);
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // Password state
  const [tempPassword, setTempPassword] = useState(config.password || '');

  const allPageSizes = [...DEFAULT_PAGE_SIZES, ...customSizes];
  const selectedPageSizeObj = allPageSizes.find(s => s.id === config.pageSize) || allPageSizes.find(s => s.id === 'A4')!;

  const handleSelectSize = (sizeId: string) => {
    onChange({
      ...config,
      pageSize: sizeId
    });
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customWidth.trim() || !customHeight.trim()) return;

    const newSize: PageSizeOption = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      dimensions: `${customWidth.trim()}cm × ${customHeight.trim()}cm`,
      widthCm: parseFloat(customWidth),
      heightCm: parseFloat(customHeight)
    };

    setCustomSizes(prev => [...prev, newSize]);
    onChange({
      ...config,
      pageSize: newSize.id
    });
    setCustomName('');
    setCustomWidth('');
    setCustomHeight('');
    setShowAddCustomSizeModal(false);
  };

  const getDirectionLabel = (dir: 'auto' | 'portrait' | 'landscape') => {
    if (dir === 'auto') return 'Auto-adjust';
    if (dir === 'portrait') return 'Portrait';
    return 'Landscape';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#191919] text-white flex flex-col font-sans select-none animate-fade-in">
      
      {/* ========================================================================= */}
      {/* SCREEN 1: MAIN PDF SETTINGS (SCREENSHOT 1) */}
      {/* ========================================================================= */}
      {currentScreen === 'main' && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto">
          {/* Top AppBar */}
          <div className="flex items-center px-4 py-4 border-b border-[#2c2c2e]">
            <button 
              onClick={onClose}
              className="p-1 text-white hover:opacity-80 transition cursor-pointer mr-4"
              title="Back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[19px] font-semibold tracking-wide text-white">
              PDF Settings
            </h1>
          </div>

          {/* Settings List */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            
            {/* 1. Lock 👑 */}
            <div 
              onClick={() => setShowLockModal(true)}
              className="py-4 border-b border-[#2c2c2e] flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition -mx-5 px-5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] text-white font-normal">Lock</span>
                <span className="text-[13px] leading-none select-none">👑</span>
              </div>
              {config.isLocked && (
                <span className="text-xs text-[#00af80] font-medium flex items-center gap-1">
                  <LockIcon size={12} />
                  <span>Protected</span>
                </span>
              )}
            </div>

            {/* 2. Page Number 👑 */}
            <div 
              onClick={() => setShowPageNumberModal(true)}
              className="py-4 border-b border-[#2c2c2e] cursor-pointer hover:bg-white/[0.02] transition -mx-5 px-5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] text-white font-normal">Page Number</span>
                <span className="text-[13px] leading-none select-none">👑</span>
              </div>
              <p className="text-[14px] text-[#8e8e93] mt-0.5">
                {config.pageNumber || 'No page number'}
              </p>
            </div>

            {/* 3. PDF Direction */}
            <div 
              onClick={() => setShowDirectionModal(true)}
              className="py-4 border-b border-[#2c2c2e] cursor-pointer hover:bg-white/[0.02] transition -mx-5 px-5"
            >
              <span className="text-[16px] text-white font-normal block">PDF Direction</span>
              <p className="text-[14px] text-[#8e8e93] mt-0.5">
                {getDirectionLabel(config.direction)}
              </p>
            </div>

            {/* 4. PDF Page Size */}
            <div 
              onClick={() => setCurrentScreen('page_size')}
              className="py-4 border-b border-[#2c2c2e] cursor-pointer hover:bg-white/[0.02] transition -mx-5 px-5"
            >
              <span className="text-[16px] text-white font-normal block">PDF Page Size</span>
              <p className="text-[14px] text-[#8e8e93] mt-0.5">
                {selectedPageSizeObj.name} {selectedPageSizeObj.dimensions ? selectedPageSizeObj.dimensions : ''}
              </p>
            </div>

            {/* 5. PDF Page Margin */}
            <div className="py-4 border-b border-[#2c2c2e] flex items-center justify-between -mx-5 px-5">
              <div>
                <span className="text-[16px] text-white font-normal block">PDF Page Margin</span>
                <p className="text-[14px] text-[#8e8e93] mt-0.5">
                  Add Margin on PDF Page
                </p>
              </div>
              {/* Green Switch Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={config.hasMargin}
                onClick={() => onChange({ ...config, hasMargin: !config.hasMargin })}
                className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  config.hasMargin ? 'bg-[#00af80]' : 'bg-[#3a3a3c]'
                }`}
              >
                <div 
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    config.hasMargin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: PDF DIRECTION DIALOG (SCREENSHOT 2) */}
      {/* ========================================================================= */}
      {showDirectionModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-[#242424] text-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-white/5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[17px] font-semibold text-white tracking-wide">
              PDF Direction
            </h2>

            <div className="space-y-4 pt-1">
              {/* Option 1: Auto-adjust */}
              <label 
                onClick={() => {
                  onChange({ ...config, direction: 'auto' });
                  setShowDirectionModal(false);
                }}
                className="flex items-center justify-between cursor-pointer py-1 group"
              >
                <span className="text-[15px] text-[#efeff4] group-hover:text-white transition-colors">
                  Auto-adjust
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  config.direction === 'auto' ? 'border-[#00af80]' : 'border-[#636366]'
                }`}>
                  {config.direction === 'auto' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00af80]" />
                  )}
                </div>
              </label>

              {/* Option 2: Portrait */}
              <label 
                onClick={() => {
                  onChange({ ...config, direction: 'portrait' });
                  setShowDirectionModal(false);
                }}
                className="flex items-center justify-between cursor-pointer py-1 group"
              >
                <span className="text-[15px] text-[#efeff4] group-hover:text-white transition-colors">
                  Portrait
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  config.direction === 'portrait' ? 'border-[#00af80]' : 'border-[#636366]'
                }`}>
                  {config.direction === 'portrait' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00af80]" />
                  )}
                </div>
              </label>

              {/* Option 3: Landscape */}
              <label 
                onClick={() => {
                  onChange({ ...config, direction: 'landscape' });
                  setShowDirectionModal(false);
                }}
                className="flex items-center justify-between cursor-pointer py-1 group"
              >
                <span className="text-[15px] text-[#efeff4] group-hover:text-white transition-colors">
                  Landscape
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  config.direction === 'landscape' ? 'border-[#00af80]' : 'border-[#636366]'
                }`}>
                  {config.direction === 'landscape' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00af80]" />
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: PDF PAGE SIZE SUB-SCREEN (SCREENSHOT 3) */}
      {/* ========================================================================= */}
      {currentScreen === 'page_size' && (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto bg-[#191919] animate-fade-in">
          {/* Top Bar with OK */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#2c2c2e]">
            <div className="flex items-center">
              <button 
                onClick={() => setCurrentScreen('main')}
                className="p-1 text-white hover:opacity-80 transition cursor-pointer mr-4"
                title="Back to Settings"
              >
                <ArrowLeft size={22} />
              </button>
              <h1 className="text-[19px] font-semibold tracking-wide text-white">
                PDF Page Size
              </h1>
            </div>
            <button
              onClick={() => setCurrentScreen('main')}
              className="text-[16px] font-medium text-white hover:text-[#00af80] px-2 py-1 transition cursor-pointer"
            >
              OK
            </button>
          </div>

          {/* List of sizes */}
          <div className="flex-1 overflow-y-auto px-5 divide-y divide-[#2c2c2e]">
            {allPageSizes.map((size) => {
              const isSelected = config.pageSize === size.id;
              return (
                <div
                  key={size.id}
                  onClick={() => handleSelectSize(size.id)}
                  className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition -mx-5 px-5"
                >
                  <div className="flex flex-col">
                    <span className="text-[16px] text-white font-normal">
                      {size.name}
                    </span>
                    {size.dimensions && (
                      <span className="text-[13px] text-[#8e8e93] mt-0.5">
                        {size.dimensions}
                      </span>
                    )}
                  </div>

                  {/* Square Checkbox Indicator like in Screenshot 3 */}
                  <div className={`w-5 h-5 rounded-xs flex items-center justify-center transition-colors border ${
                    isSelected 
                      ? 'bg-[#00af80] border-[#00af80]' 
                      : 'border-[#3e3e40] bg-transparent'
                  }`}>
                    {isSelected && (
                      <Check size={14} className="text-white stroke-[3]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Fixed Button: Add New Size (Screenshot 3) */}
          <div className="p-5 border-t border-[#2c2c2e] bg-[#191919]">
            <button
              onClick={() => setShowAddCustomSizeModal(true)}
              className="w-full py-3.5 bg-[#00af80] hover:bg-[#00966d] active:scale-[0.99] text-white text-[16px] font-medium rounded-lg transition shadow-md flex items-center justify-center cursor-pointer"
            >
              Add New Size
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 4: ADD CUSTOM PAGE SIZE */}
      {/* ========================================================================= */}
      {showAddCustomSizeModal && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleAddCustomSize}
            className="bg-[#242424] text-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-white/5 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-[17px] font-semibold text-white">Add Custom Size</h2>
              <button 
                type="button"
                onClick={() => setShowAddCustomSizeModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8e8e93] block mb-1">Size Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ID Card / Envelope"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00af80] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8e8e93] block mb-1">Width (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="21.0"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00af80] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8e8e93] block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="29.7"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00af80] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomSizeModal(false)}
                className="flex-1 py-2.5 bg-[#3a3a3c] hover:bg-[#48484a] rounded-lg text-sm text-white font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#00af80] hover:bg-[#00966d] rounded-lg text-sm text-white font-medium transition cursor-pointer shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 5: LOCK PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showLockModal && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#242424] text-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-white/5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <h2 className="text-[17px] font-semibold text-white">PDF Password Lock</h2>
              </div>
              <button 
                onClick={() => setShowLockModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#8e8e93]">
              Protect this PDF document with high-security password encryption.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8e8e93] block mb-1">Enter Password</label>
                <input
                  type="password"
                  placeholder="Set PDF password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00af80] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {config.isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...config, isLocked: false, password: '' });
                    setTempPassword('');
                    setShowLockModal(false);
                  }}
                  className="flex-1 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Remove Lock
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (tempPassword.trim()) {
                    onChange({ ...config, isLocked: true, password: tempPassword });
                  } else {
                    onChange({ ...config, isLocked: false, password: '' });
                  }
                  setShowLockModal(false);
                }}
                className="flex-1 py-2.5 bg-[#00af80] hover:bg-[#00966d] rounded-lg text-sm text-white font-medium transition cursor-pointer shadow"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 6: PAGE NUMBER MODAL */}
      {/* ========================================================================= */}
      {showPageNumberModal && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#242424] text-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-white/5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <h2 className="text-[17px] font-semibold text-white">Page Number Format</h2>
              </div>
              <button 
                onClick={() => setShowPageNumberModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { id: 'No page number', label: 'No page number' },
                { id: 'Bottom Center (1, 2, ...)', label: 'Bottom Center (1, 2, ...)' },
                { id: 'Bottom Right (Page 1 of N)', label: 'Bottom Right (Page 1 of N)' },
                { id: 'Top Right (1/N)', label: 'Top Right (1/N)' },
              ].map((item) => (
                <label
                  key={item.id}
                  onClick={() => {
                    onChange({ ...config, pageNumber: item.id });
                    setShowPageNumberModal(false);
                  }}
                  className="flex items-center justify-between cursor-pointer py-1.5 group"
                >
                  <span className="text-[14px] text-[#efeff4] group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    config.pageNumber === item.id ? 'border-[#00af80]' : 'border-[#636366]'
                  }`}>
                    {config.pageNumber === item.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00af80]" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
