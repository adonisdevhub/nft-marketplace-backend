const express = require('express');
const router = express.Router();

const listCtr = require('../controllers/listCtr');
const offerCtr = require('../controllers/offerCtr');
const historyCtr = require('../controllers/historyCtr');
const ownerCtr = require('../controllers/ownerCtr');

// Global requests
router.post('/overall', historyCtr.getOverallStatus);
router.post('/lists', listCtr.getList);
router.post('/topsales', historyCtr.getTopSales);
router.post('/recentsales', historyCtr.getRecentSales);

// Show NFTs according to collection name
router.post('/collection', listCtr.getListByCollection);

// User requests
router.post('/makelist', listCtr.makeList);
router.post('/makeoffer', offerCtr.makeOffer);
router.post('/agreedeal', ownerCtr.successfulDeal);

// User Dashboard
router.post('/user/inventory', ownerCtr.getOwnerNFT);
router.post('/user/received', ownerCtr.getReceivedOffers);
router.post('/user/sent', ownerCtr.getSentOffers);

module.exports = router;