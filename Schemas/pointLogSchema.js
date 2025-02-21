const mongoose = require('mongoose');

const PointLogSchema = new mongoose.Schema({
    to_discord_id: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
    from_discord_id: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
    points: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
    reason: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true
    }
});

module.exports = mongoose.model("PointLog", PointLogSchema);
