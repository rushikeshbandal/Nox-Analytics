import fs from 'fs';
import path from 'path';

const searchDirectories = [
  'c:\\Users\\hp\\Downloads\\Nox_Analytics-Merged (2)\\merged',
  'c:\\Users\\hp\\Downloads\\Nox_Vanta-master\\Nox_Vanta-master'
];

const ignoreDirs = ['node_modules', '.git', 'vendor', 'storage', 'bootstrap', 'public', 'dist'];

function traverse(dir, term) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(file)) {
          traverse(fullPath, term);
        }
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes(term.toLowerCase())) {
            console.log(`Found "${term}" in: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(term.toLowerCase())) {
                console.log(`  Line ${index + 1}: ${line.trim()}`);
              }
            });
          }
        } catch {}
      }
    });
  } catch {}
}

console.log('Searching for "client_id"...');
searchDirectories.forEach(dir => traverse(dir, 'client_id'));
console.log('Searching for "nox_client"...');
searchDirectories.forEach(dir => traverse(dir, 'nox_client'));
console.log('Searching for "token"...');
searchDirectories.forEach(dir => traverse(dir, '/auth/token'));
console.log('Search finished.');
