const Permission = require('../../models/Permission');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, permissionId } = req.body;

        if (!userUID || !permissionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const permission = await Permission.findOne({ permissionId, userUID });
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        permission.revoked = true;
        permission.revokedAt = new Date();
        await permission.save();

        res.json({ message: 'Permission revoked successfully' });
    } catch (error) {
        console.error('Revoke permission error:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
};
