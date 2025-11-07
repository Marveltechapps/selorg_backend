const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    mobileNumber: user.mobileNumber,
    userId: user._id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "4w" });
};

module.exports = generateToken;
