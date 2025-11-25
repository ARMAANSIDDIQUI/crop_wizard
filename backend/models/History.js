const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number,
    rainfall: Number,
    temperature: Number,
    predicted_crop: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

const History = mongoose.model('History', historySchema);

module.exports = History;