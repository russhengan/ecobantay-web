const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date }
}, { _id: false });

const TruckRouteSchema = new mongoose.Schema({
    name: { type: String, required: false },
    truckId: { type: String, required: false }, // optional assigned truck
    createdBy: { type: String, required: false },
    route: { type: [PointSchema], default: [] },
    encodedPolyline: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model('TruckRoute', TruckRouteSchema);