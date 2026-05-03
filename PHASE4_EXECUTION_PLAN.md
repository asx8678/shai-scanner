# Phase 4: User Onboarding — Comprehensive Execution Plan

**Project:** shai-scanner v4.6.0  
**Phase:** 4 — User Onboarding  
**Status:** Ready for Execution  
**Author:** Max 🐶  
**Date:** 2026-05-03  

---

## 📋 Executive Summary

This plan orchestrates the creation of **15 deliverables** (files + updates) across **4 directories** for the shai-scanner User Onboarding phase. Total estimated effort: **20–26 hours** over **2–3 days**, with a recommended execution order optimized for dependency resolution and parallel work.

---

## 🎯 Success Criteria

| Metric | Target | How to Verify |
|--------|--------|---------------|
| First-scan completion time | ≤ 10 min for new users | User testing / timer |
| Troubleshooting coverage | ≥ 90% of common issues | Issue tracker cross-reference |
| FAQ entries | ≥ 20 questions answered | Count in `FAQ.md` |
| GitHub templates | Valid YAML frontmatter | `yamllint` or manual review |
| Code examples tested | 100% run without errors | Shell execution during QA |
| README update | All new sections linked | Manual review |
| Interactive tutorial | Completable in ≤ 30 min | Timed walkthrough |
| Video script | 10–15 min runtime | Word count (~1,500–2,000 words) |

---

## 📁 Directory Structure (Target State)

```
.
├── tutorials/
│   ├── VIDEO_SCRIPT.md          ← Task 1
│   ├── INTERACTIVE_TUTORIAL.md  ← Task 2
│   └── README.md                ← Task 2 (auto-created as index)
├── templates/
│   └── QUICK_START/
│       ├── README.md            ← Task 3
│       ├── package.json         ← Task 3
│       ├── .gitignore           ← Task 3
│       ├── .github/
│       │   └── workflows/
│       │       └── security-scan.yml  ← Task 3
│       └── src/
│           └── index.js         ← Task 3
├── docs/
│   └── TROUBLESHOOTING.md       ← Task 4
├── .github/
│   ├── DISCUSSION_TEMPLATE_QA.md      ← Task 5
│   ├── DISCUSSION_TEMPLATE_FEATURE.md ← Task 5
│   ├── DISCUSSION_TEMPLATE_SHOWCASE.md← Task 5
│   └── community/
│       ├── GUIDELINES.md              ← Task 6
│       ├── CONTRIBUTOR_RECOGNITION.md ← Task 7
│       └── FAQ.md                     ← Task 8
└── README.md                    ← Task 9 (update)
```

---

## 📊 Task Dependency Graph

```
                    ┌──────────────────┐
                    │  T0: Create dirs │  (no deps)
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────────┐
          │                  │                      │
          ▼                  ▼                      ▼
  ┌───────────────┐  ┌──────────────┐    ┌─────────────────┐
  │ T1: Video     │  │ T3: Template │    │ T5: Discussion  │
  │ Script        │  │ Project      │    │ Templates       │
  │ (2-3 hrs)     │  │ (2-3 hrs)    │    │ (1.5 hrs)       │
  └───────┬───────┘  └──────┬───────┘    └────────┬────────┘
          │                  │                      │
          ▼                  ▼                      │
  ┌───────────────┐  ┌──────────────┐              │
  │ T2: Interactive│  │ T4: Troubleshoot            │
  │ Tutorial      │  │ Guide       │              │
  │ (3-4 hrs)     │  │ (3-4 hrs)   │              │
  └───────┬───────┘  └──────┬───────┘              │
          │                  │                      │
          │                  │         ┌────────────┘
          │                  │         │
          ▼                  ▼         ▼
  ┌──────────────────────────────────────────┐
  │        T6: Community Guidelines           │
  │              (2-3 hrs)                    │
  └──────────────────┬───────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
  ┌───────────────┐   ┌─────────────────┐
  │ T7: Contributor│   │ T8: FAQ         │
  │ Recognition   │   │ (3-4 hrs)       │
  │ (1-2 hrs)     │   │                 │
  └───────┬───────┘   └────────┬────────┘
          │                     │
          └──────────┬──────────┘
                     ▼
          ┌─────────────────┐
          │ T9: Update README│
          │    (1 hr)        │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ T10: QA & Validate│
          │    (2-3 hrs)      │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ T11: Phase Complete│
          │    Summary        │
          │    (1 hr)         │
          └─────────────────┘
```

