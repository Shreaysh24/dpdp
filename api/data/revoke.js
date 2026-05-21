const Data = require('../../models/Data');
const BlockchainTransaction = require('../../models/BlockchainTransaction');
const { storeDataOnBlockchain, calculateDataHash } = require('../../lib/blockchain');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, dataId } = req.body;
        const companyId = req.companyId;

        // Validate required fields
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!dataId || typeof dataId !== 'string' || !dataId.trim()) {
            return res.status(400).json({ error: 'Missing required field: dataId' });
        }

        // Find with companyId isolation (FIX 7: Using .findOne with companyId)
        const dataRecord = await Data.findOne({
            companyId,
            userUID,
        });

        if (!dataRecord) {
            return res.status(404).json({ error: 'Data record not found' });
        }

        // Revoke the data
        dataRecord.revoked = true;
        dataRecord.revokedAt = new Date();
        await dataRecord.save();

        // Store revocation metadata on blockchain
        try {
            const dataHash = calculateDataHash(dataId, userUID, companyId.toString());

            const blockchainResult = await storeDataOnBlockchain(
                dataHash,
                dataId,
                userUID
            );

            // Save blockchain revocation record
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
                metadata: {
                    operation: 'DATA_REVOCATION',
                    revokedAt: new Date().toISOString()
                }
            });

            await blockchainTx.save();

            // FIX 8: Don't expose companyId in response
            res.json({
                success: true,
                message: 'Data revoked successfully',
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status
                }
            });
        } catch (blockchainError) {
            console.error('Blockchain revocation warning:', blockchainError.message);

            res.json({
                success: true,
                message: 'Data revoked successfully',
                blockchainError: blockchainError.message
            });
        }
    } catch (error) {
        console.error('Revoke data error:', error);
        res.status(500).json({ error: 'Failed to revoke data' });
    }
};

module.exports = withCompanyVerification(handler);