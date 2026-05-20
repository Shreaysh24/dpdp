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

module.exports = { verifyApiKey, extractCompanyId };
