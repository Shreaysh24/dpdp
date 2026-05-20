const { v4: uuidv4 } = require('uuid');
const Data = require('../../models/Data');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, data } = req.body;

        if (!userUID || !data || !data.type || !data.value) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dataId = uuidv4();
        const dataRecord = new Data({
            dataId,
            userUID,
            type: data.type,
            value: data.value,
            createdAt: new Date(),
            revoked: false,
        });

        await dataRecord.save();
        res.status(201).json({ dataId });
    } catch (error) {
        console.error('Store data error:', error);
        res.status(500).json({ error: 'Failed to store data' });
    }
};
