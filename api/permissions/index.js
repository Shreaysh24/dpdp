const { v4: uuidv4 } = require('uuid');
const Permission = require('../../models/Permission');
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
        if (!userUID || !data || !data.subject) {
            return res.status(400).json({ error: 'Missing required fields: userUID, data.subject' });
        }

        // Verify user belongs to company (security check)
        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        // Generate unique permissionId
        const permissionId = uuidv4();

        // Create permission with companyId isolation
        const permission = new Permission({
            companyId,
            permissionId,
            userUID,
            subject: data.subject,
            description: data.description || '',
            createdAt: new Date(),
            revoked: false,
        });

        await permission.save();

        res.status(201).json({
            success: true,
            permissionId,
            companyId,
            userUID,
        });
    } catch (error) {
        console.error('Store permission error:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Permission record already exists for this company' });
        }
        
        res.status(500).json({ error: 'Failed to store permission' });
    }
};

module.exports = withCompanyId(handler);
