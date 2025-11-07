// Function to create order JSON for third-party application
function createThirdPartyOrder(customer, cart, address) {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log("Received: customer, cart, address");
  const orderJSON = {
    order: {
      orderLocation: customer.orgid,
      uniqueKey: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      orderNo: cart.cartId,
      orderType: "Prepaid",
      paymentType: "Credit Card",
      status: "Pending",
      holdStatus: "no",
      hyperlocal: "1",
      addressVerified: "yes",
      paymentVerified: "yes",
      addressType: address.label,
      orderDate: currentDate,
      orderAmount: cart.items.reduce((total, item) => total + (item.salePrice * item.quantity), 0).toFixed(2),
      orderCurrency: "INR",
      extCustomerCode: customer.customer_id,
      customerName: customer.name,
      shipAddress1: address.address1,
      shipAddress2: address.address2,
      shipCity: address.city,
      shipState: address.state,
      shipCountry: "India",
      shipPinCode: address.zip,
      shipPhone1: customer.phoneNumber,
      shipEmail1: customer.email,
      billName: customer.name,
      billAddress1: address.address1,
      billAddress2: address.address2,
      billCity: address.city,
      billState: address.state,
      billCountry: "India",
      billPinCode: address.zip,
      billPhone1: customer.phoneNumber,
      billEmail1: customer.email,
      landmark: address.landmark,
      latitude: address.latitude,
      longitude: address.longitude,
      items: cart.items.map((item, index) => ({
        lineno: (index + 1).toString(),
        sku: item.skuCode,
        orderQty: item.quantity.toString(),
        unitPrice: item.salePrice,
        vendor: "",
        taxInclusive: "YES",
        locationCode: customer.orgid,
        delFulfillmentMode: "2",
        shipmentType: "single",
        uom: "Each",
        discountPercent: "0"
      })),
      paymentItems: [{
        paymentMode: "Credit Card",
        docAmt: cart.items.reduce((total, item) => total + (item.salePrice * item.quantity), 0).toFixed(2)
      }]
    }
  };

  return orderJSON;
}