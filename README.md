# Gemini File Manager

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-purple?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Gemini API](https://img.shields.io/badge/Gemini%20API-blueviolet?style=for-the-badge&logo=google-gemini)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan?style=for-the-badge&logo=tailwind-css)

A modern, browser-based file manager that leverages the Gemini API for intelligent file organization. Built with the File System Access API, this application provides a secure, fast, and feature-rich interface for managing your local files directly in the browser—no backend or file uploads required.

---

## ✨ Key Features

- **📂 Secure Local File System Access**: Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write directly to your local files and folders. Your files stay on your machine, always.
- **🤖 AI-Powered Intelligence**:
    - **Smart Organize**: Automatically groups related files into intelligently named folders.
    - **Semantic Search**: Search files by their *content*, not just their names.
    - **AI Previews**: Hover over a file to see an AI-generated summary.
    - **Explain Folder**: Get a high-level summary of any folder's purpose.
    - **Contextual Actions**: Right-click a file to perform AI actions like "Summarize".
- **💻 Integrated Terminal**: A fully functional terminal powered by Xterm.js lets you run common filesystem commands like `ls`, `cd`, `mkdir`, `rm`, `mv`, `cat` and more.
- **✍️ Built-in Code Editor**: Open and edit text files directly with a powerful Monaco-based editor (the same engine as VS Code), complete with **Vim keybindings**.
- **⚡️ Blazing Fast & Responsive UI**: Built with React 19, Vite, and Tailwind CSS for a snappy, modern user experience.
- **💾 Persistent State with IndexedDB**: File and folder metadata is cached in IndexedDB, providing instant loads after the initial directory scan.
- **♿ Accessible**: Full keyboard navigation and ARIA support for screen readers.

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm` or a compatible package manager
- A [Google Gemini API Key](https://ai.google.dev/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jocall3/ai-file-manager.git
    cd gemini-file-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your Gemini API Key:**
    - In the project's root directory, create a new file named `.env.local`.
    - Add your Gemini API key to this file as shown below.

    `.env.local`
    ```
    VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
   
    **Important**: The variable name **must** start with `VITE_`. This is a security feature of the Vite build tool that allows the variable to be safely exposed to the browser. Do not change the variable name.
   
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running. Open the URL printed in your console (usually `http://localhost:5173`).

---

## 🔧 How It Works: Architectural Overview

This application is a pure client-side web app with no backend. Here's a look at the core components:

### 1. File System Service (`services/fileSystemService.ts`)

- **Entry Point**: This service is the primary interface to the local file system.
- **Permissions**: It handles requesting user permission to access directories via `window.showDirectoryPicker()`.
- **Ingestion Engine**: The `ingestDirectory` function recursively scans a selected directory.
- **Optimized Operations**: Manages all file I/O, using native, atomic browser APIs for operations like moving and renaming for maximum performance and reliability.

### 2. Database Service (`services/database.ts`)

- **Caching Layer**: To avoid re-scanning the entire directory tree on every page load, the app uses **IndexedDB** as a persistent cache for file and folder metadata.
- **Data Model**: It stores `FileNode` objects, which contain serializable information like `name`, `path`, `size`, and `modified` date. Crucially, non-serializable `FileSystemHandle` objects are **not** stored.
- **Efficiency**: This caching strategy makes subsequent loads instantaneous and allows the app to function offline after the first scan.

### 3. Gemini Service (`services/geminiService.ts`)

- **AI Brains**: This service interfaces with the Google Gemini API.
- **Prompt Engineering**: It takes file metadata, constructs carefully engineered prompts, and asks the `gemini-2.5-flash` model to return structured data for features like organization, search, and summarization.
- **JSON Mode**: It leverages Gemini's JSON mode with a predefined schema to ensure the API returns clean, structured data that the application can immediately use.

### 4. React Components & State Management

- **`App.tsx`**: The root component orchestrates the application using a centralized, type-safe state machine for modals and other global states. This robust architecture keeps the UI logic clean and predictable.
- **Navigation Logic**: The core `navigateTo` function is the single source of truth for changing directories. It fetches metadata from the database and then dynamically re-acquires live `FileSystemHandle`s for the files in the current view. This "just-in-time" handle acquisition is key to the app's design.
- **Modularity**: The UI is broken down into logical components for the header, sidebar, file views (grid/list), modals, and the integrated terminal and editor.

---

## 🔮 Future Roadmap: The Undeniable File Manager

This project aims to be more than a file browser; it's a vision for the future of interacting with local data. By deeply integrating a powerful AI, we can create functionality that is impossible in traditional file managers. This is why this app exists.

### Phase 1: Deep Content Intelligence

1.  **True Semantic Search**: Go beyond filenames. Search the *content* of your files using natural language. "Find the presentation about Q3 marketing results" or "show me invoices from Acme Corp."
2.  **AI-Generated Previews**: On hover, see a Gemini-generated summary of a document, a description of an image's content, or a plain-language explanation of a script's purpose.
3.  **"Explain this Folder"**: A button that provides a high-level summary of a folder's contents, identifying the project type, key documents, and overall status.
4.  **Automated Content Tagging**: Gemini will automatically parse files and apply relevant tags (#invoice, #receipt, #project-alpha, #draft) for effortless filtering.
5.  **Content-Based Deduplication**: Identify files that are semantically similar, not just hash-identical. "These two reports are 95% the same. Merge or delete?"

### Phase 2: Intelligent Workflow Automation

6.  **Context-Aware Actions**: The right-click menu becomes intelligent. Right-click a CSV -> "Generate charts from this data." Right-click code -> "Find potential bugs" or "Generate documentation."
7.  **Conversational File Operations**: A chat interface to manage files. "Find all my vacation photos from last year, create a folder named 'Hawaii 2024', and move them there."
8.  **Batch Processing Workflows**: Select multiple files -> "Rename all these images to `[Date]-[Location]-[Number]`.jpg", "Summarize these PDFs into a single report", "Extract all email addresses from these documents."
9.  **Predictive Organization**: As you download or create new files, the app proactively suggests which AI-organized folder they belong in.
10. **Smart Archive Assistant**: Gemini analyzes a project folder to identify old versions, large unused assets, and redundant files, suggesting a clean archive structure.

### Phase 3: Generative Content & Creation

11. **In-Place Content Generation**: Right-click in a folder -> "Create a Python script to process these CSVs," "Write a meeting agenda based on my recent notes," or "Generate a set of boilerplate files for a new React component."
12. **"Creative Remix" Tool**: Select a collection of images, notes, and videos, then prompt Gemini to "Create a short video presentation summarizing these assets."
13. **Local Knowledge Base**: Allow Gemini to index a directory to become a personal expert on *your* data. Ask questions like, "According to my project docs, what is the deadline for the Alpha release?"
14. **Data Anonymization Service**: Right-click a document -> "Create a copy with all personally identifiable information (PII) redacted."
15. **AI-Assisted Git Integration**: Automatically generate descriptive commit messages based on code changes. "Summarize the changes in this branch."

### Phase 4: The Next-Generation Interface

16. **Virtual Folders**: Create "folders" that are actually saved semantic searches. A "Q4 Invoices" folder could dynamically display any file on your drive that Gemini identifies as a Q4 invoice, regardless of its physical location.
17. **Dynamic Project Dashboards**: When opening a folder, the header transforms into a Gemini-generated dashboard showing key files, project status, recent activity, and suggested next steps.
18. **"File Story" Timeline**: Visualize the history of a project. Select a file to see an AI-generated timeline of related documents, edits, and communications.
19. **Multimodal Search & Interaction**: Drag an image into the search bar and type "find photos like this" or "find documents that reference this diagram."
20. **Secure Peer-to-Peer Sharing**: Use WebRTC to generate a secure, temporary link to share a file directly from your browser to another person's, without it ever touching a central server.
