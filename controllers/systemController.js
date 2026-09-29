const backupService = require('../services/backupService');
const storageService = require('../services/storageService');

// 1. Download Instant Full Database Dump (.sql)
exports.downloadDatabaseBackup = async (req, res) => {
    try {
        const { filename, sizeKb, tablesCount, totalRows, sqlDump } = await backupService.generateSqlDump();
        
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-Backup-Size-KB', sizeKb);
        res.setHeader('X-Backup-Tables', tablesCount);
        res.setHeader('X-Backup-Rows', totalRows);

        return res.status(200).send(sqlDump);
    } catch (error) {
        console.error('[SystemController] Error generating database backup:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to generate database dump', error: error.message });
    }
};

// 2. Get Database Backup History
exports.getBackupHistory = async (req, res) => {
    try {
        const history = await backupService.getBackupHistory();
        return res.json({ status: 'success', data: history });
    } catch (error) {
        console.error('[SystemController] Error fetching backup history:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch backup history' });
    }
};

// 3. Get Storage Settings
exports.getStorageSettings = async (req, res) => {
    try {
        const settings = await storageService.getSettings();
        return res.json({ status: 'success', data: settings });
    } catch (error) {
        console.error('[SystemController] Error fetching storage settings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch storage settings' });
    }
};

// 4. Update Storage Settings
exports.updateStorageSettings = async (req, res) => {
    try {
        const updated = await storageService.updateSettings(req.body);
        return res.json({ status: 'success', message: 'Storage settings updated successfully', data: updated });
    } catch (error) {
        console.error('[SystemController] Error updating storage settings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update storage settings' });
    }
};
