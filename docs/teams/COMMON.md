# Team Collaboration Instructions for Claude Code

## How This Works

This project has 3 team members collaborating via Claude Code. Each person has their own folder under `docs/teams/` where Claude Code logs progress, decisions, and notes.

**Team Members:**
| Name | Folder | Branch Prefix |
|------|--------|---------------|
| Abiy | `docs/teams/abiy/` | `abiy/` |
| Aryamann | `docs/teams/aryamann/` | `aryamann/` |
| Antony | `docs/teams/antony/` | `antony/` |

---

## Rules for Claude Code (READ THIS FIRST)

### 1. Identify the team member
At the start of every session, ask: **"Which team member am I working with? (abiy / aryamann / antony)"** if it is not already clear from context.

### 2. Read common context first
Before starting any task, read these files in order:
1. `/CLAUDE.md` (project-level instructions)
2. `/docs/teams/COMMON.md` (this file - team workflow rules)
3. `/docs/teams/<name>/PROGRESS.md` (that person's current progress)

### 3. Log progress in the person's folder
After completing any meaningful task, update the person's `PROGRESS.md` with:
```markdown
## [DATE] - [Short Description]
**Task:** What was requested
**Changes:** List of files modified/created
**Status:** Completed / In Progress / Blocked
**Branch:** Branch name used
**Notes:** Any important context for the team
```

### 4. Branch workflow
- Each person works on their own branch: `<name>/<feature-description>`
- Always branch from `master`
- Never push directly to `master`
- Create PRs to merge into `master`

### 5. Before writing code
- Check the person's `PROGRESS.md` to understand what they've been working on
- Check other team members' `PROGRESS.md` files if the task might overlap
- If there's a potential conflict with another member's work, flag it before proceeding

### 6. Communication via HANDOFF.md
If a task needs to be handed off to another team member, create or update a `HANDOFF.md` in the person's folder:
```markdown
## Handoff to [Name]
**Date:** YYYY-MM-DD
**What:** Description of what needs to be done
**Context:** Relevant files, branches, decisions made
**Blockers:** Any dependencies or issues
```

---

## Git Conventions

### Branch naming
```
<name>/<type>/<short-description>
```
Examples:
- `aryamann/feat/sales-filters`
- `abiy/fix/auth-token-refresh`
- `antony/feat/cost-dashboard`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Commit messages
```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
Examples:
- `feat(sales): add region filter to pipeline table`
- `fix(auth): handle expired refresh token gracefully`

---

## Avoiding Conflicts

1. **Check before you build** - Read other members' PROGRESS.md to see who's touching what
2. **Claim modules** - If working on a module (e.g., `sales/`), note it in your PROGRESS.md so others know
3. **Small, focused PRs** - Merge often, don't let branches diverge too far
4. **Shared files alert** - If you need to modify shared files (Router.tsx, App.tsx, schema.prisma), mention it in PROGRESS.md first
