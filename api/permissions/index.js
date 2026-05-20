const { v4: uuidv4 } = require('uuid');
const Permission = require('../../models/Permission');
const { connectDB } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();
        const { userUID, data } = req.body;

        if (!userUID || !data || !data.subject) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const permissionId = uuidv4();
        const permission = new Permission({
            permissionId,
            userUID,
            subject: data.subject,
            description: data.description || '',
            createdAt: new Date(),
            revoked: false,
        });

        await permission.save();
        res.status(201).json({ permissionId });
    } catch (error) {
        console.error('Store permission error:', error);
        res.status(500).json({ error: 'Failed to store permission' });
    }
};