### Legend
- **Solid arrows** = hard dependency (must complete before starting)
- **Vertical stacking within same column** = can run in parallel

---

## 🔀 Parallelization Map

### Wave 0: Setup (Sequential, ~15 min)
| Task | Description | Est. Time | Blocks |
|------|-------------|-----------|--------|
| **T0** | Create directory structure | 15 min | T1–T8 |

### Wave 1: Independent Content Creation (4 Parallel Tracks, ~9-12 hrs)
These tasks have **zero dependencies on each other** and can be executed simultaneously:

| Track | Task | Est. Time | Depends On |
|-------|------|-----------|------------|
| **A** | **T1:** `tutorials/VIDEO_SCRIPT.md` | 2–3 hrs | T0 |
| **B** | **T3:** `templates/QUICK_START/` (all 5 files) | 2–3 hrs | T0 |
| **C** | **T5:** `.github/DISCUSSION_TEMPLATE_*.md` (3 files) | 1.5 hrs | T0 |
| **D** | **T4:** `docs/TROUBLESHOOTING.md` | 3–4 hrs | T0 |

> 💡 **Parallelization insight:** If you have 4 agents, all four tracks can run concurrently. This reduces wall-clock time from ~9–12 hrs to ~3–4 hrs for Wave 1.

### Wave 2: Dependent Content (2 Parallel Tracks, ~7-10 hrs)
| Track | Task | Est. Time | Depends On |
|-------|------|-----------|------------|
| **A** | **T2:** `tutorials/INTERACTIVE_TUTORIAL.md` | 3–4 hrs | T1 (script informs tutorial structure) |
| **B** | **T6:** `.github/community/GUIDELINES.md` | 2–3 hrs | T5 (discussion templates inform guidelines) |

### Wave 3: Community Details (2 Parallel Tracks, ~5-7 hrs)
| Track | Task | Est. Time | Depends On |
|-------|------|-----------|------------|
| **A** | **T7:** `.github/community/CONTRIBUTOR_RECOGNITION.md` | 1–2 hrs | T6 |
| **B** | **T8:** `.github/community/FAQ.md` | 3–4 hrs | T4, T6 (troubleshooting + guidelines inform FAQ) |

### Wave 4: Integration & Validation (Sequential, ~4-5 hrs)
| Task | Description | Est. Time | Depends On |
|------|-------------|-----------|------------|
| **T9** | Update `README.md` with new sections | 1 hr | T1–T8 |
| **T10** | QA: Test code examples, validate YAML, check links | 2–3 hrs | T9 |
| **T11** | Phase completion summary | 1 hr | T10 |

---

## 📝 Detailed Task Specifications

---

### T0: Create Directory Structure
**Time:** 15 min  
**Dependencies:** None  
**Parallelizable:** No (must be first)

```bash
mkdir -p tutorials
mkdir -p templates/QUICK_START/.github/workflows
mkdir -p templates/QUICK_START/src
mkdir -p .github/community
```

**Quality Checkpoint:**
- [ ] All 4 directories exist
- [ ] No error on creation

---

### T1: Video Script (`tutorials/VIDEO_SCRIPT.md`)
**Time:** 2–3 hours  
**Dependencies:** T0  
**Parallelizable:** Yes (Wave 1, Track A)

**Content Requirements:**
- 10–15 minute runtime (~1,500–2,000 words)
- 7 sections: Intro, What/Why, Install, First Scan, Advanced, CI/CD, Wrap-up
- Screen recording cues marked with `[RECORD]` tags
- Code examples must match actual CLI flags (verify against `src/cli.js --help`)
- Engaging hook about npm supply-chain attack statistics
- Clear transitions between sections

**Style Guide:**
- Match tone of `CONTRIBUTING.md` — friendly, welcoming, emoji-friendly
- Use second person ("you", "your")
- Include timestamps for each section
- Bold key terms on first use

