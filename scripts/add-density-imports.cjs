/**
 * Adds DENSITY import to files that need it after color fix
 */
const fs = require('fs');

const DENSITY_FILES = [
  'src/features/terminal-next/runtime/functions/FnBLTR.tsx',
  'src/features/terminal-next/runtime/functions/FnERR.tsx',
  'src/features/terminal-next/runtime/functions/FnLAT.tsx',
  'src/features/terminal-next/runtime/functions/FnLINE.tsx',
  'src/features/terminal-next/runtime/functions/FnQLT.tsx',
];

for (const f of DENSITY_FILES) {
  try {
    let src = fs.readFileSync(f, 'utf8');
    if (!src.includes("from '../../constants/layoutDensity'") && !src.includes("from '../constants/layoutDensity'")) {
      // Find the first import line and add DENSITY import after 'use client'
      const lines = src.split('\n');
      // Find first import or 'use client'
      let insertIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("'use client'")) { insertIdx = i + 2; break; }
        if (lines[i].startsWith('import ')) { insertIdx = i; break; }
      }
      lines.splice(insertIdx, 0, "import { DENSITY } from '../../constants/layoutDensity';");
      src = lines.join('\n');
      fs.writeFileSync(f, src, 'utf8');
      console.log('Added DENSITY import to:', f);
    } else {
      console.log('Already has import:', f);
    }
  } catch(e) { console.log('Skip:', f, e.message); }
}
