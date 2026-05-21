const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getTransactionStatus } = require('../lib/blockchain');
const { connectDB } = require('../lib/mongodb');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        // Get stored blockchain transaction
        const storedTx = await BlockchainTransaction.findOne(query);

        if (!storedTx) {
            return res.status(404).json({ error: 'Transaction not found in database' });
        }

        // Get current status from blockchain
        const currentStatus = await getTransactionStatus(storedTx.transactionHash);

        // Update stored record if needed
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
};

module.exports = handler;
