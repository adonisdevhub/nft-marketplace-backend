const Offer = require('../models/offer');
// Make and edit buyer's offer
const makeOffer = async (req, res, next) => {
    let _id = req.query._id;
    let offerInfo = {
        buyer: req.query.buyer,
        price: req.query.price,
        created_at: new Date(),
        expirate: req.query.expirate
    };

    Offer.findOne({ character: _id })
         .then(offer => {
            if (offer) {
                let exist = false;
                let index;
                offer.offers.map((item, i) => {
                    if (item.buyer == offerInfo.buyer) {
                        exist = true;
                        index = i;
                    }
                });

                if (exist) {
                    offer.offers.splice(index, 1);
                    if (offer.offers.length > 0) {
                        offer.offers.push(offerInfo);
                    } else {
                        offer.offers = offerInfo;
                    }
                    offer.save()
                             .then(res.status(200).json({ message: "Offer updated!" }))
                             .catch(e => {
                                console.log(e);
                                next();
                             })
                } else {
                    offer.offers.push(offerInfo);
                    offer.save()
                         .then(res.status(201).json({ message: "Offer created!"}))
                         .catch(e => {
                            console.log(e);
                            next();
                         })
                }
            } else {
                let newOffer = new Offer({
                    character: _id,
                    offers: offerInfo
                });
                newOffer.save()
                        .then(res.status(200).json({ message: "Offer sent!" }))
                        .catch(e => {
                            console.log(e);
                            next();
                        });
            }
        })
         .catch(e => console.log(e))
}
// Update offers when NFT sold by someone.
const updateOffers = async (req, res, next) => {
    let _id = req.query._id;
    let buyer = req.query.buyer;
    Offer.findOne({ character: _id })
         .then(offer => {
            if (offer) {
                let index;
                offer.offers.map((item, i) => {
                    if (item.buyer == buyer) {
                        index = i;
                    }
                });
                offer.offers.splice(index, 1);
                offer.save()
                    .then(res.status(200).json({ message: "Total updated!" }))
                    .catch(e => {
                        console.log(e);
                        next();
                    });
            } else {
                res.status(200).json({ message: "Total updated!" });
            }
         })
         .catch(e => {
            console.log(e);
         })
}

module.exports = { makeOffer, updateOffers };