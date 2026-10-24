import fs from 'fs';

const dir = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/entity';
const files = fs.readdirSync(dir);
console.log('Entities:', files);

for (const f of ['HandoverCase.java', 'Assignment.java', 'Contact.java', 'User.java']) {
  if (files.includes(f)) {
    console.log(`\n=== ${f} ===`);
    console.log(fs.readFileSync(`${dir}/${f}`, 'utf-8'));
  }
}
