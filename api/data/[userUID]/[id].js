const Data = require('../../../models/Data');
const { connectDB } = require('../../../lib/mongodb');

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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { userUID, id } = req.query;
        const { companyId } = req;

        // Validate required parameters
        if (!userUID || !id) {
            return res.status(400).json({ error: 'Missing required parameters: userUID, id' });
        }

        // Find data with companyId isolation (critical for multi-tenant)
        const dataRecord = await Data.findOne({
            companyId,
            dataId: id,
            userUID,
        });

        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found in company' });
        }

        res.json({
            success: true,
            data: dataRecord,
            companyId,
        });
    } catch (error) {
        console.error('Fetch data error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

module.exports = withCompanyId(handler);
