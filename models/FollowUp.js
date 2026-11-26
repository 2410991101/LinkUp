
const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    note: {
      type: String,
      default: ""
    },

    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FollowUp", followUpSchema);
