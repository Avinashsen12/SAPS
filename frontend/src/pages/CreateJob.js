import React, { useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: [],
    good_to_have_skills: [],
    min_experience: '',
    max_experience: '',
    industry: '',
    location: '',
    certifications: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [goodToHaveInput, setGoodToHaveInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const handleAddSkill = (type) => {
    if (type === 'required' && skillInput.trim()) {
      setFormData({ ...formData, required_skills: [...formData.required_skills, skillInput.trim()] });
      setSkillInput('');
    } else if (type === 'good_to_have' && goodToHaveInput.trim()) {
      setFormData({ ...formData, good_to_have_skills: [...formData.good_to_have_skills, goodToHaveInput.trim()] });
      setGoodToHaveInput('');
    } else if (type === 'cert' && certInput.trim()) {
      setFormData({ ...formData, certifications: [...formData.certifications, certInput.trim()] });
      setCertInput('');
    }
  };

  const handleRemoveItem = (type, index) => {
    if (type === 'required') {
      setFormData({ ...formData, required_skills: formData.required_skills.filter((_, i) => i !== index) });
    } else if (type === 'good_to_have') {
      setFormData({ ...formData, good_to_have_skills: formData.good_to_have_skills.filter((_, i) => i !== index) });
    } else if (type === 'cert') {
      setFormData({ ...formData, certifications: formData.certifications.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || formData.required_skills.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        min_experience: formData.min_experience ? parseFloat(formData.min_experience) : null,
        max_experience: formData.max_experience ? parseFloat(formData.max_experience) : null
      };
      
      const response = await axios.post(`${API}/jobs`, payload);
      toast.success('Job description created successfully');
      navigate(`/jobs/${response.data.id}`);
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Create New Job Description"
        subtitle="Add a new position to match candidates"
      />

      <div className="p-8 max-w-4xl">
        <Card className="bg-white border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                required
                data-testid="job-title-input"
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed job description..."
                rows={6}
                required
                data-testid="job-description-input"
              />
            </div>

            <div>
              <Label>Required Skills *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('required'))}
                  placeholder="e.g., React, Python, AWS"
                  data-testid="required-skills-input"
                />
                <Button type="button" onClick={() => handleAddSkill('required')} data-testid="add-required-skill-button">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <X size={14} className="cursor-pointer" onClick={() => handleRemoveItem('required', idx)} />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Good to Have Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={goodToHaveInput}
                  onChange={(e) => setGoodToHaveInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('good_to_have'))}
                  placeholder="e.g., Docker, GraphQL"
                  data-testid="good-to-have-skills-input"
                />
                <Button type="button" onClick={() => handleAddSkill('good_to_have')} data-testid="add-good-to-have-skill-button">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.good_to_have_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <X size={14} className="cursor-pointer" onClick={() => handleRemoveItem('good_to_have', idx)} />
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_experience">Min Experience (years)</Label>
                <Input
                  id="min_experience"
                  type="number"
                  step="0.5"
                  value={formData.min_experience}
                  onChange={(e) => setFormData({ ...formData, min_experience: e.target.value })}
                  placeholder="e.g., 3"
                  data-testid="min-experience-input"
                />
              </div>
              <div>
                <Label htmlFor="max_experience">Max Experience (years)</Label>
                <Input
                  id="max_experience"
                  type="number"
                  step="0.5"
                  value={formData.max_experience}
                  onChange={(e) => setFormData({ ...formData, max_experience: e.target.value })}
                  placeholder="e.g., 8"
                  data-testid="max-experience-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Technology, Finance"
                  data-testid="industry-input"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Remote, New York"
                  data-testid="location-input"
                />
              </div>
            </div>

            <div>
              <Label>Certifications</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('cert'))}
                  placeholder="e.g., AWS Certified, PMP"
                  data-testid="certifications-input"
                />
                <Button type="button" onClick={() => handleAddSkill('cert')} data-testid="add-certification-button">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full flex items-center gap-2"
                  >
                    {cert}
                    <X size={14} className="cursor-pointer" onClick={() => handleRemoveItem('cert', idx)} />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
                data-testid="create-job-submit-button"
              >
                {loading ? 'Creating...' : 'Create Job Description'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/jobs')}
                data-testid="cancel-create-job-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateJob;