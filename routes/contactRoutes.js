
const express = require("express");
const mongoose = require("mongoose");
const Contact = require("../models/Contact");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All contact routes require a valid JWT
router.use(authMiddleware);

// GET: Logged-in user's contacts only
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find({
      user: req.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: contacts.length,
      contacts
    });
  } catch (error) {
    console.error("Fetch contacts error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch contacts."
    });
  }
});

// POST: Create a contact owned by the logged-in user
router.post("/", async (req, res) => {
  try {
    const { name, email, company, role } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact name is required."
      });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email?.trim() || undefined,
      company: company?.trim() || "",
      role: role?.trim() || "",
      user: req.userId
    });

    res.status(201).json({
      success: true,
      message: "Contact added successfully!",
      contact
    });
  } catch (error) {
    console.error("Create contact error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not create contact."
    });
  }
});

// PUT: Update only a contact owned by the logged-in user
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID."
      });
    }

    const { name, email, company, role } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact name is required."
      });
    }

    const contact = await Contact.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId
      },
      {
        $set: {
          name: name.trim(),
          email: email?.trim() || undefined,
          company: company?.trim() || "",
          role: role?.trim() || ""
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found."
      });
    }

    res.json({
      success: true,
      message: "Contact updated successfully!",
      contact
    });
  } catch (error) {
    console.error("Update contact error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not update contact."
    });
  }
});

// DELETE: Delete only a contact owned by the logged-in user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID."
      });
    }

    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found."
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully!"
    });
  } catch (error) {
    console.error("Delete contact error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not delete contact."
    });
  }
});

module.exports = router;
