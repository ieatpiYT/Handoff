# Handoff 🤝

> **Shared AI workspace for group projects. Any teammate. Any model. One persistent project memory.**

Built for **DeltaHacks** × **Backboard.io**.

---

## 💡 The Problem

When students or teams work on group projects with AI, context shatters:
- **Fragmented silos:** Alice drafts the introduction in Claude; Bob drafts the analysis in ChatGPT. Neither AI knows what constraints, sources, or formatting rules the other established.
- **Wasted prompting:** Every teammate wastes 10 minutes re-explaining the assignment rubric, constraints, and progress to their personal AI assistant.
- **Franken-reports:** Group deliverables end up with conflicting tones, redundant sections, and disjointed arguments.

Existing team solutions (ChatGPT Teams, Claude Projects) vendor-lock everyone into one AI model at $25–$30/user/month. Students want to use whichever model they prefer (Claude for long-form writing, GPT-4o for code/logic, Gemini for multi-modal docs) without losing shared state.

---

## ⚡ The Solution: Handoff

**Handoff** provides a unified AI workspace where teammates collaborate asynchronously using their model of choice, backed by a single continuous project memory.

Instead of losing context when passing work to a teammate, Handoff introduces a **Git-commit style ritual for collaborative human-AI work**:

1. **Pick Your Model:** Join the project workspace, enter your name, and select your preferred model (Claude, GPT, Gemini).
2. **Instant "Catch-Me-Up" Briefing:** Before you type anything, your AI briefs you on who worked last, what model they used, what was decided, and what needs to happen next.
3. **Continuous Decision Logging:** As you chat, the system automatically extracts and commits project milestones into persistent memory (*"we're using IEEE citations"*, *"Sara owns slides"*).
4. **One-Click Handoff:** Click **"End Session & Hand Off"**. The AI summarizes your session into a structured note (`Done` / `Decided` / `In Progress` / `Next Task`) and commits it to the project timeline.
5. **Seamless Continuation:** The next teammate opens Handoff, gets briefed in seconds, and tells their AI: *"Continue where Ibrahim left off."*

---

## 🏗️ How Backboard.io Powers Handoff

Handoff is built directly on **Backboard.io**'s persistent agent architecture:

- **Centralized Memory Store:** Each group project maps to a Backboard Assistant that manages shared state, past decisions, and working draft documents.
- **Model-Agnostic Context:** Backboard handles persistent memory across LLM providers. Teammates switch between Claude and GPT per message while the underlying memory remains synchronized.
- **Thread Management:** Each teammate works in their own thread bound to the shared assistant, preventing concurrent prompt clashes while syncing high-level memory.
- **Document & Draft Retrieval:** When a teammate uploads a report draft or rubric, Backboard indexes and retrieves context for any teammate's model.

---

## 🖥️ UI & Core Features

| Feature | Description |
| :--- | :--- |
| **Multi-Model Chat** | Chat stream where every message displays the author and the specific LLM that answered. |
| **Live Project Memory** | An always-visible side panel showing active constraints, settled decisions, and task assignments. |
| **Handoff Timeline** | An audit log of past sessions, who worked on what, and the exact handoff notes generated. |
| **Document Sync** | Upload assignment briefs, draft documents, or slide decks directly into the shared assistant memory. |

---

## 🚀 Quickstart

### 1. Prerequisites
- Node.js 18+
- [Backboard.io](https://backboard.io) account and API key

### 2. Installation
```bash
git clone https://github.com/your-username/handoff.git
cd handoff
npm install
