const Permission = require('../../models/Permission');
const { connectDB } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();
        const { userUID, permissionId } = req.body;

        if (!userUID || !permissionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await Permission.deleteOne({ permissionId, userUID });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({ error: 'Failed to delete permission' });
    }
};
