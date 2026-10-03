const fs = require('fs');
const file = 'd:/Astra/apps/web/src/app/globals.css';
let content = fs.readFileSync(file);
const nullIndex = content.indexOf(0x00);
if (nullIndex !== -1) {
    const goodStr = content.toString('utf8', 0, nullIndex);
    fs.writeFileSync(file, goodStr.trim() + '\n\n' + `/* Sleek Farmer Queue Scroll Area (Light Mode) */
.farmer-queue-scroll {
  overflow-y: auto;
  overflow-x: auto;
  max-height: 70vh;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: #6EE7B7 #F0FDF4;
  overscroll-behavior: auto;
}

@media (max-width: 1024px) {
  .farmer-queue-scroll {
    max-height: 75vh;
  }
}

@media (max-width: 768px) {
  .farmer-queue-scroll {
    max-height: 70vh;
  }
}

.farmer-queue-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.farmer-queue-scroll::-webkit-scrollbar-track {
  background: #F0FDF4;
  border-radius: 9999px;
  margin: 2px 0;
}

.farmer-queue-scroll::-webkit-scrollbar-thumb {
  background: #A7F3D0;
  border-radius: 9999px;
  border: 1px solid #D1FAE5;
}

.farmer-queue-scroll::-webkit-scrollbar-thumb:hover {
  background: #6EE7B7;
}
`);
    console.log('Fixed globals.css encoding');
} else {
    console.log('No NUL bytes found.');
}
