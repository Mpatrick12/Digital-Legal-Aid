# Digital Legal Aid - Rwanda Justice Portal

A centralized platform for simplified access to justice information in Rwanda. Supporting SDG 16: Peace, Justice & Strong Institutions.

## Project Overview

This platform democratizes legal information by translating complex legal procedures into simplified, actionable guidance accessible via mobile devices. Built as a Progressive Web App (PWA) to ensure accessibility on low-end smartphones.

## Features

- 🔍 **Natural Language Search**: Search for legal information using simple keywords
- 📱 **Mobile-First Design**: Fully responsive PWA with offline capability
- 🌐 **Bilingual Support**: English and Kinyarwanda
- 📚 **Simplified Legal Content**: Complex laws translated into plain language
- 📋 **Step-by-Step Reporting Guides**: Clear procedures for reporting crimes
- 🏛️ **Legal Aid Directory**: Find free legal services in your district
- ⚡ **Fast Performance**: Sub-2 second search response time
- 🔒 **Privacy-First**: Guest mode for sensitive searches

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- Lucide React (icons)
- PWA support

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- BCrypt

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Mpatrick12/Digital-Legal-Aid.git
cd Digital-Legal-Aid
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**

Create `.env` in `/backend`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/digital-legal-aid
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

4. **Seed the database with sample legal content**
```bash
cd backend
node src/seedData.js
```

5. **Run the development servers**
```bash
npm run dev
```

This runs:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
Digital-Legal-Aid/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   └── vite.config.js     # Vite configuration
├── backend/
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth & validation
│   │   ├── server.js      # Express server
│   │   └── seedData.js    # Database seeding script
│   └── .env               # Environment variables
└── package.json           # Workspace configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login

### Legal Content
- `GET /api/legal-content` - Get all legal articles (paginated)
- `GET /api/legal-content/:id` - Get single article

### Search
- `GET /api/search?q=query&lang=en` - Search legal content

## Database Schema

### User
- name, email, password, district, language, role
- searchHistory, savedArticles

### LegalContent
- crimeType, articleNumber
- originalText (en, rw)
- simplifiedExplanation (en, rw)
- reportingSteps, requiredEvidence
- whereToReport, tags, viewCount

### Case
- userId, caseNumber, crimeType, status
- description, updates

### SearchLog
- query, resultsCount, clickedResult
- language, timestamp

## Contributing

This is an academic project by Patrick Mukunzi for BSc. Software Engineering.

## License

MIT License

## Acknowledgments

- Aligned with Rwanda's Vision 2050 and NST1
- Supporting UN SDG 16: Peace, Justice & Strong Institutions
- Supervisor: Bernard Lamptey

## Contact

Patrick Mukunzi - p.mukunzi@alustudent.com

Project Link: https://github.com/Mpatrick12/Digital-Legal-Aid
