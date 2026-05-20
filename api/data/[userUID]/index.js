const Data = require('../../../models/Data');
const { withCompanyVerification } = require('../../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID } = req.params;
        const companyId = req.companyId;

        // Validate required parameters
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required parameter: userUID' });
        }

        // Get all data records for this user in company
        const dataRecords = await Data.find({
            companyId,
            userUID,
        }).lean();

        if (!dataRecords || dataRecords.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No data records found for this user'
            });
        }

        // FIX 8: Don't expose companyId in response
        const cleanedData = dataRecords.map(record => {
            const { companyId, ...rest } = record;
            return rest;
        });

        res.json({
            success: true,
            data: cleanedData,
            count: cleanedData.length
        });
    } catch (error) {
        console.error('Fetch user data error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

module.exports = withCompanyVerification(handler);
