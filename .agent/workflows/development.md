---
description: Standard development workflow for Olympic Hub
---

# Olympic Hub Development Workflow

## Before Making Changes

1. **Check current branch:**
   ```bash
   git status
   git log -n 3 --oneline
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

3. **Review TODO_LIST.md** for pending tasks
4. **CRITICAL REMINDER:** If this is a new setup, ensure `.env` is created locally and **Environment Variables are updated in Vercel Settings** if you added new secrets.

## Making Changes

### For API/Backend Changes

1. Make the code changes
2. **IMPORTANT:** Update `docs/API.md` (see `/update-api-docs` workflow)
3. Update TypeScript types if needed
4. Test the changes

### For Component Changes

1. Make the code changes
2. Update `docs/COMPONENTS.md` if new component/hook
3. Export from index.ts files
4. Test the changes

### For Architecture Changes

1. Make the code changes
2. Update `docs/ARCHITECTURE.md`
3. Update directory structure in docs if needed

## After Making Changes

1. **Run TypeScript check:**
   // turbo
   ```bash
   npx tsc --noEmit
   ```

2. **Run linting:**
   // turbo
   ```bash
   npm run lint
   ```

3. **Commit with descriptive message:**
   ```bash
   git add -A
   git commit -m "TYPE: Brief description

   - Detail 1
   - Detail 2"
   ```

   **Commit types:**
   - `FEATURE:` - New functionality
   - `FIX:` - Bug fix
   - `REFACTOR:` - Code restructuring
   - `DOCS:` - Documentation only
   - `IMPROVE:` - Performance/UX improvements
   - `STYLE:` - Formatting, no code change

4. **Push to GitHub:**
   ```bash
   git push origin main
   ```

## Documentation Updates Required

| Change Type | Update Required |
|-------------|-----------------|
| New API endpoint | docs/API.md |
| New component | docs/COMPONENTS.md |
| New hook | docs/COMPONENTS.md |
| New store | docs/COMPONENTS.md |
| Architecture change | docs/ARCHITECTURE.md |
| New route | docs/ARCHITECTURE.md |
| New constant | src/constants/index.ts |

## Quick Reference

### Start Dev Server
// turbo
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Check TypeScript
// turbo
```bash
npx tsc --noEmit
```

### Push to GitHub
```bash
git add -A && git commit -m "message" && git push origin main
```
