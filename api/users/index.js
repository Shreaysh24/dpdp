const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();

        // Get email from request body
        const { email } = req.body;
        const { companyId } = req;

        // Validate required fields
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate unique userUID
        const userUID = uuidv4();

        // Create user with companyId isolation
        const user = new User({
            companyId,
            userUID,
            email,
            createdAt: new Date(),
        });

        await user.save();

        res.status(201).json({
            success: true,
            userUID,
            companyId,
            email,
        });
    } catch (error) {
        console.error('Create user error:', error);
        
        // Handle duplicate email for company
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email already exists for this company' });
        }
        
        res.status(500).json({ error: 'Failed to create user' });
    }
};

module.exports = withCompanyId(handler);
