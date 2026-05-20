const Data = require('../../models/Data');
const Company = require('../../models/Company');
const { connectDB } = require('../../lib/mongodb');

// Middleware wrapper for Vercel - with company verification
const withCompanyId = (handler) => {
    return async (req, res) => {
        // Extract companyId from headers
        const companyId = req.headers['x-company-id'];
        if (!companyId) {
            return res.status(400).json({ error: 'Missing companyId - x-company-id header required' });
        }

        try {
            // Verify company exists in database
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(403).json({ 
                    error: 'Company not found or invalid companyId',
                    companyId 
                });
            }
            req.companyId = companyId;
            req.company = company;
        } catch (error) {
            console.error('Company verification error:', error);
            return res.status(500).json({ error: 'Failed to verify company' });
        }
        
        return handler(req, res);
    };
};

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
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

        // Delete with companyId isolation (prevents cross-company deletion)
        const result = await Data.deleteOne({
            companyId,
            dataId,
            userUID,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Data record not found in company' });
        }

        res.json({
            success: true,
            message: 'Data deleted successfully',
            companyId,
        });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
};

module.exports = withCompanyId(handler);
