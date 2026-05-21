const Permission = require('../../models/Permission');
const BlockchainTransaction = require('../../models/BlockchainTransaction');
const { storeDataOnBlockchain, calculateDataHash } = require('../../lib/blockchain');
const { withCompanyVerification } = require('../../middleware/withCompanyVerification');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userUID, permissionId } = req.body;
        const companyId = req.companyId;

        // Validate required fields
        if (!userUID || typeof userUID !== 'string' || !userUID.trim()) {
            return res.status(400).json({ error: 'Missing required field: userUID' });
        }

        if (!permissionId || typeof permissionId !== 'string' || !permissionId.trim()) {
            return res.status(400).json({ error: 'Missing required field: permissionId' });
        }

        // Find with companyId isolation (FIX 7: Using .findOne with companyId)
        const permission = await Permission.findOne({
            companyId,
            userUID,
        });

        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        // Revoke the permission
        permission.revoked = true;
        permission.revokedAt = new Date();
        await permission.save();

        // Store revocation metadata on blockchain
        try {
            const dataHash = calculateDataHash(permissionId, userUID, companyId.toString());

            const blockchainResult = await storeDataOnBlockchain(
                dataHash,
                permissionId,
                userUID
            );

            // Save blockchain revocation record
            const blockchainTx = new BlockchainTransaction({
                companyId,
                userUID,
                permissionId,
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
                    operation: 'PERMISSION_REVOCATION',
                    revokedAt: new Date().toISOString()
                }
            });

            await blockchainTx.save();

            // FIX 8: Don't expose companyId in response
            res.json({
                success: true,
                message: 'Permission revoked successfully',
                blockchain: {
                    transactionHash: blockchainResult.transactionHash,
                    status: blockchainResult.status
                }
            });
        } catch (blockchainError) {
            console.error('Blockchain revocation warning:', blockchainError.message);

            res.json({
                success: true,
                message: 'Permission revoked successfully',
                blockchainError: blockchainError.message
            });
        }
    } catch (error) {
        console.error('Revoke permission error:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
};

module.exports = withCompanyVerification(handler);
