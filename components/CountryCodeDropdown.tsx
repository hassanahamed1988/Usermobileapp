import React from 'react';

interface CountryCodeDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({ value, onChange }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-14 rounded-lg border border-green-500/50 bg-white px-4 font-bold text-xs text-gray-700 outline-none focus:border-green-500 focus:ring-0"
    >
      <option value="+880">+880</option>
      <option value="+974">+974</option>
      <option value="+1">+1</option>
      <option value="+44">+44</option>
      <option value="+91">+91</option>
    </select>
  );
};

export default CountryCodeDropdown;
