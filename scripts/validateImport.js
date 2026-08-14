const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const categoryMap = {
  'Medication': 'Medicine',
  'Vaccin': 'Medicine',
  'Antiseptics': 'Medicine',
  'Injections': 'Medicine',
  'Food': 'Food & Snacks',
  'Supplements': 'Vitamins & Supplements',
  'Consumables': 'Hygiene Items',
  'SHOP': 'Accessories & Toys',
  'Inventory asset': 'Accessories & Toys',
  'Service': 'Service'
};

function validateProductRows(productFilePath) {
  if (!fs.existsSync(productFilePath)) {
    throw new Error(`Product file not found: ${productFilePath}`);
  }

  const wb = xlsx.readFile(productFilePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { range: 1 });

  const summary = {
    totalFound: rows.length,
    validRows: 0,
    skippedRows: 0,
    duplicateSKUs: 0,
    skuSet: new Set(),
    categoriesFound: {},
    errors: []
  };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-based header on row 2
    const name = row['Product'] || row['name'];
    const rawSKU = row['SKU'] || row['sku'];
    const rawSellingPrice = row['Selling Price'] || row['selling_price'];
    const rawCategory = row['Category'] || row['category'];

    if (!name) {
      summary.errors.push(`Row ${rowNum}: Missing product name`);
      summary.skippedRows++;
      return;
    }

    if (rawSKU === undefined || rawSKU === null || String(rawSKU).trim() === '') {
      summary.errors.push(`Row ${rowNum} (${name}): Missing SKU`);
      summary.skippedRows++;
      return;
    }

    const skuStr = String(rawSKU).trim();
    if (summary.skuSet.has(skuStr)) {
      summary.duplicateSKUs++;
      summary.errors.push(`Row ${rowNum} (${name}): Duplicate SKU '${skuStr}'`);
      // We count duplicate SKU rows as skipped or handled by upsert
    } else {
      summary.skuSet.add(skuStr);
    }

    const mappedCat = categoryMap[rawCategory ? String(rawCategory).trim() : ''] || 'Accessories & Toys';
    summary.categoriesFound[mappedCat] = (summary.categoriesFound[mappedCat] || 0) + 1;
    summary.validRows++;
  });

  return summary;
}

function validateCustomerRows(customerFilePath) {
  if (!fs.existsSync(customerFilePath)) {
    return { totalFound: 0, validRows: 0, skippedRows: 0, errors: [`Customer file not found: ${customerFilePath}`] };
  }

  const wb = xlsx.readFile(customerFilePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { range: 1 });

  const summary = {
    totalFound: rows.length,
    validRows: 0,
    skippedRows: 0,
    duplicateIDs: 0,
    idSet: new Set(),
    errors: []
  };

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['Name'] || row['name'];
    const contactId = row['Contact ID'] || row['contact_id'] || row['id'];

    if (!name) {
      summary.errors.push(`Customer Row ${rowNum}: Missing customer name`);
      summary.skippedRows++;
      return;
    }

    if (contactId) {
      const idStr = String(contactId).trim();
      if (summary.idSet.has(idStr)) {
        summary.duplicateIDs++;
        summary.errors.push(`Customer Row ${rowNum} (${name}): Duplicate Contact ID '${idStr}'`);
      } else {
        summary.idSet.add(idStr);
      }
    }

    summary.validRows++;
  });

  return summary;
}

async function validateImport(productFilePath, customerFilePath) {
  console.log('====================================================');
  console.log('       RUNNING DRY-RUN / PRE-FLIGHT VALIDATION      ');
  console.log('====================================================\n');

  const pSummary = validateProductRows(productFilePath);
  const cSummary = validateCustomerRows(customerFilePath);

  console.log('--- PRODUCT VALIDATION SUMMARY ---');
  console.log(`Total Product Records Found : ${pSummary.totalFound}`);
  console.log(`Valid Rows                 : ${pSummary.validRows}`);
  console.log(`Skipped / Invalid Rows     : ${pSummary.skippedRows}`);
  console.log(`Duplicate SKUs Detected    : ${pSummary.duplicateSKUs}`);
  console.log(`Categories Breakdown       :`, pSummary.categoriesFound);

  console.log('\n--- CUSTOMER VALIDATION SUMMARY ---');
  console.log(`Total Customer Records Found: ${cSummary.totalFound}`);
  console.log(`Valid Rows                  : ${cSummary.validRows}`);
  console.log(`Duplicate IDs Detected     : ${cSummary.duplicateIDs}`);

  if (pSummary.errors.length > 0 || cSummary.errors.length > 0) {
    console.log('\n--- VALIDATION ERRORS / WARNINGS SAMPLE (First 10) ---');
    const allErrors = [...pSummary.errors, ...cSummary.errors];
    allErrors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  console.log('\n====================================================');
  console.log(' [DRY-RUN RESULT]: Validation Complete. No DB Changes Made.');
  console.log('====================================================\n');

  return {
    success: true,
    products: pSummary,
    customers: cSummary
  };
}

if (require.main === module) {
  const pPath = path.join(__dirname, '../../Products - ALDOPET VETERINARY CLINIC (1).xlsx');
  const cPath = path.join(__dirname, '../../Customers - ALDOPET VETERINARY CLINIC (2).xlsx');
  validateImport(pPath, cPath).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = validateImport;
