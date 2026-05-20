const Data = require('../../../models/Data');
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

        const dataRecord = await Data.findOne({ dataId: id, userUID });
        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        res.json(dataRecord);
    } catch (error) {
        console.error('Fetch data error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};
