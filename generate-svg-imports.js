const fs = require('fs');

const files = fs.readdirSync('assets/tarot/rider-waite').sort();

// Map of filenames to variable names
const svgMap = {};

files.forEach(file => {
  const base = file.replace('.svg', '');
  const parts = base.split('-');
  const varName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Svg';
  svgMap[base] = varName;
});

// Generate imports
console.log('// SVG Imports');
Object.entries(svgMap).forEach(([file, varName]) => {
  console.log(`import ${varName} from '../../../assets/tarot/rider-waite/${file}.svg';`);
});

console.log('\n// SVG Map for easy lookup');
console.log('const SVG_MAP = {');
Object.entries(svgMap).forEach(([file, varName]) => {
  console.log(`  '${file}': ${varName},`);
});
console.log('};');
