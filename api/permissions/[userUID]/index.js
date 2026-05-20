const Permission = require('../../../models/Permission');
const { withCompanyVerification } = require('../../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Extract userUID from URL path: /dpdp/permissions/abc123
        const urlParts = req.url.split('?')[0].split('/'); // Remove query string and split
        const userUID = urlParts[urlParts.length - 1]; // Last part is userUID
        const companyId = req.companyId;

        // Validate required parameters
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: userUID' });
        }

        // Get all permission records for this user in company
        const permissions = await Permission.find({
            companyId,
            userUID,
        }).lean();

        if (!permissions || permissions.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No permission records found for this user'
            });
        }

        // FIX 8: Don't expose companyId in response
        const cleanedPermissions = permissions.map(permission => {
            const { companyId, ...rest } = permission;
            return rest;
        });

        res.json({
            success: true,
            data: cleanedPermissions,
            count: cleanedPermissions.length
        });
    } catch (error) {
        console.error('Fetch user permissions error:', error);
        res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
};

module.exports = withCompanyVerification(handler);
