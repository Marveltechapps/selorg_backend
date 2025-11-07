const Address = require("../model/address");
const Customermodel = require("../model/customer");
const AvailabilityZone = require("../model/availability");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const config = require("../config/config");

const debugMode = config.debugMode;
// Function to add a new address
exports.addAddress = async (req, res) => {
  if (req.body.customer_id) {
    const addressData = req.body;
    const customerId = req.body.customer_id;
    try {
      const customer = await Customermodel.findOne({ customer_id: customerId });
      //  console.log(customer);
      // console.log(addressData.zip);
      if (!customer) {
        return res
          .status(200)
          .json({ status: 401, message: "Invalid request" });
      }
      const zone = await AvailabilityZone.findOne({ orgid: customer.orgid });
      if (zone && zone.pinCodes.includes(addressData.zip)) {
        // return res.status(200).json({status: 200, message: "Pin code is available for the given orgId"});
      } else {
        return res.status(404).json({
          status: 404,
          message: "Pin code is not available for the given orgId"
        });
      }
      const isDefault =
        addressData.isDefault === "true" || addressData.isDefault === true;
      if (isDefault) {
        await Address.updateMany(
          { customer_id: customerId },
          { isDefault: false }
        );
      } else {
        const addresses = await Address.find({ customer_id: customerId });
        if (addresses.length === 0) {
          addressData.isDefault = true;
        }
      }

      const addressID = uuidv4();
      addressData.address_id = addressID;

      const newAddress = new Address(addressData);
      const addrs = await newAddress.save();
      if (debugMode) {
        console.log("addressData updated");
      }

      // if (!customer.customerCode || customer.customerCode == "" & 0) { //stop creating customer in Vinculumn
      if (0) {
        //stop creating customer in Vinculumn

        const customerdata = await PrepVinCustomerData(newAddress, customer);
        if (debugMode) {
          console.log("preparing customer data", customerdata);
        }
        if (customerdata) {
          if (debugMode) {
            console.log(
              "customer data prepared successfully and start creating customer in vin"
            );
          }
          const customerCode = await createCustomer(customerdata, customer);
          if (debugMode) {
            console.log("VIN create customer completed", customerCode);
          }
          if (customerCode) {
            if (debugMode) {
              console.log("all completed");
            }
            return res.status(200).json({
              status: 200,
              message: "Address added successfully",
              data: newAddress
            });
          } else {
            if (debugMode) {
              console.log("END with out customer update!!! something happened");
            }
            return res.status(200).json({
              status: 200,
              message: "Address added successfully",
              data: newAddress
            });
          }
        } else {
          // return res.status(200).json({ message: "something went wrong" });
        }
      } else {
        if (debugMode) {
          console.log("END customer code already exist");
        }
        return res.status(200).json({
          success: 200,
          message: "Address added successfully",
          data: newAddress
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ status: 500, message: "Failed to add address", error: error });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};

// async function createCustomer1(CustomerData, customer) {
//         const CustomerData1 = CustomerData;
//         // customer.customerCode = customerCode;
//         console.log(customer.customer_id);
//         const customerCode = 'C123123123';
//         try{
//           const updatedCustomer = await Customermodel.findOneAndUpdate(
//             { customer_id: customer.customer_id },
//             { $set: { customerCode: customerCode } }
//           );
//           console.log(updatedCustomer);
//         } catch(error){
//           console.log(error);
//         }

//         console.log("customerCode:", customerCode);
//         return customerCode;
//       }

async function createCustomer(CustomerData, customer) {
  // if(debugMode){ console.log('CustomerData',CustomerData);}
  if (debugMode) {
    console.log("VIN Create customer");
  }
  try {
    const vinconfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: config._VINBASEURL_ + "/customer/custCreate",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        ApiOwner: config._VINApiOwner_,
        ApiKey: config._VINAPIKEY_
      },
      data: CustomerData
    };
    if (debugMode) {
      console.log("VIN config completed");
    }
    try {
      const response = await axios(vinconfig);
      console.log(response.data);
      if (response.data.responseCode === 0) {
        if (debugMode) {
          console.log("response.data.responseCode === 0");
        }
        const extCustomerCode = response.data.response[0].extCustomerCode;
        const customerCode = response.data.response[0].customerCode;

        if (debugMode) {
          console.log("response.data", response.data);
        }
        if (debugMode) {
          console.log("Customer Code resp", customerCode);
        }
        if (extCustomerCode) {
          customer.extCustomerCode = extCustomerCode;
          // console.log("extCustomerCode:", extCustomerCode);
        }

        if (customerCode) {
          if (debugMode) {
            console.log("customerCode update:", customerCode);
          }
          // customer.customerCode = customerCode;
          try {
            if (debugMode) {
              console.log("updating customer code into DB:", customerCode);
            }
            const updatedCustomer = await Customermodel.findOneAndUpdate(
              { customer_id: customer.customer_id },
              { $set: { customerCode: customerCode } }
            );
            if (updatedCustomer) {
              if (debugMode) {
                console.log("Hope customer code updatd successfully");
              }
            }
          } catch (error) {
            console.log(error);
          }
          return customerCode;
        } else {
          if (debugMode) {
            console.log("customerCode empty:", customerCode);
          }
          return false;
        }
      } else {
        if (debugMode) {
          console.log("Error response received", responseCode);
        }
        handleResponseErrors(response.data.responseCode);
        return false;
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(response.data);
    // return false;
  } catch (error) {
    console.error(`API Error: ${error}`);
    return false;
  }
}

// Function to edit an existing address
exports.editAddress = async (req, res) => {
  if (req.body.address_id) {
    try {
      const addressId = req.body.address_id; // Use the system-generated address_id
      let addressData = req.body;
      addressData.updatedAt = new Date();
      const updatedAddress = await Address.findOneAndUpdate(
        { address_id: addressId },
        addressData,
        { new: true }
      );
      if (!updatedAddress) {
        return res
          .status(200)
          .json({ status: 401, message: "Address not found" });
      }
      res.json({
        status: 200,
        message: "Address updated successfully",
        data: updatedAddress
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "Failed to update address",
        error: error
      });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};

// Function to delete an address
exports.deleteAddress = async (req, res) => {
  if (req.query.address_id) {
    try {
      const addressId = req.query.address_id; // Use the system-generated address_id
      const deletedAddress = await Address.findOneAndRemove({
        address_id: addressId
      });
      if (!deletedAddress) {
        return res
          .status(200)
          .json({ status: 404, message: "Address not found" });
      }
      res.json({ status: 200, message: "Address deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Failed to delete address",
        error: error
      });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};
// Function to set an address as the default for a customer
exports.setDefaultAddress = async (req, res) => {
  if (req.body.customer_id && req.body.address_id) {
    try {
      const customerId = req.body.customer_id;
      const addressId = req.body.address_id;

      // Clear the default flag for all addresses of this customer
      await Address.updateMany(
        { customer_id: customerId },
        { isDefault: false }
      );

      // Set the selected address as the default
      const updatedAddress = await Address.findOneAndUpdate(
        { customer_id: customerId, address_id: addressId },
        { isDefault: true },
        { new: true }
      );
      console.log(updatedAddress);
      if (!updatedAddress) {
        return res
          .status(200)
          .json({ status: 400, message: "Address not found for the customer" });
      }
      res.json({ status: 200, message: "Success", data: updatedAddress });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Failed to set default address",
        error: error
      });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};

// Function to get an address by address_id with customer_id
exports.getAddressByAddressId = async (req, res) => {
  if (req.query.customer_id && req.query.address_id) {
    try {
      const customerId = req.query.customer_id;
      const addressId = req.query.address_id;
      const address = await Address.findOne({
        customer_id: customerId,
        address_id: addressId
      });
      if (address) {
        res.json({
          status: 200,
          message: "Success",
          data: address
        });
      } else {
        res
          .status(200)
          .json({ status: 404, message: "Address not found for the customer" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Failed to retrieve address",
        error: error
      });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};

// Function to get all addresses by customer_id
exports.getAddressesByCustomerId = async (req, res) => {
  if (req.query.customer_id) {
    try {
      const customerId = req.query.customer_id;
      const addresses = await Address.find({ customer_id: customerId });
      const count = addresses.length;
      if (addresses.length > 0) {
        res.json({
          status: 200,
          message: "Addresses retrieved successfully",
          count,
          data: addresses
        });
      } else {
        res.status(200).json({
          status: 404,
          message: "No addresses found for the customer"
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: 500,
        message: "Failed to retrieve addresses",
        error: error
      });
    }
  } else {
    return res.status(200).json({ status: 401, message: "Invalid request" });
  }
};

function handleResponseErrors(responseCode) {
  switch (responseCode) {
    case 2050:
      console.error(
        "Customer Name is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2051:
      console.error(
        "Customer Type is a mandatory field. It cannot be left null or blank. If you have sent the Customer Type, it does not exist with us."
      );
      break;
    case 2052:
      console.error(
        "Bill Address 1 is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2053:
      console.error(
        "Bill Phone is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2054:
      console.error(
        "Bill E-Mail is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2055:
      console.error(
        "Bill Country is a mandatory field. It cannot be left null or blank. If you have sent the Bill Country, this Bill Country does not exist with us."
      );
      break;
    case 2056:
      console.error(
        "Address 1 is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2057:
      console.error(
        "Phone is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2058:
      console.error(
        "E-Mail is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2059:
      console.error(
        "Country is a mandatory field. It cannot be left null or blank. If you have sent the Country, this Country does not exist with us."
      );
      break;
    case 2060:
      console.error(
        "State is a mandatory field. It cannot be left null or blank. If you have sent the State, this State does not exist under the given Country."
      );
      break;
    case 2061:
      console.error(
        "Other Address 1 is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2062:
      console.error(
        "Other Phone is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2063:
      console.error(
        "Other E-Mail is a mandatory field. It cannot be left null or blank."
      );
      break;
    case 2064:
      console.error(
        "Other Country is a mandatory field. It cannot be left null or blank. If you have sent the Country, this Country does not exist with us."
      );
      break;
    case 2065:
      console.error(
        "Other State is a mandatory field. It cannot be left null or blank. If you have sent the State, this State does not exist under the given Country."
      );
      break;
    case 2066:
      console.error(
        "Customer Code supplied in the request for update does not exist. You can leave this field blank for creating a new Customer."
      );
      break;
    case 2067:
      console.error(
        "Bill State is a mandatory field. It cannot be left null or blank. If you have sent the Bill State, this Bill State does not exist under the given Country."
      );
      break;
    case 2068:
      console.error(
        "Customer already exists with the Bill Phone Number supplied in the request. Please change the Bill Phone Number."
      );
      break;
    case 2069:
      console.error(
        "Customer already exists with the Bill E-Mail supplied in the request. Please change the Bill E-Mail."
      );
      break;
    case 2070:
      console.error(
        "Customer already exists with the Phone Number supplied in the request. Please change the Phone Number."
      );
      break;
    case 2071:
      console.error(
        "Customer already exists with the E-Mail supplied in the request. Please change the E-Mail."
      );
      break;
    case 2073:
      console.error("Phone cannot be more than 50 characters.");
      break;
    case 2074:
      console.error("Other Addresses Phone cannot be more than 20 characters.");
      break;
    default:
      console.error("Generic Error");
  }
}

async function PrepVinCustomerData(address, profile) {
  console.log("profile", profile);
  try {
    if (!profile.email || profile.email == "") {
      const min = 100000;
      const max = 999999;
      const randemail = Math.floor(Math.random() * (max - min + 1)) + min;
      profile.email = "selorg" + randemail + "@gmail.com";
    }
    // console.log(profile.email);
    const modifiedCustomerData = {
      customers: [
        {
          extCustomerCode: "",
          customerName: profile.name,
          isActive: "Yes",
          customerType: "B2C",
          address1: address.address1,
          address2: address.address2,
          address3: "",
          address4: "",
          phone: profile.phoneNumber,
          altPhone: "",
          fax: "",
          email1: profile.email,
          email2: "",
          country: "INDIA",
          state: "Tamil Nadu",
          city: address.city,
          pinCode: address.zip,
          billAddress1: address.address1,
          billAddress2: address.address2,
          billAddress3: "",
          billAddress4: "",
          billPhone: profile.phoneNumber,
          billAltPhone: "",
          billFax: "",
          billEmail1: profile.email,
          billEmail2: "",
          billCountry: "INDIA",
          billState: "Tamil Nadu",
          billCity: address.city,
          billPinCode: address.zip,
          paymentTerms: "7 DAYS",
          tinNo: "",
          taxZone: "",
          priceZone: "PriceZone One",
          udf1: "Portal",
          udf2: "",
          udf3: "",
          udf4: "",
          udf5: "",
          udf6: "",
          udf7: "",
          udf8: "",
          udf9: "",
          udf10: "Test",
          panNo: "",
          gstNo: "",
          shelflifeonPicking: 1,
          totalShelfLife: 1,
          isTaxExempt: "YES",
          economiczone: "SEZ",
          creditDays: 5,
          isTCSApplicable: "NO",
          tcsPercentage: "",
          latitude: "",
          longitude: "",
          geoType: "",
          geoAddress: "",
          geoLatitude: "",
          geoLongitude: "",
          addresses: [
            {
              lineno: "",
              address1: address.address1,
              address2: address.address2,
              address3: "",
              phone: profile.phoneNumber,
              altPhone: "",
              fax: "",
              email1: profile.email,
              email2: "",
              country: "INDIA",
              state: "Tamil Nadu",
              city: address.city,
              pinCode: address.zip,
              remarks: "",
              udf1: address.label,
              udf2: "",
              udf3: "",
              udf4: "",
              udf5: "",
              udf6: "",
              udf7: "",
              udf8: "",
              udf9: "",
              udf10: "",
              latitude: "",
              longitude: ""
            }
          ]
        }
      ]
    };
    //  console.log(modifiedCustomerData);
    return modifiedCustomerData;
  } catch (error) {
    console.log(error);
    return false;
  }
}
