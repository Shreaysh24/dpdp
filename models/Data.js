const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        index: true,
    },
    dataId: {
        type: String,
        required: true,
    },
    userUID: {
        type: String,
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['email', 'phone', 'address'],
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    revoked: {
        type: Boolean,
        default: false,
    },
    revokedAt: {
        type: Date,
    },
});

// Compound unique index to prevent duplicate data records per company
dataSchema.index({ companyId: 1, dataId: 1 }, { unique: true });

module.exports = mongoose.model('Data', dataSchema);
