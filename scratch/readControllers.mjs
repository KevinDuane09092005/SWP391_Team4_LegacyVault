import fs from 'fs';

const dir = 'c:/Users/ThinkPad T14/Desktop/LegagyVault-project/SWP391_Team4_LegacyVault_Backend/src/main/java/com/legacyvault/controller';

for (const file of ['AssetHandoverController.java', 'HandoverController.java']) {
  console.log(`\n=== ${file} ===`);
  try {
    const content = fs.readFileSync(`${dir}/${file}`, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('Mapping') || line.includes('public ResponseEntity') || line.includes('class ')) {
        console.log(`L${i+1}: ${line.trim()}`);
      }
    });
  } catch (e) {
    console.error(e.message);
  }
}
