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
    temperature: [Number],
    humidity: Number,
    soil_type: String,
    predictions: [{
        crop: { type: String, required: true },
        probability: Number,
        season: String,
        duration: String,
        water_needs: String
    }],
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

const History = mongoose.model('History', historySchema);

module.exports = History;