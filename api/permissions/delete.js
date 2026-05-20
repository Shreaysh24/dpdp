const Permission = require('../../models/Permission');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, permissionId } = req.body;
        const companyId = req.companyId;

        // Validate required fields
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!permissionId || typeof permissionId !== 'string' || !permissionId.trim()) {
            return res.status(400).json({ error: 'Missing required field: permissionId' });
        }

        // Delete with companyId isolation (prevents cross-company deletion)
        const result = await Permission.deleteOne({
            companyId,
            userUID,
            permissionId,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            message: 'Permission deleted successfully',
        });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({ error: 'Failed to delete permission' });
    }
};

module.exports = withCompanyVerification(handler);
