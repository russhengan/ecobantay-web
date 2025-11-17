const express = require("express");
const axios = require("axios");
const router = express.Router();
const Truck = require("../models/Truck");
const TruckRoute = require("../models/TruckRoute");

require('dotenv').config();
const apiKey = process.env.GOOGLE_API_KEY; // ✅ Load Google API Key from .env

// 📍 Fixed Start Location (Initial Position)
let truckLatitude = 14.697770397114022;
let truckLongitude = 120.96234690190866;

// 📍 Target Destination (User Location)
const targetLatitude = 14.679751;
const targetLongitude = 120.9806721;

// 📍 Movement Speed (Smaller values for smoother movement)
const moveStep = 0.0003;

// ✅ Function to move truck closer to the target
function moveTruck() {
    if (Math.abs(truckLatitude - targetLatitude) > moveStep) {
        truckLatitude += truckLatitude > targetLatitude ? -moveStep : moveStep;
    }
    if (Math.abs(truckLongitude - targetLongitude) > moveStep) {
        truckLongitude += truckLongitude > targetLongitude ? -moveStep : moveStep;
    }
}

// ✅ Snap to Roads API Function (Ensures truck follows actual roads)
async function snapToRoads(waypoints) {
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${waypoints}&interpolate=true&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        return response.data.snappedPoints;
    } catch (error) {
        console.error("❌ Error fetching snapped route:", error);
        return null;
    }
}

// ✅ Update Truck Location (Auto-Move)
router.post("/update-location", async (req, res) => {
    try {
        moveTruck();

        const waypoints = `${truckLatitude},${truckLongitude}`;

        // Call Google Snap to Roads API
        console.log("🚧 Sending GPS to Snap to Roads API:", waypoints);
        const snappedRoute = await snapToRoads(waypoints);
        console.log("🛣️ Snap to Roads Response:", snappedRoute);

        if (!snappedRoute) {
            return res.status(500).json({ error: "Failed to snap truck location to road" });
        }

        const snappedLocation = snappedRoute[0].location;
        console.log("📍 Truck snapped location:", snappedLocation);

        // Save to MongoDB
        const truckData = new Truck({
            truckId: "truck_001",
            location: { latitude: snappedLocation.latitude, longitude: snappedLocation.longitude },
            timestamp: new Date()
        });

        await truckData.save();
        console.log("✅ Truck location saved!");

        // Store Snapped Route
        const routeEntry = await TruckRoute.findOne({ truckId: "truck_001" });
        if (routeEntry) {
            routeEntry.route.push({
                lat: snappedLocation.latitude,
                lng: snappedLocation.longitude,
                timestamp: new Date()
            });
            await routeEntry.save();
        } else {
            const newRoute = new TruckRoute({
                truckId: "truck_001",
                route: [{
                    lat: snappedLocation.latitude,
                    lng: snappedLocation.longitude,
                    timestamp: new Date()
                }]
            });
            await newRoute.save();
        }

        res.json({ message: "✅ Truck is moving on the road!", location: snappedLocation });
    } catch (error) {
        console.error("❌ Error in /update-location:", error);
        res.status(500).json({ error: "Error updating truck location" });
    }
});

// ✅ Fetch Latest Truck Location
router.get("/latest/:truckId", async (req, res) => {
    try {
        const { truckId } = req.params;
        const latestLocation = await Truck.findOne({ truckId }).sort({ timestamp: -1 });

        if (!latestLocation) {
            return res.status(404).json({ error: "No location data found" });
        }

        res.json(latestLocation);
    } catch (error) {
        console.error("❌ Error in /latest/:truckId:", error);
        res.status(500).json({ error: "Error fetching truck location" });
    }
});

// ✅ Fetch Stored Truck Route (Snapped Points)
router.get("/get-truck-route/:truckId", async (req, res) => {
    try {
        const { truckId } = req.params;
        console.log("🔍 Fetching route for truckId:", truckId); // Debugging log

        const truckRoute = await TruckRoute.findOne({ truckId });

        if (!truckRoute) {
            console.log("❌ Route not found in database for truckId:", truckId);
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({ snappedRoute: truckRoute.route });
    } catch (error) {
        console.error("❌ Error in /get-truck-route:", error);
        res.status(500).json({ error: "Error fetching truck route" });
    }
});

// -------------------------
// Route Management (CRUD)
// -------------------------

// Create a new saved route
router.post('/routes', async (req, res) => {
    try {
        const { name, route, encodedPolyline, createdBy } = req.body;
        if (!route || !Array.isArray(route) || route.length === 0) {
            return res.status(400).json({ error: 'Route must be a non-empty array of points' });
        }

        const newRoute = new TruckRoute({
            name: name || 'Unnamed Route',
            route: route.map(p => ({ lat: p.latitude ?? p.lat, lng: p.longitude ?? p.lng, timestamp: p.timestamp })),
            encodedPolyline: encodedPolyline || null,
            createdBy: createdBy || null
        });

        await newRoute.save();
        res.json({ success: true, route: newRoute });
    } catch (err) {
        console.error('❌ Error creating route:', err);
        res.status(500).json({ error: 'Server error creating route' });
    }
});

// Get list of saved routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await TruckRoute.find().sort({ createdAt: -1 }).limit(200);
        res.json({ routes });
    } catch (err) {
        console.error('❌ Error fetching routes:', err);
        res.status(500).json({ error: 'Server error fetching routes' });
    }
});

// Get single route by id
router.get('/routes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const route = await TruckRoute.findById(id);
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json({ route });
    } catch (err) {
        console.error('❌ Error fetching route:', err);
        res.status(500).json({ error: 'Server error fetching route' });
    }
});

// Update route (edit points or name)
router.put('/routes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, route, encodedPolyline, truckId } = req.body;

        const existing = await TruckRoute.findById(id);
        if (!existing) return res.status(404).json({ error: 'Route not found' });

        if (name !== undefined) existing.name = name;
        if (route !== undefined && Array.isArray(route)) {
            existing.route = route.map(p => ({ lat: p.latitude ?? p.lat, lng: p.longitude ?? p.lng, timestamp: p.timestamp }));
        }
        if (encodedPolyline !== undefined) existing.encodedPolyline = encodedPolyline;
        if (truckId !== undefined) existing.truckId = truckId;

        await existing.save();
        res.json({ success: true, route: existing });
    } catch (err) {
        console.error('❌ Error updating route:', err);
        res.status(500).json({ error: 'Server error updating route' });
    }
});

// Delete route
router.delete('/routes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await TruckRoute.findByIdAndDelete(id);
        if (!removed) return res.status(404).json({ error: 'Route not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error deleting route:', err);
        res.status(500).json({ error: 'Server error deleting route' });
    }
});

// Assign route to a truck
router.post('/routes/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { truckId } = req.body;
        if (!truckId) return res.status(400).json({ error: 'truckId is required' });

        const route = await TruckRoute.findById(id);
        if (!route) return res.status(404).json({ error: 'Route not found' });

        route.truckId = truckId;
        await route.save();
        res.json({ success: true, route });
    } catch (err) {
        console.error('❌ Error assigning route:', err);
        res.status(500).json({ error: 'Server error assigning route' });
    }
});

module.exports = router;
