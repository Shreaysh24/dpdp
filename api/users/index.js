const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userUID = uuidv4();
        const user = new User({ userUID, createdAt: new Date() });
        await user.save();

        res.status(201).json({ userUID });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};
