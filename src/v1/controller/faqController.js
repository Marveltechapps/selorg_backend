const FAQ = require("../model/faq");

exports.createFAQ = async (req, res) => {
  const faq = new FAQ({
    question: req.body.question,
    answer: req.body.answer
  });
  try {
    const newFaq = await faq.save();
    res.status(200).json({
      status: 200,
      message: "Customer Support and FAQ Created successfully",
      data: newFaq
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({});
    if (!faqs) return res.status(404).json({ message: "No FAQ found" });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    // Update fields if provided in request body
    if (req.body.question) faq.question = req.body.question;
    if (req.body.answer) faq.answer = req.body.answer;

    const updatedFaq = await faq.save();
    res.status(200).json({
      status: 200,
      message: "FAQ updated successfully",
      data: updatedFaq
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted FAQ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
