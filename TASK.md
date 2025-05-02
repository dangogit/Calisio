## TASK.md

**Purpose:** Track active tasks, backlog, milestones, and discovered subtasks.

**Active Work:**
- [ ] Design and implement `UploadWorkout` screen (PDF/manual).
- [ ] Build `WorkoutList` component (scrollable, RTL).
- [ ] Create `TimerScreen` with circular start/timer and navigation buttons.
- [ ] Support supersets logic in `useTimer` hook.
- [ ] Implement `PlanOverview` overlay with progress indicators.

**Backlog:**
- Add offline storage for imported PDFs.
- Integrate with Supabase Storage for future sync.
- CI/CD setup with Expo EAS

**Milestones:**
1. MVP UI screens (Upload, List, Timer, Overview)
2. Timer logic & animation refinement
3. RTL localization complete
4. Accessibility audits

**Discovered Mid‑Process:**
- Need fallback for timers if Reanimated not available (use `setInterval`).
- PDF parsing library research (react-native-pdf).

**Next Steps:**
- Finalize PLANNING.md decisions
- Kick off UploadWorkout implementation
