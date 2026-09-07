const fs = require('fs');

const file = './src/views/Payment.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/text-xs font-bold text-black/g, 'text-[12px] font-normal text-black');
fs.writeFileSync(file, content);
console.log('Done');
