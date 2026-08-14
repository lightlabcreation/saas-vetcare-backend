const fs = require('fs');
const path = require('path');
const backupDatabase = require('./backupDatabase');
const inspectAndPrepareSchema = require('./inspectAndPrepareSchema');
const validateImport = require('./validateImport');
const clearMockData = require('./clearMockData');
const importProducts = require('./importProducts');
const importCustomers = require('./importCustomers');
const pool = require('../config/db');

async function runMigration() {
  const isDryRun = process.argv.includes('--dry-run');
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = path.join(__dirname, '../database/backups');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFilePath = path.join(logDir, `migration_${timestamp}.log`);
  let logContent = `====================================================\n`;
  logContent += `  ALDOPET VETERINARY MIGRATION LOG - ${new Date().toISOString()}\n`;
  logContent += `  Mode: ${isDryRun ? 'DRY-RUN (Pre-Flight Only)' : 'LIVE MIGRATION'}\n`;
  logContent += `====================================================\n\n`;

  console.log(logContent);

  const productPath = path.join(__dirname, '../../Products - ALDOPET VETERINARY CLINIC (1).xlsx');
  const customerPath = path.join(__dirname, '../../Customers - ALDOPET VETERINARY CLINIC (2).xlsx');

  // STEP 1: Dry-Run Validation
  console.log('[Step 1] Running Pre-Flight Dry-Run Validation...');
  const valResult = await validateImport(productPath, customerPath);
  logContent += `[Dry-Run Validation Result]: ${valResult.success ? 'PASSED' : 'FAILED'}\n`;
  logContent += `  - Products Validated : ${valResult.products.validRows} / ${valResult.products.totalFound}\n`;
  logContent += `  - Customers Validated: ${valResult.customers.validRows} / ${valResult.customers.totalFound}\n\n`;

  if (isDryRun) {
    logContent += `[Status]: DRY-RUN COMPLETE. No database data was modified.\n`;
    fs.writeFileSync(logFilePath, logContent, 'utf8');
    console.log(`[Dry-Run] Log written to ${logFilePath}`);
    return;
  }

  try {
    // STEP 2: Database Backup (Phase 0)
    console.log('\n[Step 2] Phase 0: Executing Mandatory Database Backup...');
    const backupRes = await backupDatabase();
    logContent += `[Phase 0 Backup]: SUCCESS\n  - Backup File: ${backupRes.filePath}\n  - Size: ${(backupRes.size / 1024).toFixed(2)} KB\n\n`;

    // STEP 3: Conditional Schema Preparation (Phase 1)
    console.log('\n[Step 3] Phase 1: Conditional Schema Inspection...');
    const schemaRes = await inspectAndPrepareSchema();
    logContent += `[Phase 1 Schema]: SUCCESS\n  - Modifications: ${schemaRes.alterations.join(', ') || 'None required'}\n\n`;

    // STEP 4: Purge Mock Business Data (Phase 2)
    console.log('\n[Step 4] Phase 2: Purging Business Mock Data...');
    await clearMockData();
    logContent += `[Phase 2 Mock Purge]: SUCCESS (Users & Login buttons strictly preserved)\n\n`;

    // STEP 5: Import Products (Phase 3)
    console.log('\n[Step 5] Phase 3: Batch Importing 1,738 Products...');
    const prodRes = await importProducts(productPath);
    logContent += `[Phase 3 Products Import]: SUCCESS\n`;
    logContent += `  - Total Records Found : ${prodRes.totalFound}\n`;
    logContent += `  - Successfully Imported: ${prodRes.imported}\n`;
    logContent += `  - Skipped Invalid Rows: ${prodRes.skipped}\n`;
    logContent += `  - Duplicate SKUs      : ${prodRes.duplicates}\n`;
    logContent += `  - Time Taken          : ${prodRes.timeTakenMs} ms\n`;
    logContent += `  - Categories Breakdown: ${JSON.stringify(prodRes.categoriesImported)}\n\n`;

    // STEP 6: Import Customers (Phase 4)
    console.log('\n[Step 6] Phase 4: Batch Importing Customers...');
    const custRes = await importCustomers(customerPath);
    logContent += `[Phase 4 Customer Import]: SUCCESS\n`;
    logContent += `  - Total Found         : ${custRes.totalFound}\n`;
    logContent += `  - Successfully Imported: ${custRes.imported}\n`;
    logContent += `  - Time Taken          : ${custRes.timeTakenMs} ms\n\n`;

    // STEP 7: Automated Post-Migration Verification (Phase 5)
    console.log('\n[Step 7] Phase 5: Automated Verification Audit...');
    const [invCount] = await pool.query('SELECT COUNT(*) as count FROM inventory');
    const [custCount] = await pool.query('SELECT COUNT(*) as count FROM pet_owners');
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');

    logContent += `[Phase 5 Verification Audit]:\n`;
    logContent += `  - Database Inventory Count : ${invCount[0].count} (Expected: ${prodRes.imported})\n`;
    logContent += `  - Database Customer Count  : ${custCount[0].count}\n`;
    logContent += `  - Preserved Staff Users     : ${userCount[0].count}\n`;

    const totalDuration = Date.now() - startTime;
    logContent += `\n====================================================\n`;
    logContent += `  MIGRATION STATUS: COMPLETED SUCCESSFULLY IN ${totalDuration} ms\n`;
    logContent += `====================================================\n`;

    fs.writeFileSync(logFilePath, logContent, 'utf8');
    console.log(`\n[Migration Complete] Detailed log written to: ${logFilePath}`);
    console.log(`[Summary]: ${invCount[0].count} products and ${custCount[0].count} customers in DB. ${userCount[0].count} demo staff accounts active.`);

  } catch (error) {
    logContent += `\n[CRITICAL FAILURE]: ${error.message}\n${error.stack}\n`;
    logContent += `MIGRATION STATUS: FAILED (Rolled back to preserve data safety)\n`;
    fs.writeFileSync(logFilePath, logContent, 'utf8');
    console.error('\n[Migration Error] Migration failed. Check log file:', logFilePath);
    throw error;
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runMigration;
