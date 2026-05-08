const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/bg-\[rgba\(26,26,26,0\.8\)\]/g, 'bg-[rgba(26,27,30,0.6)]')
                 .replace(/border border-\[\#2a2d32\] backdrop-blur-\[12px\] bg-\[rgba\(26,27,30,0\.6\)\]/g, 'border border-[rgba(255,255,255,0.05)] backdrop-blur-[12px] bg-[rgba(26,27,30,0.6)]')
                 .replace(/<nav className="fixed w-full z-40 top-0 border-b border-\[\#2a2d32\] backdrop-blur-\[12px\] bg-\[rgba\(26,27,30,0\.6\)\] transition-all duration-300">/g, '<nav className="fixed w-full z-40 top-0 border-b border-[#2a2d32] backdrop-blur-md bg-[#0f1011]/90 transition-all duration-300">');
fs.writeFileSync('src/App.jsx', content);
