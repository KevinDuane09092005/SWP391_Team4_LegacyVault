import fs from 'fs';

const dir = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/service';

console.log(fs.readFileSync(`${dir}/HandoverService.java`, 'utf-8'));
