const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
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
        },
        email: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt, updatedAt
    }
);

// Compound unique index to prevent duplicate users per company
userSchema.index({ companyId: 1, userUID: 1 }, { unique: true });
userSchema.index({ companyId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
