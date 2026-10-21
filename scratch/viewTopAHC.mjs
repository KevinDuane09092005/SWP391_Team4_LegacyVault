import fs from 'fs';

const file = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/controller/AssetHandoverController.java';
const lines = fs.readFileSync(file, 'utf-8').split('\n');
console.log(lines.slice(0, 65).join('\n'));
