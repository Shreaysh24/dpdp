const Data = require('../../models/Data');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, dataId } = req.body;

        if (!userUID || !dataId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dataRecord = await Data.findOne({ dataId, userUID });
        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        dataRecord.revoked = true;
        dataRecord.revokedAt = new Date();
        await dataRecord.save();

        res.json({ message: 'Data revoked successfully' });
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
};
