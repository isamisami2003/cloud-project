const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  originalName: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  category: { type: String, default: "Unclassified" },
  filename: { type: String },
  fileSize: { type: Number } 
});

const Document =  mongoose.model("Document", documentSchema);

module.exports = Document;