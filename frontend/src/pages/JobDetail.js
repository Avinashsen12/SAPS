import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import ScoreBar from '@/components/ScoreBar';
import MatchExplanation from '@/components/MatchExplanation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, PlayCircle, Trash2, Mail, FileText, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [selectedResume, setSelectedResume] = useState(null);
  const [resumeContent, setResumeContent] = useState(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState(null);

  useEffect(() => {
    fetchJobDetails();
    fetchMatches();
  }, [id, minScore]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${API}/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/match/results/${id}?min_score=${minScore}&include_explanation=true`);
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
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

  const toggleMatchExpansion = (matchId) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const handleRunMatching = async () => {
    setMatching(true);
    try {
      await axios.post(`${API}/match/run?jd_id=${id}`);
      toast.success('Matching completed successfully');
      fetchMatches();
      fetchJobDetails();
    } catch (error) {
      console.error('Error running matching:', error);
      toast.error('Failed to run matching');
    } finally {
      setMatching(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API}/jobs/${id}/status?status=${newStatus}`);
      toast.success('Job status updated successfully');
      fetchJobDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job description?')) return;

    try {
      await axios.delete(`${API}/jobs/${id}`);
      toast.success('Job description deleted successfully');
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job description');
    }
  };

  const getCategoryMatches = (category) => {
    return matches.filter(m => m.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Job not found</div>
      </div>
    );
  }

  const highlySuitable = getCategoryMatches('Highly Suitable');
  const moderatelySuitable = getCategoryMatches('Moderately Suitable');
  const lowMatch = getCategoryMatches('Low Match');
  const notSuitable = getCategoryMatches('Not Suitable');

  const renderMatchCard = (match, color) => (
    <div key={match.resume_id} className="border border-slate-200 rounded-lg p-4" data-testid={`match-card-${match.resume_id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{match.resume_name}</p>
          {match.resume_email && (
            <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
              <Mail size={12} />
              {match.resume_email}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewResume(match.resume_id)}
            data-testid={`view-resume-${match.resume_id}`}
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <span className="font-mono text-lg font-bold" style={{ color }}>
            {match.total_score.toFixed(1)}%
          </span>
        </div>
      </div>
      <ScoreBar score={match.total_score} category={match.category} />
      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
        <div>
          <span className="text-slate-500">Skills:</span>
          <span className="ml-1 font-semibold text-slate-900">{match.skill_score.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500">Experience:</span>
          <span className="ml-1 font-semibold text-slate-900">{match.experience_score.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500">Tools:</span>
          <span className="ml-1 font-semibold text-slate-900">{match.tools_score.toFixed(1)}%</span>
        </div>
      </div>
      
      {match.match_explanation && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => toggleMatchExpansion(match.resume_id)}
            data-testid={`toggle-explanation-${match.resume_id}`}
          >
            {expandedMatch === match.resume_id ? '▼ Hide Details' : '▶ Why This Match?'}
          </Button>
          
          {expandedMatch === match.resume_id && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <MatchExplanation explanation={match.match_explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Header
        title={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/jobs')}
              data-testid="back-to-jobs-button"
            >
              <ArrowLeft size={20} />
            </Button>
            <span>{job.title}</span>
          </div>
        }
        subtitle="Job Description & Candidate Matches"
        action={
          <div className="flex items-center gap-3">
            <Select value={job.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]" data-testid="job-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRunMatching}
              disabled={matching || job.status !== 'ACTIVE'}
              className="bg-brand-accent text-white hover:bg-brand-hover"
              data-testid="run-matching-button"
            >
              <PlayCircle size={16} className="mr-2" />
              {matching ? 'Matching...' : 'Run Matching'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              data-testid="delete-job-button"
            >
              <Trash2 size={16} className="mr-2 text-red-500" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <Card className="bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Job Details</h2>
            <StatusBadge status={job.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Min Experience</p>
              <p className="font-semibold text-slate-900">{job.min_experience ? `${job.min_experience}y` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Max Experience</p>
              <p className="font-semibold text-slate-900">{job.max_experience ? `${job.max_experience}y` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Industry</p>
              <p className="font-semibold text-slate-900">{job.industry || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="font-semibold text-slate-900">{job.location || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.good_to_have_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Good to Have Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.good_to_have_skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.certifications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {job.certifications.map((cert, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200 p-6" data-testid="matches-section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">Candidate Matches</h2>
              <p className="text-sm text-slate-500 mt-1">{matches.length} total matches</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Min Score:</span>
              <Select value={minScore.toString()} onValueChange={(val) => setMinScore(parseInt(val))}>
                <SelectTrigger className="w-[120px]" data-testid="min-score-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All (0%+)</SelectItem>
                  <SelectItem value="50">50%+</SelectItem>
                  <SelectItem value="60">60%+</SelectItem>
                  <SelectItem value="80">80%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12" data-testid="no-matches-state">
              <p className="text-slate-500 mb-4">No matches found. Run matching to see results.</p>
              <Button
                onClick={handleRunMatching}
                disabled={matching || job.status !== 'ACTIVE'}
                variant="outline"
                data-testid="run-matching-empty-button"
              >
                Run Matching Now
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {highlySuitable.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#16A34A' }}></div>
                    <h3 className="font-semibold text-slate-900">Highly Suitable (≥80%)</h3>
                    <span className="text-sm text-slate-500">({highlySuitable.length})</span>
                  </div>
                  <div className="space-y-2">
                    {highlySuitable.map((match) => renderMatchCard(match, '#15803D'))}
                  </div>
                </div>
              )}

              {moderatelySuitable.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#CA8A04' }}></div>
                    <h3 className="font-semibold text-slate-900">Moderately Suitable (60-79%)</h3>
                    <span className="text-sm text-slate-500">({moderatelySuitable.length})</span>
                  </div>
                  <div className="space-y-2">
                    {moderatelySuitable.map((match) => renderMatchCard(match, '#854D0E'))}
                  </div>
                </div>
              )}

              {lowMatch.length > 0 && minScore < 50 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                    <h3 className="font-semibold text-slate-900">Low Match (50-59%)</h3>
                    <span className="text-sm text-slate-500">({lowMatch.length})</span>
                  </div>
                  <div className="space-y-2">
                    {lowMatch.map((match) => renderMatchCard(match, '#9A3412'))}
                  </div>
                </div>
              )}

              {notSuitable.length > 0 && minScore === 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }}></div>
                    <h3 className="font-semibold text-slate-900">Not Suitable (&lt;50%)</h3>
                    <span className="text-sm text-slate-500">({notSuitable.length})</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">These candidates do not meet the minimum requirements</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default JobDetail;