import fs from 'fs';

const dir = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault';

console.log('--- HandoverController.java ---');
console.log(fs.readFileSync(`${dir}/controller/HandoverController.java`, 'utf-8'));

console.log('--- AssetHandoverController.java (around getAuthorizedInheritanceAssets) ---');
const ahc = fs.readFileSync(`${dir}/controller/AssetHandoverController.java`, 'utf-8');
const lines = ahc.split('\n');
console.log(lines.slice(135, 170).join('\n'));
