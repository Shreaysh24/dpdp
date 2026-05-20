const Company = require('../models/Company');

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API key' });
    }

    const validApiKey = process.env.API_KEY || 'default-api-key';
    if (apiKey !== validApiKey) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
};

const extractCompanyId = (req, res, next) => {
    // Get companyId from headers (sent by external API key service)
    const companyId = req.headers['x-company-id'];

    if (!companyId) {
        return res.status(400).json({ error: 'Missing companyId - x-company-id header required' });
    }

    // Attach companyId to request for use in route handlers
    req.companyId = companyId;
    next();
};

const verifyCompanyExists = async (req, res, next) => {
    try {
        const { companyId } = req;

        if (!companyId) {
            return res.status(400).json({ error: 'Missing companyId - x-company-id header required' });
        }

        // Verify company exists in database
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(403).json({ 
                error: 'Company not found or invalid companyId',
                companyId 
            });
        }

        // Attach company to request for reference
        req.company = company;
        next();
    } catch (error) {
        console.error('Company verification error:', error);
        res.status(500).json({ error: 'Failed to verify company' });
    }
};

module.exports = { verifyApiKey, extractCompanyId, verifyCompanyExists };