**Quality Checkpoint:**
- [ ] Word count: 1,500–2,000
- [ ] All CLI commands are valid (test each one)
- [ ] Timestamps add up to 10–15 min
- [ ] No placeholder text remaining
- [ ] Links point to real resources

---

### T2: Interactive Tutorial (`tutorials/INTERACTIVE_TUTORIAL.md`)
**Time:** 3–4 hours  
**Dependencies:** T1 (use same structure/narrative flow)  
**Parallelizable:** Yes (Wave 2, Track A — parallel with T6)

**Content Requirements:**
- 5 steps, completable in ≤ 30 minutes
- Prerequisites section (Node.js 18+, terminal access)
- Each step has: instructions, expected output, ✅ checkpoint
- Validation commands users can run to confirm success
- Troubleshooting tips inline at each step
- Completion summary with next steps

**Step Breakdown:**
| Step | Topic | Time | Key Checkpoint |
|------|-------|------|----------------|
| 1 | Environment Setup | 5 min | `shai-scanner --version` returns 4.6.0+ |
| 2 | First Scan | 10 min | Scan summary with findings displayed |
| 3 | Advanced Scanning | 10 min | JSON/HTML/SARIF files generated |
| 4 | CI/CD Integration | 3 min | GitHub Actions workflow explained |
| 5 | Troubleshooting | 2 min | Links to full troubleshooting guide |

**Quality Checkpoint:**
- [ ] Total estimated time ≤ 30 min
- [ ] Every code block has expected output
- [ ] Every step has a ✅ checkpoint
- [ ] No dead links
- [ ] References T3's quick-start template where appropriate

---

### T3: Quick Start Template (`templates/QUICK_START/`)
**Time:** 2–3 hours (5 files)  
**Dependencies:** T0  
**Parallelizable:** Yes (Wave 1, Track B)

**Files to Create:**

#### T3a: `templates/QUICK_START/README.md` (45 min)
- Project description
- Quick start instructions (3 steps)
- Configuration section
- Advanced usage examples
- Resource links

#### T3b: `templates/QUICK_START/package.json` (15 min)
```json
{
  "name": "my-secure-project",
  "version": "1.0.0",
  "scripts": {
    "scan": "shai-scanner --scan .",
    "scan:json": "shai-scanner --scan . --json",
    "scan:html": "shai-scanner --scan . --html -o report.html",
    "scan:sarif": "shai-scanner --scan . --sarif --output shai-scanner.sarif"
  },
  "devDependencies": {
    "shai-scanner": "^4.6.0"
  }
}
```

#### T3c: `templates/QUICK_START/.github/workflows/security-scan.yml` (45 min)
- Triggers: push, pull_request, schedule, workflow_dispatch
- Permissions: `contents: read`, `security-events: write`
- Steps: checkout → setup node → install → scan → upload SARIF → HTML report → artifact upload
- Must match style of `examples/github-action.yml`
- **Must pass `yamllint` validation**

#### T3d: `templates/QUICK_START/.gitignore` (10 min)
- Standard Node.js ignores
- Security report outputs
- Shai-scanner cache

#### T3e: `templates/QUICK_START/src/index.js` (10 min)
- Placeholder with helpful console output
- 10 lines max

**Quality Checkpoint:**
- [ ] `package.json` is valid JSON (test with `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`)
- [ ] YAML passes linting
- [ ] `.gitignore` covers all common patterns
- [ ] README links are valid
- [ ] Template is clone-and-go ready

---

### T4: Troubleshooting Guide (`docs/TROUBLESHOOTING.md`)
**Time:** 3–4 hours  
**Dependencies:** T0  
**Parallelizable:** Yes (Wave 1, Track D)

**Content Requirements:**
- Cover ≥ 90% of common issues (estimated 15–20 issue categories)
- Organized by category: Installation, Scan Errors, Output, CI/CD, Performance, Advanced
- Each issue has: Symptoms (with error output), Solutions (numbered steps), Prevention tip
- Debug mode and log file documentation
- Support channel reference table

