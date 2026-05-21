const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');
const BlockchainTransaction = require('../../models/BlockchainTransaction');
const { storeDataOnBlockchain, calculateDataHash } = require('../../lib/blockchain');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get email from request body
        const { email } = req.body;
        const companyId = req.companyId;

        // Validate required fields
        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email is required and must be a valid string' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Generate unique userUID
        const userUID = uuidv4();

        // Create user with companyId isolation
        const user = new User({
            companyId,
            userUID,
            email: email.trim(),
        });

        await user.save();

        // Store user creation metadata on blockchain
        try {
            const dataHash = calculateDataHash(userUID, email.trim(), companyId.toString());

            const blockchainResult = await storeDataOnBlockchain(
                dataHash,
                userUID,
                userUID
            );

            // Save blockchain transaction record
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId: userUID,
                dataHash,
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

            // FIX 8: Don't expose internal companyId in response
            res.status(201).json({
                success: true,
                userUID,
                email,
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status,
                    confirmations: blockchainResult.confirmations
                }
            });
        } catch (blockchainError) {
            console.error('Blockchain storage warning (user stored in DB):', blockchainError.message);

            res.status(201).json({
                success: true,
                userUID,
                email,
                blockchainError: blockchainError.message
            });
        }
    } catch (error) {
        console.error('Create user error:', error);

        // Handle duplicate email for company
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email already exists for this company' });
        }

        res.status(500).json({ error: 'Failed to create user' });
    }
};

module.exports = withCompanyVerification(handler);
