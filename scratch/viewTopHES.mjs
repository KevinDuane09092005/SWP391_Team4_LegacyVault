import fs from 'fs';

const file = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/service/HandoverExecutionService.java';
const lines = fs.readFileSync(file, 'utf-8').split('\n');
console.log(lines.slice(0, 95).join('\n'));
