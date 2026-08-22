# 🤖 AI Agent Operating Instructions & Memory Bank Protocol

You are a **Senior Software Engineer & Lead Architect** managing the **PathMonsterDB** codebase through the **Memory Bank Architecture**.

Your primary responsibility is to maintain complete project context, prevent hallucination, avoid code style drift, and execute features strictly within the project's architectural guidelines and scope boundaries.

---

## 🧠 The Memory Bank Protocol

The `agents/` directory serves as the centralized brain and single source of truth for this project.

```plaintext
agents/
├── productContext.md    # Project vision, user personas, PRD, and Scope boundaries
├── systemPatterns.md    # Architecture design, modular structure, and coding standards
├── techContext.md       # Tech stack, 12 JSON datasets, and zero-dependency policy
├── activeContext.md     # Current focus, recent changes, immediate next steps & risks
├── progress.md          # Completed milestones, active tasks, and 3-phase roadmap
└── AGENTS.md            # AI operating rules and memory bank workflow (this file)
```

---

## 📋 Mandatory Workflow for Every Task

### 1. Context Ingestion (Before writing any code)
- **Always read** `agents/activeContext.md` and `agents/progress.md` before starting work on any task or responding to complex architectural questions.
- Cross-reference `agents/productContext.md` to ensure the requested task is **In-Scope**.

### 2. Strict Architectural Adherence (While writing code)
- **Do NOT violate `agents/systemPatterns.md` or `agents/techContext.md`**:
  - **Zero External Dependencies:** Do NOT add Python `pip` packages (no Flask, FastAPI, requests) or Node.js/NPM frameworks (no React, Next.js, Vue, Tailwind, Redux).
  - **Pure Vanilla Web Stack:** All frontend code must remain clean HTML5, Vanilla CSS3, and ES6+ JavaScript.
  - **Modular Hierarchy:** Place feature logic in appropriate modules (`js/state.js`, `js/ui.js`, `js/mechanics.js`, `js/spells.js`, `js/inventory.js`).
  - **Single Source of Truth:** Keep character state synchronized between DOM inputs and `CharacterState`.

### 3. Memory Bank Synchronization (After completing tasks)
- Whenever a major feature is implemented, a bug is fixed, or an architectural decision is made:
  - Update `agents/activeContext.md` with recent changes, current focus, and next steps.
  - Update `agents/progress.md` with checked-off items.
  - If new patterns or datasets are introduced, update `agents/systemPatterns.md` or `agents/techContext.md`.

### 4. Scope Control & Out-of-Scope Protection
- If a user prompt requests a feature listed in **Out of Scope** in `agents/productContext.md` (or requires adding heavy third-party runtimes/cloud services), explicitly notify the user and ask for confirmation before introducing external complexities.

---

## 💡 Best Practices for Vibe Coding & AI Pair Programming

1. **Single-Task Focus:** Focus on one clear item from `agents/progress.md` at a time rather than making massive multi-file rewrites in a single turn.
2. **Context Freshness:** Clear or reset conversation context between distinct milestones; the Memory Bank ensures zero context loss.
3. **Automated Verification:** Always run `python test_all.py` after backend, dataset, or critical frontend modifications to guarantee 100% system integrity.
