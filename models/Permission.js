const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    permissionId: {
        type: String,
        required: true,
        unique: true,
    },
    userUID: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
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

module.exports = mongoose.model('Permission', permissionSchema);
