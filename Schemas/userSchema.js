const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discord_id: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
    points: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    }
})

module.exports = mongoose.model("User", UserSchema);