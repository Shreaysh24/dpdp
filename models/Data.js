const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema(
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
        type: {
            type: String,
            enum: ['email', 'phone', 'address'],
            required: true,
        },
        value: {
            type: String,
            required: true,
            validate: {
                validator: (v) => typeof v === 'string' && v.trim().length > 0,
                message: 'Value must be a non-empty string',
            },
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

// Compound index on company and userUID for efficient queries
dataSchema.index({ companyId: 1, userUID: 1 });

module.exports = mongoose.model('Data', dataSchema);
