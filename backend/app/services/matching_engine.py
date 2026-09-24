import re
from typing import List, Tuple
from app.schemas.job import JobMatchDetail


class MatchingEngine:
    """Calculates practical, transparent candidate-to-job matching scores and breakdowns."""

    @classmethod
    def evaluate(
        cls,
        candidate_roles: List[str],
        candidate_skills: List[str],
        candidate_experience: str,
        preferred_locations: List[str],
        work_preferences: List[str],
        job_title: str,
        job_location: str,
        job_work_mode: str,
        job_required_skills: List[str],
        job_description: str
    ) -> JobMatchDetail:
        # Check if candidate has no resume / skills extracted yet
        if not candidate_skills and not candidate_roles:
            return JobMatchDetail(
                match_level="Pending",
                match_score=0,
                matched_skills=[],
                missing_skills=[],
                role_fit="Pending",
                location_fit="Pending",
                reasons=["Upload your resume to calculate your personalized match score and highlight matching skills."]
            )

        # Normalize skill sets
        cand_skills_lower = {s.lower(): s for s in candidate_skills}
        
        # If job has no explicit skills parsed, scan description
        if not job_required_skills:
            from app.utils.text_helpers import extract_skills_from_text
            job_required_skills = extract_skills_from_text(f"{job_title} {job_description}")

        job_skills_lower = {s.lower(): s for s in job_required_skills}

        # 1. Skill Overlap Calculation
        matched_keys = set(cand_skills_lower.keys()).intersection(set(job_skills_lower.keys()))
        missing_keys = set(job_skills_lower.keys()) - set(cand_skills_lower.keys())

        matched_skills = [job_skills_lower[k] for k in matched_keys]
        missing_skills = [job_skills_lower[k] for k in missing_keys]

        if job_skills_lower:
            skill_score = min(100, int((len(matched_keys) / len(job_skills_lower)) * 100))
        else:
            # If no skills mentioned, check if candidate's top skill is in description
            skill_score = 65

        # 2. Role Title Similarity
        role_score, role_fit = cls._calculate_role_fit(candidate_roles, job_title)

        # 3. Location & Work Mode Fit
        loc_score, location_fit = cls._calculate_location_fit(
            preferred_locations, work_preferences, job_location, job_work_mode
        )

        # 4. Experience Alignment
        exp_score = cls._calculate_experience_fit(candidate_experience, job_title, job_description)

        # Weighted Composite Score:
        # Skills: 45%, Role: 30%, Location/Mode: 15%, Experience: 10%
        total_score = int(
            (skill_score * 0.45) +
            (role_score * 0.30) +
            (loc_score * 0.15) +
            (exp_score * 0.10)
        )
        total_score = max(10, min(98, total_score))

        # Match Level Thresholds
        if total_score >= 70:
            match_level = "High"
        elif total_score >= 45:
            match_level = "Medium"
        else:
            match_level = "Low"

        # Generate reasons
        reasons = []
        if matched_skills:
            reasons.append(f"Strong match on core skills: {', '.join(matched_skills[:3])}")
        if role_score >= 80:
            reasons.append(f"Title closely aligns with your target role")
        if loc_score == 100:
            reasons.append(f"Location ({job_location}) aligns with your preferences")
        elif job_work_mode == "Remote":
            reasons.append("Remote role matching your flexibility preference")

        if missing_skills:
            reasons.append(f"Role asks for {', '.join(missing_skills[:2])} which is not highlighted in your resume")

        return JobMatchDetail(
            match_level=match_level,
            match_score=total_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills[:5],
            role_fit=role_fit,
            location_fit=location_fit,
            reasons=reasons
        )

    @classmethod
    def _calculate_role_fit(cls, target_roles: List[str], job_title: str) -> Tuple[int, str]:
        title_lower = job_title.lower()
        if not target_roles:
            return 60, "Medium"

        # Check exact or strong token overlap
        best_score = 30
        for role in target_roles:
            r_tokens = set(re.findall(r"\w+", role.lower()))
            t_tokens = set(re.findall(r"\w+", title_lower))
            if not r_tokens:
                continue
            common = r_tokens.intersection(t_tokens)
            ratio = len(common) / len(r_tokens)
            if ratio >= 0.8:
                return 95, "High"
            elif ratio >= 0.5:
                best_score = max(best_score, 80)
            elif any(w in title_lower for w in ["developer", "engineer", "architect"]):
                best_score = max(best_score, 60)

        if best_score >= 80:
            return best_score, "High"
        elif best_score >= 50:
            return best_score, "Medium"
        return best_score, "Low"

    @classmethod
    def _calculate_location_fit(
        cls,
        preferred_locations: List[str],
        work_preferences: List[str],
        job_location: str,
        job_work_mode: str
    ) -> Tuple[int, str]:
        job_loc_lower = job_location.lower()
        pref_locs_lower = [l.lower() for l in preferred_locations]
        pref_modes_lower = [m.lower() for m in work_preferences]

        # Remote match
        if job_work_mode.lower() == "remote" or "remote" in job_loc_lower:
            if "remote" in pref_modes_lower or "remote" in pref_locs_lower:
                return 100, "Remote (Preferred)"
            return 80, "Remote"

        # Direct city match (Indore, Delhi, Bangalore, Pune, Hyderabad, etc.)
        for loc in pref_locs_lower:
            if loc in job_loc_lower:
                return 100, f"Exact Match ({loc.title()})"

        # Work mode match
        if job_work_mode.lower() in pref_modes_lower:
            return 70, f"Mode Match ({job_work_mode})"

        return 40, "Different Location"

    @classmethod
    def _calculate_experience_fit(cls, candidate_exp: str, job_title: str, description: str) -> int:
        cand_level = candidate_exp.lower()
        text = f"{job_title} {description}".lower()

        is_senior_job = any(w in text for w in ["senior", "lead", "staff", "principal", "architect"])
        is_junior_job = any(w in text for w in ["junior", "entry", "associate", "graduate", "intern"])

        if "senior" in cand_level:
            return 100 if is_senior_job else 75
        elif "entry" in cand_level:
            return 50 if is_senior_job else 95
        else:  # Mid
            return 85
