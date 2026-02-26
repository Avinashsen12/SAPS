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
import { Upload, CheckCircle, Briefcase, MapPin, DollarSign, Clock, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom CSS for watermark
const watermarkStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: 0.03,
  pointerEvents: 'none',
  zIndex: 0,
  width: '60%',
  maxWidth: '600px',
};

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
      <div className="min-h-screen bg-gradient-to-br from-brand-blue/5 via-brand-cyan/10 to-brand-orange/5 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-brand-cyan/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-brand-orange/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-brand-magenta/15 to-transparent rounded-full blur-2xl" />
        
        {/* Watermark */}
        <img src="/saps-logo.png" alt="" style={watermarkStyle} />
        
        <Card className="max-w-2xl w-full bg-white/95 backdrop-blur-sm p-12 text-center relative z-10 border-2 border-brand-cyan/20 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-blue bg-clip-text text-transparent mb-4">
            Thank You, {candidateName}!
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            Your application has been successfully submitted to SAPS.
          </p>
          <div className="bg-gradient-to-r from-brand-blue/5 via-brand-cyan/10 to-brand-orange/5 border border-brand-cyan/30 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-brand-blue mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-orange" />
              What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold text-xs">1</span>
                <span>Our AI system is matching your profile with available job openings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-xs">2</span>
                <span>Our recruitment team will review your application within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-magenta/20 flex items-center justify-center text-brand-magenta font-bold text-xs">3</span>
                <span>If your profile matches any positions, we'll contact you via email or phone</span>
              </li>
            </ul>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-brand-blue to-brand-cyan hover:from-brand-cyan hover:to-brand-blue text-white shadow-lg transition-all duration-300"
          >
            Submit Another Application
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/5 via-white to-brand-orange/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-cyan/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-brand-orange/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-brand-magenta/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-tl from-brand-yellow/15 to-transparent rounded-full blur-2xl" />
      
      {/* Watermark */}
      <img src="/saps-logo.png" alt="" style={watermarkStyle} />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-brand-cyan/20 shadow-lg sticky top-0 z-50">
        <div className="w-full px-8 lg:px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/saps-logo.png" alt="SAPS Logo" className="h-16 md:h-20 w-auto drop-shadow-lg" />
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-bold text-brand-blue">SAPS</h1>
                <p className="text-xs md:text-sm text-slate-500">Skills and Placement Services</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-cyan text-white font-medium rounded-full shadow-md">
                Candidate Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="w-full px-6 lg:px-16 py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange/10 to-brand-yellow/10 rounded-full text-sm font-medium text-brand-orange mb-6 border border-brand-orange/20">
              <Sparkles size={16} />
              AI-Powered Career Matching
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-heading mb-4">
              <span className="bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-magenta bg-clip-text text-transparent">
                Welcome to Your Career Journey
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Join SAPS and let our AI-powered platform match you with the perfect job opportunities.
              Upload your resume and share your preferences to get started.
            </p>
          </div>

          {/* Application Form */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-brand-cyan/20 p-8 shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border-b border-gradient-to-r from-brand-cyan/30 via-brand-blue/20 to-transparent pb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center shadow-lg">
                  <Upload size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">Upload Your Resume</h3>
                  <p className="text-sm text-slate-500">PDF, DOCX, TXT (including scanned documents)</p>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-brand-cyan/40 rounded-xl p-8 text-center hover:border-brand-cyan hover:bg-brand-cyan/5 transition-all duration-300 cursor-pointer group"
                onClick={() => document.getElementById('resume-upload').click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-lg">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={32} className="text-brand-cyan" />
                    </div>
                    <p className="font-bold text-slate-900 mb-1 text-lg">Click to upload your resume</p>
                    <p className="text-sm text-slate-500">or drag and drop your file here</p>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-blue-400 flex items-center justify-center shadow-lg">
                  <MapPin size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold font-heading text-slate-900">Location Preferences</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_location" className="text-slate-700 font-medium">Current Location *</Label>
                  <Input
                    id="current_location"
                    value={formData.current_location}
                    onChange={(e) => setFormData({...formData, current_location: e.target.value})}
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="mt-1.5 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_locations" className="text-slate-700 font-medium">Preferred Locations *</Label>
                  <Input
                    id="preferred_locations"
                    value={formData.preferred_locations}
                    onChange={(e) => setFormData({...formData, preferred_locations: e.target.value})}
                    placeholder="e.g., Mumbai, Pune, Bangalore"
                    className="mt-1.5 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Separate multiple locations with commas</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-yellow to-brand-orange flex items-center justify-center shadow-lg">
                  <DollarSign size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold font-heading text-slate-900">Salary Expectations</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_salary" className="text-slate-700 font-medium">Current Salary (Annual)</Label>
                  <Input
                    id="current_salary"
                    value={formData.current_salary}
                    onChange={(e) => setFormData({...formData, current_salary: e.target.value})}
                    placeholder="e.g., ₹12,00,000 or $80,000"
                    className="mt-1.5 border-slate-200 focus:border-brand-orange focus:ring-brand-orange/20"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Optional - helps us match better roles</p>
                </div>
                <div>
                  <Label htmlFor="expected_salary" className="text-slate-700 font-medium">Expected Salary (Annual) *</Label>
                  <Input
                    id="expected_salary"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({...formData, expected_salary: e.target.value})}
                    placeholder="e.g., ₹15,00,000 or $100,000"
                    className="mt-1.5 border-slate-200 focus:border-brand-orange focus:ring-brand-orange/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-magenta to-pink-400 flex items-center justify-center shadow-lg">
                  <Clock size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold font-heading text-slate-900">Availability</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notice_period" className="text-slate-700 font-medium">Notice Period</Label>
                  <Select 
                    value={formData.notice_period} 
                    onValueChange={(val) => setFormData({...formData, notice_period: val})}
                  >
                    <SelectTrigger className="mt-1.5 border-slate-200 focus:border-brand-magenta focus:ring-brand-magenta/20">
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
                  <Label htmlFor="availability" className="text-slate-700 font-medium">When can you start?</Label>
                  <Select 
                    value={formData.availability} 
                    onValueChange={(val) => setFormData({...formData, availability: val})}
                  >
                    <SelectTrigger className="mt-1.5 border-slate-200 focus:border-brand-magenta focus:ring-brand-magenta/20">
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

            <div className="pt-8 border-t border-brand-cyan/20">
              <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-blue hover:from-brand-cyan hover:via-brand-blue hover:to-brand-cyan text-white h-14 text-lg font-bold shadow-xl transition-all duration-500 rounded-xl group"
              >
                {uploading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Application...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                    Submit Application
                  </span>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-4">
                By submitting, you agree to SAPS processing your data for recruitment purposes
              </p>
            </div>
          </form>
        </Card>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-slate-600 border border-slate-200/50 shadow-sm">
            Need help? Contact us at 
            <a href="mailto:support@saps.com" className="text-brand-cyan font-medium hover:text-brand-blue transition-colors">
              support@saps.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatePortal;
