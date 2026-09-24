import React, { useState } from 'react';
import { User, MapPin, Briefcase, Award, Check, Plus, X, Save } from 'lucide-react';
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

  const [fullName, setFullName] = useState(profile.full_name || 'Vivek Rajawat');
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level || 'Entry Level');
  const [preferredLocations, setPreferredLocations] = useState<string[]>(profile.preferred_locations || []);
  const [workPreferences, setWorkPreferences] = useState<string[]>(profile.work_preferences || []);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [targetRoles, setTargetRoles] = useState<string[]>(profile.target_roles || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#373842] pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Candidate Profile & Match Preferences
          </h2>
          <p className="text-xs text-zinc-500">
            Customize extracted skills, target roles, and location preferences used for public ATS matching.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50 ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-600/25'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name & Experience Level */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Candidate Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              placeholder="e.g. Vivek Rajawat"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    experienceLevel === lvl
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/25'
                      : 'bg-zinc-50 dark:bg-[#25262c] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Work Preference (Remote, Hybrid, On-site) */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            Work Preference
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {WORK_MODES.map((mode) => {
              const active = workPreferences.includes(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleWorkMode(mode)}
                  className={`py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/25'
                      : 'bg-zinc-50 dark:bg-[#25262c] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Preferred Locations */}
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            Preferred Locations (Click to toggle)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_LOCATIONS.map((loc) => {
              const active = preferredLocations.includes(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                      : 'bg-zinc-50 dark:bg-[#25262c] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Job Roles */}
      <div className="border-t border-zinc-200 dark:border-[#373842] pt-4">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          Target Job Roles (Used to generate search queries & role similarity)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {targetRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
            >
              {role}
              <button
                type="button"
                onClick={() => handleRemoveRole(role)}
                className="hover:text-red-500 text-indigo-400 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddRole} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newRoleInput}
            onChange={(e) => setNewRoleInput(e.target.value)}
            placeholder="Add role (e.g. AI Engineer, Python Developer)"
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Role
          </button>
        </form>
      </div>

      {/* Extracted Skills */}
      <div className="border-t border-zinc-200 dark:border-[#373842] pt-4">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          Extracted Skills ({skills.length})
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="hover:text-red-500 text-emerald-500/70 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddSkill} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            placeholder="Add skill (e.g. Docker, Redis, Kubernetes)"
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#1a1b1f] border border-zinc-200 dark:border-[#373842] rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Skill
          </button>
        </form>
      </div>
    </div>
  );
};