**Issue Categories to Cover:**
| Category | Est. Issues | Priority |
|----------|-------------|----------|
| Installation | 3–4 | High |
| Scan Errors | 4–5 | High |
| Output Issues | 3–4 | High |
| CI/CD Integration | 3–4 | High |
| Performance | 2–3 | Medium |
| Advanced | 2–3 | Medium |

**Cross-Reference Sources:**
- GitHub Issues (common patterns)
- `src/cli.js` error messages
- `src/scanner.js` error handling
- `src/database.js` network/cache issues

**Quality Checkpoint:**
- [ ] ≥ 15 distinct issues documented
- [ ] All code examples are runnable
- [ ] Error messages match actual tool output
- [ ] Support channels table is accurate
- [ ] Links to FAQ, Community Guidelines work

---

### T5: GitHub Discussion Templates
**Time:** 1.5 hours (3 files)  
**Dependencies:** T0  
**Parallelizable:** Yes (Wave 1, Track C)

**Files:**
| File | Est. Time | Frontmatter Format |
|------|-----------|-------------------|
| `.github/DISCUSSION_TEMPLATE_QA.md` | 30 min | YAML with `name`, `about`, `title`, `labels` |
| `.github/DISCUSSION_TEMPLATE_FEATURE.md` | 30 min | YAML with `name`, `about`, `title`, `labels` |
| `.github/DISCUSSION_TEMPLATE_SHOWCASE.md` | 30 min | YAML with `name`, `about`, `title`, `labels` |

**Requirements:**
- Valid GitHub Discussion YAML frontmatter
- Clear, helpful prompts for users
- Environment info section (OS, Node.js version, shai-scanner version)
- Consistent emoji usage across templates
- Labels must match GitHub label conventions

**Quality Checkpoint:**
- [ ] YAML frontmatter parses correctly
- [ ] All fields use GitHub-supported keys
- [ ] Markdown body is well-structured
- [ ] Templates are distinct and purposeful
- [ ] Labels exist in the repository (or will be created)

---

### T6: Community Guidelines (`.github/community/GUIDELINES.md`)
**Time:** 2–3 hours  
**Dependencies:** T5 (discussion templates inform communication channels)  
**Parallelizable:** Yes (Wave 2, Track B — parallel with T2)

**Content Requirements:**
- Community values (respect, inclusion, constructive communication)
- Communication channels guide (GitHub Discussions, Issues, Discord, Twitter)
- Getting help section (before asking, when asking)
- Contributing guide (ways to contribute, process, code quality, PR guidelines)
- Recognition program overview (reference T7)
- Unacceptable behavior (reference CODE_OF_CONDUCT.md)
- Enforcement procedures
- Resource links

**Style:** Match tone of `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md`

**Quality Checkpoint:**
- [ ] References existing CONTRIBUTING.md and CODE_OF_CONDUCT.md
- [ ] All channel links are valid
- [ ] Tone is welcoming and inclusive
- [ ] No jargon without explanation
- [ ] Recognition tiers match T7

---

### T7: Contributor Recognition (`.github/community/CONTRIBUTOR_RECOGNITION.md`)
**Time:** 1–2 hours  
**Dependencies:** T6  
**Parallelizable:** Yes (Wave 3, Track A — parallel with T8)

**Content Requirements:**
- 4 recognition tiers: First-Time → Regular → Core → Maintainer
- Clear requirements for each tier
- Benefits/recognition for each tier
- Monthly recognition program (newsletter, social media)
- Contribution metrics tracking
- How to get started

**Quality Checkpoint:**
- [ ] Tier requirements are measurable
- [ ] Benefits are realistic and achievable
- [ ] Tone matches community guidelines
- [ ] Links to CONTRIBUTING.md work

---

### T8: FAQ (`.github/community/FAQ.md`)
**Time:** 3–4 hours  
**Dependencies:** T4 (troubleshooting informs Q&A), T6 (guidelines inform community Qs)  
**Parallelizable:** Yes (Wave 3, Track B — parallel with T7)

**Content Requirements:**
- ≥ 20 questions covering:
  - Installation & Setup (4–5 questions)
  - Usage & Configuration (5–6 questions)
  - Output & Reports (3–4 questions)
  - CI/CD Integration (3–4 questions)
  - Community & Contributing (2–3 questions)
