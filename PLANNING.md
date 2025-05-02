## PLANNING.md

**Purpose:**
- Define high-level vision and goals for the Calisio app UI.
- Document architecture, constraints, technology stack, tools, and key decisions.

**1. Vision & Goals**
- Deliver a minimalist, high-performance calisthenics workout app UI in Hebrew (RTL), using black and green.
- Enable users to upload or manually add workouts, browse, select, and execute timed sets (including supersets) with clear navigation.

**2. Architecture Overview**
- **Framework:** React Native + Expo (TypeScript).
- **UI Library:** styled-components for theming with RTL support.
- **State:** React Context for workout flow, Zustand for local timers, Redux for plan storage.
- **Animation:** React Native Reanimated & Gesture Handler for smooth interactions.

**3. Constraints & Non‑functional Requirements**
- Full RTL mirroring; Hebrew localization.
- Timers must remain accurate on older devices (use native clocks or Reanimated driving).
- Touch targets ≥44×44pt; large fonts; high-contrast colors.
- Offline PDF import; manual exercise CRUD.

**4. Tech Stack & Tools**
- **Language:** TypeScript
- **Framework:** React Native (Expo CLI)
- **Styling:** styled-components + ThemeProvider
- **Routing:** React Navigation
- **State Management:** React Context, Redux Toolkit, Zustand
- **Animations:** react-native-reanimated, react-native-gesture-handler
- **Localization:** i18next-react-native
- **Assets:** SVGR for icons; Supabase Storage (future)

**5. Key Decisions**
- Component-driven design: isolated `TimerCircle`, `WorkoutList`, `PlanOverview`.
- Custom hooks: `useTimer`, `useWorkoutFlow`.
- Centralized theme file for colors, spacing, typography.
