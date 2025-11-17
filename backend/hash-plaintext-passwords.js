require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const users = await User.find();
    console.log(`Found ${users.length} users. Scanning for plaintext passwords...`);

    let updated = 0;
    for (const user of users) {
      const pwd = user.password || '';
      // bcrypt hashes typically start with $2a$ or $2b$ or $2y$
      if (!pwd.startsWith('$2')) {
        console.log(`Hashing password for user ${user._id} (${user.email || user.contactNumber || 'no-email'})`);
        const hashed = await bcrypt.hash(pwd, 10);
        user.password = hashed;
        await user.save();
        updated++;
      }
    }

    console.log(`Done. Updated ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
