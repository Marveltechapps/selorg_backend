const express = require('express');
const orderController = require('../controller/order');
const authToken = require("../auths/auth");
const router = express.Router();

 router.post('/create', orderController.create);
 router.post('/getorder', orderController.getorder);
 router.post('/getcustomerorder', orderController.getcustomerorder);
 router.post('/orderStatus', orderController.orderStatus);
 router.post('/neworder', orderController.neworder);
 
module.exports = router;
