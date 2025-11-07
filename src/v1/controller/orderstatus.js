// const axios = require("axios");
// const OrderStatusModel = require("../model/orderstatus");
// const Customermodel = require("../model/customer");
// const config = require("../../../config.json");
// const debugMode = config.debugMode;

// exports.create = async (req, res) => {
//   const orderData = req.body;
//   // if(debugMode){console.log('req', req.body);}
//   // return res.status(404).json({ customercode: req.body, message: "customercode ID not found." });
//   try {
//     if (orderData.order.customerCode) {
//       const customerId = orderData.order.customerCode;
//       const customer = await Customermodel.findOne({ customer_id: customerId });
//       // if(debugMode){console.log('customer',customer);}
//       // if(debugMode){console.log('orderData.order.orderNo', orderData.order.orderNo);}

//       if (customer) {
//         if (orderData.order.orderNo == "") {
//           //Check new order or old order
//           const orderID = await generateOrderNo();
//           const uniqNoalreadyExist = await OrderModel.Order.findOne({
//             orderNo: orderID,
//           });
//           if (!uniqNoalreadyExist) {
//             orderData.order.customerCode = customer.customerCode;
//             orderData.order.uniqueKey = orderID;
//             orderData.order.orderNo = orderID;
//             if (debugMode) {
//               console.log("orderID generated: ", orderID);
//             }
//             try {
//               const orderDB = await OrderModel.Order.create(orderData.order);
//               if (debugMode) {
//                 console.log("order saved in DB", orderDB);
//               }
//             } catch (error) {
//               console.log(error);
//               return false;
//             }
//           } else {
//             if (debugMode) {
//               console.log("orderDuplicate: ", orderDuplicate);
//             }
//             //need to address this scenerio
//           }
//         } else {
//           if (debugMode) {
//             console.log("orderNo not empty");
//           }
//         }

//         // if(debugMode){console.log('after: orderData.order.orderNo', orderData.order.orderNo);}
//         // if(debugMode){console.log('customer code ', orderData.order.customerCode);}

//         try {
//           const orderNo = orderData.order.orderNo;

//           // const existingOrder = await OrderModel.findOne({ orderNo });
//           // if (existingOrder) {
//           //   await OrderModel.updateOne({ orderNo }, { $set: orderData });
//           // } else {

//           // }
//           const OrderStatus = await createOrder(orderData);

//           try {
//             const filter = { orderNo: orderNo };
//             const update = {
//               $set: {
//                 OrderStatus,
//               },
//             };
//             const orderDBupdate = await OrderModel.Order.updateOne(
//               filter,
//               update
//             );

//             if (debugMode) {
//               console.log("order updated in DB", orderDBupdate);
//             }
//           } catch (error) {
//             console.log(error);
//             return false;
//           }

//           if (OrderStatus) {
//             if (debugMode) {
//               console.log("OrderStatus: Success", OrderStatus);
//             }
//             return res.status(200).json({ OrderStatus: OrderStatus });
//           } else {
//             if (debugMode) {
//               console.log("OrderStatus fail", OrderStatus);
//             }
//             return res
//               .status(200)
//               .json({
//                 status: 0,
//                 message: "Something went wrong",
//                 OrderStatus: OrderStatus,
//               });
//           }
//         } catch (error) {
//           console.log(error);
//           return false;
//         }
//       } else {
//         return res
//           .status(404)
//           .json({ message: "Unable to identify the customer." });
//       }
//     } else {
//       return res
//         .status(404)
//         .json({ message: "customerCode Should not be empty." });
//     }

//     // if (customer) {
//     //   return res.status(200).json({ status: 1, orderid: orderID, message: "Order created successfully" });

//     // } else {
//     //   return res.status(501).json({ error: "Failed to create order" });
//     // }
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to create order" });
//   }
// };

// async function createOrder(order) {
//   //  if(debugMode){ console.log('function called', order);}
//   try {
//     const config = {
//       method: "post",
//       maxBodyLength: Infinity,
//       url: "https://Selorg.vineretail.com/RestWS/api/eretail/v1/customer/custCreate",
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/json",
//         ApiOwner: config._VINApiOwner_,
//         ApiKey: "b9eac597bbcf4a10b7ab438f7e8a2319feb22a6ebafb4322b7f6ec5",
//       },
//       data: order,
//     };
//     if (debugMode) {
//       console.log("VIN config completed");
//     }
//     try {
//       const response = await axios(config);
//       if (debugMode) {
//         console.log("response", response.data);
//       }
//       return response.data;
//       // if (response.data.responseCode === 0) {
//       //   if(debugMode){ console.log('response.data.responseCode === 0');}
//       //     try{
//       //       // if(debugMode){ console.log("updating customer code into DB:", customerCode);}
//       //       // const updatedCustomer = await Customermodel.findOneAndUpdate(
//       //       //   { customer_id: customer.customer_id },
//       //       //   { $set: { customerCode: customerCode } }
//       //       // );
//       //     } catch(error){
//       //       console.log(error);
//       //     }
//       //     return response.data;
//       // } else {
//       //   if(debugMode){ console.log("Error response received", response.data.responseCode);}
//       //   handleResponseErrors(response.data.responseCode);
//       //   return false;
//       // }
//     } catch (error) {
//       console.log(error);
//       return false;
//     }
//   } catch (error) {
//     console.error(`API Error: ${error}`);
//     return false;
//   }
// }

// // Function to generate an order number (sequence number)
// async function generateOrderNo() {
//   const min = 10000000;
//   const max = 99999999;
//   const orderNo = Math.floor(Math.random() * (max - min + 1)) + min;
//   return `SEL${orderNo}`;
// }

// function handleResponseErrors(responseCode) {
//   switch (responseCode) {
//     case 463:
//       console.error("Generic Error.");
//       break;
//     case 501:
//       console.error("No Access for given Order Location.");
//       break;
//     case 502:
//       console.error("Order Location is mandatory.");
//       break;
//     case 808:
//       console.error("Order Status mandatory for filter, Please check.");
//       break;
//     case 810:
//       console.error("Multiple Location Found in ERP for given location.");
//       break;
//     case 9006:
//       console.error("Invalid location.  ");
//       break;
//     case 9005:
//       console.error("Order Location is mandatory.");
//       break;
//     case 9007:
//       console.error("No Access for given Order Location.");
//     default:
//       console.error("Generic Error");
//   }
// }
