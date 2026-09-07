const fs = require('fs');

const files = [
  './src/views/NewTrip.tsx',
  './src/views/NewAccount.tsx',
  './src/views/Support.tsx',
  './src/views/AdminProfileUpdate.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<InputField/g, '<InputField inputSize="text-[10px] font-[\'Calibri\',_sans-serif]"');
  fs.writeFileSync(file, content);
});
console.log('Done');
