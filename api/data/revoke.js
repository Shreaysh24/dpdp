const Data = require('../../models/Data');
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

        const { userUID, dataId } = req.body;
        const { companyId } = req;

        // Validate required fields
        if (!userUID || !dataId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, dataId' });
        }

        // Find with companyId isolation
        const dataRecord = await Data.findOne({
            companyId,
            dataId,
            userUID,
        });

        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found in company' });
        }

        // Revoke the data
        dataRecord.revoked = true;
        dataRecord.revokedAt = new Date();
        await dataRecord.save();

        res.json({
            success: true,
            message: 'Data revoked successfully',
            companyId,
        });
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
};

module.exports = withCompanyId(handler);
