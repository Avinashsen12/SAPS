# SAPS - Resume-JD Intelligence Matching Engine

## Product Overview
SAPS (Skills and Placement Services) is an AI-powered Resume-Job Description Intelligence Matching Engine that analyzes resumes and job descriptions, matches candidates against active JDs, scores them using a weighted percentage system (0%-100%), and ranks them.

## Core Features

### Module 1: Resume Parsing
- Extract and store candidate details, skills, experience from PDF, DOCX, TXT files
- OCR support for scanned/image-based PDFs using pytesseract

### Module 2: JD Management
- Support ADD_JD, DELETE_JD, UPDATE_JD_STATUS operations
- Status management: ACTIVE, CLOSED, ON_HOLD
- Bulk upload via individual files or ZIP archives

### Module 3: Matching & Scoring Engine
- Weighted scoring model for skills (40%), experience (25%), tools (15%), industry (10%), certifications (10%)
- Fast mode (keyword-based) for performance
- AI-powered smart matching using Claude Sonnet 4.5 for semantic skill analysis
- Skill-gap suggestions for candidates

### Module 4: Output Format
- Ranked and categorized candidates: Highly Suitable (≥80%), Moderately Suitable (60-79%), Low Match (50-59%), Not Suitable (<50%)
- Detailed match explanations with score breakdowns

### Module 5: Recent Resume Filter
- Filter matches for resumes uploaded within the last 3 months

## Additional Features
- Bulk upload for resumes and JDs via single files and ZIP archives
- Immediate pop-up of matching results after uploads
- View resume files and detailed match explanations
- Public Candidate Portal (/apply) for external applicants with salary/location preferences

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **AI/LLM:** Claude Sonnet 4.5 via emergentintegrations
- **File Parsing:** pdfplumber, python-docx
- **OCR:** pytesseract, pdf2image

## What's Been Implemented

### Dec 26, 2025 - UI/UX Enhancement
- ✅ Implemented vibrant multi-color theming using full SAPS logo palette (blue, cyan, orange, yellow, magenta)
- ✅ Updated CandidatePortal.js with decorative gradients, watermark, and colorful form sections
- ✅ Updated Sidebar.js with dark modern theme and gradient nav items
- ✅ Updated Header.js with subtle gradient styling
- ✅ Updated Dashboard.js with welcome banner, colored stat cards, and vibrant job listings
- ✅ Updated Jobs.js with multi-color skill badges and filter buttons
- ✅ Updated Resumes.js with colorful table styling and skill badges

### Previous Implementations
- ✅ Full-stack Resume-JD matching application
- ✅ Core matching engine with weighted scoring
- ✅ AI-powered smart matching with Claude Sonnet 4.5
- ✅ OCR support for scanned PDFs
- ✅ Public Candidate Portal with salary/location preferences
- ✅ Bulk upload functionality (single files + ZIP)
- ✅ View/Download/Delete resume functionality
- ✅ Detailed match explanations and skill-gap suggestions

## Outstanding Issues
- P2: Minor React hydration warning (span inside tbody) - Console warning, does not affect functionality

## Backlog / Future Tasks
- P2: Export functionality for candidate lists (CSV/PDF)
- P2: Email templates for contacting shortlisted candidates
- P2: Bulk matching automation on new resume uploads
- P2: Social media sharing for candidate portal link

## Key API Endpoints
- POST /api/resumes/upload - Upload single/multiple resumes
- POST /api/jds/upload - Upload single/multiple JDs
- POST /api/upload-zip - Upload ZIP file with resumes/JDs
- POST /api/public/apply - Public candidate submission
- GET /api/resumes - Fetch all resumes
- GET /api/jobs - Fetch all JDs
- GET /api/jobs/{job_id}/matches - Get candidate matches for a job
- POST /api/match/run - Trigger matching process
- GET /api/resumes/{resume_id}/raw - Get resume raw text

## Database Schema
- **resumes**: { id, name, skills[], experience_years, tools[], certifications[], industry, location, education, upload_date, keyword_vector, current_salary, expected_salary, preferred_location, current_location, raw_text }
- **jds**: { id, title, required_skills[], good_to_have_skills[], min_experience, industry, location, certifications[], status, keyword_vector }
- **matches**: { resume_id, jd_id, total_score, category, explanation }

## Architecture
```
/app/
├── backend/
│   ├── server.py        # FastAPI app, all API logic, matching engine
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # Header, Sidebar, StatCard, etc.
│   │   ├── pages/       # Dashboard, Resumes, Jobs, JobDetail, CandidatePortal
│   │   └── App.js
│   ├── tailwind.config.js
│   └── package.json
└── memory/
    └── PRD.md
```
