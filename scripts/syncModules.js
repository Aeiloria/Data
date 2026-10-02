import fs from 'fs';
import path from 'path';

// Define core build directory source and destination parameters
const SOURCE_FILE = path.resolve('./src/data/mockArcGISInfrastructure.json');
const TARGET_FILE = path.resolve('./public/assets/mockArcGISInfrastructure.json');

function synchronizeModuleAssets() {
  console.log('🏁 Launching development module asset synchronization routine...');

  try {
    if (!fs.existsSync(SOURCE_FILE)) {
      console.error(`❌ Sync Failure: Source file missing at ${SOURCE_FILE}`);
      process.exit(1);
    }

    const targetFolder = path.dirname(TARGET_FILE);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    fs.copyFileSync(SOURCE_FILE, TARGET_FILE);

    const fileStats = fs.statSync(TARGET_FILE);
    console.log(`✅ Sync complete. Target locked: ${TARGET_FILE} (${fileStats.size} bytes)`);
  } catch (err) {
    console.error('❌ Unexpected module synchronization fault:', err.message);
    process.exit(1);
  }
}

synchronizeModuleAssets();
