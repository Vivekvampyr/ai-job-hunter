import React, { useState, useEffect } from 'react';
import { Check, X, Save } from 'lucide-react';
import type { CandidateProfile } from '../types';

interface ProfileEditorProps {
  profile: CandidateProfile | null;
  onUpdateProfile: (updated: Partial<CandidateProfile>) => Promise<void>;
}

const ALL_LOCATIONS = ['Indore', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Remote', 'Mumbai', 'Chennai', 'Gurgaon'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level'];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onUpdateProfile }) => {
  if (!profile) return null;

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level || 'Entry Level');
  const [preferredLocations, setPreferredLocations] = useState<string[]>(profile.preferred_locations || []);
  const [workPreferences, setWorkPreferences] = useState<string[]>(profile.work_preferences || []);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [targetRoles, setTargetRoles] = useState<string[]>(profile.target_roles || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync internal state when profile prop changes (e.g. user switch, resume upload)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setExperienceLevel(profile.experience_level || 'Entry Level');
      setPreferredLocations(profile.preferred_locations || []);
      setWorkPreferences(profile.work_preferences || []);
      setSkills(profile.skills || []);
      setTargetRoles(profile.target_roles || []);
      setSavedSuccess(false);
    }
  }, [profile]);

  const toggleLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleWorkMode = (mode: string) => {
    setWorkPreferences((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
      setTargetRoles([...targetRoles, newRoleInput.trim()]);
      setNewRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== roleToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        full_name: fullName,
        experience_level: experienceLevel,
        preferred_locations: preferredLocations,
        work_preferences: workPreferences,
        skills,
        target_roles: targetRoles,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#15171c] border border-zinc-200 dark:border-[#262933] rounded p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#262933] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Candidate Profile & Match Preferences
          </h2>
          <p className="text-xs text-zinc-500">
            Configure skills, target roles, and locations used to match open positions.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name & Experience Level */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Candidate Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 dark:focus:border-sky-500 transition-colors"
              placeholder="e.g. Vivek Rajawat"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                    experienceLevel === lvl
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                      : 'bg-white dark:bg-[#111317] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#262933] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Work Preference (Remote, Hybrid, On-site) */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Work Mode Preference
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {WORK_MODES.map((mode) => {
                const active = workPreferences.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleWorkMode(mode)}
                    className={`py-1.5 text-xs font-medium rounded border flex items-center justify-center gap-1 transition-colors ${
                      active
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'bg-white dark:bg-[#111317] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#262933] hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Preferred Locations
            </label>
            <div className="flex flex-wrap gap-1">
              {ALL_LOCATIONS.map((loc) => {
                const active = preferredLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      active
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                        : 'bg-white dark:bg-[#111317] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-[#262933] hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Target Job Roles */}
      <div className="border-t border-zinc-200 dark:border-[#262933] pt-3">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
          Target Job Roles
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {targetRoles.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">
              No target roles configured yet.
            </p>
          ) : (
            targetRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50 dark:bg-[#0f1013] text-xs font-mono text-zinc-800 dark:text-zinc-200"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  className="hover:text-red-500 text-zinc-400 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <form onSubmit={handleAddRole} className="flex gap-1.5 max-w-sm">
          <input
            type="text"
            value={newRoleInput}
            onChange={(e) => setNewRoleInput(e.target.value)}
            placeholder="Add role (e.g. AI Engineer)"
            className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1c1f26] text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Extracted Skills */}
      <div className="border-t border-zinc-200 dark:border-[#262933] pt-3">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
          Skills ({skills.length})
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skills.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">
              No skills configured yet.
            </p>
          ) : (
            skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-[#262933] bg-zinc-50 dark:bg-[#0f1013] text-xs font-mono text-zinc-800 dark:text-zinc-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500 text-zinc-400 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <form onSubmit={handleAddSkill} className="flex gap-1.5 max-w-sm">
          <input
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            placeholder="Add skill (e.g. Docker, PostgreSQL)"
            className="flex-1 px-2.5 py-1 text-xs bg-zinc-50 dark:bg-[#0f1013] border border-zinc-200 dark:border-[#262933] rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-200 dark:border-[#262933] bg-white dark:bg-[#15171c] hover:bg-zinc-100 dark:hover:bg-[#1c1f26] text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
