# 🧭 RutiMind – Copilot Instruction Set

**Context:**  
RutiMind is an **Android-based educational app** built with **Expo**, **React Native**, and **TypeScript (strict)**.  
The app includes two user roles: **Parent (Veli)** and **Student (Öğrenci)**.  
Copilot must always follow the technical, visual, and behavioral rules described below.

---

## ⚙️ Global Coding Rules

### 🧱 Tech Stack & Architecture
- Use **Expo + React Native + TypeScript (strict)**.
- Apply a **consistent, modern, and clean** UI design that supports both **light** and **dark** themes.
- Use a **design system**: either `@shopify/restyle` or `nativewind` (Tailwind RN) with a **small theme token file** (colors, spacing, radii, font sizes).
- Use **Inter** for body text and **Poppins** for headings (headings must be visually stronger).
- Keep files **modular and organized**:
  - One responsibility per file.
  - Co-locate related logic.
  - Keep components small.
  - **All comments in English.**

### 🧭 Navigation
- Use `@react-navigation/native` with **stack** and **tab** navigators.
- Define **type-safe routes**.
- Main stacks:
  - `AuthStack` → Authentication flow
  - `ParentTabs` → Skills / Reinforcers / Progress
  - `StudentFlowStack` → Ready → Wait → Skill presentation

### ⚡ State, Data & Storage
- **Zustand** → Local UI state.
- **TanStack Query** → Async data and server cache.
- **SQLite (expo-sqlite)** → Domain data (skills, reinforcers, sessions, etc.).
- **SecureStore (expo-secure-store)** → Sensitive data (PIN, tokens, Firebase credentials).

### 🔐 Authentication (Firebase + PIN Gate)
- Use **Firebase Authentication** with **Google Sign-In only**.
- After the **first successful Google login**, require a **local PIN (4–6 digits)** on every app open until explicit **sign-out**.
- While Firebase session is active, **do not show Google sign-in again** — only ask for PIN.
- Store PIN **hashed and encrypted** in `SecureStore` (never plain text).
- Use **PBKDF2 or Argon2 + per-user salt** if available.
- On sign-out:
  - Clear Firebase session.
  - Reset “PIN verified this run” flag.
  - If a new Google user logs in → force **Set PIN** again.
- Include a minimal **PIN retry/lockout policy** (e.g., 5 tries → timed lock).

### 🖼️ Media Handling
- Use `expo-image-picker` + `expo-image-manipulator`.
- All images must be **square-cropped** before saving or displaying.
- After upload, show a **small thumbnail preview**.

### ↕️ Interactions
- Use **react-native-draggable-flatlist** for drag-and-drop item ordering (skills, reinforcers, etc.).

### 📊 Charts & Forms
- **Charts:** `victory-native` + `react-native-svg`.
- **Forms:** `react-hook-form` + `zod`.
- Validate all inputs:
  - Total session duration ≤ 2 hours.
  - Each selected skill has a duration and an image.
  - Required fields must not be empty.

### ♿ Accessibility & Feedback
- Every touchable element must have an **accessibility label**.
- Use **semantic headings** for screen titles.
- Provide **haptic and vibration feedback** via `expo-haptics` and `Vibration`.

### 🧪 Testing & Quality
- **Jest** → Unit tests.  
- **React Native Testing Library** → UI tests.  
- **Detox** → End-to-end tests.  
- **Linting/Formatting:** ESLint (Airbnb RN), Prettier, Husky + Lint-staged.

### 🌍 Internationalization
- Use `react-i18next` with **Turkish (tr)** and **English (en)** support.
- All user-facing strings must come from translation files.

### ⚠️ Error Handling
- Add **Error Boundaries** to catch runtime errors.
- Every screen must have **loading, empty, and error** states (never show a blank screen).

### 🔒 Privacy & Security
- Never log PII (names, emails, IDs).
- Encrypt sensitive data.
- Provide user options to **export or delete** all personal data.
- Do not expose authentication tokens in logs.

---

## 📲 PROGRAM FLOW

### 🔹 Entry Screen
- Two options:
  1. **Parent Login**
  2. **Student Login**

---

### 👨‍👩‍👧 Parent Flow

#### Step 1: Authentication
- On **Parent Login**, show **Google sign-in (Firebase)**.
- After first login → prompt **PIN creation**.
- On next launches → **PIN entry only**, skip Google (until sign-out).
- On **sign-out** → clear Firebase session and PIN verification.

