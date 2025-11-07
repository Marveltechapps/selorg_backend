const jwt = require("jsonwebtoken");

// function for Generating Token
const generateAccessToken = (user) => {
	const payload = {
		id: user.password,
		email: user.email,
	};

	// expires 1 hours
	return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: "7hr" });
};

module.exports = generateAccessToken;