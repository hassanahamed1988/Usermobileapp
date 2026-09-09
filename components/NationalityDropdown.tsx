import React from 'react';

interface NationalityDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const NationalityDropdown: React.FC<NationalityDropdownProps> = ({ value, onChange }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-14 rounded-lg border border-green-500/50 bg-white px-4 font-bold text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-0"
    >
      <option value="Bangladeshi">Bangladeshi</option>
      <option value="Qatari">Qatari</option>
      <option value="American">American</option>
      <option value="British">British</option>
      <option value="Indian">Indian</option>
    </select>
  );
};

export default NationalityDropdown;
