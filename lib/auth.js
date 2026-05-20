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

module.exports = { verifyApiKey };
