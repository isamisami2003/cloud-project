const express = require("express");
const multer = require("multer");
const {
  uploadDocument,
  getAllDocuments,
  searchDocuments,
  classifyDocuments,
  getStats,
  sort
} = require("../controllers/documentController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getAllDocuments);
router.get("/search", searchDocuments);
router.post("/classify", classifyDocuments);
router.get("/stats", getStats);
router.get("/sort", sort);

module.exports = router;
