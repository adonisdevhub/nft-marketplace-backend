const Character = require('../models/character');
const Listing = require('../models/listing');

const makeList = async (req, res, next) => {
    let fname = parseInt(req.query.fname);
    let price = parseFloat(req.query.price);
    Character.findOne({ fname: fname })
             .then(nft => {
                if (nft) {
                    Listing.findOne({character: nft._id})
                           .then(list => {
                                if (list) {
                                    list.price = price;
                                    list.save()
                                        .then(res.status(200).json({ message: "NFT price updated!" }))
                                        .catch(e => {
                                            console.log(e);
                                            next();
                                        });
                                } else {
                                    let newListing = new Listing({
                                        character: nft._id,
                                        price: price,
                                        created_at: new Date()
                                    });
                                    newListing.save()
                                                .then(() => {
                                                nft.listed = true;
                                                nft.save()
                                                    .then(res.status(200).json({ message: "NFT listed!" }))
                                                    .catch(e => {
                                                        console.log(e);
                                                        next();
                                                    });
                                                })
                                                .catch(e => {
                                                console.log(e);
                                                next();
                                                });
                                }
                           })
                           .catch(e => {
                                console.log(e);
                                next();
                           });
                } else {
                    res.status(204).json({ message: "Can not find NFT" });
                }
             })
             .catch(e => {
                console.log(e);
                next();
             });
}
// Get all recent lists
const getList = async (req, res, next) => {
    const limit = 10 * 24 * 60 * 60 * 1000; // To get the all NFTs listed in 3 minutes
    await Listing.aggregate([
        {
            $match: {
                created_at: {
                    $gte: new Date(Date.now() - limit)
                }
            }
        },
        {
            $sort: {
                created_at: -1
            }
        },
        {
            $limit: 1 // limit NFT counts to display
        },
        {
            $lookup: {
                from: 'characters',
                localField: 'character',
                foreignField: '_id',
                as: 'character'
            }
        },
        {
            $unwind: '$character'
        },
        {
            $lookup: {
                from: 'offers',
                localField: 'character._id',
                foreignField: 'character',
                as: 'offers'
            }
        },
        {
            $lookup: {
                from: 'histories',
                localField: 'character._id',
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

// Get NFTs by collection name
const getListByCollection = async (req, res, next) => {
    let cname = req.query.cname; // collection name
    let sname = req.query.sname; // sort name
    let flag = req.query.flag ? 1: -1; // sort flag. ASC or DEC
    let nsale = req.query.nsale; // for not sale flag
    let fsale = req.query.fsale; // for sale flag
    let pageNum = req.query.pageNum;
    let cnt = req.query.cnt;

    let mfilter;
    if ((fsale && nsale) || (!(fsale || nsale))) {
        mfilter = {
            cname: cname
        }
    } else {
        mfilter = {
            cname: cname,
            listed: fsale
        }
    }

    let sfilter;
    if (sname == 'id') {
        sfilter = {
            fname: flag
        }
    } else if (sname == 'price') {
        sfilter = {
            fprice: flag
        }
    } else {
        sfilter = {
            sdate: -1
        }
    }

    await Character.aggregate([
        {
            $match: mfilter
        },
        {
            $facet: {
                count: [
                    {
                        $count: 'count'
                    }
                ],
                characters: [
                    {
                        $lookup: {
                            from: 'listings',
                            localField: '_id',
                            foreignField: 'character',
                            as: 'listings'
                        }
                    },
                    {
                        $lookup: {
                            from: 'histories',
                            localField: '_id',
                            foreignField: 'character',
                            as: 'histories'
                        }
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
                            created_at: 1,
                            'listings': 1,
                            'histories': 1,
                            fprice: {
                                $cond: {
                                    if: "$listed",
                                    then: { $arrayElemAt: ["$listings.price", 0] },
                                    else: {
                                        $cond: {
                                            if: { $gt: [ { $size: "$histories" }, 0 ] },
                                            then: {
                                                    $arrayElemAt: [{ $arrayElemAt: ["$histories.history.price", -1]}, -1],
                                            },
                                            else: 0
                                        }
                                    }
                                }
                            },
                            sdate: {
                                $cond: {
                                    if: "$listed",
                                    then: { $arrayElemAt: ["$listings.created_at", 0] },
                                    else: {
                                        $cond: {
                                            if: { $gt: [ { $size: "$histories" }, 0 ] },
                                            then: {
                                                    $arrayElemAt: [{ $arrayElemAt: ["$histories.history.sold_at", -1]}, -1],
                                            },
                                            else: '$created_at'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $sort: sfilter
                    },
                    {
                        $skip: cnt * (pageNum - 1)
                    },
                    {
                        $limit: cnt
                    }
                ]
            }
        }
    ]).then(result => {
        res.status(200).json(result);
    }).catch(e => {
        console.log(e);
        next();
    });
}

// Remove list when NFT sold by someone
const updateList = async (_id) => {
    try {
        await Listing.findOneAndRemove({ character: _id });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = { makeList, getList, updateList, getListByCollection };