const Profile = require("../model/profile");
const OTP = require("../controller/otp"); // Adjust path as necessary

exports.createProfile = async (req, res) => {
  const {  name, MobileNumber, email } = req.body;

  try {
    // Verify OTP and get customer_id
    // const customer_id = await OTP.verifyOTP(MobileNumber, otp, customer_id);
    // if (!customer_id) {
    //   return res.status(400).json({ message: "Invalid or expired OTP" });
    // }

    // Create or update profile
    const newProfile = new Profile({
      name,
      email,
      MobileNumber
    });
    await newProfile.save();
console.log("profile", newProfile);
    res.send({
      status: 200,
      message: "Profile Created Successfully",
      data: newProfile
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.find({});
    res.status(200).json({
      status: 200,
      message: "Profile Received successfully",
      data: profile
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
