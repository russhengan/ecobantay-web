const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const router = express.Router();

const SECRET_KEY = process.env.QR_SECRET_KEY;

// Encrypt Data
const encryptData = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

// Generate QR Code
router.post('/generate', async (req, res) => {
    const { timestamp, truckNumber, location } = req.body;

    // Concatenate data with delimiters
    const payload = `${timestamp}|${truckNumber}|${location}`;

    // Encrypt the payload
    const encryptedData = encryptData(payload);

    try {
        // Generate the full validation URL for the QR
        const validationUrl = `http://ecobantay-backend.onrender.com/api/qr/validate?data=${encryptedData}`;

        // Generate the QR Code with the URL embedded
        const qrCodeDataUrl = await QRCode.toDataURL(validationUrl);

        // Return the Data URL
        res.status(200).json({
            message: 'QR Code Generated Successfully',
            qrCodeUrl: qrCodeDataUrl,
            validationUrl
        });
    } catch (error) {
        console.error('❌ Error generating QR Code:', error.message);
        res.status(500).json({ message: 'Failed to generate QR Code' });
    }
});

module.exports = router;
