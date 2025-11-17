const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/send-sms", async (req, res) => {
  const { number, message } = req.body;
  const apiKey = process.env.PHILSMS_API_KEY;

  
  // ✅ Development fallback (skip sending if not in production)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV SMS] Simulated SMS → ${number}: ${message}`);
    return res.json({ success: true, dev: true, simulated: true });
  }

  try {
    const response = await axios.post(
      "https://app.philsms.com/api/v1/send",
      {
        number,
        message,
        sendername: "EcoBantay", // optional
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("❌ SMS Send Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
