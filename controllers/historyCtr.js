const History = require('../models/history');

// Get overall status
const getOverallStatus = async (req, res, next) => {
    let overall = [];

    for (i=0; i<30; i++) {
        let edate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        let sdate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);

        let overone = await History.aggregate([
            {
                $match: {
                    'history.sold_at': {
                        $lt: edate,
                        $gte: sdate
                    }
                }
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
                $project: {
                    'character.cname': 1,
                    fitHistory: {
                        $cond: {
                            if: { $gt: [ { $size: "$history" }, 0 ] },
                            then: {
                                $filter: {
                                    input: "$history",
                                    as: "item",
                                    cond: {
                                        $and: [
                                            { $lt: ["$$item.sold_at", edate] },
                                            { $gte: ["$$item.sold_at", sdate] }
                                        ]
                                    }
                                }
                            },
                            else: []
                        }
                    }
                }
            }
        ]).exec();

        let apeCnt = 0; // Can add another collection name below
        let salesCnt = 0;
        let totalPrice = 0;

        if (overone.length > 0) {
            overone.map((e, j) => {
                if (e.character.length > 0) {
                    if (e.character[0].cname == 'Ape') {
                        apeCnt++;
                    } // If collection name is other, increase another collection name's count
                }

                salesCnt += e.fitHistory.length;
                e.fitHistory.map((el, k) => {
                    totalPrice += el.price;

                    if (j == (overone.length - 1) && k == (e.fitHistory.length - 1)) {
                        overall[i] = {
                            apeCnt: apeCnt,
                            salesCnt: salesCnt,
                            totalPrice: totalPrice
                        }
                    }
                });
            });
        } else {
            overall[i] = {
                apeCnt: 0,
                salesCnt: 0,
                totalPrice: 0
            }
        }
    }

    overall.reverse();

    Promise.all(overall).then(result => {
        res.status(200).json(result);
    }).catch(e => {
        console.log(e);
        next();
    })
}

// Get top price sold NFTs
const getTopSales = async (req, res, next) => {
    let limit = req.query.day * 24 * 60 * 60 * 1000;
    await History.aggregate([
        {
            $match: {
                'history.sold_at': {
                    $gte: new Date(Date.now() - limit)
                }
            }
        },
        {
            $project: {
                character: 1,
                tmpHistory: {
                    $filter: {
                        input: "$history",
                        as: "item",
                        cond: {
                            $and: [
                                { $eq: ["$$item.price", { $max: "$history.price" }] },
                                { $gte: ["$$item.sold_at", new Date(Date.now() - limit)] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                tmpHistory: {
                    $ne: []
                }
            }
        },
        {
            $project: {
                character: 1,
                maxHistory: {
                    $filter: {
                        input: "$tmpHistory",
                        as: "item",
                        cond: {
                            $eq: ["$$item.sold_at", { $max: "$tmpHistory.sold_at" }]
                        }
                    }
                }
            }
        },
        {
            $unwind: '$maxHistory'
        },
        {
            $sort: {
                "maxHistory.price": -1
            }
        },
        {
            $limit: 10 // Change counts to display
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
        }
    ]).then(result => {
        res.json(result);
    }).catch(e => {
        console.log(e);
        next();
    });
}
// Get recent sold NFTs
const getRecentSales = async (req, res, next) => {
    let limit = 24 * 60 * 10 * 60 * 1000;
    await History.aggregate([
        {
            $match: {
                'history.sold_at': {
                    $gte: new Date(Date.now() - limit)
                }
            }
        },
        {
            $project: {
                character: 1,
                lastHistory: {
                    $slice: ['$history', -1]
                }
            }
        },
        {
            $sort: {
                "lastHistory.sold_at": -1
            }
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
            $unwind: '$offers'
        }
    ]).then(result => {
        res.json(result);
    }).catch(e => {
        console.log(e);
        next();
    });
}
// Update histories when NFT sold by someone.
const updateHistories = async (_id, seller, buyer, price) => {
    let historyInfo = {
        seller: seller,
        buyer: buyer,
        price: parseFloat(price),
        sold_at: new Date()
    }
    await History.findOne({ character: _id })
                 .then(item => {
                    if (item) {
                        item.history.push(historyInfo);
                        item.save()
                            .then(() => { return true; })
                            .catch(() => { return false; });
                    } else {
                        let newHistory = new History({
                            character: _id,
                            history: historyInfo
                        });
                        newHistory.save()
                                  .then(() => { return true; })
                                  .catch(() => { return false; });
                    }
                 })
                 .catch(() => {
                    return false;
                 });
}

module.exports = { getOverallStatus, getTopSales, getRecentSales, updateHistories };