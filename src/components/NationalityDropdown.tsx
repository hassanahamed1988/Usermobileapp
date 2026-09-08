import React, { useState } from 'react';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { useStore } from '@/store';

interface NationalityDropdownProps {
  selectedNationality: string;
  onSelect: (nationality: string) => void;
}

const NationalityDropdown: React.FC<NationalityDropdownProps> = ({ selectedNationality, onSelect }) => {
  const { nationalities } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const options = nationalities.map(n => ({
    label: n.name,
    value: n.name,
    icon: n.flag,
  }));

  const selectedOption = options.find(o => o.value === selectedNationality);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full h-14 px-3 py-2 rounded-lg text-sm bg-transparent dark:bg-theme-card text-text-main focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <span className="text-xl">{selectedOption.icon}</span>
          ) : (
            <div className="w-5 h-3.5 bg-gray-200 rounded-sm"></div>
          )}
          <span>{selectedNationality || 'Select Nationality'}</span>
        </div>
      </button>

      <GlobalFullscreenSelect
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Nationality"
        options={options}
        onSelect={onSelect}
        selectedValue={selectedNationality}
      />
    </div>
  );
};

export default NationalityDropdown;
