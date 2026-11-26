
const express = require("express");
const router = express.Router();

const FollowUp = require("../models/FollowUp");
const Contact = require("../models/Contact");
const authMiddleware = require("../middleware/authMiddleware");

// Get all follow-ups
router.get("/", authMiddleware, async (req, res) => {
  try {
    const followUps = await FollowUp.find({ user: req.userId })
      .populate("contact", "name email company")
      .sort({ dueDate: 1 });

    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch follow-ups" });
  }
});

// Create follow-up
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, note, contact, dueDate } = req.body;

    if (!title || !contact || !dueDate) {
      return res.status(400).json({
        message: "Title, contact and due date are required"
      });
    }

    const contactExists = await Contact.findOne({
      _id: contact,
      user: req.userId
    });

    if (!contactExists) {
      return res.status(404).json({
        message: "Contact not found"
      });
    }

    const followUp = await FollowUp.create({
      title,
      note,
      contact,
      dueDate,
      user: req.userId
    });

    const populatedFollowUp = await followUp.populate(
      "contact",
      "name email company"
    );

    res.status(201).json(populatedFollowUp);
  } catch (error) {
    res.status(500).json({ message: "Failed to create follow-up" });
  }
});

// Update follow-up
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, note, contact, dueDate, status } = req.body;

    const followUp = await FollowUp.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!followUp) {
      return res.status(404).json({
        message: "Follow-up not found"
      });
    }

    if (contact) {
      const contactExists = await Contact.findOne({
        _id: contact,
        user: req.userId
      });

      if (!contactExists) {
        return res.status(404).json({
          message: "Contact not found"
        });
      }

      followUp.contact = contact;
    }

    if (title !== undefined) followUp.title = title;
    if (note !== undefined) followUp.note = note;
    if (dueDate !== undefined) followUp.dueDate = dueDate;
    if (status !== undefined) followUp.status = status;

    await followUp.save();

    await followUp.populate("contact", "name email company");

    res.json(followUp);
  } catch (error) {
    res.status(500).json({ message: "Failed to update follow-up" });
  }
});

// Delete follow-up
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const followUp = await FollowUp.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!followUp) {
      return res.status(404).json({
        message: "Follow-up not found"
      });
    }

    res.json({ message: "Follow-up deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete follow-up" });
  }
});

module.exports = router;
