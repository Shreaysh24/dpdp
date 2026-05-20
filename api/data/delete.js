const Data = require('../../models/Data');
const { connectDB } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();
        const { userUID, dataId } = req.body;

        if (!userUID || !dataId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await Data.deleteOne({ dataId, userUID });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        res.json({ message: 'Data deleted successfully' });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
};
