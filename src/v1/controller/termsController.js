const Terms = require("../model/terms");

// exports.createTerms = async (req, res) => {
//   const { title, content } = req.body;
//   const terms = new Terms({
//     // heading,
//     // section,
//     title,
//     content
//   });
//   try {
//     await terms.save();
//     res.status(201).json(terms);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// exports.getTerms = async (req, res) => {
//   try {
//     const terms = await Terms.find({});
//     if (!terms) return res.status(404).json({ message: "No terms found" });
//     res.json(terms);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.updateTerms = async (req, res) => {
//   const { general_policy, shipping_cancellation_refund_policy } = req.body;
//   try {
//     let terms = await Terms.findOne();
//     if (terms) {
//       terms.general_policy = general_policy;
//       terms.shipping_cancellation_refund_policy =
//         shipping_cancellation_refund_policy;
//       terms.updated_at = new Date();
//     } else {
//       terms = new Terms({
//         general_policy,
//         shipping_cancellation_refund_policy
//       });
//     }
//     await terms.save();
//     res.json(terms);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Create Terms Document

exports.createTerms = async (req, res) => {
  try {
    const { content } = req.body;
    const newTerms = new Terms({ content });
    await newTerms.save();
    res.status(201).json(newTerms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get All Terms Documents
exports.getAllTerms = async (req, res) => {
  try {
    const terms = await Terms.find();
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Terms Document by ID
exports.getTermsById = async (req, res) => {
  try {
    const terms = await Terms.findById(req.params.id);
    if (!terms) return res.status(404).json({ message: "Terms not found" });
    res.status(200).json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Terms Document
exports.updateTerms = async (req, res) => {
  try {
    const updatedTerms = await Terms.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTerms)
      return res.status(404).json({ message: "Terms not found" });
    res.status(200).json(updatedTerms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Terms Document
exports.deleteTerms = async (req, res) => {
  try {
    const deletedTerms = await Terms.findByIdAndDelete(req.params.id);
    if (!deletedTerms)
      return res.status(404).json({ message: "Terms not found" });
    res.status(200).json({ message: "Terms deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
