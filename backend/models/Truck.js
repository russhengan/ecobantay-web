const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
    truckId: { type: String, required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Truck', truckSchema);