#### Step 2: Parent Tabs
After login, parent sees **three main tabs**:  
**1. Skills (Beceri Listesi)** | **2. Reinforcers (Pekiştireçler)** | **3. Progress (Gelişim Grafiği)**

---

#### 1️⃣ Skills (Beceri Listesi)
- **Left panel:** Filterable skills grouped by category (each group has a color).  
  Each skill row shows a “+” icon to add it.
- **Right panel:** “Selected Skills” (max 10 items).
  - Top fixed row: **Wait Time** (Bekleme Süresi) with minute input (not reorderable).
  - Below that: selected skills with:
    - Order number (1, 2, 3…)
    - Drag & Drop ordering.
    - Image upload (square crop → preview thumbnail).
    - Duration input box.
    - Remove button.
- **Save** button (bottom-right):
  - Calculates total duration.
  - Validates:
    - All skills have image + duration.
    - Total duration ≤ 2 hours.
  - On error: show validation message and highlight invalid fields.

---

#### 2️⃣ Reinforcers (Pekiştireçler)
- Split view:
  - **Left:** Reinforcers list with “+”, name, small image preview.
  - **Right:** “Selected Reinforcers” arranged into **1–10 slots**, representing how many positive behaviors must occur before each reinforcer appears.
- **Add Reinforcer** (top-right):
  - Modal opens: enter name + upload image (square crop).
  - On save, append to reinforcer list.
- **Drag & Drop** to reorder items between slots.
- **Save** persists selection and order.

---

#### 3️⃣ Progress (Gelişim Grafiği)
- **Daily line chart:**
  - X-axis → Dates.
  - Y-axis → Number of correct responses (or percentage).
- Tapping a date opens a **detail view**:
  - Shows skills presented that day.
  - Lists responses: **Yes / No / No Response** with timestamps.

---

### 👦 Student Flow

#### Step 1: Login
- On **Student Login**, show “Are you ready?” prompt.  
  - **No** → return to main screen.  
  - **Yes** → start **Wait Period** (based on parent’s setting).

#### Step 2: Wait → Skill Sequence
- After waiting, present skills **in parent-defined order**.
  - Display skill text (e.g., “Did you put your homework on your desk?”).
  - Show associated image.
  - Below image: “Yes” and “No” buttons.
  - Device vibrates to prompt response.

#### Step 3: Response Window
- Start a **30-second timer**.
  - If the student doesn’t respond → record **No Response** (not Yes/No).
  - If the student taps → record “Yes” or “No”.
- After response, the screen **fades to black** (blackout) until the next skill’s scheduled start.

#### Step 4: Timing Rules
- The timing between skills must strictly follow the parent’s configuration.  
  Use a **monotonic clock** to avoid drift.
- Example:
  - Wait: 5 minutes  
  - Skill 1: 4 minutes  
  - Skill 2: 7 minutes  
  → Skill 1 appears at minute 5, Skill 2 at minute 12.

---

### 🎓 Training Content
Two main categories of in-app training videos:

1. **Self-Management Training**
   - Giving oneself cues  
   - Self-instruction  
   - Self-monitoring  
   - Self-evaluation  
   - Self-reinforcement  

2. **App Usage Tutorials**
   - How to use Parent Mode  
   - How to use Student Mode  

---

## ✅ Copilot Behavior Summary

When generating code for this project, Copilot must:
1. Build with **Expo + React Native + TypeScript (strict)**.
2. Use **Firebase Authentication (Google only)** + **local PIN gate** (SecureStore, hashed, until sign-out).
3. Implement **Parent Mode** (Skills / Reinforcers / Progress) and **Student Mode** (Ready → Wait → Skills → Responses).
4. Enforce **square image crop**, **drag-and-drop**, **≤2h total duration**, **error validation**, and **accessibility**.
5. Use **Zustand + SQLite + react-query** for data flow.
6. Include **English comments**, modular files, and unit/UI/E2E test readiness.
7. Follow all **privacy, i18n, and security** requirements in this document.

---

✅ **File placement:**  
Save this file as `/COPILOT_INSTRUCTIONS.md` or `.github/COPILOT_INSTRUCTIONS.md`.  
Copilot will read and apply these instructions automatically during code generation.
