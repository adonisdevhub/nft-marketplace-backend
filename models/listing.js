const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    character: { type: mongoose.Schema.Types.ObjectId, ref: 'characters', required: true },
    price: { type: Number, required: true },
    created_at: { type: Date, required: true }
});

module.exports = mongoose.model("listings", listingSchema);