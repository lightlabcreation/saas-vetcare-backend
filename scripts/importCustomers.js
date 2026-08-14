const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const pool = require('../config/db');

async function importCustomers(filePath) {
  const startTime = Date.now();
  console.log(`[Customer Import] Reading file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.warn(`[Customer Import Warning] File not found: ${filePath}. Skipping customer import step.`);
    return { totalFound: 0, imported: 0, skipped: 0, errors: [`File not found: ${filePath}`] };
  }

  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { range: 1 });

  console.log(`[Customer Import] Total customer rows found: ${rows.length}`);

  const report = {
    totalFound: rows.length,
    imported: 0,
    skipped: 0,
    duplicates: 0,
    timeTakenMs: 0,
    errors: []
  };

  const processedIDs = new Set();
  const validCustomers = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['Name'] || row['name'];
    const contactId = row['Contact ID'] || row['customer_number'] || row['id'];
    const mobile = row['Mobile'] || row['mobile'] || row['Phone'] || '';
    const address = row['Address'] || row['address'] || '';
    const email = row['Email'] || row['email'] || '';
    const nic = row['Tax number'] || row['nic'] || '';

    if (!name || String(name).trim() === '') {
      report.skipped++;
      report.errors.push(`Customer Row ${rowNum}: Skipped due to missing name`);
      return;
    }

    const id = contactId ? String(contactId).trim() : `own-${crypto.randomUUID().slice(0, 8)}`;
    if (processedIDs.has(id)) {
      report.duplicates++;
    }
    processedIDs.add(id);

    validCustomers.push({
      id,
      customer_number: contactId ? String(contactId).trim() : null,
      name: String(name).trim(),
      nic: nic ? String(nic).trim() : null,
      email: email ? String(email).trim() : null,
      telephone: null,
      mobile: mobile ? String(mobile).trim() : null,
      address: address ? String(address).trim() : null
    });
  });

  if (validCustomers.length === 0) {
    report.timeTakenMs = Date.now() - startTime;
    return report;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO pet_owners (id, customer_number, name, nic, email, telephone, mobile, address)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        customer_number = VALUES(customer_number),
        name = VALUES(name),
        nic = VALUES(nic),
        email = VALUES(email),
        mobile = VALUES(mobile),
        address = VALUES(address)
    `;

    const valuesBatch = validCustomers.map(c => [
      c.id, c.customer_number, c.name, c.nic, c.email, c.telephone, c.mobile, c.address
    ]);

    await connection.query(insertQuery, [valuesBatch]);
    await connection.commit();

    report.imported = validCustomers.length;
    report.timeTakenMs = Date.now() - startTime;
    console.log(`[Customer Import] Successfully imported ${report.imported} customers in ${report.timeTakenMs} ms.`);
    return report;
  } catch (error) {
    await connection.rollback();
    console.error('[Customer Import Error] Batch insert failed. Rolled back:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  const cPath = path.join(__dirname, '../../Customers - ALDOPET VETERINARY CLINIC (2).xlsx');
  importCustomers(cPath).then(res => {
    console.log('Customer Import Report:', res);
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = importCustomers;
