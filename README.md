# cloud-project
A Node.js and MongoDB-powered Document Management System for uploading, searching, classifying, and managing PDF/DOCX files. Features automatic content extraction, keyword-based classification, and a simple Bootstrap frontend for easy document handling.

## Features

- Upload PDF and DOCX documents
- Extracts content and title automatically
- Search documents by content
- Classify documents into categories using keywords
- View system statistics (total documents, size, categories)
- Sort documents by title
- Simple Bootstrap-based frontend

## Project Structure

```
.env
index.js
package.json
config/
  db.js
controllers/
  documentController.js
models/
  Document.js
routes/
  documentRoute.js
uploads/
views/
  index.html
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (running locally or provide a connection string)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up your `.env` file:

   ```
   MONGO_URI='mongodb://localhost:27017/Documents'
   ```

4. Start the server:

   ```sh
   npm start
   ```

5. Open [http://localhost:3000/views/index.html](http://localhost:3000/views/index.html) in your browser.

## API Endpoints

- `POST /api/documents/upload` — Upload a document (multipart/form-data, field: `file`)
- `GET /api/documents/` — Get all documents (sorted by title)
- `GET /api/documents/search?query=...` — Search documents by content
- `POST /api/documents/classify` — Classify all documents
- `GET /api/documents/stats` — Get system statistics

## Technologies Used

- Node.js
- Express
- MongoDB & Mongoose
- Multer (file uploads)
- pdf-parse, mammoth (content extraction)
- Bootstrap (frontend)

## License

This project is licensed under the ISC License.

---

Author: Ismail sami Ibrahim
