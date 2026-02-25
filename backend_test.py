import requests
import sys
import os
import json
from datetime import datetime
import time

# Get backend URL from environment
BACKEND_URL = "https://resume-matcher-117.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class SAPSAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.resume_ids = []
        self.job_ids = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED {details}")
        else:
            print(f"❌ {test_name}: FAILED {details}")
        return success
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        try:
            response = requests.get(f"{API_BASE}/dashboard/stats", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['total_resumes', 'recent_resumes', 'total_jds', 'active_jds', 'total_matches']
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields
                details = f"- Status: {response.status_code}, Fields: {list(data.keys())}"
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Dashboard Stats", success, details)
        except Exception as e:
            return self.log_test("Dashboard Stats", False, f"- Error: {str(e)}")
    
    def test_bulk_resume_upload(self):
        """Test bulk resume upload with sample files"""
        try:
            # Test with text files
            files = []
            
            # Create sample resume content
            sample_content_1 = open('/app/test_sample_resume_1.txt', 'rb')
            sample_content_2 = open('/app/test_sample_resume_2.txt', 'rb')
            
            files = [
                ('files', ('john_doe_resume.txt', sample_content_1, 'text/plain')),
                ('files', ('sarah_johnson_resume.txt', sample_content_2, 'text/plain'))
            ]
            
            response = requests.post(f"{API_BASE}/resumes/upload-bulk", files=files, timeout=60)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.resume_ids = [resume['id'] for resume in data]
                details = f"- Uploaded {len(data)} resumes, IDs: {self.resume_ids[:2]}"
            else:
                details = f"- Status: {response.status_code}, Response: {response.text[:100]}"
            
            sample_content_1.close()
            sample_content_2.close()
            return self.log_test("Bulk Resume Upload", success, details)
            
        except Exception as e:
            return self.log_test("Bulk Resume Upload", False, f"- Error: {str(e)}")
    
    def test_resume_list(self):
        """Test getting resume list"""
        try:
            response = requests.get(f"{API_BASE}/resumes", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"- Found {len(data)} resumes"
                if len(data) > 0:
                    resume = data[0]
                    required_fields = ['id', 'filename', 'name', 'skills', 'upload_date']
                    has_fields = all(field in resume for field in required_fields)
                    success = has_fields
                    if not has_fields:
                        details += f", Missing fields in resume object"
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Resume List", success, details)
        except Exception as e:
            return self.log_test("Resume List", False, f"- Error: {str(e)}")
    
    def test_recent_resume_filter(self):
        """Test recent resume filtering (≤3 months)"""
        try:
            response = requests.get(f"{API_BASE}/resumes?recent_only=true", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"- Found {len(data)} recent resumes"
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Recent Resume Filter", success, details)
        except Exception as e:
            return self.log_test("Recent Resume Filter", False, f"- Error: {str(e)}")
    
    def test_job_creation(self):
        """Test job description creation"""
        try:
            job_data = {
                "title": "Senior Full Stack Developer",
                "description": "We are looking for a senior full stack developer with experience in React and Node.js to join our team.",
                "required_skills": ["React", "Node.js", "JavaScript", "MongoDB"],
                "good_to_have_skills": ["AWS", "Docker", "TypeScript"],
                "min_experience": 4,
                "max_experience": 8,
                "industry": "Technology",
                "location": "San Francisco, CA",
                "certifications": ["AWS Certified Solutions Architect"]
            }
            
            response = requests.post(f"{API_BASE}/jobs", json=job_data, timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.job_ids.append(data['id'])
                details = f"- Created job with ID: {data['id']}, Status: {data['status']}"
            else:
                details = f"- Status: {response.status_code}, Response: {response.text[:100]}"
                
            return self.log_test("Job Creation", success, details)
        except Exception as e:
            return self.log_test("Job Creation", False, f"- Error: {str(e)}")
    
    def test_job_list(self):
        """Test getting job list with status filtering"""
        try:
            # Test all jobs
            response = requests.get(f"{API_BASE}/jobs", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"- Found {len(data)} total jobs"
                
                # Test active jobs filter
                active_response = requests.get(f"{API_BASE}/jobs?status=ACTIVE", timeout=30)
                if active_response.status_code == 200:
                    active_data = active_response.json()
                    details += f", {len(active_data)} active jobs"
                    
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Job List & Filtering", success, details)
        except Exception as e:
            return self.log_test("Job List & Filtering", False, f"- Error: {str(e)}")
    
    def test_job_status_update(self):
        """Test job status update functionality"""
        if not self.job_ids:
            return self.log_test("Job Status Update", False, "- No job IDs available")
            
        try:
            job_id = self.job_ids[0]
            response = requests.put(f"{API_BASE}/jobs/{job_id}/status", 
                                  params={"status": "ON_HOLD"}, timeout=30)
            success = response.status_code == 200
            
            if success:
                # Verify status change
                get_response = requests.get(f"{API_BASE}/jobs/{job_id}", timeout=30)
                if get_response.status_code == 200:
                    job_data = get_response.json()
                    success = job_data['status'] == 'ON_HOLD'
                    details = f"- Status updated to: {job_data['status']}"
                else:
                    success = False
                    details = "- Failed to verify status update"
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Job Status Update", success, details)
        except Exception as e:
            return self.log_test("Job Status Update", False, f"- Error: {str(e)}")
    
    def test_ai_matching_algorithm(self):
        """Test AI-powered matching with weighted scoring"""
        if not self.job_ids or not self.resume_ids:
            return self.log_test("AI Matching Algorithm", False, "- No job or resume IDs available")
            
        try:
            # First, set job back to ACTIVE for matching
            job_id = self.job_ids[0]
            requests.put(f"{API_BASE}/jobs/{job_id}/status", params={"status": "ACTIVE"}, timeout=30)
            
            # Run matching
            response = requests.post(f"{API_BASE}/match/run?jd_id={job_id}", timeout=120)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"- {data['message']}, Matches: {data['matches_created']}"
                
                # Get match results to verify scoring
                time.sleep(2)  # Allow processing time
                results_response = requests.get(f"{API_BASE}/match/results/{job_id}", timeout=30)
                if results_response.status_code == 200:
                    results = results_response.json()
                    if results:
                        sample_match = results[0]
                        score_fields = ['total_score', 'skill_score', 'experience_score', 'tools_score']
                        has_scores = all(field in sample_match for field in score_fields)
                        if has_scores:
                            details += f", Sample score: {sample_match['total_score']}%, Category: {sample_match['category']}"
                        success = has_scores
                    else:
                        details += ", No match results found"
                        success = False
            else:
                details = f"- Status: {response.status_code}, Response: {response.text[:100]}"
                
            return self.log_test("AI Matching Algorithm", success, details)
        except Exception as e:
            return self.log_test("AI Matching Algorithm", False, f"- Error: {str(e)}")
    
    def test_match_results_filtering(self):
        """Test match results with score filtering"""
        if not self.job_ids:
            return self.log_test("Match Results Filtering", False, "- No job IDs available")
            
        try:
            job_id = self.job_ids[0]
            
            # Test different minimum score filters
            filters = [0, 50, 60, 80]
            results_counts = []
            
            for min_score in filters:
                response = requests.get(f"{API_BASE}/match/results/{job_id}?min_score={min_score}", timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    results_counts.append(len(data))
                else:
                    return self.log_test("Match Results Filtering", False, f"- Status: {response.status_code}")
            
            # Verify filtering works (higher scores should have equal or fewer results)
            success = all(results_counts[i] >= results_counts[i+1] for i in range(len(results_counts)-1))
            details = f"- Results by min score {dict(zip(filters, results_counts))}"
            
            return self.log_test("Match Results Filtering", success, details)
        except Exception as e:
            return self.log_test("Match Results Filtering", False, f"- Error: {str(e)}")
    
    def test_recent_matching(self):
        """Test recent resume matching (≤3 months)"""
        try:
            response = requests.get(f"{API_BASE}/match/recent", timeout=60)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"- {data['message']}, Results: {len(data.get('results', []))}"
            else:
                details = f"- Status: {response.status_code}"
                
            return self.log_test("Recent Resume Matching", success, details)
        except Exception as e:
            return self.log_test("Recent Resume Matching", False, f"- Error: {str(e)}")
    
    def test_bulk_jd_upload(self):
        """Test NEW FEATURE: bulk JD file upload with AI parsing"""
        try:
            # Test with JD text files
            sample_jd_1 = open('/app/test_sample_jd_1.txt', 'rb')
            sample_jd_2 = open('/app/test_sample_jd_2.txt', 'rb')
            
            files = [
                ('files', ('senior_fullstack_jd.txt', sample_jd_1, 'text/plain')),
                ('files', ('devops_engineer_jd.txt', sample_jd_2, 'text/plain'))
            ]
            
            response = requests.post(f"{API_BASE}/jobs/upload-bulk", files=files, timeout=120)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                jd_ids = [jd['id'] for jd in data]
                self.job_ids.extend(jd_ids)
                details = f"- Uploaded {len(data)} JDs with AI parsing, Sample title: {data[0]['title'] if data else 'None'}"
            else:
                details = f"- Status: {response.status_code}, Response: {response.text[:100]}"
            
            sample_jd_1.close()
            sample_jd_2.close()
            return self.log_test("NEW: Bulk JD Upload with AI Parsing", success, details)
            
        except Exception as e:
            return self.log_test("NEW: Bulk JD Upload with AI Parsing", False, f"- Error: {str(e)}")
    
    def test_zip_upload_auto_detection(self):
        """Test NEW FEATURE: ZIP file upload with auto file type detection"""
        try:
            import zipfile
            import tempfile
            import os
            
            # Create a temporary ZIP file with mixed resumes and JDs
            with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as zip_file:
                zip_path = zip_file.name
                
                with zipfile.ZipFile(zip_path, 'w') as zf:
                    # Add resume files
                    zf.write('/app/test_sample_resume_1.txt', 'resume_1.txt')
                    zf.write('/app/test_sample_resume_2.txt', 'resume_2.txt')
                    # Add JD files
                    zf.write('/app/test_sample_jd_1.txt', 'job_description_1.txt')
                    zf.write('/app/test_sample_jd_2.txt', 'job_description_2.txt')
            
            # Upload the ZIP file
            with open(zip_path, 'rb') as zip_content:
                files = {'file': ('test_mixed.zip', zip_content, 'application/zip')}
                response = requests.post(f"{API_BASE}/upload-zip", files=files, timeout=120)
                
            success = response.status_code == 200
            
            if success:
                data = response.json()
                resumes_count = data.get('resumes_uploaded', 0)
                jds_count = data.get('jds_uploaded', 0)
                details = f"- Auto-detected and processed: {resumes_count} resumes, {jds_count} JDs"
                # Verify auto-detection worked (should separate files correctly)
                success = resumes_count > 0 and jds_count > 0
            else:
                details = f"- Status: {response.status_code}, Response: {response.text[:100]}"
            
            # Cleanup
            os.unlink(zip_path)
            return self.log_test("NEW: ZIP Upload with Auto File Type Detection", success, details)
            
        except Exception as e:
            return self.log_test("NEW: ZIP Upload with Auto File Type Detection", False, f"- Error: {str(e)}")

    def test_delete_operations(self):
        """Test delete operations for cleanup"""
        success_count = 0
        total_operations = 0
        
        # Delete a resume
        if self.resume_ids:
            try:
                resume_id = self.resume_ids[0]
                response = requests.delete(f"{API_BASE}/resumes/{resume_id}", timeout=30)
                total_operations += 1
                if response.status_code == 200:
                    success_count += 1
            except Exception as e:
                pass
        
        # Delete a job
        if self.job_ids:
            try:
                job_id = self.job_ids[0]
                response = requests.delete(f"{API_BASE}/jobs/{job_id}", timeout=30)
                total_operations += 1
                if response.status_code == 200:
                    success_count += 1
            except Exception as e:
                pass
        
        success = success_count == total_operations if total_operations > 0 else False
        details = f"- {success_count}/{total_operations} operations successful"
        
        return self.log_test("Delete Operations", success, details)
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"\n🚀 Starting SAPS Backend API Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}\n")
        
        # Core functionality tests
        self.test_dashboard_stats()
        self.test_bulk_resume_upload()
        self.test_resume_list()
        self.test_recent_resume_filter()
        
        self.test_job_creation()
        self.test_job_list()
        self.test_job_status_update()
        
        # AI and matching tests
        self.test_ai_matching_algorithm()
        self.test_match_results_filtering()
        self.test_recent_matching()
        
        # Cleanup tests
        self.test_delete_operations()
        
        # Summary
        print(f"\n📊 Test Results Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ All backend tests passed!")
            return True
        else:
            print(f"\n❌ {self.tests_run - self.tests_passed} tests failed")
            return False

if __name__ == "__main__":
    tester = SAPSAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)