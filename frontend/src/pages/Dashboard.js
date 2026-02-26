import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/StatCard';
import Header from '@/components/Header';
import { FileText, Briefcase, TrendingUp, Clock, ArrowRight, Upload, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';

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
    <div className="bg-gradient-to-br from-slate-50 via-brand-cyan/5 to-brand-orange/5 min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Overview of your recruitment pipeline"
      />
      
      <div className="p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-blue rounded-2xl p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-brand-orange/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-brand-yellow" />
                <span className="text-white/80 text-sm font-medium">AI-Powered Recruitment</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome to SAPS Dashboard</h2>
              <p className="text-white/70 text-sm">Smart matching technology for perfect candidate-job alignment</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button 
                onClick={() => navigate('/jobs/new')}
                className="bg-white text-brand-blue hover:bg-white/90 shadow-lg"
                data-testid="quick-add-job-button"
              >
                <Zap size={16} className="mr-2" />
                Quick Add Job
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
          <StatCard 
            title="Total Resumes" 
            value={stats?.total_resumes || 0}
            icon={<FileText size={20} />}
            colorScheme="blue"
          />
          <StatCard 
            title="Recent Resumes" 
            value={stats?.recent_resumes || 0}
            subtitle="Last 3 months"
            icon={<Clock size={20} />}
            colorScheme="cyan"
          />
          <StatCard 
            title="Active Jobs" 
            value={stats?.active_jds || 0}
            icon={<Briefcase size={20} />}
            colorScheme="orange"
          />
          <StatCard 
            title="Total Matches" 
            value={stats?.total_matches || 0}
            icon={<TrendingUp size={20} />}
            colorScheme="magenta"
          />
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-2 border-brand-cyan/10 p-6 shadow-lg rounded-xl" data-testid="active-jobs-section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-yellow flex items-center justify-center">
                  <Briefcase size={16} className="text-white" />
                </div>
                <h2 className="text-xl font-bold font-heading text-slate-900">Active Job Descriptions</h2>
              </div>
              <p className="text-sm text-slate-500 ml-10">Current open positions</p>
            </div>
            <Button 
              onClick={() => navigate('/jobs/new')}
              className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white hover:from-brand-cyan hover:to-brand-blue shadow-lg transition-all duration-300"
              data-testid="add-new-job-button"
            >
              Add New Job
            </Button>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-brand-cyan/5 rounded-xl" data-testid="empty-jobs-state">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase size={32} className="text-brand-cyan" />
              </div>
              <p className="text-slate-600 mb-4 font-medium">No active job descriptions yet</p>
              <Button 
                onClick={() => navigate('/jobs/new')}
                className="bg-gradient-to-r from-brand-orange to-brand-yellow text-white hover:from-brand-yellow hover:to-brand-orange"
                data-testid="add-first-job-button"
              >
                Add Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 5).map((job, index) => (
                <div
                  key={job.id}
                  data-testid={`job-card-${job.id}`}
                  className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-brand-cyan/50 hover:bg-gradient-to-r hover:from-white hover:to-brand-cyan/5 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-brand-cyan' : 
                        index === 1 ? 'bg-brand-orange' : 
                        index === 2 ? 'bg-brand-magenta' : 
                        'bg-brand-yellow'
                      }`} />
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 ml-5">
                      <span className="flex items-center gap-1">
                        <span className="text-brand-cyan font-medium">{job.required_skills.length}</span> skills
                      </span>
                      {job.min_experience && <span>Min <span className="text-brand-orange font-medium">{job.min_experience}y</span> exp</span>}
                      <span className="px-2 py-0.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-xs font-medium">{job.match_count || 0} matches</span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}

          {activeJobs.length > 5 && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/jobs')}
                className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all"
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