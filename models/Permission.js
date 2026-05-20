const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    companyId: {
        type: String,
        required: true,
        index: true,
    },
    permissionId: {
        type: String,
        required: true,
    },
    userUID: {
        type: String,
        required: true,
        index: true,
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

// Compound unique index to prevent duplicate permission records per company
permissionSchema.index({ companyId: 1, permissionId: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
