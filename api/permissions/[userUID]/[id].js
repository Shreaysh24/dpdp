const Permission = require('../../../models/Permission');
const { withCompanyVerification } = require('../../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, id } = req.query;
        const companyId = req.companyId;

        // Validate required parameters
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: userUID' });
        }

        if (!id || typeof id !== 'string' || !id.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: id' });
        }

        // Find permission with companyId isolation (critical for multi-tenant)
        const permission = await Permission.findOne({
            companyId,
            userUID,
        });

        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            data: permission,
        });
    } catch (error) {
        console.error('Fetch permission error:', error);
        res.status(500).json({ error: 'Failed to fetch permission' });
    }
};

module.exports = withCompanyVerification(handler);
