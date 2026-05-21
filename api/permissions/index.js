const { v4: uuidv4 } = require('uuid');
const Permission = require('../../models/Permission');
const User = require('../../models/User');
const BlockchainTransaction = require('../../models/BlockchainTransaction');
const { storeDataOnBlockchain, calculateDataHash } = require('../../lib/blockchain');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, data } = req.body;
        const companyId = req.companyId;

        // Validate required fields with proper type checking (FIX 5)
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!data || typeof data !== 'object' || !data.subject) {
            return res.status(400).json({ error: 'Missing required field: data.subject' });
        }

        if (typeof data.subject !== 'string' || !data.subject.trim()) {
            return res.status(400).json({ error: 'data.subject must be a non-empty string' });
        }

        // Verify user belongs to company (security check)
        const user = await User.findOne({
            companyId,
            userUID,
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        // Generate unique permissionId
        const permissionId = uuidv4();

        // Create permission with companyId isolation
        const permission = new Permission({
            companyId,
            permissionId,
            userUID,
            subject: data.subject.trim(),
            description: data.description ? data.description.trim() : '',
            revoked: false,
        });

        await permission.save();

        // Store metadata on blockchain
        try {
            const dataHash = calculateDataHash(permissionId, userUID, companyId.toString());

            const blockchainResult = await storeDataOnBlockchain(
                dataHash,
                permissionId,
                userUID
            );

            // Save blockchain transaction record
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId,
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
                    subject: data.subject.trim(),
                    description: data.description ? data.description.trim() : '',
                    operation: 'PERMISSION_STORAGE'
                }
            });

            await blockchainTx.save();

            // FIX 8: Don't expose internal companyId in response
            res.status(201).json({
                success: true,
                permissionId,
                userUID,
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status,
                    confirmations: blockchainResult.confirmations
                }
            });
        } catch (blockchainError) {
            console.error('Blockchain storage warning (permission stored in DB):', blockchainError.message);

            res.status(201).json({
                success: true,
                permissionId,
                userUID,
                blockchainError: blockchainError.message
            });
        }
    } catch (error) {
        console.error('Store permission error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'Permission record already exists for this company' });
        }

        res.status(500).json({ error: 'Failed to store permission' });
    }
};

module.exports = withCompanyVerification(handler);
