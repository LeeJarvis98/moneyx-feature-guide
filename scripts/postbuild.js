const fs = require('fs');
const path = require('path');

// Copy Vietnamese locale files to root
const outDir = path.join(__dirname, '..', 'out');
const viDir = path.join(outDir, 'vi');

// Files to copy from /vi to root
const filesToCopy = ['index.html', 'index.txt'];

console.log('Copying Vietnamese locale files to root...');

filesToCopy.forEach(file => {
  const src = path.join(viDir, file);
  const dest = path.join(outDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied ' + file + ' to root');
  }
});

console.log('Postbuild complete!');
