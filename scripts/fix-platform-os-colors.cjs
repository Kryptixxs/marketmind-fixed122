/**
 * Fixes hardcoded colors in FnPlatformOS.tsx using simple string replacements.
 * Run with: node scripts/fix-platform-os-colors.cjs
 */
const fs = require('fs');

let src = fs.readFileSync('./src/features/terminal-next/runtime/functions/FnPlatformOS.tsx', 'utf8');

// Replace the import line to add inputStyle
src = src.replace(
  "import { DENSITY } from '../../constants/layoutDensity';",
  "import { DENSITY, inputStyle } from '../../constants/layoutDensity';"
);

// Use a function-based approach to avoid regex backreference issues
// Replace each literal string pattern one at a time

// borderBottom patterns (inside style={{...}})
while (src.includes("borderBottom: '1px solid #111'")) {
  src = src.replace("borderBottom: '1px solid #111'", 'borderBottom: `1px solid ${DENSITY.gridlineColor}`');
}
while (src.includes("borderTop: '1px solid #111'")) {
  src = src.replace("borderTop: '1px solid #111'", 'borderTop: `1px solid ${DENSITY.gridlineColor}`');
}
while (src.includes("border: '1px solid #111'")) {
  src = src.replace("border: '1px solid #111'", 'border: `1px solid ${DENSITY.gridlineColor}`');
}
while (src.includes("border: '1px solid #222'")) {
  src = src.replace("border: '1px solid #222'", 'border: `1px solid ${DENSITY.borderColor}`');
}
while (src.includes("background: '#000'")) {
  src = src.replace("background: '#000'", 'background: DENSITY.bgBase');
}
while (src.includes("background: '#111'")) {
  src = src.replace("background: '#111'", 'background: DENSITY.bgSurface');
}
while (src.includes("color: '#e6e6e6'")) {
  src = src.replace("color: '#e6e6e6'", 'color: DENSITY.textPrimary');
}

fs.writeFileSync('./src/features/terminal-next/runtime/functions/FnPlatformOS.tsx', src, 'utf8');
console.log('Done fixing FnPlatformOS.tsx');
