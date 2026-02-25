import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Briefcase, ArrowRight, Upload } from 'lucide-react';
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
      fetchJobs();
    } catch (error) {
      console.error('Error uploading JDs:', error);
      toast.error('Failed to upload job descriptions');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Header
        title="Job Descriptions"
        subtitle={`${jobs.length} job description(s)`}
        action={
          <div className="flex items-center gap-3">
            <label htmlFor="jd-file-upload">
              <Button
                as="span"
                variant="outline"
                className="cursor-pointer"
                disabled={uploading}
                data-testid="upload-jds-button"
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload JDs'}
              </Button>
            </label>
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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="create-new-job-button"
            >
              <Plus size={16} className="mr-2" />
              Create New Job
            </Button>
          </div>
        }
      />

      <div className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            data-testid="filter-all-button"
          >
            All
          </Button>
          <Button
            variant={filter === 'ACTIVE' ? 'default' : 'outline'}
            onClick={() => setFilter('ACTIVE')}
            data-testid="filter-active-button"
          >
            Active
          </Button>
          <Button
            variant={filter === 'CLOSED' ? 'default' : 'outline'}
            onClick={() => setFilter('CLOSED')}
            data-testid="filter-closed-button"
          >
            Closed
          </Button>
          <Button
            variant={filter === 'ON_HOLD' ? 'default' : 'outline'}
            onClick={() => setFilter('ON_HOLD')}
            data-testid="filter-onhold-button"
          >
            On Hold
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Loading job descriptions...</div>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="bg-white border border-slate-200 p-12 text-center" data-testid="empty-jobs-state">
            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No job descriptions found</p>
            <Button
              onClick={() => navigate('/jobs/new')}
              variant="outline"
              data-testid="create-first-job-button"
            >
              Create Your First Job
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                data-testid={`job-card-${job.id}`}
                className="bg-white border border-slate-200 p-6 hover:border-brand-accent/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-brand-accent transition-colors">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500">Required Skills</p>
                        <p className="font-semibold text-slate-900">{job.required_skills.length}</p>
                      </div>
                      {job.min_experience && (
                        <div>
                          <p className="text-xs text-slate-500">Min Experience</p>
                          <p className="font-semibold text-slate-900">{job.min_experience}y</p>
                        </div>
                      )}
                      {job.location && (
                        <div>
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="font-semibold text-slate-900">{job.location}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500">Matches</p>
                        <p className="font-semibold text-brand-accent">{job.match_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
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

                  <ArrowRight size={20} className="text-slate-400 group-hover:text-brand-accent transition-colors mt-2" />
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