const mongoose = require('mongoose');

const blockchainTransactionSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true,
        },
        userUID: {
            type: String,
            required: true,
            index: true,
        },
        permissionId: {
            type: String,
            required: true,
        },
        dataHash: {
            type: String,
            required: true,
        },
        operationType: {
            type: String,
            enum: ['STORE', 'REVOKE', 'UPDATE', 'TRANSFER'],
            default: 'STORE',
        },
        transactionHash: {
            type: String,
            required: true,
            unique: true,
        },
        blockNumber: {
            type: Number,
        },
        gasUsed: {
            type: String,
        },
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'FAILED'],
            default: 'PENDING',
        },
        contractAddress: {
            type: String,
            required: true,
        },
        from: {
            type: String,
            required: true,
        },
        confirmations: {
            type: Number,
            default: 0,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
blockchainTransactionSchema.index({ companyId: 1, userUID: 1, createdAt: -1 });
// Note: transactionHash already has index via unique: true
blockchainTransactionSchema.index({ permissionId: 1 });

module.exports = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);