- Each answer: concise (3–5 sentences), links to detailed docs
- Searchable headings
- Table of contents

**Quality Checkpoint:**
- [ ] ≥ 20 distinct Q&As
- [ ] All answers link to relevant docs
- [ ] No orphaned references
- [ ] Covers questions from troubleshooting guide
- [ ] TOC links work (anchor links)

---

### T9: Update README.md
**Time:** 1 hour  
**Dependencies:** T1–T8  
**Parallelizable:** No (sequential)

**Changes Required:**
1. Add "Tutorials" section linking to `tutorials/`
2. Add "Quick Start Template" section linking to `templates/QUICK_START/`
3. Add "Community" section linking to `.github/community/`
4. Add "Troubleshooting" section linking to `docs/TROUBLESHOOTING.md`
5. Add "FAQ" section linking to `.github/community/FAQ.md`
6. Verify all existing links still work

**Quality Checkpoint:**
- [ ] All new sections present
- [ ] All links resolve
- [ ] Markdown renders correctly
- [ ] No duplicate content
- [ ] Table of contents updated (if present)

---

### T10: QA & Validation
**Time:** 2–3 hours  
**Dependencies:** T9  
**Parallelizable:** No (sequential)

**Validation Checklist:**

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Code examples run | Execute each in shell | No errors |
| YAML valid | `yamllint` or `node -e` parse | Valid syntax |
| JSON valid | `JSON.parse` | Valid syntax |
| Links resolve | `curl -I` or manual | HTTP 200 |
| Markdown renders | Visual inspection | Clean formatting |
| FAQ has 20+ entries | `grep -c "^###"` count | ≥ 20 |
| Troubleshooting has 15+ issues | `grep -c "^### Issue"` count | ≥ 15 |
| Video script is 1,500–2,000 words | `wc -w` | In range |
| Tutorial ≤ 30 min | Manual walkthrough estimate | ≤ 30 min |

**Quality Checkpoint:**
- [ ] All checks pass
- [ ] No placeholder text (`TODO`, `FIXME`, `XXX`)
- [ ] No broken internal references
- [ ] File sizes reasonable (< 600 lines each)

---

### T11: Phase Completion Summary
**Time:** 1 hour  
**Dependencies:** T10  
**Parallelizable:** No

**Deliverables:**
- Update `PHASE4_PROGRESS_TRACKER.md` — all tasks marked complete
- Update `PHASE4_SUMMARY.md` — execution results
- Create/update phase completion summary with metrics

---

## ⏱️ Time Estimates Summary

### Per-Task Estimates

| Task | Description | Min | Max | Wave |
|------|-------------|-----|-----|------|
| T0 | Directory structure | 15m | 15m | 0 |
| T1 | Video script | 2h | 3h | 1 |
| T2 | Interactive tutorial | 3h | 4h | 2 |
| T3 | Quick start template | 2h | 3h | 1 |
| T4 | Troubleshooting guide | 3h | 4h | 1 |
| T5 | Discussion templates | 1.5h | 1.5h | 1 |
| T6 | Community guidelines | 2h | 3h | 2 |
| T7 | Contributor recognition | 1h | 2h | 3 |
| T8 | FAQ | 3h | 4h | 3 |
| T9 | README update | 1h | 1h | 4 |
| T10 | QA & validation | 2h | 3h | 4 |
| T11 | Phase summary | 1h | 1h | 4 |
| **Total** | | **21.5h** | **29.5h** | |

### Wall-Clock Estimates by Scenario

| Scenario | Agents | Wall Clock |
|----------|--------|------------|
| **Solo** (1 agent, sequential) | 1 | 2–3 days |
| **Duo** (2 agents, some parallel) | 2 | 1.5–2 days |
| **Full parallel** (4 agents, max parallel) | 4 | 1–1.5 days |

---

## 🔄 Recommended Execution Order

