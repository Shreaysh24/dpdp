const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Permission = require('../models/Permission');
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
 * POST /api/unified-permissions - Create permission
 * GET  /api/unified-permissions/:userUID - List user's permissions
 * GET  /api/unified-permissions/:userUID/:id - Get specific permission
 * POST /api/unified-permissions/revoke - Revoke permission
 * DELETE /api/unified-permissions - Delete permission
 */

// CREATE permission
router.post('/', async (req, res) => {
    try {
        const { userUID, data } = req.body;
        const companyId = req.companyId;

        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!data || typeof data !== 'object' || !data.subject) {
            return res.status(400).json({ error: 'Missing required field: data.subject' });
        }

        if (typeof data.subject !== 'string' || !data.subject.trim()) {
            return res.status(400).json({ error: 'data.subject must be a non-empty string' });
        }

        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        const permissionId = uuidv4();

        // Try blockchain first - if it fails, skip it (fallback mode)
        let blockchainResult = null;
        let blockchainError = null;

        try {
            const dataHash = calculateDataHash(permissionId, userUID, companyId.toString());
            blockchainResult = await storeDataOnBlockchain(dataHash, permissionId, userUID);
        } catch (error) {
            console.warn('Blockchain storage skipped:', error.message);
            blockchainError = error.message;
        }

        // Save to MongoDB
        const permission = new Permission({
            companyId,
            permissionId,
            userUID,
            subject: data.subject.trim(),
            description: data.description ? data.description.trim() : '',
            revoked: false,
        });

        await permission.save();

        // If blockchain succeeded, also save blockchain transaction
        if (blockchainResult) {
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId,
                dataHash: calculateDataHash(permissionId, userUID, companyId.toString()),
                operationType: 'STORE',
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber,
                gasUsed: blockchainResult.gasUsed,
                status: blockchainResult.status,
                contractAddress: blockchainResult.contractAddress,
                from: blockchainResult.from,
                confirmations: blockchainResult.confirmations,
                metadata: {
                    subject: data.subject.trim(),
                    description: data.description ? data.description.trim() : '',
                    operation: 'PERMISSION_STORAGE'
                }
            });

            await blockchainTx.save();

            res.status(201).json({
                success: true,
                permissionId,
                userUID,
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status,
                    confirmations: blockchainResult.confirmations,
                    contractAddress: blockchainResult.contractAddress
                }
            });
        } else {
            res.status(201).json({
                success: true,
                permissionId,
                userUID,
                blockchainStatus: 'PENDING - Smart contract deployment in progress',
                blockchainError: blockchainError
            });
        }
    } catch (error) {
        console.error('Store permission error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Permission already exists' });
        }
        res.status(500).json({ error: 'Failed to store permission' });
    }
});

// REVOKE permission
router.post('/revoke', async (req, res) => {
    try {
        const { userUID, permissionId } = req.body;
        const companyId = req.companyId;

        if (!userUID || !permissionId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, permissionId' });
        }

        const permission = await Permission.findOne({ companyId, userUID });
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // Try blockchain first - if it fails, skip it (fallback mode)
        let blockchainResult = null;
        let blockchainError = null;

        try {
            const dataHash = calculateDataHash(permissionId, userUID, companyId.toString());
            blockchainResult = await storeDataOnBlockchain(dataHash, permissionId, userUID);
        } catch (error) {
            console.warn('Blockchain revocation skipped:', error.message);
            blockchainError = error.message;
        }

        // Update MongoDB
        permission.revoked = true;
        permission.revokedAt = new Date();
        await permission.save();

        // If blockchain succeeded, also save blockchain transaction
        if (blockchainResult) {
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId,
                dataHash: calculateDataHash(permissionId, userUID, companyId.toString()),
                operationType: 'REVOKE',
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber,
                gasUsed: blockchainResult.gasUsed,
                status: blockchainResult.status,
                contractAddress: blockchainResult.contractAddress,
                from: blockchainResult.from,
                confirmations: blockchainResult.confirmations,
                metadata: { operation: 'PERMISSION_REVOCATION', revokedAt: new Date().toISOString() }
            });

            await blockchainTx.save();

            res.json({
                success: true,
                message: 'Permission revoked successfully',
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status,
                    contractAddress: blockchainResult.contractAddress,
                    confirmations: blockchainResult.confirmations
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Permission revoked successfully (stored in MongoDB, blockchain pending)',
                blockchainStatus: 'PENDING',
                blockchainError: blockchainError
            });
        }
    } catch (error) {
        console.error('Revoke permission error:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
});

// DELETE permission
router.delete('/', async (req, res) => {
    try {
        const { userUID, permissionId } = req.body;
        const companyId = req.companyId;

        if (!userUID || !permissionId) {
            return res.status(400).json({ error: 'Missing required fields: userUID, permissionId' });
        }

        const result = await Permission.deleteOne({ permissionId, companyId, userUID });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        res.json({ success: true, message: 'Permission deleted permanently' });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({ error: 'Failed to delete permission' });
    }
});

// GET user's permissions
router.get('/:userUID', async (req, res) => {
    try {
        const { userUID } = req.params;
        const companyId = req.companyId;

        const user = await User.findOne({ companyId, userUID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const permissions = await Permission.find({ companyId, userUID });
        res.json({ success: true, data: permissions, count: permissions.length });
    } catch (error) {
        console.error('List permissions error:', error);
        res.status(500).json({ error: 'Failed to list permissions' });
    }
});

// GET specific permission
router.get('/:userUID/:id', async (req, res) => {
    try {
        const { userUID, id } = req.params;
        const companyId = req.companyId;

        const permission = await Permission.findOne({ _id: id, companyId, userUID });
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        res.json({ success: true, data: permission });
    } catch (error) {
        console.error('Get permission error:', error);
        res.status(500).json({ error: 'Failed to get permission' });
    }
});

module.exports = router;
