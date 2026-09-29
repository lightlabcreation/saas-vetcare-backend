const db = require('../config/db');
const fs = require('fs');
const path = require('path');

class StorageService {
    async getSettings() {
        const [rows] = await db.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_group = 'storage'");
        const settings = {};
        rows.forEach(r => {
            settings[r.setting_key] = r.setting_value;
        });
        return {
            storage_provider: settings.storage_provider || 'local',
            s3_bucket_name: settings.s3_bucket_name || '',
            s3_region: settings.s3_region || 'us-east-1',
            s3_access_key: settings.s3_access_key ? `${settings.s3_access_key.slice(0, 4)}••••••••` : '',
            s3_endpoint: settings.s3_endpoint || '',
            has_secret_key: !!settings.s3_secret_key
        };
    }

    async updateSettings({ storage_provider, s3_bucket_name, s3_region, s3_access_key, s3_secret_key, s3_endpoint }) {
        const updates = [
            ['storage_provider', storage_provider || 'local'],
            ['s3_bucket_name', s3_bucket_name || ''],
            ['s3_region', s3_region || 'us-east-1'],
            ['s3_endpoint', s3_endpoint || '']
        ];

        if (s3_access_key && !s3_access_key.includes('••••')) {
            updates.push(['s3_access_key', s3_access_key]);
        }
        if (s3_secret_key) {
            updates.push(['s3_secret_key', s3_secret_key]);
        }

        for (const [key, val] of updates) {
            await db.query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_group) 
                 VALUES (?, ?, 'storage') 
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [key, val]
            );
        }

        return this.getSettings();
    }
}

module.exports = new StorageService();
