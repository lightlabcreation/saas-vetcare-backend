const pool = require('../config/db');

// 1. Get Paginated & Filtered Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        const clinicId = req.clinicId || req.user?.clinic_id;
        const {
            page = 1,
            limit = 20,
            search = '',
            action = '',
            entity = '',
            status = '',
            method = '',
            minLatency = '',
            startDate = '',
            endDate = '',
            userId = ''
        } = req.query;

        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const params = [];
        let whereClauses = [];

        if (clinicId) {
            whereClauses.push('(a.clinic_id = ? OR a.clinic_id IS NULL)');
            params.push(clinicId);
        }

        if (search) {
            whereClauses.push('(a.action LIKE ? OR a.entity LIKE ? OR a.endpoint LIKE ? OR a.ip_address LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
            const s = `%${search}%`;
            params.push(s, s, s, s, s, s);
        }

        if (action) {
            whereClauses.push('a.action = ?');
            params.push(action);
        }

        if (entity) {
            whereClauses.push('a.entity = ?');
            params.push(entity);
        }

        if (status) {
            whereClauses.push('a.status = ?');
            params.push(status);
        }

        if (method) {
            whereClauses.push('a.method = ?');
            params.push(method.toUpperCase());
        }

        if (minLatency) {
            whereClauses.push('a.response_time_ms >= ?');
            params.push(parseInt(minLatency));
        }

        if (startDate) {
            whereClauses.push('a.created_at >= ?');
            params.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClauses.push('a.created_at <= ?');
            params.push(`${endDate} 23:59:59`);
        }

        if (userId) {
            whereClauses.push('a.user_id = ?');
            params.push(userId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM audit_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ${whereSql}`,
            params
        );
        const total = countResult[0]?.total || 0;

        // Fetch logs with user join
        const [logs] = await pool.query(
            `SELECT 
                a.id,
                a.user_id,
                a.clinic_id,
                a.action,
                a.entity,
                a.entity_id,
                a.method,
                a.endpoint,
                a.status_code,
                a.response_time_ms,
                a.status,
                a.old_values,
                a.new_values,
                a.ip_address,
                a.user_agent,
                a.created_at,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.id
             ${whereSql}
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            status: 'success',
            data: {
                logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('[AuditController] Error fetching audit logs:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve audit logs' });
    }
};

// 2. Real-time System Performance & Audit Analytics
exports.getAuditStats = async (req, res) => {
    try {
        const clinicId = req.clinicId || req.user?.clinic_id;
        const clinicFilter = clinicId ? 'WHERE (clinic_id = ? OR clinic_id IS NULL)' : '';
        const params = clinicId ? [clinicId] : [];

        // Summary Aggregates
        const [summaryRows] = await pool.query(
            `SELECT 
                COUNT(*) as total_events,
                ROUND(AVG(NULLIF(response_time_ms, 0)), 1) as avg_latency_ms,
                MAX(response_time_ms) as max_latency_ms,
                SUM(CASE WHEN status = 'FAILED' OR status_code >= 500 THEN 1 ELSE 0 END) as total_errors,
                SUM(CASE WHEN status = 'WARNING' OR (status_code >= 400 AND status_code < 500) THEN 1 ELSE 0 END) as total_warnings,
                SUM(CASE WHEN status = 'SUCCESS' OR (status_code >= 200 AND status_code < 400) THEN 1 ELSE 0 END) as total_success,
                COUNT(DISTINCT user_id) as active_operators
             FROM audit_logs
             ${clinicFilter}`,
            params
        );
        const summary = summaryRows[0] || {};
        const totalEvents = summary.total_events || 0;
        const errorRate = totalEvents > 0 ? ((summary.total_errors / totalEvents) * 100).toFixed(1) : 0;

        // Latency Distribution
        const [latencyDist] = await pool.query(
            `SELECT 
                SUM(CASE WHEN response_time_ms < 100 THEN 1 ELSE 0 END) as fast_count,
                SUM(CASE WHEN response_time_ms >= 100 AND response_time_ms < 300 THEN 1 ELSE 0 END) as moderate_count,
                SUM(CASE WHEN response_time_ms >= 300 THEN 1 ELSE 0 END) as slow_count
             FROM audit_logs
             ${clinicFilter}`,
            params
        );

        // Top Entities/Actions
        const [actionBreakdown] = await pool.query(
            `SELECT entity, COUNT(*) as count 
             FROM audit_logs 
             ${clinicFilter} 
             GROUP BY entity 
             ORDER BY count DESC 
             LIMIT 6`,
            params
        );

        // Slowest Endpoints
        const [slowestEndpoints] = await pool.query(
            `SELECT 
                method, 
                endpoint, 
                COUNT(*) as count, 
                ROUND(AVG(response_time_ms), 1) as avg_latency_ms,
                MAX(response_time_ms) as peak_latency_ms
             FROM audit_logs
             ${clinicFilter ? `${clinicFilter} AND endpoint IS NOT NULL` : 'WHERE endpoint IS NOT NULL'}
             GROUP BY method, endpoint
             ORDER BY avg_latency_ms DESC
             LIMIT 5`,
            params
        );

        // Recent 24h Activity Timeline
        const [timelineRows] = await pool.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as time_slot,
                COUNT(*) as request_count,
                ROUND(AVG(NULLIF(response_time_ms, 0)), 1) as avg_latency,
                SUM(CASE WHEN status = 'FAILED' OR status_code >= 400 THEN 1 ELSE 0 END) as error_count
             FROM audit_logs
             ${clinicFilter ? `${clinicFilter} AND created_at >= NOW() - INTERVAL 24 HOUR` : 'WHERE created_at >= NOW() - INTERVAL 24 HOUR'}
             GROUP BY time_slot
             ORDER BY time_slot ASC`,
            params
        );

        res.json({
            status: 'success',
            data: {
                totalEvents,
                avgLatencyMs: summary.avg_latency_ms || 0,
                maxLatencyMs: summary.max_latency_ms || 0,
                totalErrors: summary.total_errors || 0,
                totalWarnings: summary.total_warnings || 0,
                totalSuccess: summary.total_success || 0,
                errorRate: parseFloat(errorRate),
                activeOperators: summary.active_operators || 0,
                latencyDistribution: latencyDist[0] || { fast_count: 0, moderate_count: 0, slow_count: 0 },
                actionBreakdown,
                slowestEndpoints,
                timeline: timelineRows
            }
        });
    } catch (error) {
        console.error('[AuditController] Error fetching stats:', error);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve audit stats' });
    }
};

// 3. Export Audit Logs as CSV
exports.exportAuditLogs = async (req, res) => {
    try {
        const clinicId = req.clinicId || req.user?.clinic_id;
        const clinicFilter = clinicId ? 'WHERE (a.clinic_id = ? OR a.clinic_id IS NULL)' : '';
        const params = clinicId ? [clinicId] : [];

        const [logs] = await pool.query(
            `SELECT 
                a.created_at,
                u.name as user_name,
                u.role as user_role,
                a.action,
                a.entity,
                a.method,
                a.endpoint,
                a.status_code,
                a.response_time_ms,
                a.status,
                a.ip_address
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.id
             ${clinicFilter}
             ORDER BY a.created_at DESC
             LIMIT 1000`,
            params
        );

        let csv = 'Timestamp,Operator,Role,Action,Entity,Method,Endpoint,StatusCode,Latency(ms),Status,IP\n';
        logs.forEach(row => {
            const time = new Date(row.created_at).toISOString();
            const operator = `"${(row.user_name || 'System').replace(/"/g, '""')}"`;
            const role = `"${(row.user_role || 'System').replace(/"/g, '""')}"`;
            const action = `"${(row.action || '').replace(/"/g, '""')}"`;
            const entity = `"${(row.entity || '').replace(/"/g, '""')}"`;
            const method = row.method || '';
            const endpoint = `"${(row.endpoint || '').replace(/"/g, '""')}"`;
            const status_code = row.status_code || '';
            const latency = row.response_time_ms || 0;
            const status = row.status || '';
            const ip = row.ip_address || '';

            csv += `${time},${operator},${role},${action},${entity},${method},${endpoint},${status_code},${latency},${status},${ip}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error('[AuditController] Error exporting CSV:', error);
        res.status(500).json({ status: 'error', message: 'Failed to export logs' });
    }
};
