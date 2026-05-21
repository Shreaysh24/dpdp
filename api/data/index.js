const { v4: uuidv4 } = require('uuid');
const Data = require('../../models/Data');
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

        if (!data || typeof data !== 'object' || !data.type || !data.value) {
            return res.status(400).json({ error: 'Missing required fields: data.type, data.value' });
        }

        if (typeof data.value !== 'string' || !data.value.trim()) {
            return res.status(400).json({ error: 'data.value must be a non-empty string' });
        }

        // Verify user belongs to company (security check)
        const user = await User.findOne({
            companyId,
            userUID
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in company' });
        }

        // Generate unique dataId
        const dataId = uuidv4();

        // Create data record with companyId isolation
        const dataRecord = new Data({
            companyId,
            userUID,
            type: data.type,
            value: data.value.trim(),
            revoked: false,
        });

        await dataRecord.save();

        // Store metadata on blockchain
        try {
            const dataHash = calculateDataHash(dataRecord._id.toString(), userUID, companyId.toString());

            const blockchainResult = await storeDataOnBlockchain(
                dataHash,
                dataRecord._id.toString(),
                userUID
            );

            // Save blockchain transaction record
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId: dataRecord._id.toString(),
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
                    dataType: data.type,
                    dataValue: data.value.trim(),
                    operation: 'DATA_STORAGE'
                }
            });

            await blockchainTx.save();

            // FIX 8: Don't expose internal companyId in response
            res.status(201).json({
                success: true,
                dataId,
                userUID,
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status,
                    confirmations: blockchainResult.confirmations
                }
            });
        } catch (blockchainError) {
            console.error('Blockchain storage warning (data stored in DB):', blockchainError.message);

            res.status(201).json({
                success: true,
                dataId,
                userUID,
                blockchainError: blockchainError.message
            });
        }
    } catch (error) {
        console.error('Store data error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'Data record already exists for this company' });
        }

        res.status(500).json({ error: 'Failed to store data' });
    }
};

module.exports = withCompanyVerification(handler);
