import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, CheckCircle, Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CandidatePortal = () => {
  const [formData, setFormData] = useState({
    current_location: '',
    preferred_locations: '',
    current_salary: '',
    expected_salary: '',
    notice_period: '',
    availability: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [candidateName, setCandidateName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|docx|txt)$/i)) {
        toast.error('Please upload PDF, DOCX, or TXT file');
        return;
      }
      setFile(selectedFile);
      toast.success(`Selected: ${selectedFile.name}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please upload your resume');
      return;
    }

    if (!formData.current_location || !formData.preferred_locations || !formData.expected_salary) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    const submitData = new FormData();
    submitData.append('file', file);
    submitData.append('current_location', formData.current_location);
    submitData.append('preferred_locations', formData.preferred_locations);
    submitData.append('current_salary', formData.current_salary || 'Not disclosed');
    submitData.append('expected_salary', formData.expected_salary);
    submitData.append('notice_period', formData.notice_period || 'Immediate');
    submitData.append('availability', formData.availability || 'Immediate');

    try {
      const response = await axios.post(`${API}/public/apply`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCandidateName(response.data.candidate_name);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-white p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 mb-4">
            Thank You, {candidateName}!
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            Your application has been successfully submitted to SAPS.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Our AI system is matching your profile with available job openings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Our recruitment team will review your application within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>If your profile matches any positions, we'll contact you via email or phone</span>
              </li>
            </ul>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Submit Another Application
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <img src="/saps-logo.png" alt="SAPS Logo" className="h-16 w-auto" />
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-heading text-brand-blue mb-4">
            Welcome to Your Career Journey
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Join SAPS and let our AI-powered platform match you with the perfect job opportunities.
            Upload your resume and share your preferences to get started.
          </p>
        </div>

        {/* Application Form */}
        <Card className="bg-white border border-slate-200 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Upload Your Resume</h3>
              <p className="text-sm text-slate-600 mb-4">
                Supported formats: PDF, DOCX, TXT (including scanned documents)
              </p>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-accent transition-colors cursor-pointer"
                onClick={() => document.getElementById('resume-upload').click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle size={24} className="text-green-600" />
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="font-semibold text-slate-900 mb-1">Click to upload your resume</p>
                    <p className="text-sm text-slate-500">or drag and drop</p>
                  </div>
                )}
              </div>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold font-heading text-brand-blue mb-2 flex items-center gap-2">
                <MapPin size={20} className="text-brand-cyan" />
                Location Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_location">Current Location *</Label>
                  <Input
                    id="current_location"
                    value={formData.current_location}
                    onChange={(e) => setFormData({...formData, current_location: e.target.value})}
                    placeholder="e.g., Mumbai, Maharashtra"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_locations">Preferred Locations *</Label>
                  <Input
                    id="preferred_locations"
                    value={formData.preferred_locations}
                    onChange={(e) => setFormData({...formData, preferred_locations: e.target.value})}
                    placeholder="e.g., Mumbai, Pune, Bangalore"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate multiple locations with commas</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold font-heading text-brand-blue mb-2 flex items-center gap-2">
                <DollarSign size={20} className="text-brand-yellow" />
                Salary Expectations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_salary">Current Salary (Annual)</Label>
                  <Input
                    id="current_salary"
                    value={formData.current_salary}
                    onChange={(e) => setFormData({...formData, current_salary: e.target.value})}
                    placeholder="e.g., ₹12,00,000 or $80,000"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional - helps us match better roles</p>
                </div>
                <div>
                  <Label htmlFor="expected_salary">Expected Salary (Annual) *</Label>
                  <Input
                    id="expected_salary"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({...formData, expected_salary: e.target.value})}
                    placeholder="e.g., ₹15,00,000 or $100,000"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold font-heading text-brand-blue mb-2 flex items-center gap-2">
                <Clock size={20} className="text-brand-orange" />
                Availability
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notice_period">Notice Period</Label>
                  <Select 
                    value={formData.notice_period} 
                    onValueChange={(val) => setFormData({...formData, notice_period: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="15 days">15 days</SelectItem>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="2 months">2 months</SelectItem>
                      <SelectItem value="3 months">3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability">When can you start?</Label>
                  <Select 
                    value={formData.availability} 
                    onValueChange={(val) => setFormData({...formData, availability: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediately</SelectItem>
                      <SelectItem value="Within 15 days">Within 15 days</SelectItem>
                      <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                      <SelectItem value="Within 2 months">Within 2 months</SelectItem>
                      <SelectItem value="Within 3 months">Within 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Application...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-3">
                By submitting, you agree to SAPS processing your data for recruitment purposes
              </p>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Need help? Contact us at <a href="mailto:support@saps.com" className="text-brand-accent hover:underline">support@saps.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default CandidatePortal;
