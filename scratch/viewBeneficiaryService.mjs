import fs from 'fs';

const dir = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/service';

const files = fs.readdirSync(dir);
const bhs = files.find(f => f.toLowerCase().includes('beneficiary'));
console.log('Beneficiary service file:', bhs);

if (bhs) {
  console.log(fs.readFileSync(`${dir}/${bhs}`, 'utf-8'));
}
