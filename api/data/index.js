const { v4: uuidv4 } = require('uuid');
const Data = require('../../models/Data');
const User = require('../../models/User');
const { connectDB } = require('../../lib/mongodb');

// Middleware wrapper for Vercel
const withCompanyId = (handler) => {
    return async (req, res) => {
        // Extract companyId from headers
        const companyId = req.headers['x-company-id'];
        if (!companyId) {
            return res.status(400).json({ error: 'Missing companyId - x-company-id header required' });
        }
        req.companyId = companyId;
        return handler(req, res);
    };
};

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { userUID, data } = req.body;
        const { companyId } = req;

        // Validate required fields
        if (!userUID || !data || !data.type || !data.value) {
            return res.status(400).json({ error: 'Missing required fields: userUID, data.type, data.value' });
        }

        // Verify user belongs to company (security check)
        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        // Generate unique dataId
        const dataId = uuidv4();

        // Create data record with companyId isolation
        const dataRecord = new Data({
            companyId,
            dataId,
            userUID,
            type: data.type,
            value: data.value,
            createdAt: new Date(),
            revoked: false,
        });

        await dataRecord.save();

        res.status(201).json({
            success: true,
            dataId,
            companyId,
            userUID,
        });
    } catch (error) {
        console.error('Store data error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Data record already exists for this company' });
        }
        
        res.status(500).json({ error: 'Failed to store data' });
    }
};

module.exports = withCompanyId(handler);
