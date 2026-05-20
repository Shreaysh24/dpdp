const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
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
        revoked: {
            type: Boolean,
            default: false,
        },
        revokedAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt, updatedAt
    }
);

// Compound unique index to prevent duplicate permission records per company
permissionSchema.index({ companyId: 1, permissionId: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
