const fs = require('fs');

const FILES = [
  'src/features/terminal-next/runtime/functions/FnBLTR.tsx',
  'src/features/terminal-next/runtime/functions/FnAUD.tsx',
  'src/features/terminal-next/runtime/functions/FnPOL.tsx',
  'src/features/terminal-next/runtime/functions/FnLINE.tsx',
  'src/features/terminal-next/runtime/functions/FnENT.tsx',
  'src/features/terminal-next/runtime/functions/FnMON.tsx',
  'src/features/terminal-next/runtime/functions/FnNOTES.tsx',
  'src/features/terminal-next/runtime/functions/FnWave4CollabExecution.tsx',
  'src/features/terminal-next/runtime/functions/FnWave4Workflow.tsx',
  'src/features/terminal-next/runtime/functions/FnALRT.tsx',
  'src/features/terminal-next/runtime/functions/FnIB.tsx',
  'src/features/terminal-next/runtime/functions/FnRegionNewsIntel.tsx',
  'src/features/terminal-next/runtime/functions/FnRelationshipIntel.tsx',
  'src/features/terminal-next/runtime/functions/FnNavDossierIntel.tsx',
  'src/features/terminal-next/runtime/functions/FnORD.tsx',
  'src/features/terminal-next/runtime/functions/FnSTAT.tsx',
  'src/features/terminal-next/runtime/functions/FnCACH.tsx',
  'src/features/terminal-next/runtime/functions/FnERR.tsx',
  'src/features/terminal-next/runtime/functions/FnLAT.tsx',
  'src/features/terminal-next/runtime/functions/FnQLT.tsx',
  'src/features/terminal-next/runtime/functions/FnECO.tsx',
  'src/features/terminal-next/runtime/functions/FnCOLS.tsx',
  'src/features/terminal-next/runtime/functions/FnPIN.tsx',
  'src/features/terminal-next/runtime/functions/FnNX.tsx',
  'src/features/terminal-next/runtime/PanelOverlays.tsx',
];

function fix(src) {
  return src
    .replace(/background:\s*'#000'/g, 'background: DENSITY.bgBase')
    .replace(/border:\s*'1px solid #222'/g, 'border: `1px solid ${DENSITY.borderColor}`')
    .replace(/color:\s*'#e6e6e6'/g, 'color: DENSITY.textPrimary')
    .replace(/color:\s*'#93a9c6'/g, 'color: DENSITY.textSecondary')
    .replace(/borderBottom:\s*'1px solid #111'/g, 'borderBottom: `1px solid ${DENSITY.gridlineColor}`')
    .replace(/borderTop:\s*'1px solid #111'/g, 'borderTop: `1px solid ${DENSITY.gridlineColor}`')
    .replace(/background:\s*'#111'/g, 'background: DENSITY.bgSurface')
    .replace(/background:\s*'#0a0a0a'/g, 'background: DENSITY.bgSurface')
    .replace(/background:\s*'#060606'/g, 'background: DENSITY.rowZebra')
    .replace(/background:\s*'#090909'/g, 'background: DENSITY.bgBase')
    .replace(/ri\s*%\s*2\s*===\s*1\s*\?\s*'#060606'\s*:\s*DENSITY\.bgBase/g, 'ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.bgBase')
    .replace(/i\s*%\s*2\s*\?\s*'#060606'\s*:\s*DENSITY\.bgBase/g, 'i % 2 ? DENSITY.rowZebra : DENSITY.bgBase')
    .replace(/'#1a2a3a'/g, 'DENSITY.rowSelectedBg')
    .replace(/'#FFB000'/g, 'DENSITY.accentAmber')
    .replace(/'#ffb000'/g, 'DENSITY.accentAmber')
    .replace(/background:\s*'#000000f0'/g, 'background: `${DENSITY.bgBase}f0`')
    ;
}

let fixed = 0;
for (const f of FILES) {
  try {
    const src = fs.readFileSync(f, 'utf8');
    const out = fix(src);
    if (out !== src) { fs.writeFileSync(f, out, 'utf8'); fixed++; console.log('Fixed:', f); }
    else console.log('No changes:', f);
  } catch(e) { console.log('Skip:', f, e.message); }
}
console.log('Done, fixed', fixed, 'files');
