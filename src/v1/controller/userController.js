const UserModel = require("../model/userModel");

// Create a new user (open, no auth required)
exports.createUser = async (req, res) => {
  try {
    const user = new UserModel(req.body);
    user.lastActiveAt = new Date();
    if (user.isVerified && !user.mobileVerifiedAt) {
      user.mobileVerifiedAt = new Date();
    }
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users (could be restricted to admin later)
exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a user by ID (auth not required for demo, optional)
exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Profile – authenticated
exports.updateProfile = async (req, res) => {
  const { name, email, notificationPreferences } = req.body;
  const mobileNumber = req.user.mobileNumber;

  try {
    const user = await UserModel.findOne({ mobileNumber });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (notificationPreferences) {
      const currentPrefs =
        user.notificationPreferences?.toObject?.() ||
        user.notificationPreferences ||
        {};
      user.notificationPreferences = {
        ...currentPrefs,
        ...notificationPreferences
      };
    }
    user.lastActiveAt = new Date();
    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ✅ Delete account – authenticated
exports.deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findOneAndDelete({
      mobileNumber: req.user.mobileNumber
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
