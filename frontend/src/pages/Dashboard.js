import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import Header from '@/components/Header';
import { FileText, Briefcase, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingZip, setUploadingZip] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/jobs?status=ACTIVE`)
      ]);
      setStats(statsRes.data);
      setActiveJobs(jobsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      toast.success(`Successfully uploaded: ${response.data.resumes_uploaded} resumes, ${response.data.jds_uploaded} job descriptions`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error uploading ZIP:', error);
      toast.error('Failed to process ZIP file');
    } finally {
      setUploadingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Dashboard" 
        subtitle="Overview of your recruitment pipeline"
      />
      
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
          <StatCard 
            title="Total Resumes" 
            value={stats?.total_resumes || 0}
            icon={<FileText size={20} />}
          />
          <StatCard 
            title="Recent Resumes" 
            value={stats?.recent_resumes || 0}
            subtitle="Last 3 months"
            icon={<Clock size={20} />}
          />
          <StatCard 
            title="Active Jobs" 
            value={stats?.active_jds || 0}
            icon={<Briefcase size={20} />}
          />
          <StatCard 
            title="Total Matches" 
            value={stats?.total_matches || 0}
            icon={<TrendingUp size={20} />}
          />
        </div>

        <Card className="bg-white border border-slate-200 p-6" data-testid="active-jobs-section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900">Active Job Descriptions</h2>
              <p className="text-sm text-slate-500 mt-1">Current open positions</p>
            </div>
            <Button 
              onClick={() => navigate('/jobs/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="add-new-job-button"
            >
              Add New Job
            </Button>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-jobs-state">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-4">No active job descriptions yet</p>
              <Button 
                onClick={() => navigate('/jobs/new')}
                variant="outline"
                data-testid="add-first-job-button"
              >
                Add Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  data-testid={`job-card-${job.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-brand-accent/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-accent transition-colors">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{job.required_skills.length} required skills</span>
                      {job.min_experience && <span>Min {job.min_experience}y exp</span>}
                      <span className="font-medium text-brand-accent">{job.match_count || 0} matches</span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-400 group-hover:text-brand-accent transition-colors" />
                </div>
              ))}
            </div>
          )}

          {activeJobs.length > 5 && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/jobs')}
                data-testid="view-all-jobs-button"
              >
                View All Jobs ({activeJobs.length})
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;