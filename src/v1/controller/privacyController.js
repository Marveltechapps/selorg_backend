const PrivacyPolicy = require("../model/privacyPolicy");

// Create a new privacy policy
exports.createPrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;
    const newPolicy = new PrivacyPolicy({ content });
    await newPolicy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get the current privacy policy
exports.getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne().sort({ createdAt: -1 });
    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update the privacy policy
exports.updatePrivacyPolicy = async (req, res) => {
  try {
    const { id, content } = req.body;
    const updatedPolicy = await PrivacyPolicy.findByIdAndUpdate(
      id,
      { content, updatedAt: Date.now() },
      { new: true }
    );
    res.status(200).json(updatedPolicy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Optionally, delete a privacy policy
exports.deletePrivacyPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    await PrivacyPolicy.findByIdAndDelete(id);
    res.status(200).json({ message: "Privacy policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
