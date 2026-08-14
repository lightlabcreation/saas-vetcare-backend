const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const pool = require('../config/db');

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

function parsePrice(val) {
  if (val === undefined || val === null || val === '') return 0;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
}

function parseQuantity(val) {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).trim();
  if (str === '--' || str === '-') return 0;
  const match = str.match(/[-+]?\d*\.?\d+/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return isNaN(num) ? 0 : Math.round(num);
}

function parseUnit(val) {
  if (!val) return 'Pieces';
  const str = String(val).trim();
  const match = str.match(/[a-zA-Z]+/g);
  if (match && match.length > 0) {
    const u = match.join(' ');
    if (u.toLowerCase() === 'quantity') return 'Pieces';
    return u;
  }
  return 'Pieces';
}

async function importProducts(filePath) {
  const startTime = Date.now();
  console.log(`[Product Import] Reading file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Product Excel file not found: ${filePath}`);
  }

  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { range: 1 });

  console.log(`[Product Import] Total rows found: ${rows.length}`);

  const report = {
    totalFound: rows.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    duplicates: 0,
    timeTakenMs: 0,
    categoriesImported: {},
    errors: []
  };

  const processedSKUs = new Set();
  const validProductItems = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['Product'] || row['name'];
    const rawSKU = row['SKU'] || row['sku'];
    const rawPurchasePrice = row['Unit Purchase Price'] || row['cost_price'];
    const rawSellingPrice = row['Selling Price'] || row['selling_price'];
    const rawStock = row['Current stock'] || row['quantity'];
    const rawCategory = row['Category'] || row['category'];

    if (!name || String(name).trim() === '') {
      report.skipped++;
      report.errors.push(`Row ${rowNum}: Skipped due to missing product name`);
      return;
    }

    const sku = rawSKU ? String(rawSKU).trim() : `SKU-${idx + 1000}`;
    if (processedSKUs.has(sku)) {
      report.duplicates++;
    }
    processedSKUs.add(sku);

    const costPrice = parsePrice(rawPurchasePrice);
    const sellingPrice = parsePrice(rawSellingPrice);
    const quantity = parseQuantity(rawStock);
    const unit = parseUnit(rawStock);
    const rawCatStr = rawCategory ? String(rawCategory).trim() : '';
    const category = categoryMap[rawCatStr] || 'Accessories & Toys';

    validProductItems.push({
      id: crypto.randomUUID(),
      sku,
      name: String(name).trim(),
      category,
      supplier: row['Brand'] || row['Business Location'] || 'General Supplier',
      quantity,
      costPrice,
      sellingPrice,
      unit,
      status: String(name).toLowerCase().includes('inactive') ? 'Inactive' : 'Active'
    });

    report.categoriesImported[category] = (report.categoriesImported[category] || 0) + 1;
  });

  console.log(`[Product Import] Prepared ${validProductItems.length} valid product items for database batch insertion.`);

  // Execute Batch DB Insertion inside transaction
  const connection = await pool.getConnection();
  const BATCH_SIZE = 250;

  try {
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO inventory (id, sku, name, category, supplier, quantity, cost_price, selling_price, unit, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        category = VALUES(category),
        supplier = VALUES(supplier),
        quantity = VALUES(quantity),
        cost_price = VALUES(cost_price),
        selling_price = VALUES(selling_price),
        unit = VALUES(unit),
        status = VALUES(status)
    `;

    for (let i = 0; i < validProductItems.length; i += BATCH_SIZE) {
      const chunk = validProductItems.slice(i, i + BATCH_SIZE);
      const valuesBatch = chunk.map(p => [
        p.id, p.sku, p.name, p.category, p.supplier, p.quantity, p.costPrice, p.sellingPrice, p.unit, p.status
      ]);

      const [res] = await connection.query(insertQuery, [valuesBatch]);
      
      // Calculate inserted vs updated count from MySQL affectedRows
      if (res.affectedRows > 0) {
        report.imported += chunk.length;
      }
    }

    await connection.commit();
    report.timeTakenMs = Date.now() - startTime;
    console.log(`[Product Import] Batch insert completed in ${report.timeTakenMs} ms. Successfully processed ${report.imported} items.`);
    return report;
  } catch (error) {
    await connection.rollback();
    console.error('[Product Import Error] Critical failure during batch insert. Transaction rolled back:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  const pPath = path.join(__dirname, '../../Products - ALDOPET VETERINARY CLINIC (1).xlsx');
  importProducts(pPath).then(res => {
    console.log('Import Report:', res);
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = importProducts;
