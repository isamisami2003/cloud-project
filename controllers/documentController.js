const fs = require('fs');
const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");

// this function can extract the document
const extractContent = async (filePath, mimetype) => {
  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value;
  }
  return "";
};

// extractTitle function to extract the title from the document
const extractTitle = async (filePath, mimetype, content) => {
  if (mimetype === "application/pdf") {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      const lines = data.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines.length > 0) {
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          const line = lines[i];
          if (line.length > 100) continue;
          if (line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line)) {
            return cleanTitle(line);
          }
          if (isTitleCase(line) && line.length > 3) {
            return cleanTitle(line);
          }
          if (i < 5 && line.length < 80 && !line.includes('.') && !line.includes(',')) {
            return cleanTitle(line);
          }
        }
        const firstLine = lines[0];
        if (firstLine.length < 100 && !isMetadataLine(firstLine)) {
          return cleanTitle(firstLine);
        }
      }
      
      if (data.info && data.info.Title) {
        const title = data.info.Title.trim();
        if (title && title.length > 0 && !isGenericTitle(title)) {
          return title;
        }
      }

      for (const line of lines.slice(0, 20)) {
        const titlePatterns = [
          /^title:\s*(.+)/i,
          /^subject:\s*(.+)/i,
          /^topic:\s*(.+)/i,
          /^chapter\s+\d+[:\-]\s*(.+)/i,
          /^report\s+on\s+(.+)/i,
          /^study\s+of\s+(.+)/i,
          /^analysis\s+of\s+(.+)/i
        ];
        for (const pattern of titlePatterns) {
          const match = line.match(pattern);
          if (match && match[1]) {
            return cleanTitle(match[1]);
          }
        }
      }

      const firstParagraph = lines.slice(0, 5).join(' ');
      const sentences = firstParagraph.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      for (const sentence of sentences.slice(0, 3)) {
        if (sentence.length > 10 && sentence.length < 100) {
          return cleanTitle(sentence);
        }
      }

      return 'Untitled Document';
    } catch (error) {
      console.error('Error extracting PDF title:', error);
      return 'Untitled Document';
    }
  } else {
    const lines = content.trim().split("\n").filter(Boolean);
    return lines[0] ? lines[0].slice(0, 100) : "Untitled";
  }

  function isTitleCase(text) {
    const words = text.split(/\s+/);
    if (words.length === 1) return /^[A-Z][a-z]/.test(text);
    let capitalizedWords = 0;
    for (const word of words) {
      if (/^[A-Z][a-z]/.test(word) || /^[A-Z]+$/.test(word)) {
        capitalizedWords++;
      }
    }
    return capitalizedWords / words.length > 0.5;
  }
  function isGenericTitle(title) {
    const genericTitles = [
      'untitled', 'document', 'pdf', 'file', 'page', 'new document',
      'untitled document', 'document1', 'document 1'
    ];
    return genericTitles.some(generic => 
      title.toLowerCase().includes(generic.toLowerCase())
    );
  }
  function isMetadataLine(line) {
    const metadataPatterns = [
      /^\d+$/,
      /^page\s+\d+/i,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
      /^created|modified|author|date/i,
      /^file|size|version/i
    ];
    return metadataPatterns.some(pattern => pattern.test(line));
  }
  function cleanTitle(title) {
    return title
      .replace(/[^\w\s\-\.\,\:\;\!\?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }
};

// uploadDocument function to handle the file upload
const uploadDocument = async (req, res) => {
  try {
      const file = req.file;

      const content = await extractContent(file.path, file.mimetype);
      const title = await extractTitle(file.path, file.mimetype, content);

      const doc = await Document.create({
        title,
        content,
        originalName: file.originalname,
        filename: file.filename,
        fileSize: file.size 
      });
      
    fs.unlinkSync(file.path);

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

// getAllDocuments function to retrieve all documents from the database
const getAllDocuments = async (req, res) => {
  const docs = await Document.find().sort({ title: 1 }); 
  res.json(docs.map(doc => ({
    title: doc.title,
  })
  ))
};

// searchDocuments function to search documents by content
const searchDocuments = async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const pipeline = [
      {
        $match: {
          content: { $regex: new RegExp(query, "i") },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          originalName: 1,
          content: 1,
        },
      },
    ];

    const documents = await Document.aggregate(pipeline, { allowDiskUse: true });

    const highlighted = documents.map((doc) => {
      const highlightedContent = doc.content.replace(
        new RegExp(`(${query})`, "gi"),
        "**$1**"
      );

      return {
        _id: doc._id,
        title: doc.title,
        originalName: doc.originalName,
        content: highlightedContent,
      };
    });

    res.json(highlighted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};

const classificationTree = {
  "Artificial Intelligence": ["ai", "neural", "machine learning", "deep learning", "nlp", "vision"],
  "Cybersecurity": ["encryption", "malware", "xss", "csrf", "buffer overflow", "hashing"],
  "Cloud Computing": ["aws", "azure", "cloud", "docker", "kubernetes", "virtualization"],
  "Databases": ["sql", "mongodb", "nosql", "index", "schema", "relational"],
  "Software Engineering": ["agile", "scrum", "uml", "design pattern", "requirement"],
  "Computer Networks": ["tcp", "ip", "udp", "router", "dns", "firewall"],
  "Operating Systems": ["kernel", "process", "thread", "scheduling", "memory"],
  "Data Structures & Algorithms": ["array", "graph", "tree", "binary", "sorting", "dynamic programming"],
};


// classifyDocuments function to classify documents based on keywords
const classifyDocuments = async (req, res) => {
  try {
    const documents = await Document.find();

    for (let doc of documents) {
      const content = doc.content.toLowerCase();
      const title = doc.title ? doc.title.toLowerCase() : "";
      let bestCategory = "Unclassified";
      let maxScore = 0;

      for (let category in classificationTree) {
        const keywords = classificationTree[category];
        let score = 0;

        for (const word of keywords) {
          if (title.includes(word.toLowerCase())) score += 3;
        }

        const intro = content.slice(0, 500);
        for (const word of keywords) {
          if (intro.includes(word.toLowerCase())) score += 2;
        }

        for (const word of keywords) {
          if (content.includes(word.toLowerCase())) score += 1;
        }

        if (score > maxScore) {
          maxScore = score;
          bestCategory = category;
        }
      }

      doc.category = bestCategory;
      await doc.save();
    }

    res.json({ message: "Documents classified successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Classification failed" });
  }
};

//  provides statistics about the documents in the database 
const getStats = async (req, res) => {
  const startTime = Date.now();
  try {
    const documents = await Document.find();
    const totalCount = documents.length;

    const categoryCount = {};
    let totalSizeBytes = 0;
    for (let doc of documents) {
      categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;

      if (doc.fileSize) { 
        totalSizeBytes += doc.fileSize;
      }
    }

    const endTime = Date.now();
    const executionTime = ((endTime - startTime) / 1000).toFixed(2); 
    res.json({
      totalDocuments: totalCount,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      documentsPerCategory: categoryCount,
      processingTimeSeconds: executionTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate stats" });
  }
};

const sort = async (req, res) => {
  try {
    const docs = await Document.aggregate([
      { $sort: { title: 1 } },
      { $project: { title: 1, _id: 0 } }
    ], { allowDiskUse: true });

    res.json(docs.map(doc => ({
      title: doc.title})
    ));
  } catch (err) {
    console.error("Aggregation sort error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

module.exports = { uploadDocument, getAllDocuments, searchDocuments, classifyDocuments, getStats, sort}
