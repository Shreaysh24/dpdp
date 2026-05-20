const Data = require('../../models/Data');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
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

        // Find with companyId isolation (FIX 7: Using .findOne with companyId)
        const dataRecord = await Data.findOne({
            companyId,
            userUID,
        });

        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        // Revoke the data
        dataRecord.revoked = true;
        dataRecord.revokedAt = new Date();
        await dataRecord.save();

        // FIX 8: Don't expose companyId in response
        res.json({
            success: true,
            message: 'Data revoked successfully',
        });
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
};

module.exports = withCompanyVerification(handler);
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
};

module.exports = withCompanyId(handler);
