const Data = require('../../../models/Data');
const { withCompanyVerification } = require('../../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, id } = req.query;
        const companyId = req.companyId;

        // Validate required parameters
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: userUID' });
        }

        if (!id || typeof id !== 'string' || !id.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: id' });
        }

        // Find data with companyId isolation (critical for multi-tenant)
        const dataRecord = await Data.findOne({
            companyId,
            userUID,
        });

        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            data: dataRecord,
        });
    } catch (error) {
        console.error('Fetch data error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

module.exports = withCompanyVerification(handler);
