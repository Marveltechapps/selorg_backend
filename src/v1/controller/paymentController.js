const Payment = require("../model/paymentModel");
const axios = require("axios");

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_MERCHANT_KEY = process.env.PHONEPE_MERCHANT_KEY;
const PHONEPE_API_URL = "https://api.phonepe.com/v3/transaction/initiate";

exports.processPayment = async (req, res) => {
  const { amount } = req.body;

  try {
    const response = await axios.post(
      PHONEPE_API_URL,
      {
        merchantId: PHONEPE_MERCHANT_ID,
        amount,
        merchantTransactionId: `txn_${Date.now()}`,
        merchantUserId: "user_id",
        redirectUrl: "https://yourredirecturl.com/callback",
        callbackUrl: "https://yourcallbackurl.com/callback",
        paymentMethod: "UPI",
        deviceId: "device_id",
        storeId: "store_id",
        terminalId: "terminal_id"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": `${PHONEPE_MERCHANT_KEY}`,
          "X-CALLBACK-URL": "https://yourcallbackurl.com/callback"
        }
      }
    );

    const { transactionId, status } = response.data;

    const newPayment = new Payment({
      amount,
      status,
      transactionId
    });

    await newPayment.save();

    res.status(200).json({ transactionId, status });
  } catch (error) {
    res.status(500).json({ error: "Failed to process payment" });
  }
};
