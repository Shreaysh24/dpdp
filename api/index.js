const express = require('express');
const dataRouter = require('./unified-data-handler');
const permissionsRouter = require('./unified-permissions-handler');
const { connectDB } = require('../lib/mongodb');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getTransactionStatus, storeDataOnBlockchain, calculateDataHash } = require('../lib/blockchain');
const User = require('../models/User');
const Company = require('../models/Company');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

// Mount unified routers
app.use('/dpdp/data', dataRouter);
app.use('/dpdp/permissions', permissionsRouter);

// Blockchain status endpoint
app.get('/dpdp/blockchain-status', async (req, res) => {
    try {
        await connectDB();

        const { transactionHash, permissionId } = req.query;

        if (!transactionHash && !permissionId) {
            return res.status(400).json({
                error: 'Missing required query parameter: transactionHash or permissionId'
            });
        }

        let query = {};
        if (transactionHash) {
            query.transactionHash = transactionHash;
        } else if (permissionId) {
            query.permissionId = permissionId;
        }

        const storedTx = await BlockchainTransaction.findOne(query);
        if (!storedTx) {
            return res.status(404).json({ error: 'Transaction not found in database' });
        }

        const currentStatus = await getTransactionStatus(storedTx.transactionHash);

        if (currentStatus.confirmations > storedTx.confirmations) {
            storedTx.confirmations = currentStatus.confirmations;
            storedTx.status = currentStatus.status;
            await storedTx.save();
        }

        res.status(200).json({
            success: true,
            transaction: {
                transactionHash: storedTx.transactionHash,
                permissionId: storedTx.permissionId,
                userUID: storedTx.userUID,
                status: currentStatus.status,
                blockNumber: currentStatus.blockNumber,
                confirmations: currentStatus.confirmations,
                gasUsed: currentStatus.gasUsed,
                from: currentStatus.from,
                contractAddress: storedTx.contractAddress,
                createdAt: storedTx.createdAt,
                updatedAt: storedTx.updatedAt
            }
        });

    } catch (error) {
        console.error('Blockchain status error:', error);
        res.status(500).json({
            error: 'Failed to get blockchain status',
            message: error.message
        });
    }
});

// Users endpoint
app.post('/dpdp/users', async (req, res) => {
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

        const companyId = company._id;
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email is required and must be a valid string' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const userUID = uuidv4();

        // Try blockchain first - if it fails, skip it (fallback mode)
        let blockchainResult = null;
        let blockchainError = null;

        try {
            const dataHash = calculateDataHash(userUID, email.trim(), companyId.toString());
            blockchainResult = await storeDataOnBlockchain(dataHash, userUID, userUID);
        } catch (error) {
            console.warn('Blockchain storage skipped (will be implemented after contract deployed):', error.message);
            blockchainError = error.message;
        }

        // If blockchain failed in fallback mode, still proceed with MongoDB
        if (!blockchainResult) {
            console.log('Proceeding with MongoDB-only storage (no blockchain)');
        }

        // Save to MongoDB
        const user = new User({
            companyId,
            userUID,
            email: email.trim(),
        });

        await user.save();

        // If blockchain succeeded, also save blockchain transaction
        if (blockchainResult) {
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId: userUID,
                dataHash: calculateDataHash(userUID, email.trim(), companyId.toString()),
                operationType: 'STORE',
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber,
                gasUsed: blockchainResult.gasUsed,
                status: blockchainResult.status,
                contractAddress: blockchainResult.contractAddress,
                from: blockchainResult.from,
                confirmations: blockchainResult.confirmations,
                metadata: {
                    email: email.trim(),
                    operation: 'USER_CREATION'
                }
            });

            await blockchainTx.save();

            res.status(201).json({
                success: true,
                userUID,
                email,
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
                userUID,
                email,
                blockchainStatus: 'PENDING - Smart contract deployment in progress',
                blockchainError: blockchainError
            });
        }
    } catch (error) {
        console.error('Create user error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email already exists for this company' });
        }

        res.status(500).json({ error: 'Failed to create user' });
    }
});

module.exports = app;
