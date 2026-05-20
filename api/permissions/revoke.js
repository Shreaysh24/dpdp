const Permission = require('../../models/Permission');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
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

        // Find with companyId isolation (FIX 7: Using .findOne with companyId)
        const permission = await Permission.findOne({
            companyId,
            userUID,
        });

        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // Revoke the permission
        permission.revoked = true;
        permission.revokedAt = new Date();
        await permission.save();

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            message: 'Permission revoked successfully',
        });
    } catch (error) {
        console.error('Revoke permission error:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
};

module.exports = withCompanyVerification(handler);
