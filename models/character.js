const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    owner: { type: String, required: true }, // owner's wallet address
    cname: { type: String, required: true }, // collection name
    fname: { type: Number, required: true }, // file name
    name: { type: String, required: true }, // character's name
    image: { type: String, required: true }, // IPFS path for character
    attributes: { type: Array, required: true },
    /*
        {
            trait_type: { type: String, required: true },
            value: { type: String, required: true }
        }
    */
    listed: { type: Boolean, required: true, default: false },
    created_at: { type: Date, required: true, default: new Date()}
});

module.exports = mongoose.model("characters", characterSchema);