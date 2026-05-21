const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Data = require('../models/Data');
const User = require('../models/User');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { storeDataOnBlockchain, calculateDataHash } = require('../lib/blockchain');
const { connectDB } = require('../lib/mongodb');
const Company = require('../models/Company');

const router = express.Router();

/**
 * Middleware to verify API key and attach company
 */
const verifyCompany = async (req, res, next) => {
    try {
        await connectDB();

        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(400).json({ error: 'Missing x-api-key header' });
        }

        const company = await Company.findOne({ apiKey });
        if (!company) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        req.companyId = company._id;
        next();
    } catch (error) {
        console.error('Company verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

router.use(verifyCompany);

/**
 * POST /api/unified-data - Create data
 * GET  /api/unified-data/:userUID - List user's data
 * GET  /api/unified-data/:userUID/:id - Get specific data record
 * POST /api/unified-data/revoke - Revoke data
 * DELETE /api/unified-data - Delete data
 */

// CREATE data
router.post('/', async (req, res) => {
    try {
        const { userUID, data } = req.body;
        const companyId = req.companyId;

        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!data || typeof data !== 'object' || !data.type || !data.value) {
            return res.status(400).json({ error: 'Missing required fields: data.type, data.value' });
        }

        if (typeof data.value !== 'string' || !data.value.trim()) {
            return res.status(400).json({ error: 'data.value must be a non-empty string' });
        }

        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        const dataId = uuidv4();

        // BLOCKCHAIN FIRST (required) - calculate hash and store on blockchain before MongoDB
        const dataHash = calculateDataHash(dataId, userUID, companyId.toString());
        const blockchainResult = await storeDataOnBlockchain(dataHash, dataId, userUID);

        // Blockchain succeeded - now save to MongoDB
        const dataRecord = new Data({
            companyId,
            userUID,
            type: data.type,
            value: data.value.trim(),
            revoked: false,
        });

        await dataRecord.save();

        // Save blockchain transaction to MongoDB
        const blockchainTx = new BlockchainTransaction({
            companyId,
            userUID,
            permissionId: dataId,
            dataHash,
            operationType: 'STORE',
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            gasUsed: blockchainResult.gasUsed,
            status: blockchainResult.status,
            contractAddress: blockchainResult.contractAddress,
            from: blockchainResult.from,
            confirmations: blockchainResult.confirmations,
            metadata: { dataType: data.type, dataValue: data.value.trim(), operation: 'DATA_STORAGE' }
        });

        await blockchainTx.save();

        res.status(201).json({
            success: true,
            dataId,
            userUID,
            blockchain: {
                transactionHash: blockchainResult.transactionHash,
                status: blockchainResult.status,
                confirmations: blockchainResult.confirmations,
                contractAddress: blockchainResult.contractAddress
            }
        });
    } catch (error) {
        console.error('Store data error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Data record already exists' });
        }
        res.status(500).json({ error: 'Failed to store data' });
    }
});

// REVOKE data
router.post('/revoke', async (req, res) => {
    try {
        const { userUID, dataId } = req.body;
        const companyId = req.companyId;

        if (!userUID || !dataId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, dataId' });
        }

        const dataRecord = await Data.findOne({ companyId, userUID });
        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        // BLOCKCHAIN FIRST (required) - revoke on blockchain before updating MongoDB
        const dataHash = calculateDataHash(dataId, userUID, companyId.toString());
        const blockchainResult = await storeDataOnBlockchain(dataHash, dataId, userUID);

        // Blockchain succeeded - now update MongoDB
        dataRecord.revoked = true;
        dataRecord.revokedAt = new Date();
        await dataRecord.save();

        // Save blockchain revocation to MongoDB
        const blockchainTx = new BlockchainTransaction({
            companyId,
            userUID,
            permissionId: dataId,
            dataHash,
            operationType: 'REVOKE',
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            gasUsed: blockchainResult.gasUsed,
            status: blockchainResult.status,
            contractAddress: blockchainResult.contractAddress,
            from: blockchainResult.from,
            confirmations: blockchainResult.confirmations,
            metadata: { operation: 'DATA_REVOCATION', revokedAt: new Date().toISOString() }
        });

        await blockchainTx.save();

        res.json({
            success: true,
            message: 'Data revoked successfully',
            blockchain: {
                transactionHash: blockchainResult.transactionHash,
                status: blockchainResult.status,
                contractAddress: blockchainResult.contractAddress,
                confirmations: blockchainResult.confirmations
            }
        });
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
});

// DELETE data
router.delete('/', async (req, res) => {
    try {
        const { userUID, dataId } = req.body;
        const companyId = req.companyId;

        if (!userUID || !dataId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, dataId' });
        }

        const result = await Data.deleteOne({ _id: dataId, companyId, userUID });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        res.json({ success: true, message: 'Data deleted permanently' });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

// GET user's data records
router.get('/:userUID', async (req, res) => {
    try {
        const { userUID } = req.params;
        const companyId = req.companyId;

        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const data = await Data.find({ companyId, userUID });
        res.json({ success: true, data, count: data.length });
    } catch (error) {
        console.error('List data error:', error);
        res.status(500).json({ error: 'Failed to list data' });
    }
});

// GET specific data record
router.get('/:userUID/:id', async (req, res) => {
    try {
        const { userUID, id } = req.params;
        const companyId = req.companyId;

        const dataRecord = await Data.findOne({ _id: id, companyId, userUID });
        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        res.json({ success: true, data: dataRecord });
    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({ error: 'Failed to get data' });
    }
});

module.exports = router;
