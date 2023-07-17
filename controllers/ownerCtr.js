const Character = require('../models/character');
const Offer = require('../models/offer');

// Controllers
const listCtr = require('./listCtr');
const offerCtr = require('./offerCtr');
const historyCtr = require('./historyCtr');

// Get owner's NFT list
const getOwnerNFT = async (req, res, next) => {
    let owner = req.query.owner;
    let cname = req.query.cname;
    let fsale = req.query.fsale;
    let nsale = req.query.nsale;

    let findParam;
    if ((fsale && nsale) || (!(fsale || nsale))) {
        findParam = {
            owner: owner,
            cname: cname
        }
    } else {
        findParam = {
            owner: owner,
            cname: cname,
            listed: fsale
        }
    }

    await Character.aggregate([
        {
            $match: findParam
        },
        {
            $sort: {
                _id: 1
            }
        },
        {
            $lookup: {
                from: 'listings',
                localField: '_id',
                foreignField: 'character',
                as: 'listing'
            }
        },
        {
            $lookup: {
                from: 'offers',
                localField: '_id',
                foreignField: 'character',
                as: 'offers'
            }
        },
        {
            $lookup: {
                from: 'histories',
                localField: '_id',
                foreignField: 'character',
                as: 'histories'
            }
        }
    ]).then(result => {
        res.json(result);
    }).catch(e => {
        console.log(e);
        next();
    });
}
// Shows all offers sent by buyers
const getReceivedOffers = async (req, res, next) => {
    let owner = req.query.owner;
    let cname = req.query.cname;
    let cfilter;

    if (cname == 'all') {
        cfilter = {
            owner: owner
        }
    } else {
        cfilter = {
            owner: owner,
            cname: cname
        }
    }

    await Character.aggregate([
        {
            $match: cfilter
        },
        {
            $lookup: {
                from: 'offers',
                localField: '_id',
                foreignField: 'character',
                as: 'offers'
            }
        },
        {
            $match: {
                'offers': {
                    $ne: []
                }
            }
        },
        {
            $unwind: '$offers'
        },
        {
            $project: {
                _id: 1,
                owner: 1,
                cname: 1,
                fname: 1,
                name: 1,
                image: 1,
                attributes: 1,
                listed: 1,
                offers: 1,
                maxOffer: {
                    $filter: {
                        input: "$offers.offers",
                        as: "item",
                        cond: { $eq: ["$$item.price", { $max: "$offers.offers.price" }] }
                    }
                }
            }
        },
        {
            $unwind: '$maxOffer'
        }
    ]).then(result => {
        res.status(200).json(result);
    }).catch(e => {
        console.log(e);
        next();
    });
}
// Shows all offers owner sent
const getSentOffers = async (req, res, next) => {
    let owner = req.query.owner;
    let cname = req.query.cname;
    let sname = req.query.sname; // sort name
    let flag = req.query.flag;
    let cfilter;
    let sfilter;

    if (cname == 'all') {
        cfilter = {
            'offers.buyer': owner,
        }
    } else {
        cfilter = {
            'offers.buyer': owner,
            cname: cname
        }
    }

    if (sname == 'price') {
        sfilter = {
            'offer.price': flag
        }
    } else {
        sfilter = {
            'offer.expirate': flag
        }
    }

    await Offer.aggregate([
        {
            $match: cfilter
        },
        {
            $project: {
                _id: 1,
                character: 1,
                offer: {
                    $filter: {
                        input: "$offers",
                        as: "item",
                        cond: { $eq: ["$$item.buyer", owner] }
                    }
                }
            }
        },
        {
            $unwind: '$offer'
        },
        {
            $sort: sfilter
        }
    ]).then(result => {
        res.status(200).json(result);
    }).catch(e => {
        console.log(e);
        next();
    })
}
// Update owner of NFT when it is sold
const updateOwner = async (_id, newOwner ) => {
    try {
        await Character.findByIdAndUpdate(_id, { $set: { owner: newOwner, listed: false } });
        return true;
    } catch (e) {
        return false;
    }
}

const successfulDeal = async (req, res, next) => {
    let _id = req.query._id;
    let seller = req.query.seller;
    let buyer = req.query.buyer;
    let price = req.query.price;
    
    if (updateOwner(_id, buyer)) {
        if (historyCtr.updateHistories(_id, seller, buyer, price)) {
            if (listCtr.updateList(_id)) {
                offerCtr.updateOffers(req, res, next);
            } else {
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
}

module.exports = { getOwnerNFT, getReceivedOffers, getSentOffers, successfulDeal };