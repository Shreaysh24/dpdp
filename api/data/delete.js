const Data = require('../../models/Data');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, dataId } = req.body;
        const companyId = req.companyId;

        // Validate required fields
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!dataId || typeof dataId !== 'string' || !dataId.trim()) {
            return res.status(400).json({ error: 'Missing required field: dataId' });
        }

        // Delete with companyId isolation (prevents cross-company deletion)
        const result = await Data.deleteOne({
            companyId,
            userUID,
            _id: dataId,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            message: 'Data deleted successfully',
        });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
};

module.exports = withCompanyVerification(handler);
