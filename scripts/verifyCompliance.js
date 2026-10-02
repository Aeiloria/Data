import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const errors = [];

console.log('🏁 Starting pre-deployment architectural validation check...');

// 1. Verify existence of critical environmental config modules
const envLocalPath = path.join(projectRoot, '.env.local');
const envExamplePath = path.join(projectRoot, '.env.example');

if (!fs.existsSync(envLocalPath) && !fs.existsSync(envExamplePath)) {
  errors.push('.env.local or .env.example configuration file missing from project directory root.');
} else {
  const content = fs.existsSync(envLocalPath) 
    ? fs.readFileSync(envLocalPath, 'utf8') 
    : fs.readFileSync(envExamplePath, 'utf8');
  if (!content.includes('VITE_ARCGIS_API_KEY')) {
    errors.push('Required property VITE_ARCGIS_API_KEY is not defined inside environment config.');
  }
}

// 2. Validate structural constraints of large dataset dependencies
const mockDbPath = path.join(projectRoot, 'src/data/mockArcGISInfrastructure.json');
if (fs.existsSync(mockDbPath)) {
  const stats = fs.statSync(mockDbPath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  if (fileSizeInMB > 5) {
    errors.push(`Infrastructure dataset bundle exceeded structural load targets (${fileSizeInMB.toFixed(2)}MB).`);
  }
} else {
  errors.push('ArcGIS dataset baseline file mapping parameters are missing.');
}

// 3. Compile audit review findings
if (errors.length > 0) {
  console.error('\n❌ PRE-DEPLOYMENT COMPLIANCE CHECK FAILED:');
  errors.forEach((err, index) => console.error(`  ${index + 1}. ${err}`));
  process.exit(1); // Block compilation task pipelines on host runner platforms
} else {
  console.log('\n✅ SYSTEM COMPLIANCE VERIFICATION PASSED. READY FOR COMPILATION.');
  process.exit(0);
}
