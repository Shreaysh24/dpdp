const Permission = require('../../models/Permission');
const { connectDB } = require('../../lib/mongodb');

// Middleware wrapper for Vercel
const withCompanyId = (handler) => {
    return async (req, res) => {
        // Extract companyId from headers
        const companyId = req.headers['x-company-id'];
        if (!companyId) {
            return res.status(400).json({ error: 'Missing companyId - x-company-id header required' });
        }
        req.companyId = companyId;
        return handler(req, res);
    };
};

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { userUID, permissionId } = req.body;
        const { companyId } = req;

        // Validate required fields
        if (!userUID || !permissionId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, permissionId' });
        }

        // Find with companyId isolation
        const permission = await Permission.findOne({
            companyId,
            permissionId,
            userUID,
        });

        if (!permission) {
            return res.status(404).json({ error: 'Permission not found in company' });
        }

        // Revoke the permission
        permission.revoked = true;
        permission.revokedAt = new Date();
        await permission.save();

        res.json({
            success: true,
            message: 'Permission revoked successfully',
            companyId,
        });
    } catch (error) {
        console.error('Revoke permission error:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
};

module.exports = withCompanyId(handler);
