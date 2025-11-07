const mongoose = require("mongoose");

const PrivacyPolicySchema = new mongoose.Schema({
  effectiveDate: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now // Automatically sets the last updated date
  },
  section1: [
    {
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section2: [
    {
      title: {
        type: String,
        required: false
      },
      subTitle: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      },
      subTitle1: {
        type: String,
        required: false
      },
      description1: {
        type: String,
        required: false
      },
      subTitle2: {
        type: String,
        required: false
      },
      description2: {
        type: String,
        required: false
      },
      subTitle3: {
        type: String,
        required: false
      },
      description3: {
        type: String,
        required: false
      },
      subTitle4: {
        type: String,
        required: false
      },
      description4: {
        type: String,
        required: false
      },
      subTitle5: {
        type: String,
        required: false
      },
      description5: {
        type: String,
        required: false
      },
      subTitle6: {
        type: String,
        required: false
      },
      description6: {
        type: String,
        required: false
      }
    }
  ],
  section3: [
    {
      title: {
        type: String,
        required: false
      },
      subTitle: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section4: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section5: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section6: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section7: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      }
    }
  ],
  section8: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      }
    }
  ],
  section9: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section10: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section11: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: [String],
        required: false
      }
    }
  ],
  section12: [
    {
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
