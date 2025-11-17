const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CleanPointsSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  clean_points: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CleanPoints', CleanPointsSchema);
