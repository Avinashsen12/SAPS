import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Resumes from '@/pages/Resumes';
import Jobs from '@/pages/Jobs';
import CreateJob from '@/pages/CreateJob';
import JobDetail from '@/pages/JobDetail';
import CandidatePortal from '@/pages/CandidatePortal';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Route - No Sidebar */}
          <Route path="/apply" element={<CandidatePortal />} />
          
          {/* Admin Routes - With Sidebar */}
          <Route path="/*" element={
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/resumes" element={<Resumes />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/new" element={<CreateJob />} />
                  <Route path="/jobs/:id" element={<JobDetail />} />
                </Routes>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;