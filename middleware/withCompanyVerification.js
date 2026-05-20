const Company = require('../models/Company');
const { connectDB } = require('./mongodb');

/**
 * Middleware to verify API key and attach company to request
 * Flow:
 * 1. Extract x-api-key header (contains apiKey from external service)
 * 2. Connect to database
 * 3. Find company by apiKey
 * 4. Attach company._id (MongoDB ObjectId) to req.companyId
 * 5. Pass to handler
 */
const withCompanyVerification = (handler) => {
    return async (req, res) => {
        try {
            // Connect to database FIRST (FIX 1)
            await connectDB();

            // Extract apiKey from header (FIX 4 - renamed from x-company-id)
            const apiKey = req.headers['x-api-key'];

            if (!apiKey) {
                return res.status(400).json({
                    error: 'Missing x-api-key header'
                });
            }

            // Find company by apiKey
            const company = await Company.findOne({
                apiKey
            });

            if (!company) {
                return res.status(403).json({
                    error: 'Invalid API key'
                });
            }

            // FIX 2: Store internal MongoDB _id, NOT the apiKey
            req.companyId = company._id;
            req.company = company;

            return handler(req, res);

        } catch (error) {
            console.error('Company verification error:', error);
            return res.status(500).json({
                error: 'Server error during verification'
            });
        }
    };
};

module.exports = { withCompanyVerification };
