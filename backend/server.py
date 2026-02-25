from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import pdfplumber
from docx import Document
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import re
import zipfile
import tempfile
from pdf2image import convert_from_bytes
import pytesseract

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class JDStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    ON_HOLD = "ON_HOLD"

class MatchCategory(str, Enum):
    HIGHLY_SUITABLE = "Highly Suitable"
    MODERATELY_SUITABLE = "Moderately Suitable"
    LOW_MATCH = "Low Match"
    NOT_SUITABLE = "Not Suitable"

class Resume(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = None
    tools: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    industry: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    raw_text: str
    file_content: Optional[bytes] = None
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    parsed_data: Optional[Dict[str, Any]] = None
    # Additional candidate details
    current_location: Optional[str] = None
    preferred_locations: List[str] = Field(default_factory=list)
    current_salary: Optional[str] = None
    expected_salary: Optional[str] = None
    notice_period: Optional[str] = None
    availability: Optional[str] = None
    source: str = "admin_upload"  # "admin_upload" or "candidate_portal"

class ResumeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    filename: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = None
    tools: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    industry: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    upload_date: str

class JobDescriptionCreate(BaseModel):
    title: str
    required_skills: List[str]
    good_to_have_skills: List[str] = Field(default_factory=list)
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    certifications: List[str] = Field(default_factory=list)
    description: str

class JobDescription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    required_skills: List[str]
    good_to_have_skills: List[str] = Field(default_factory=list)
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    certifications: List[str] = Field(default_factory=list)
    description: str
    status: JDStatus = JDStatus.ACTIVE
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobDescriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    required_skills: List[str]
    good_to_have_skills: List[str]
    min_experience: Optional[float]
    max_experience: Optional[float]
    industry: Optional[str]
    location: Optional[str]
    certifications: List[str]
    description: str
    status: str
    created_date: str
    match_count: Optional[int] = 0

class MatchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_id: str
    jd_id: str
    total_score: float
    skill_score: float
    experience_score: float
    tools_score: float
    industry_score: float
    certification_score: float
    location_score: float
    keyword_score: float
    category: MatchCategory
    matched_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchResultResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    resume_id: str
    resume_name: str
    resume_email: Optional[str]
    total_score: float
    category: str
    skill_score: float
    experience_score: float
    tools_score: float
    match_explanation: Optional[Dict[str, Any]] = None

class DashboardStats(BaseModel):
    total_resumes: int
    recent_resumes: int
    total_jds: int
    active_jds: int
    total_matches: int

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        # First try normal text extraction
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            # If text extracted successfully, return it
            if text.strip():
                logging.info(f"PDF text extraction successful: {len(text)} chars")
                return text
            
            # If no text found, try OCR
            logging.info("No text in PDF, attempting OCR...")
        
        # Convert PDF to images and perform OCR
        images = convert_from_bytes(file_bytes, dpi=300)
        ocr_text = ""
        
        for i, image in enumerate(images):
            logging.info(f"Performing OCR on page {i+1}/{len(images)}")
            page_text = pytesseract.image_to_string(image, lang='eng')
            ocr_text += page_text + "\n"
        
        if ocr_text.strip():
            logging.info(f"OCR successful: {len(ocr_text)} chars extracted")
            return ocr_text
        else:
            logging.warning("OCR returned no text")
            return ""
            
    except Exception as e:
        logging.error(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        logging.error(f"Error extracting DOCX: {e}")
        return ""

def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8')
    except Exception as e:
        logging.error(f"Error extracting TXT: {e}")
        return ""

async def parse_resume_with_ai(raw_text: str) -> Dict[str, Any]:
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=llm_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert resume parser. Extract structured information from resumes accurately."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Parse the following resume and extract structured information. Return ONLY valid JSON with these exact fields:
{{
  "name": "candidate full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "skills": ["list of technical and professional skills"],
  "experience_years": numeric value or null,
  "tools": ["list of tools, technologies, software"],
  "certifications": ["list of certifications"],
  "industry": "industry/domain or null",
  "location": "location/city or null",
  "education": "highest education or null"
}}

Resume text:
{raw_text[:4000]}

Return only the JSON object, no additional text."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        json_match = re.search(r'\{[^}]+\}', response.replace('\n', ' '), re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed
        
        return json.loads(response)
    except Exception as e:
        logging.error(f"Error parsing resume with AI: {e}")
        return {}

async def parse_jd_with_ai(raw_text: str) -> Dict[str, Any]:
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=llm_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert job description parser. Extract structured information from job descriptions accurately."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Parse the following job description and extract structured information. Return ONLY valid JSON with these exact fields:
{{
  "title": "job title",
  "description": "full job description text",
  "required_skills": ["list of required skills"],
  "good_to_have_skills": ["list of good to have skills"],
  "min_experience": numeric value in years or null,
  "max_experience": numeric value in years or null,
  "industry": "industry/domain or null",
  "location": "location or null",
  "certifications": ["list of required certifications"]
}}

Job Description text:
{raw_text[:4000]}

Return only the JSON object, no additional text."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        json_match = re.search(r'\{[^}]+\}', response.replace('\n', ' '), re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed
        
        return json.loads(response)
    except Exception as e:
        logging.error(f"Error parsing JD with AI: {e}")
        return {}

async def ai_skill_matcher(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
    """Use AI to intelligently match skills even if worded differently"""
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=llm_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert HR assistant specializing in skill matching."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Analyze if the candidate's skills match the job requirements. Be smart about synonyms and related skills.

Candidate has: {', '.join(candidate_skills[:20])}

Job requires: {', '.join(required_skills[:15])}

Return ONLY valid JSON:
{{
  "matched_skills": [list of required skills that the candidate has or closely matches],
  "match_explanations": {{"skill_name": "why it matches"}},
  "missing_skills": [required skills the candidate doesn't have],
  "overall_reasoning": "brief explanation of the match quality"
}}

Be generous with matches - if CAD and AutoCAD, consider them matching. If "Mechanical design" and "Mechanical systems knowledge", consider them related."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        json_match = re.search(r'\{.*\}', response.replace('\n', ' '), re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"matched_skills": [], "missing_skills": required_skills, "match_explanations": {}}
    except Exception as e:
        logging.error(f"Error in AI skill matcher: {e}")
        return {"matched_skills": [], "missing_skills": required_skills, "match_explanations": {}}

async def calculate_match_score(resume: Dict[str, Any], jd: Dict[str, Any], use_ai: bool = False) -> Dict[str, float]:
    scores = {
        "skill_score": 0.0,
        "experience_score": 0.0,
        "tools_score": 0.0,
        "industry_score": 0.0,
        "certification_score": 0.0,
        "location_score": 0.0,
        "keyword_score": 0.0
    }
    
    explanation = {
        "matched_skills": [],
        "missing_skills": [],
        "experience_detail": "",
        "matched_tools": [],
        "industry_match": False,
        "location_match": False,
        "matched_certifications": []
    }
    
    resume_skills = [s.lower() for s in resume.get('skills', [])]
    resume_tools = [t.lower() for t in resume.get('tools', [])]
    resume_certs = [c.lower() for c in resume.get('certifications', [])]
    
    jd_required = [s.lower() for s in jd.get('required_skills', [])]
    jd_good_to_have = [s.lower() for s in jd.get('good_to_have_skills', [])]
    jd_certs = [c.lower() for c in jd.get('certifications', [])]
    
    # Fast keyword matching first
    def skills_match(resume_skill, jd_skill):
        if resume_skill == jd_skill or jd_skill in resume_skill or resume_skill in jd_skill:
            return True
        resume_base = resume_skill.replace(' skills', '').replace('skills', '').strip()
        jd_base = jd_skill.replace(' skills', '').replace('skills', '').strip()
        if resume_base == jd_base or jd_base in resume_base or resume_base in jd_base:
            return True
        return False
    
    if jd_required:
        if use_ai:
            # Use AI for better matching (slower but smarter)
            ai_match = await ai_skill_matcher(resume_skills + resume_tools, jd_required)
            explanation['matched_skills'] = ai_match.get('matched_skills', [])
            explanation['missing_skills'] = ai_match.get('missing_skills', [])
            explanation['match_explanations'] = ai_match.get('match_explanations', {})
            explanation['ai_reasoning'] = ai_match.get('overall_reasoning', '')
        else:
            # Fast keyword matching
            for jd_skill in jd_required:
                matched = False
                for resume_skill in resume_skills + resume_tools:
                    if skills_match(resume_skill, jd_skill):
                        explanation['matched_skills'].append(jd_skill)
                        matched = True
                        break
                if not matched:
                    explanation['missing_skills'].append(jd_skill)
        
        required_matches = len(explanation['matched_skills'])
        scores['skill_score'] = (required_matches / len(jd_required)) * 40
        
        # Add suggestions if score is low
        current_total_estimate = scores['skill_score'] + 20 + 15  # Base estimate with exp + tools
        if current_total_estimate < 50:
            skills_needed_for_50 = []
            points_needed = 50 - current_total_estimate
            skills_to_add = int((points_needed / 40) * len(jd_required)) + 1
            
            missing_count = len(explanation['missing_skills'])
            if missing_count > 0:
                skills_to_suggest = min(skills_to_add, missing_count, 3)
                skills_needed_for_50 = explanation['missing_skills'][:skills_to_suggest]
                explanation['suggestion'] = f"To reach 50%+ match, consider adding these skills: {', '.join(skills_needed_for_50)}"
    else:
        scores['skill_score'] = 40
    
    if jd.get('min_experience') and resume.get('experience_years'):
        exp_diff = resume['experience_years'] - jd['min_experience']
        if exp_diff >= 0:
            scores['experience_score'] = 20
            explanation['experience_detail'] = f"Has {resume['experience_years']}y experience (required: {jd['min_experience']}y) ✓"
        elif exp_diff >= -2:
            scores['experience_score'] = 15
            explanation['experience_detail'] = f"Has {resume['experience_years']}y experience, slightly below {jd['min_experience']}y requirement"
        else:
            scores['experience_score'] = 10
            explanation['experience_detail'] = f"Has {resume['experience_years']}y experience, below {jd['min_experience']}y requirement"
    else:
        scores['experience_score'] = 20
        explanation['experience_detail'] = "Experience requirement met"
    
    all_jd_skills = jd_required + jd_good_to_have
    if all_jd_skills:
        for tool in resume_tools:
            if any(jd_skill in tool or tool in jd_skill for jd_skill in all_jd_skills):
                explanation['matched_tools'].append(tool)
        
        tool_matches = len(explanation['matched_tools'])
        scores['tools_score'] = min((tool_matches / len(resume_tools) if resume_tools else 0) * 15, 15)
    else:
        scores['tools_score'] = 15
    
    if jd.get('industry') and resume.get('industry'):
        if jd['industry'].lower() in resume['industry'].lower() or resume['industry'].lower() in jd['industry'].lower():
            scores['industry_score'] = 10
            explanation['industry_match'] = True
        else:
            scores['industry_score'] = 5
    else:
        scores['industry_score'] = 10
        explanation['industry_match'] = True
    
    if jd_certs and resume_certs:
        for cert in jd_certs:
            if cert in resume_certs:
                explanation['matched_certifications'].append(cert)
        
        cert_matches = len(explanation['matched_certifications'])
        scores['certification_score'] = (cert_matches / len(jd_certs)) * 5
    else:
        scores['certification_score'] = 5
    
    if jd.get('location') and resume.get('location'):
        if jd['location'].lower() in resume['location'].lower() or resume['location'].lower() in jd['location'].lower() or 'remote' in jd['location'].lower():
            scores['location_score'] = 5
            explanation['location_match'] = True
        else:
            scores['location_score'] = 2
    else:
        scores['location_score'] = 5
        explanation['location_match'] = True
    
    resume_text = ' '.join(resume_skills + resume_tools).lower()
    jd_text = ' '.join(jd_required + jd_good_to_have).lower()
    common_words = set(resume_text.split()) & set(jd_text.split())
    scores['keyword_score'] = min(len(common_words) * 0.5, 5)
    
    # Return both scores and explanation separately
    return {
        'skill_score': scores['skill_score'],
        'experience_score': scores['experience_score'],
        'tools_score': scores['tools_score'],
        'industry_score': scores['industry_score'],
        'certification_score': scores['certification_score'],
        'location_score': scores['location_score'],
        'keyword_score': scores['keyword_score'],
        'explanation': explanation
    }

def categorize_score(total_score: float) -> MatchCategory:
    if total_score >= 80:
        return MatchCategory.HIGHLY_SUITABLE
    elif total_score >= 60:
        return MatchCategory.MODERATELY_SUITABLE
    elif total_score >= 50:
        return MatchCategory.LOW_MATCH
    else:
        return MatchCategory.NOT_SUITABLE

@api_router.post("/resumes/upload-bulk", response_model=List[ResumeResponse])
async def upload_bulk_resumes(files: List[UploadFile] = File(...)):
    uploaded_resumes = []
    
    for file in files:
        try:
            file_bytes = await file.read()
            filename = file.filename.lower()
            
            if filename.endswith('.pdf'):
                raw_text = extract_text_from_pdf(file_bytes)
            elif filename.endswith('.docx'):
                raw_text = extract_text_from_docx(file_bytes)
            elif filename.endswith('.txt'):
                raw_text = extract_text_from_txt(file_bytes)
            else:
                continue
            
            if not raw_text.strip():
                continue
            
            parsed_data = await parse_resume_with_ai(raw_text)
            
            resume = Resume(
                filename=file.filename,
                name=parsed_data.get('name'),
                email=parsed_data.get('email'),
                phone=parsed_data.get('phone'),
                skills=parsed_data.get('skills', []),
                experience_years=parsed_data.get('experience_years'),
                tools=parsed_data.get('tools', []),
                certifications=parsed_data.get('certifications', []),
                industry=parsed_data.get('industry'),
                location=parsed_data.get('location'),
                education=parsed_data.get('education'),
                raw_text=raw_text,
                parsed_data=parsed_data
            )
            
            doc = resume.model_dump()
            doc['upload_date'] = doc['upload_date'].isoformat()
            await db.resumes.insert_one(doc)
            
            uploaded_resumes.append(ResumeResponse(
                id=resume.id,
                filename=resume.filename,
                name=resume.name,
                email=resume.email,
                phone=resume.phone,
                skills=resume.skills,
                experience_years=resume.experience_years,
                tools=resume.tools,
                certifications=resume.certifications,
                industry=resume.industry,
                location=resume.location,
                education=resume.education,
                upload_date=resume.upload_date.isoformat()
            ))
            
        except Exception as e:
            logging.error(f"Error processing file {file.filename}: {e}")
            continue
    
    return uploaded_resumes

@api_router.post("/jobs/upload-bulk", response_model=List[JobDescriptionResponse])
async def upload_bulk_jds(files: List[UploadFile] = File(...)):
    uploaded_jds = []
    
    for file in files:
        try:
            file_bytes = await file.read()
            filename = file.filename.lower()
            
            if filename.endswith('.pdf'):
                raw_text = extract_text_from_pdf(file_bytes)
            elif filename.endswith('.docx'):
                raw_text = extract_text_from_docx(file_bytes)
            elif filename.endswith('.txt'):
                raw_text = extract_text_from_txt(file_bytes)
            else:
                continue
            
            if not raw_text.strip():
                continue
            
            parsed_data = await parse_jd_with_ai(raw_text)
            
            jd = JobDescription(
                title=parsed_data.get('title', 'Untitled Position'),
                description=parsed_data.get('description', raw_text[:500]),
                required_skills=parsed_data.get('required_skills', []),
                good_to_have_skills=parsed_data.get('good_to_have_skills', []),
                min_experience=parsed_data.get('min_experience'),
                max_experience=parsed_data.get('max_experience'),
                industry=parsed_data.get('industry'),
                location=parsed_data.get('location'),
                certifications=parsed_data.get('certifications', [])
            )
            
            doc = jd.model_dump()
            doc['created_date'] = doc['created_date'].isoformat()
            doc['status'] = doc['status'].value
            await db.job_descriptions.insert_one(doc)
            
            uploaded_jds.append(JobDescriptionResponse(
                id=jd.id,
                title=jd.title,
                required_skills=jd.required_skills,
                good_to_have_skills=jd.good_to_have_skills,
                min_experience=jd.min_experience,
                max_experience=jd.max_experience,
                industry=jd.industry,
                location=jd.location,
                certifications=jd.certifications,
                description=jd.description,
                status=jd.status.value,
                created_date=jd.created_date.isoformat(),
                match_count=0
            ))
            
        except Exception as e:
            logging.error(f"Error processing JD file {file.filename}: {e}")
            continue
    
    return uploaded_jds

@api_router.post("/upload-zip")
async def upload_zip_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported")
    
    resumes_uploaded = []
    jds_uploaded = []
    
    try:
        file_bytes = await file.read()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = Path(temp_dir) / "upload.zip"
            zip_path.write_bytes(file_bytes)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            for root, dirs, files in os.walk(temp_dir):
                for filename in files:
                    if filename.startswith('.') or filename.startswith('__MACOSX'):
                        continue
                    
                    file_path = Path(root) / filename
                    filename_lower = filename.lower()
                    
                    if not (filename_lower.endswith('.pdf') or filename_lower.endswith('.docx') or filename_lower.endswith('.txt')):
                        continue
                    
                    try:
                        with open(file_path, 'rb') as f:
                            file_content = f.read()
                        
                        if filename_lower.endswith('.pdf'):
                            raw_text = extract_text_from_pdf(file_content)
                        elif filename_lower.endswith('.docx'):
                            raw_text = extract_text_from_docx(file_content)
                        elif filename_lower.endswith('.txt'):
                            raw_text = extract_text_from_txt(file_content)
                        else:
                            continue
                        
                        if not raw_text.strip():
                            continue
                        
                        is_resume = await detect_file_type(raw_text)
                        
                        if is_resume:
                            parsed_data = await parse_resume_with_ai(raw_text)
                            resume = Resume(
                                filename=filename,
                                name=parsed_data.get('name'),
                                email=parsed_data.get('email'),
                                phone=parsed_data.get('phone'),
                                skills=parsed_data.get('skills', []),
                                experience_years=parsed_data.get('experience_years'),
                                tools=parsed_data.get('tools', []),
                                certifications=parsed_data.get('certifications', []),
                                industry=parsed_data.get('industry'),
                                location=parsed_data.get('location'),
                                education=parsed_data.get('education'),
                                raw_text=raw_text,
                                parsed_data=parsed_data
                            )
                            
                            doc = resume.model_dump()
                            doc['upload_date'] = doc['upload_date'].isoformat()
                            await db.resumes.insert_one(doc)
                            resumes_uploaded.append(resume.name or filename)
                        else:
                            parsed_data = await parse_jd_with_ai(raw_text)
                            jd = JobDescription(
                                title=parsed_data.get('title', filename.replace('.pdf', '').replace('.docx', '').replace('.txt', '')),
                                description=parsed_data.get('description', raw_text[:500]),
                                required_skills=parsed_data.get('required_skills', []),
                                good_to_have_skills=parsed_data.get('good_to_have_skills', []),
                                min_experience=parsed_data.get('min_experience'),
                                max_experience=parsed_data.get('max_experience'),
                                industry=parsed_data.get('industry'),
                                location=parsed_data.get('location'),
                                certifications=parsed_data.get('certifications', [])
                            )
                            
                            doc = jd.model_dump()
                            doc['created_date'] = doc['created_date'].isoformat()
                            doc['status'] = doc['status'].value
                            await db.job_descriptions.insert_one(doc)
                            jds_uploaded.append(jd.title)
                    
                    except Exception as e:
                        logging.error(f"Error processing file {filename} from ZIP: {e}")
                        continue
    
    except Exception as e:
        logging.error(f"Error processing ZIP file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing ZIP file: {str(e)}")
    
    return {
        "message": "ZIP file processed successfully",
        "resumes_uploaded": len(resumes_uploaded),
        "jds_uploaded": len(jds_uploaded),
        "resume_names": resumes_uploaded,
        "jd_titles": jds_uploaded
    }

async def detect_file_type(text: str) -> bool:
    """Detect if a document is a resume (True) or job description (False)"""
    text_lower = text.lower()
    
    resume_keywords = ['resume', 'cv', 'curriculum vitae', 'education', 'work experience', 'professional experience']
    jd_keywords = ['job description', 'responsibilities', 'requirements', 'qualifications', 'we are looking for', 'the ideal candidate']
    
    resume_score = sum(1 for keyword in resume_keywords if keyword in text_lower)
    jd_score = sum(1 for keyword in jd_keywords if keyword in text_lower)
    
    if resume_score > jd_score:
        return True
    elif jd_score > resume_score:
        return False
    else:
        if 'resume' in text_lower or 'cv' in text_lower:
            return True
        return True

@api_router.get("/resumes", response_model=List[ResumeResponse])
async def get_resumes(recent_only: bool = False):
    query = {}
    if recent_only:
        three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
        query['upload_date'] = {'$gte': three_months_ago.isoformat()}
    
    resumes = await db.resumes.find(query, {"_id": 0, "raw_text": 0}).sort("upload_date", -1).to_list(10000)
    
    return [
        ResumeResponse(
            id=r['id'],
            filename=r['filename'],
            name=r.get('name'),
            email=r.get('email'),
            phone=r.get('phone'),
            skills=r.get('skills', []),
            experience_years=r.get('experience_years'),
            tools=r.get('tools', []),
            certifications=r.get('certifications', []),
            industry=r.get('industry'),
            location=r.get('location'),
            education=r.get('education'),
            upload_date=r['upload_date']
        )
        for r in resumes
    ]

@api_router.get("/resumes/{resume_id}", response_model=Resume)
async def get_resume(resume_id: str):
    resume = await db.resumes.find_one({"id": resume_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if isinstance(resume.get('upload_date'), str):
        resume['upload_date'] = datetime.fromisoformat(resume['upload_date'])
    
    return Resume(**resume)

@api_router.get("/resumes/{resume_id}/raw")
async def get_resume_raw_text(resume_id: str):
    resume = await db.resumes.find_one({"id": resume_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "id": resume['id'],
        "name": resume.get('name'),
        "filename": resume['filename'],
        "raw_text": resume.get('raw_text', ''),
        "parsed_data": resume.get('parsed_data', {})
    }

@api_router.get("/resumes/{resume_id}/matching-jobs")
async def get_matching_jobs_for_resume(resume_id: str, min_score: float = 50, use_ai: bool = False):
    """Get top matching jobs for a specific resume"""
    resume = await db.resumes.find_one({"id": resume_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get all active jobs
    active_jds = await db.job_descriptions.find({"status": "ACTIVE"}, {"_id": 0}).to_list(100)
    
    matches = []
    for jd in active_jds:
        scores = await calculate_match_score(resume, jd, use_ai=use_ai)
        total_score = (
            scores['skill_score'] + 
            scores['experience_score'] + 
            scores['tools_score'] + 
            scores['industry_score'] + 
            scores['certification_score'] + 
            scores['location_score'] + 
            scores['keyword_score']
        )
        
        if total_score >= min_score:
            category = categorize_score(total_score)
            matches.append({
                "jd_id": jd['id'],
                "jd_title": jd['title'],
                "total_score": round(total_score, 2),
                "category": category.value,
                "skill_score": round(scores['skill_score'], 2),
                "experience_score": round(scores['experience_score'], 2),
                "explanation": scores.get('explanation', {})
            })
    
    # Sort by score descending
    matches.sort(key=lambda x: x['total_score'], reverse=True)
    return matches[:5]  # Return top 5 matches

@api_router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    result = await db.resumes.delete_one({"id": resume_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    await db.matches.delete_many({"resume_id": resume_id})
    return {"message": "Resume deleted successfully"}

@api_router.post("/jobs", response_model=JobDescriptionResponse)
async def create_job(job: JobDescriptionCreate):
    jd = JobDescription(**job.model_dump())
    doc = jd.model_dump()
    doc['created_date'] = doc['created_date'].isoformat()
    doc['status'] = doc['status'].value
    
    await db.job_descriptions.insert_one(doc)
    
    return JobDescriptionResponse(
        id=jd.id,
        title=jd.title,
        required_skills=jd.required_skills,
        good_to_have_skills=jd.good_to_have_skills,
        min_experience=jd.min_experience,
        max_experience=jd.max_experience,
        industry=jd.industry,
        location=jd.location,
        certifications=jd.certifications,
        description=jd.description,
        status=jd.status.value,
        created_date=jd.created_date.isoformat(),
        match_count=0
    )

@api_router.get("/jobs", response_model=List[JobDescriptionResponse])
async def get_jobs(status: Optional[str] = None):
    query = {}
    if status:
        query['status'] = status
    
    jobs = await db.job_descriptions.find(query, {"_id": 0}).sort("created_date", -1).to_list(1000)
    
    results = []
    for j in jobs:
        match_count = await db.matches.count_documents({"jd_id": j['id']})
        results.append(JobDescriptionResponse(
            id=j['id'],
            title=j['title'],
            required_skills=j.get('required_skills', []),
            good_to_have_skills=j.get('good_to_have_skills', []),
            min_experience=j.get('min_experience'),
            max_experience=j.get('max_experience'),
            industry=j.get('industry'),
            location=j.get('location'),
            certifications=j.get('certifications', []),
            description=j.get('description', ''),
            status=j['status'],
            created_date=j['created_date'],
            match_count=match_count
        ))
    
    return results

@api_router.get("/jobs/{jd_id}", response_model=JobDescriptionResponse)
async def get_job(jd_id: str):
    job = await db.job_descriptions.find_one({"id": jd_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    match_count = await db.matches.count_documents({"jd_id": jd_id})
    
    return JobDescriptionResponse(
        id=job['id'],
        title=job['title'],
        required_skills=job.get('required_skills', []),
        good_to_have_skills=job.get('good_to_have_skills', []),
        min_experience=job.get('min_experience'),
        max_experience=job.get('max_experience'),
        industry=job.get('industry'),
        location=job.get('location'),
        certifications=job.get('certifications', []),
        description=job.get('description', ''),
        status=job['status'],
        created_date=job['created_date'],
        match_count=match_count
    )

@api_router.put("/jobs/{jd_id}/status")
async def update_job_status(jd_id: str, status: JDStatus):
    result = await db.job_descriptions.update_one(
        {"id": jd_id},
        {"$set": {"status": status.value}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    return {"message": "Job status updated successfully"}

@api_router.delete("/jobs/{jd_id}")
async def delete_job(jd_id: str):
    result = await db.job_descriptions.delete_one({"id": jd_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    await db.matches.delete_many({"jd_id": jd_id})
    return {"message": "Job description deleted successfully"}

@api_router.post("/match/run")
async def run_matching(jd_id: Optional[str] = None):
    query = {"status": "ACTIVE"}
    if jd_id:
        query['id'] = jd_id
    
    active_jds = await db.job_descriptions.find(query, {"_id": 0}).to_list(100)
    
    if not active_jds:
        return {"message": "No active job descriptions found", "matches_created": 0}
    
    resumes = await db.resumes.find({}, {"_id": 0}).to_list(10000)
    
    if not resumes:
        return {"message": "No resumes found", "matches_created": 0}
    
    matches_created = 0
    
    for jd in active_jds:
        await db.matches.delete_many({"jd_id": jd['id']})
        
        for resume in resumes:
            scores = await calculate_match_score(resume, jd)
            
            # Calculate total score excluding explanation
            total_score = (
                scores['skill_score'] + 
                scores['experience_score'] + 
                scores['tools_score'] + 
                scores['industry_score'] + 
                scores['certification_score'] + 
                scores['location_score'] + 
                scores['keyword_score']
            )
            category = categorize_score(total_score)
            
            match = MatchResult(
                resume_id=resume['id'],
                jd_id=jd['id'],
                total_score=round(total_score, 2),
                skill_score=round(scores['skill_score'], 2),
                experience_score=round(scores['experience_score'], 2),
                tools_score=round(scores['tools_score'], 2),
                industry_score=round(scores['industry_score'], 2),
                certification_score=round(scores['certification_score'], 2),
                location_score=round(scores['location_score'], 2),
                keyword_score=round(scores['keyword_score'], 2),
                category=category
            )
            
            doc = match.model_dump()
            doc['matched_date'] = doc['matched_date'].isoformat()
            doc['category'] = doc['category'].value
            await db.matches.insert_one(doc)
            matches_created += 1
    
    return {"message": "Matching completed successfully", "matches_created": matches_created}

@api_router.get("/match/results/{jd_id}", response_model=List[MatchResultResponse])
async def get_match_results(jd_id: str, min_score: float = 0, include_explanation: bool = False, use_ai: bool = False):
    matches = await db.matches.find(
        {"jd_id": jd_id, "total_score": {"$gte": min_score}},
        {"_id": 0}
    ).sort("total_score", -1).to_list(10000)
    
    results = []
    for match in matches:
        resume = await db.resumes.find_one({"id": match['resume_id']}, {"_id": 0})
        if resume:
            match_response = MatchResultResponse(
                resume_id=match['resume_id'],
                resume_name=resume.get('name', 'Unknown'),
                resume_email=resume.get('email'),
                total_score=match['total_score'],
                category=match['category'],
                skill_score=match['skill_score'],
                experience_score=match['experience_score'],
                tools_score=match['tools_score']
            )
            
            if include_explanation:
                # Recalculate with optional AI for explanation
                jd = await db.job_descriptions.find_one({"id": jd_id}, {"_id": 0})
                if jd:
                    scores = await calculate_match_score(resume, jd, use_ai=use_ai)
                    match_response.match_explanation = scores.get('explanation', {})
            
            results.append(match_response)
    
    return results

@api_router.get("/match/recent")
async def get_recent_matches(jd_id: Optional[str] = None):
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    recent_resumes = await db.resumes.find(
        {"upload_date": {"$gte": three_months_ago.isoformat()}},
        {"_id": 0}
    ).to_list(10000)
    
    if not recent_resumes:
        return {"message": "No recent resumes found", "results": []}
    
    query = {"status": "ACTIVE"}
    if jd_id:
        query['id'] = jd_id
    
    active_jds = await db.job_descriptions.find(query, {"_id": 0}).to_list(100)
    
    if not active_jds:
        return {"message": "No active job descriptions found", "results": []}
    
    results = []
    for jd in active_jds:
        jd_matches = []
        for resume in recent_resumes:
            scores = await calculate_match_score(resume, jd)
            total_score = sum(scores.values())
            
            if total_score >= 50:
                jd_matches.append({
                    "resume_name": resume.get('name', 'Unknown'),
                    "total_score": round(total_score, 2),
                    "category": categorize_score(total_score).value
                })
        
        jd_matches.sort(key=lambda x: x['total_score'], reverse=True)
        results.append({
            "jd_title": jd['title'],
            "jd_id": jd['id'],
            "matches": jd_matches
        })
    
    return {"message": "Recent matching completed", "results": results}

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    total_resumes = await db.resumes.count_documents({})
    
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    recent_resumes = await db.resumes.count_documents(
        {"upload_date": {"$gte": three_months_ago.isoformat()}}
    )
    
    total_jds = await db.job_descriptions.count_documents({})
    active_jds = await db.job_descriptions.count_documents({"status": "ACTIVE"})
    total_matches = await db.matches.count_documents({})
    
    return DashboardStats(
        total_resumes=total_resumes,
        recent_resumes=recent_resumes,
        total_jds=total_jds,
        active_jds=active_jds,
        total_matches=total_matches
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()