### Day 1: Foundation (8 hours)
| Time | Track | Task | Status |
|------|-------|------|--------|
| 0:00–0:15 | All | **T0:** Create directories | ☐ |
| 0:15–2:15 | A | **T1:** Video script | ☐ |
| 0:15–2:15 | B | **T3:** Quick start template | ☐ |
| 0:15–1:45 | C | **T5:** Discussion templates | ☐ |
| 0:15–3:45 | D | **T4:** Troubleshooting guide | ☐ |
| 2:15–5:15 | A | **T2:** Interactive tutorial | ☐ |
| 1:45–4:45 | C | **T6:** Community guidelines | ☐ |
| 5:15–6:15 | — | Break / review | ☐ |
| 6:15–7:15 | A | **T7:** Contributor recognition | ☐ |
| 6:15–9:15 | B | **T8:** FAQ | ☐ |

### Day 2: Integration & QA (6 hours)
| Time | Track | Task | Status |
|------|-------|------|--------|
| 0:00–1:00 | All | **T9:** Update README | ☐ |
| 1:00–3:00 | All | **T10:** QA & validation | ☐ |
| 3:00–4:00 | All | **T11:** Phase summary | ☐ |
| 4:00–6:00 | All | Buffer / fixes | ☐ |

---

## 🛡️ Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Video script exceeds 15 min | Medium | Low | Trim to key sections; use timestamps |
| FAQ doesn't reach 20 entries | Low | Medium | Mine GitHub Issues, Stack Overflow, Discord |
| YAML templates fail validation | Low | High | Test with `yamllint` before finalizing |
| Troubleshooting misses key issues | Medium | High | Cross-reference GitHub Issues for top 10 |
| Tutorial takes > 30 min | Medium | Medium | Add estimated times per step; cut Step 4 |
| README update breaks existing links | Low | High | Test all links before and after |

---

## 🏁 Quality Gates

Before marking Phase 4 complete, ALL of the following must pass:

### Gate 1: Content Completeness
- [ ] All 14 files created (not counting README update)
- [ ] No placeholder text remaining
- [ ] All files under 600 lines

### Gate 2: Technical Accuracy
- [ ] All CLI commands verified against `src/cli.js --help`
- [ ] All JSON/YAML files parse without errors
- [ ] Code examples execute without errors
- [ ] GitHub Actions workflow matches `examples/github-action.yml` style

### Gate 3: Documentation Quality
- [ ] All internal links resolve
- [ ] Markdown renders correctly
- [ ] Consistent formatting across all files
- [ ] Tone matches existing docs (CONTRIBUTING.md, CODE_OF_CONDUCT.md)

### Gate 4: User Experience
- [ ] Video script: 1,500–2,000 words
- [ ] Interactive tutorial: completable in ≤ 30 min
- [ ] Troubleshooting: ≥ 15 issues documented
- [ ] FAQ: ≥ 20 Q&As
- [ ] Quick-start template: clone-and-go ready

### Gate 5: Integration
- [ ] README updated with all new sections
- [ ] Cross-references between documents work
- [ ] Phase completion summary created

---

## 📎 Appendix: Cross-Reference Map

This shows how documents reference each other:

```
README.md ──────────┬──→ tutorials/VIDEO_SCRIPT.md
                    ├──→ tutorials/INTERACTIVE_TUTORIAL.md
                    ├──→ templates/QUICK_START/README.md
                    ├──→ docs/TROUBLESHOOTING.md
                    ├──→ .github/community/GUIDELINES.md
                    └──→ .github/community/FAQ.md

INTERACTIVE_TUTORIAL.md ──→ templates/QUICK_START/README.md
                         ──→ docs/TROUBLESHOOTING.md

TROUBLESHOOTING.md ──→ .github/community/FAQ.md
                    ──→ .github/community/GUIDELINES.md

FAQ.md ──→ docs/TROUBLESHOOTING.md
        ──→ tutorials/INTERACTIVE_TUTORIAL.md
        ──→ templates/QUICK_START/README.md

GUIDELINES.md ──→ CONTRIBUTING.md
              ──→ CODE_OF_CONDUCT.md
              ──→ .github/community/CONTRIBUTOR_RECOGNITION.md

DISCUSSION_TEMPLATE_*.md ──→ GUIDELINES.md
```

---

**Last Updated:** 2026-05-03  
**Author:** Max 🐶  
**Next Step:** Execute T0 — create directory structure, then fan out to Wave 1 tasks.
