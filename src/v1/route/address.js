const express = require('express');
const router = express.Router();
const addressController = require('../controller/address');
router.post('/add', addressController.addAddress);
router.put('/edit', addressController.editAddress);
router.put('/setdefault', addressController.setDefaultAddress);
router.delete('/delete', addressController.deleteAddress);
router.get('/address-detail', addressController.getAddressByAddressId);
router.get('/get-all-address', addressController.getAddressesByCustomerId);

module.exports = router;
