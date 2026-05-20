const Permission = require('../../../models/Permission');
const Company = require('../../../models/Company');
const { connectDB } = require('../../../lib/mongodb');

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

        // Find permission with companyId isolation (critical for multi-tenant)
        const permission = await Permission.findOne({
            companyId,
            permissionId: id,
            userUID,
        });

        if (!permission) {
            return res.status(404).json({ error: 'Permission not found in company' });
        }

        res.json({
            success: true,
            data: permission,
            companyId,
        });
    } catch (error) {
        console.error('Fetch permission error:', error);
        res.status(500).json({ error: 'Failed to fetch permission' });
    }
};

module.exports = withCompanyId(handler);
