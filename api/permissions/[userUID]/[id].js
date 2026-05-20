const Permission = require('../../../models/Permission');
const { connectDB } = require('../../../lib/mongodb');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();
        const { userUID, id } = req.query;

        if (!userUID || !id) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const permission = await Permission.findOne({ permissionId: id, userUID });
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        res.json(permission);
    } catch (error) {
        console.error('Fetch permission error:', error);
        res.status(500).json({ error: 'Failed to fetch permission' });
    }
};
