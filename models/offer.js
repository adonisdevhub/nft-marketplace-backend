const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    character: { type: mongoose.Schema.Types.ObjectId, ref: 'characters', required: true },
    offers: { type: Array }
    /*
        {
            buyer: { type: String, required: true },
            price: { type: Number, required: true },
            created_at: { type: Date, required: true },
            expirate: { type: Number? Date, required: true }
        }
    */
});

module.exports = mongoose.model("offers", offerSchema);