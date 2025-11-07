const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderStatusSchema = new Schema({
//     orderNo: String,
//   uniqueKey: String,
//   // Other order fields as per your requirements
//   orderLocation: String,
//   // ... (add other fields)

}, { strict: false });
const OrderStatus = mongoose.model('OrderStatus', orderStatusSchema, 'orderstatus');

module.exports = { OrderStatus };