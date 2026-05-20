const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    dataId: {
        type: String,
        required: true,
        unique: true,
    },
    userUID: {
        type: String,
        required: true,
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

module.exports = mongoose.model('Data', dataSchema);
