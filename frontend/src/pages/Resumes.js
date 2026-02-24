import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Upload, FileText, Trash2, Calendar, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

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
      fetchResumes();
    } catch (error) {
      console.error('Error uploading resumes:', error);
      toast.error('Failed to upload resumes');
    } finally {
      setUploading(false);
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

  return (
    <div>
      <Header
        title="Resume Database"
        subtitle={`${resumes.length} resume(s) in database`}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setRecentOnly(!recentOnly)}
              data-testid="filter-recent-button"
            >
              {recentOnly ? 'Show All' : 'Recent Only (≤3 months)'}
            </Button>
            <label htmlFor="file-upload">
              <Button
                as="span"
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                disabled={uploading}
                data-testid="upload-resumes-button"
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Resumes'}
              </Button>
            </label>
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Loading resumes...</div>
          </div>
        ) : resumes.length === 0 ? (
          <Card className="bg-white border border-slate-200 p-12 text-center" data-testid="empty-resumes-state">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No resumes uploaded yet</p>
            <label htmlFor="file-upload-empty">
              <Button
                as="span"
                variant="outline"
                className="cursor-pointer"
                data-testid="upload-first-resume-button"
              >
                Upload Your First Resume
              </Button>
            </label>
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
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left" data-testid="resumes-table">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3 border-b">Candidate Name</th>
                  <th className="px-4 py-3 border-b">Contact</th>
                  <th className="px-4 py-3 border-b">Skills</th>
                  <th className="px-4 py-3 border-b">Experience</th>
                  <th className="px-4 py-3 border-b">Upload Date</th>
                  <th className="px-4 py-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr
                    key={resume.id}
                    className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                    data-testid={`resume-row-${resume.id}`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{resume.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{resume.filename}</p>
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
                        {resume.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.skills.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            +{resume.skills.length - 3}
                          </span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resume.id)}
                        data-testid={`delete-resume-${resume.id}`}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resumes;