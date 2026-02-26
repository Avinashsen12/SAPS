import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import ScoreBar from '@/components/ScoreBar';
import StatusBadge from '@/components/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileText, Trash2, Calendar, Mail, MapPin, X, ExternalLink, Eye, Download, ChevronDown, ChevronRight, Briefcase, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeContent, setResumeContent] = useState(null);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [loadingMatches, setLoadingMatches] = useState({});

  useEffect(() => {
    fetchResumes();
  }, [recentOnly]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/resumes?recent_only=${recentOnly}`);
      setResumes(response.data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API}/resumes/upload-bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Successfully uploaded ${response.data.length} resume(s)`);
      
      // Auto-match and show results
      const resumeIds = response.data.map(r => r.id);
      await autoMatchResumes(resumeIds);
      
      fetchResumes();
    } catch (error) {
      console.error('Error uploading resumes:', error);
      toast.error('Failed to upload resumes');
    } finally {
      setUploading(false);
    }
  };

  const handleZipUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please upload a ZIP file');
      return;
    }

    setUploadingZip(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-zip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Successfully uploaded: ${response.data.resumes_uploaded} resume(s)`);
      
      // Get uploaded resume IDs and auto-match
      fetchResumes();
      const jobsResponse = await axios.get(`${API}/jobs?status=ACTIVE`);
      if (jobsResponse.data.length > 0) {
        toast.info('Matching resumes with active jobs...');
        await axios.post(`${API}/match/run`);
        toast.success('Matching completed! Check job details for results.');
      }
    } catch (error) {
      console.error('Error uploading ZIP:', error);
      toast.error('Failed to process ZIP file');
    } finally {
      setUploadingZip(false);
    }
  };

  const autoMatchResumes = async (resumeIds) => {
    try {
      const jobsResponse = await axios.get(`${API}/jobs?status=ACTIVE`);
      if (jobsResponse.data.length === 0) {
        toast.info('No active jobs to match against');
        return;
      }
      
      toast.info('Finding matching jobs...');
      await axios.post(`${API}/match/run`);
      
      // Fetch match results for the uploaded resumes
      const allMatches = [];
      for (const jd of jobsResponse.data) {
        const matchRes = await axios.get(`${API}/match/results/${jd.id}?min_score=50`);
        const resumeMatches = matchRes.data.filter(m => resumeIds.includes(m.resume_id));
        if (resumeMatches.length > 0) {
          allMatches.push({
            job: jd,
            matches: resumeMatches
          });
        }
      }
      
      if (allMatches.length > 0) {
        setMatchResults(allMatches);
        toast.success(`Found ${allMatches.length} matching job(s)!`);
      } else {
        toast.info('No matches found with score ≥ 50%');
      }
    } catch (error) {
      console.error('Error matching resumes:', error);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      await axios.delete(`${API}/resumes/${resumeId}`);
      toast.success('Resume deleted successfully');
      fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const toggleSkills = (resumeId) => {
    setExpandedSkills(prev => ({
      ...prev,
      [resumeId]: !prev[resumeId]
    }));
  };

  const handleViewResume = async (resumeId) => {
    try {
      const response = await axios.get(`${API}/resumes/${resumeId}/raw`);
      setResumeContent(response.data);
      setShowResumeDialog(true);
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast.error('Failed to load resume');
    }
  };

  const handleDownloadResume = (resume) => {
    const element = document.createElement('a');
    const file = new Blob([resume.raw_text || 'No content'], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = resume.filename || `${resume.name}_resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Resume downloaded');
  };

  const toggleMatchingJobs = async (resumeId) => {
    if (expandedMatches[resumeId]) {
      setExpandedMatches(prev => ({...prev, [resumeId]: null}));
      return;
    }

    setLoadingMatches(prev => ({...prev, [resumeId]: true}));
    try {
      const response = await axios.get(`${API}/resumes/${resumeId}/matching-jobs?min_score=40`);
      setExpandedMatches(prev => ({...prev, [resumeId]: response.data}));
    } catch (error) {
      console.error('Error fetching matching jobs:', error);
      toast.error('Failed to load matching jobs');
    } finally {
      setLoadingMatches(prev => ({...prev, [resumeId]: false}));
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-brand-cyan/5 to-brand-magenta/5 min-h-screen">
      <Header
        title="Resume Database"
        subtitle={`${resumes.length} resume(s) in database`}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setRecentOnly(!recentOnly)}
              className={recentOnly ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'border-slate-200'}
              data-testid="filter-recent-button"
            >
              {recentOnly ? 'Show All' : 'Recent Only (≤3 months)'}
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById('zip-upload-resumes').click()}
              disabled={uploadingZip}
              className="border-brand-orange/30 hover:border-brand-orange hover:bg-brand-orange/10"
              data-testid="upload-zip-resumes-button"
            >
              <Upload size={16} className="mr-2 text-brand-orange" />
              {uploadingZip ? 'Processing ZIP...' : 'Upload ZIP'}
            </Button>
            <input
              id="zip-upload-resumes"
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
              data-testid="zip-upload-resumes-input"
            />
            <Button
              className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white hover:from-brand-cyan hover:to-brand-blue shadow-lg"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={uploading}
              data-testid="upload-resumes-button"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resumes'}
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="file-upload-input"
            />
          </div>
        }
      />

      <div className="p-8">
        {matchResults && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-brand-cyan/20 p-6 mb-6 shadow-lg rounded-xl" data-testid="match-results-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta to-pink-400 flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-900">Matching Jobs Found</h2>
                  <p className="text-sm text-slate-500">Jobs that match your uploaded resumes</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMatchResults(null)} className="hover:bg-red-50 hover:text-red-500" data-testid="close-match-results">
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              {matchResults.map((result, idx) => (
                <div key={idx} className="border-2 border-slate-100 rounded-xl p-4 hover:border-brand-magenta/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        idx === 0 ? 'bg-brand-cyan' : 
                        idx === 1 ? 'bg-brand-orange' : 
                        'bg-brand-magenta'
                      }`} />
                      <h3 className="font-bold text-slate-900">{result.job.title}</h3>
                      <StatusBadge status={result.job.status} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/jobs/${result.job.id}`, '_blank')}
                      className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-white"
                      data-testid={`view-job-${result.job.id}`}
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {result.matches.map((match) => (
                      <div key={match.resume_id} className="bg-gradient-to-r from-slate-50 to-brand-magenta/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-slate-900">{match.resume_name}</p>
                          <span className={`font-mono font-bold ${
                            match.total_score >= 80 ? 'text-green-600' :
                            match.total_score >= 60 ? 'text-brand-yellow' :
                            'text-brand-orange'
                          }`}>
                            {match.total_score.toFixed(1)}%
                          </span>
                        </div>
                        <ScoreBar score={match.total_score} category={match.category} />
                        <p className="text-xs text-slate-600 mt-2">
                          <span className="font-medium text-brand-blue">{match.category}</span> • 
                          Skills: <span className="text-brand-cyan">{match.skill_score.toFixed(1)}%</span> • 
                          Experience: <span className="text-brand-orange">{match.experience_score.toFixed(1)}%</span> • 
                          Tools: <span className="text-brand-magenta">{match.tools_score.toFixed(1)}%</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
              Loading resumes...
            </div>
          </div>
        ) : resumes.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-cyan/20 p-12 text-center rounded-xl" data-testid="empty-resumes-state">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 rounded-2xl flex items-center justify-center mb-4">
              <Users size={40} className="text-brand-cyan" />
            </div>
            <p className="text-slate-600 mb-4 font-medium">No resumes uploaded yet</p>
            <Button
              onClick={() => document.getElementById('file-upload-empty').click()}
              className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white hover:from-brand-cyan hover:to-brand-blue"
              data-testid="upload-first-resume-button"
            >
              Upload Your First Resume
            </Button>
            <input
              id="file-upload-empty"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </Card>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-100 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-sm text-left" data-testid="resumes-table">
              <thead className="bg-gradient-to-r from-brand-blue/5 to-brand-cyan/5 text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-4 border-b border-slate-100">Candidate Name</th>
                  <th className="px-4 py-4 border-b border-slate-100">Contact</th>
                  <th className="px-4 py-4 border-b border-slate-100">Skills</th>
                  <th className="px-4 py-4 border-b border-slate-100">Experience</th>
                  <th className="px-4 py-4 border-b border-slate-100">Upload Date</th>
                  <th className="px-4 py-4 border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume, index) => (
                  <React.Fragment key={resume.id}>
                    <tr
                      className="border-b border-slate-50 hover:bg-gradient-to-r hover:from-white hover:to-brand-cyan/5 transition-all"
                      data-testid={`resume-row-${resume.id}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMatchingJobs(resume.id)}
                            className="text-slate-400 hover:text-brand-cyan transition-colors"
                          >
                            {expandedMatches[resume.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div className={`w-2 h-2 rounded-full ${
                            index % 4 === 0 ? 'bg-brand-blue' : 
                            index % 4 === 1 ? 'bg-brand-cyan' : 
                            index % 4 === 2 ? 'bg-brand-orange' : 
                            'bg-brand-magenta'
                          }`} />
                          <div>
                            <p className="font-medium text-slate-900">{resume.name || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{resume.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {resume.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Mail size={12} />
                              {resume.email}
                            </div>
                          )}
                          {resume.location && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <MapPin size={12} />
                              {resume.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(expandedSkills[resume.id] ? resume.skills : resume.skills.slice(0, 3)).map((skill, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                idx % 3 === 0 ? 'bg-brand-blue/10 text-brand-blue' : 
                                idx % 3 === 1 ? 'bg-brand-cyan/10 text-brand-cyan' : 
                                'bg-brand-orange/10 text-brand-orange'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.skills.length > 3 && (
                            <button
                              onClick={() => toggleSkills(resume.id)}
                              className="px-2 py-0.5 bg-brand-magenta/10 text-brand-magenta text-xs rounded-full hover:bg-brand-magenta/20 transition-colors font-medium"
                            >
                              {expandedSkills[resume.id] ? 'Show Less' : `+${resume.skills.length - 3} more`}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm">
                          {resume.experience_years ? `${resume.experience_years}y` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar size={12} />
                          {new Date(resume.upload_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewResume(resume.id)}
                            data-testid={`view-resume-${resume.id}`}
                            title="View Resume"
                            className="hover:bg-brand-blue/10"
                          >
                            <Eye size={16} className="text-brand-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadResume(resume)}
                            data-testid={`download-resume-${resume.id}`}
                            title="Download Resume"
                            className="hover:bg-green-50"
                          >
                            <Download size={16} className="text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(resume.id)}
                            data-testid={`delete-resume-${resume.id}`}
                            title="Delete Resume"
                            className="hover:bg-red-50"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedMatches[resume.id] && (
                      <tr className="bg-gradient-to-r from-brand-cyan/5 to-brand-magenta/5">
                        <td colSpan="6" className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center">
                              <Briefcase size={14} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-3">Matching Job Descriptions (Score ≥ 40%)</p>
                              {loadingMatches[resume.id] ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                  Loading matches...
                                </div>
                              ) : expandedMatches[resume.id].length === 0 ? (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                  <p className="text-sm text-amber-800 font-medium mb-2">No matches found (score ≥ 40%)</p>
                                  <p className="text-xs text-amber-700">
                                    Consider adding more relevant skills or updating your resume to match active job requirements.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {expandedMatches[resume.id].map((match, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white border-2 border-slate-100 rounded-xl p-4 hover:border-brand-cyan/30 transition-all"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${
                                              idx % 3 === 0 ? 'bg-brand-cyan' : 
                                              idx % 3 === 1 ? 'bg-brand-orange' : 
                                              'bg-brand-magenta'
                                            }`} />
                                            <p className="font-semibold text-slate-900">{match.jd_title}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              match.total_score >= 80 ? 'bg-green-100 text-green-700' :
                                              match.total_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                              match.total_score >= 50 ? 'bg-orange-100 text-orange-700' :
                                              'bg-red-100 text-red-700'
                                            }`}>
                                              {match.category}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-600">
                                            Skills: <span className="text-brand-cyan font-medium">{match.skill_score}%</span> • 
                                            Experience: <span className="text-brand-orange font-medium">{match.experience_score}%</span>
                                          </p>
                                          {match.explanation && match.explanation.suggestion && (
                                            <div className="mt-2 bg-gradient-to-r from-amber-50 to-orange-50 border-l-3 border-brand-orange p-2 rounded-r text-xs text-amber-800">
                                              <strong>Tip:</strong> {match.explanation.suggestion}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                          <span className={`font-mono text-xl font-bold ${
                                            match.total_score >= 80 ? 'text-green-600' :
                                            match.total_score >= 60 ? 'text-brand-yellow' :
                                            match.total_score >= 50 ? 'text-brand-orange' :
                                            'text-red-600'
                                          }`}>
                                            {match.total_score}%
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/jobs/${match.jd_id}`, '_blank')}
                                            className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-white"
                                          >
                                            <ExternalLink size={14} className="mr-1" />
                                            View Job
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume: {resumeContent?.name || 'Unknown'}</DialogTitle>
          </DialogHeader>
          {resumeContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">File Name</p>
                  <p className="font-semibold">{resumeContent.filename}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Candidate Name</p>
                  <p className="font-semibold">{resumeContent.name || 'N/A'}</p>
                </div>
              </div>

              {resumeContent.parsed_data && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Parsed Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {resumeContent.parsed_data.email && (
                      <div>
                        <p className="text-slate-500">Email</p>
                        <p className="font-medium">{resumeContent.parsed_data.email}</p>
                      </div>
                    )}
                    {resumeContent.parsed_data.phone && (
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-medium">{resumeContent.parsed_data.phone}</p>
                      </div>
                    )}
                    {resumeContent.parsed_data.location && (
                      <div>
                        <p className="text-slate-500">Location</p>
                        <p className="font-medium">{resumeContent.parsed_data.location}</p>
                      </div>
                    )}
                    {resumeContent.parsed_data.experience_years && (
                      <div>
                        <p className="text-slate-500">Experience</p>
                        <p className="font-medium">{resumeContent.parsed_data.experience_years} years</p>
                      </div>
                    )}
                    {resumeContent.parsed_data.education && (
                      <div className="col-span-2">
                        <p className="text-slate-500">Education</p>
                        <p className="font-medium">{resumeContent.parsed_data.education}</p>
                      </div>
                    )}
                    {resumeContent.parsed_data.skills && resumeContent.parsed_data.skills.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-slate-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {resumeContent.parsed_data.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {resumeContent.parsed_data.tools && resumeContent.parsed_data.tools.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-slate-500 mb-2">Tools & Technologies</p>
                        <div className="flex flex-wrap gap-2">
                          {resumeContent.parsed_data.tools.map((tool, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 mb-3">Full Resume Text</h3>
                <div className="bg-slate-50 p-4 rounded text-sm whitespace-pre-wrap font-mono text-slate-700 max-h-96 overflow-y-auto">
                  {resumeContent.raw_text || 'No text content available'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resumes;