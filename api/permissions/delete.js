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
    if (req.method !== 'DELETE') {
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

        // Delete with companyId isolation (prevents cross-company deletion)
        const result = await Permission.deleteOne({
            companyId,
            permissionId,
            userUID,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Permission not found in company' });
        }

        res.json({
            success: true,
            message: 'Permission deleted successfully',
            companyId,
        });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({ error: 'Failed to delete permission' });
    }
};

module.exports = withCompanyId(handler);
