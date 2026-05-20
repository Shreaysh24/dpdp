const { connectDB } = require('../mongodb');
const Company = require('../../models/Company');

/**
 * Verify if a company exists in the database
 * @param {string} companyId - MongoDB ObjectId of the company
 * @returns {Promise<Object|null>} Company object if found, null otherwise
 */
const verifyCompanyInDB = async (companyId) => {
    try {
        await connectDB();
        
        const company = await Company.findById(companyId);
        
        if (!company) {
            return null;
        }
        
        return {
            companyId: company._id.toString(),
            name: company.name,
            email: company.email,
            domain: company.domain,
            createdAt: company.createdAt,
            exists: true,
        };
    } catch (error) {
        console.error('Error verifying company:', error);
        throw error;
    }
};

/**
 * Get all companies
 * @returns {Promise<Array>} List of all companies
 */
const getAllCompanies = async () => {
    try {
        await connectDB();
        
        const companies = await Company.find({})
            .select('_id name email domain createdAt')
            .lean();
        
        return companies.map(c => ({
            companyId: c._id.toString(),
            name: c.name,
            email: c.email,
            domain: c.domain,
            createdAt: c.createdAt,
        }));
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
};

/**
 * Get company by ID with full details
 * @param {string} companyId - MongoDB ObjectId of the company
 * @returns {Promise<Object>} Full company details
 */
const getCompanyDetails = async (companyId) => {
    try {
        await connectDB();
        
        const company = await Company.findById(companyId)
            .select('-password')
            .lean();
        
        if (!company) {
            return null;
        }
        
        return {
            companyId: company._id.toString(),
            name: company.name,
            email: company.email,
            domain: company.domain,
            apiKey: company.apiKey,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
        };
    } catch (error) {
        console.error('Error getting company details:', error);
        throw error;
    }
};

module.exports = {
    verifyCompanyInDB,
    getAllCompanies,
    getCompanyDetails,
};
