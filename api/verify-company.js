const Company = require('../../models/Company');
const { connectDB } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }

    try {
        await connectDB();

        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({ 
                error: 'Missing companyId parameter',
                example: '/api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86'
            });
        }

        // Find company by ID
        const company = await Company.findById(companyId)
            .select('-password')
            .lean();

        if (!company) {
            return res.status(404).json({
                error: 'Company not found',
                companyId,
                exists: false,
            });
        }

        // Company found - return details
        return res.status(200).json({
            success: true,
            exists: true,
            company: {
                companyId: company._id.toString(),
                name: company.name,
                email: company.email,
                domain: company.domain,
                apiKey: company.apiKey,
                createdAt: company.createdAt,
                updatedAt: company.updatedAt,
            },
        });
    } catch (error) {
        console.error('Company verification error:', error);
        res.status(500).json({
            error: 'Failed to verify company',
            details: error.message,
        });
    }
};
