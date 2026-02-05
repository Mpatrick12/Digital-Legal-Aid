# Official Gazette Integration Guide

## Overview
This system allows you to upload Official Gazette PDF documents, automatically extract their text, and make them searchable.

## How It Works

### 1. **Upload PDF Files**
- Access the upload page at: `http://localhost:3000/admin/upload-gazette`
- Fill in document metadata (title, number, date, category)
- Upload the PDF file (max 50MB)

### 2. **Automatic Processing**
- System extracts text from PDF using `pdf-parse` library
- Stores extracted text in MongoDB for full-text search
- Keeps original PDF for download
- Indexes content for fast searching

### 3. **Search & Access**
- Users can search gazette documents via the search page
- Full-text search across document titles, numbers, and content
- Download original PDFs
- Filter by category, year, tags

## API Endpoints

### Upload Document (Admin Only)
```
POST /api/gazette/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- pdf: File
- title: String
- documentNumber: String
- publicationDate: Date
- category: String
- tags: String (comma-separated)
```

### Search Documents
```
GET /api/gazette/search?q=theft&category=Law&year=2018

Response:
{
  "documents": [...],
  "totalPages": 5,
  "currentPage": 1,
  "totalDocuments": 42
}
```

### Get Single Document
```
GET /api/gazette/:id

Response:
{
  "id": "...",
  "title": "Law N° 68/2018",
  "extractedText": { "en": "..." },
  "pdfUrl": "/uploads/gazettes/filename.pdf",
  ...
}
```

### Download PDF
```
GET /api/gazette/:id/download
```

## Database Schema

### GazetteDocument Model
- **title**: Document title
- **documentNumber**: Official number (e.g., N° 68/2018)
- **publicationDate**: When it was published
- **category**: Law, Presidential Order, etc.
- **extractedText**: Full text extracted from PDF (multi-language)
- **summary**: Optional human-written summary
- **pdfFileName**: Original file name
- **pdfUrl**: Download URL
- **tags**: Searchable tags
- **pageCount**: Number of pages
- **downloadCount**: Usage analytics
- **searchCount**: How many times viewed

## Usage Instructions

### For Admins (Uploading):
1. Navigate to `/admin/upload-gazette`
2. Fill in the form:
   - **Title**: "Law N° 68/2018 on the Penal Code"
   - **Document Number**: "N° 68/2018"
   - **Publication Date**: Select from calendar
   - **Category**: Choose from dropdown
   - **Tags**: "criminal law, penal code, theft, assault"
3. Click "Choose File" and select your PDF
4. Click "Upload Document"
5. System processes the PDF (may take 10-30 seconds for large files)
6. Success message appears when done

### For Users (Searching):
1. Go to search page
2. Type keywords: "theft", "assault", "Law 68"
3. System searches across all gazette documents
4. Click any result to view full content
5. Download original PDF if needed

## Local Testing

### Upload Your First Document:
```bash
# 1. Make sure backend is running
cd backend
npm run dev

# 2. In browser, go to:
http://localhost:3000/admin/upload-gazette

# 3. Upload a sample PDF with these details:
Title: Law N° 68/2018 on the Penal Code
Document Number: N° 68/2018
Publication Date: 2018-08-30
Category: Law
Tags: criminal law, penal code

# 4. Search for it:
http://localhost:3000/search?q=penal
```

## File Storage
- PDFs are stored in: `backend/uploads/gazettes/`
- Make sure this directory has write permissions
- Add to `.gitignore` to avoid committing large PDFs

## Alternative Methods

If PDF text extraction doesn't work well (scanned PDFs):

### Option 1: OCR Processing
Install Tesseract.js for OCR:
```bash
npm install tesseract.js --workspace=backend
```

### Option 2: Manual Data Entry
- Extract text manually
- Save as JSON
- Import using bulk insert script

### Option 3: Cloud Storage
Use AWS S3 or Google Cloud Storage:
- Upload PDFs to cloud
- Store URLs in database
- More scalable for production

## Production Considerations

1. **File Size Limits**: Increase for production (currently 50MB)
2. **Authentication**: Restrict upload endpoint to admin users only
3. **Validation**: Add more robust PDF validation
4. **Compression**: Compress PDFs before storage
5. **CDN**: Use CDN for faster PDF delivery
6. **Backup**: Regular backups of uploads folder
7. **Monitoring**: Track upload failures and extraction errors

## Troubleshooting

**PDF text extraction fails:**
- Ensure PDF is not scanned images (use OCR)
- Check if PDF is password-protected
- Verify PDF is not corrupted

**Upload timeout:**
- Increase timeout in server config
- Process extraction in background job

**Search not working:**
- Ensure MongoDB text indexes are created
- Check extracted text is not empty
