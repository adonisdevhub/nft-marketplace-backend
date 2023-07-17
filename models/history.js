const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    character: { type: mongoose.Schema.Types.ObjectId, ref: 'characters', required: true },
    history: { type: Array }
    /*
        {
            seller: { type: String, required: true },
            buyer: { type: String, required: true },
            price: { type: Number, required: true },
            sold_at: { type: Date, required: true }
        }
    */
});

module.exports = mongoose.model("histories", historySchema);