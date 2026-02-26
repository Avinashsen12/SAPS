import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import ScoreBar from '@/components/ScoreBar';
import { Plus, Briefcase, ArrowRight, Upload, X, ExternalLink, Sparkles, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? `${API}/jobs` : `${API}/jobs?status=${filter}`;
      const response = await axios.get(url);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch job descriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API}/jobs/upload-bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Successfully uploaded ${response.data.length} job description(s)`);
      
      // Auto-match and show results
      const jdIds = response.data.map(j => j.id);
      await autoMatchJobs(jdIds);
      
      fetchJobs();
    } catch (error) {
      console.error('Error uploading JDs:', error);
      toast.error('Failed to upload job descriptions');
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
      toast.success(`Successfully uploaded: ${response.data.jds_uploaded} job description(s)`);
      
      fetchJobs();
      const resumesResponse = await axios.get(`${API}/resumes`);
      if (resumesResponse.data.length > 0) {
        toast.info('Matching jobs with resumes...');
        await axios.post(`${API}/match/run`);
        toast.success('Matching completed!');
      }
    } catch (error) {
      console.error('Error uploading ZIP:', error);
      toast.error('Failed to process ZIP file');
    } finally {
      setUploadingZip(false);
    }
  };

  const autoMatchJobs = async (jdIds) => {
    try {
      const resumesResponse = await axios.get(`${API}/resumes`);
      if (resumesResponse.data.length === 0) {
        toast.info('No resumes to match against');
        return;
      }
      
      toast.info('Finding matching candidates...');
      await axios.post(`${API}/match/run`);
      
      // Fetch match results for the uploaded JDs
      const allMatches = [];
      for (const jdId of jdIds) {
        const job = await axios.get(`${API}/jobs/${jdId}`);
        const matchRes = await axios.get(`${API}/match/results/${jdId}?min_score=50`);
        if (matchRes.data.length > 0) {
          allMatches.push({
            job: job.data,
            matches: matchRes.data
          });
        }
      }
      
      if (allMatches.length > 0) {
        setMatchResults(allMatches);
        toast.success(`Found matches for ${allMatches.length} job(s)!`);
      } else {
        toast.info('No matches found with score ≥ 50%');
      }
    } catch (error) {
      console.error('Error matching jobs:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-brand-orange/5 to-brand-cyan/5 min-h-screen">
      <Header
        title="Job Descriptions"
        subtitle={`${jobs.length} job description(s)`}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => document.getElementById('zip-upload-jobs').click()}
              disabled={uploadingZip}
              className="border-brand-orange/30 hover:border-brand-orange hover:bg-brand-orange/10"
              data-testid="upload-zip-jobs-button"
            >
              <Upload size={16} className="mr-2 text-brand-orange" />
              {uploadingZip ? 'Processing ZIP...' : 'Upload ZIP'}
            </Button>
            <input
              id="zip-upload-jobs"
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
              data-testid="zip-upload-jobs-input"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('jd-file-upload').click()}
              disabled={uploading}
              className="border-brand-cyan/30 hover:border-brand-cyan hover:bg-brand-cyan/10"
              data-testid="upload-jds-button"
            >
              <Upload size={16} className="mr-2 text-brand-cyan" />
              {uploading ? 'Uploading...' : 'Upload JDs'}
            </Button>
            <input
              id="jd-file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleBulkUpload}
              className="hidden"
              data-testid="jd-file-upload-input"
            />
            <Button
              onClick={() => navigate('/jobs/new')}
              className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white hover:from-brand-cyan hover:to-brand-blue shadow-lg"
              data-testid="create-new-job-button"
            >
              <Plus size={16} className="mr-2" />
              Create New Job
            </Button>
          </div>
        }
      />

      <div className="p-8">
        {matchResults && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-brand-cyan/20 p-6 mb-6 shadow-lg rounded-xl" data-testid="match-results-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-900">Matching Candidates Found</h2>
                  <p className="text-sm text-slate-500">Candidates that match your uploaded jobs</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMatchResults(null)} className="hover:bg-red-50 hover:text-red-500" data-testid="close-match-results">
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              {matchResults.map((result, idx) => (
                <div key={idx} className="border-2 border-slate-100 rounded-xl p-4 hover:border-brand-cyan/30 transition-colors">
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
                      onClick={() => navigate(`/jobs/${result.job.id}`)}
                      className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-white"
                      data-testid={`view-job-${result.job.id}`}
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View All Matches
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {result.matches.slice(0, 5).map((match) => (
                      <div key={match.resume_id} className="bg-gradient-to-r from-slate-50 to-brand-cyan/5 rounded-lg p-3">
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
                    {result.matches.length > 5 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        +{result.matches.length - 5} more candidates
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Filter:</span>
          </div>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white' : 'border-slate-200'}
            data-testid="filter-all-button"
          >
            All
          </Button>
          <Button
            variant={filter === 'ACTIVE' ? 'default' : 'outline'}
            onClick={() => setFilter('ACTIVE')}
            className={filter === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'border-slate-200'}
            data-testid="filter-active-button"
          >
            Active
          </Button>
          <Button
            variant={filter === 'CLOSED' ? 'default' : 'outline'}
            onClick={() => setFilter('CLOSED')}
            className={filter === 'CLOSED' ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white' : 'border-slate-200'}
            data-testid="filter-closed-button"
          >
            Closed
          </Button>
          <Button
            variant={filter === 'ON_HOLD' ? 'default' : 'outline'}
            onClick={() => setFilter('ON_HOLD')}
            className={filter === 'ON_HOLD' ? 'bg-gradient-to-r from-brand-orange to-brand-yellow text-white' : 'border-slate-200'}
            data-testid="filter-onhold-button"
          >
            On Hold
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
              Loading job descriptions...
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-orange/20 p-12 text-center rounded-xl" data-testid="empty-jobs-state">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-orange/20 to-brand-yellow/20 rounded-2xl flex items-center justify-center mb-4">
              <Briefcase size={40} className="text-brand-orange" />
            </div>
            <p className="text-slate-600 mb-4 font-medium">No job descriptions found</p>
            <Button
              onClick={() => navigate('/jobs/new')}
              className="bg-gradient-to-r from-brand-orange to-brand-yellow text-white hover:from-brand-yellow hover:to-brand-orange"
              data-testid="create-first-job-button"
            >
              Create Your First Job
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job, index) => (
              <Card
                key={job.id}
                data-testid={`job-card-${job.id}`}
                className="bg-white/80 backdrop-blur-sm border-2 border-slate-100 p-6 hover:border-brand-cyan/50 hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-xl"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index % 4 === 0 ? 'bg-brand-blue' : 
                        index % 4 === 1 ? 'bg-brand-cyan' : 
                        index % 4 === 2 ? 'bg-brand-orange' : 
                        'bg-brand-magenta'
                      }`} />
                      <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-brand-blue transition-colors">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-brand-blue/5 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Required Skills</p>
                        <p className="font-bold text-brand-blue">{job.required_skills.length}</p>
                      </div>
                      {job.min_experience && (
                        <div className="bg-brand-cyan/5 rounded-lg p-2">
                          <p className="text-xs text-slate-500">Min Experience</p>
                          <p className="font-bold text-brand-cyan">{job.min_experience}y</p>
                        </div>
                      )}
                      {job.location && (
                        <div className="bg-brand-orange/5 rounded-lg p-2">
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="font-bold text-brand-orange text-sm">{job.location}</p>
                        </div>
                      )}
                      <div className="bg-brand-magenta/5 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Matches</p>
                        <p className="font-bold text-brand-magenta">{job.match_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            idx % 3 === 0 ? 'bg-brand-blue/10 text-brand-blue' : 
                            idx % 3 === 1 ? 'bg-brand-cyan/10 text-brand-cyan' : 
                            'bg-brand-orange/10 text-brand-orange'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                          +{job.required_skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all mt-2" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;