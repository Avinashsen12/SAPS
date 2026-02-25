import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Brain, Lightbulb } from 'lucide-react';

const MatchExplanation = ({ explanation }) => {
  if (!explanation) return null;

  return (
    <div className="space-y-3 text-sm">
      {explanation.suggestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
            <Lightbulb size={16} />
            Suggestion to Improve Match
          </p>
          <p className="text-amber-800 text-sm">{explanation.suggestion}</p>
        </div>
      )}

      {explanation.ai_reasoning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
            <Brain size={16} />
            AI Analysis
          </p>
          <p className="text-blue-800 text-sm">{explanation.ai_reasoning}</p>
        </div>
      )}

      {explanation.matched_skills && explanation.matched_skills.length > 0 && (
        <div>
          <p className="font-semibold text-green-700 flex items-center gap-2 mb-1">
            <CheckCircle size={16} />
            Matched Skills ({explanation.matched_skills.length})
          </p>
          <div className="space-y-1">
            {explanation.matched_skills.map((skill, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  {skill}
                </span>
                {explanation.match_explanations && explanation.match_explanations[skill] && (
                  <span className="text-xs text-slate-600 italic">
                    {explanation.match_explanations[skill]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation.missing_skills && explanation.missing_skills.length > 0 && (
        <div>
          <p className="font-semibold text-red-700 flex items-center gap-2 mb-1">
            <XCircle size={16} />
            Missing Skills ({explanation.missing_skills.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {explanation.missing_skills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {explanation.experience_detail && (
        <div>
          <p className="font-semibold text-slate-700 flex items-center gap-2 mb-1">
            <AlertCircle size={16} />
            Experience
          </p>
          <p className="text-slate-600">{explanation.experience_detail}</p>
        </div>
      )}

      {explanation.matched_tools && explanation.matched_tools.length > 0 && (
        <div>
          <p className="font-semibold text-blue-700 flex items-center gap-2 mb-1">
            <CheckCircle size={16} />
            Matching Tools/Technologies ({explanation.matched_tools.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {explanation.matched_tools.map((tool, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {explanation.matched_certifications && explanation.matched_certifications.length > 0 && (
        <div>
          <p className="font-semibold text-purple-700 flex items-center gap-2 mb-1">
            <CheckCircle size={16} />
            Certifications Match
          </p>
          <div className="flex flex-wrap gap-2">
            {explanation.matched_certifications.map((cert, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Industry Match:</span>
            <span className={explanation.industry_match ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {explanation.industry_match ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Location Match:</span>
            <span className={explanation.location_match ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {explanation.location_match ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchExplanation;
