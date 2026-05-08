const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/className="w-full h-full object-cover"/g, 'className="w-full h-full object-cover grayscale-[20%] contrast-110"')
                 .replace(/className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"/g, 'className="w-full h-full object-cover grayscale-[20%] contrast-110 transform group-hover:scale-105 transition-transform duration-700"');
fs.writeFileSync('src/App.jsx', content);
