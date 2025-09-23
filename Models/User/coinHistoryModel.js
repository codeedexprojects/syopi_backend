const mongoose = require('mongoose');

const coinHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referenceType: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    balanceAfter: { type: Number, required: true }

}, { timestamps: true });

module.exports = mongoose.model('CoinHistory', coinHistorySchema);
