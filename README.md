
# Gemini File Manager

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-purple?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Gemini API](https://img.shields.io/badge/Gemini%20API-blueviolet?style=for-the-badge&logo=google-gemini)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan?style=for-the-badge&logo=tailwind-css)

A modern, browser-based file manager that leverages the Gemini API for intelligent file organization. Built with the File System Access API, this application provides a secure, fast, and feature-rich interface for managing your local files directly in the browser—no backend or file uploads required.

---

## ✨ Key Features

- **📂 Secure Local File System Access**: Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write directly to your local files and folders. Your files stay on your machine, always.
- **🤖 AI-Powered Organization**: Integrates the **Google Gemini API** to provide "Smart Organize" suggestions, automatically grouping related files into intelligently named folders.
- **💻 Integrated Terminal**: A fully functional terminal powered by Xterm.js lets you run common filesystem commands like `ls`, `cd`, `mkdir`, `rm`, and more.
- **✍️ Built-in Code Editor**: Open and edit text files directly within the application with a powerful Monaco-based editor (the same engine as VS Code), complete with **Vim keybindings**.
- **⚡️ Blazing Fast & Responsive UI**: Built with React 19, Vite, and Tailwind CSS for a snappy, modern user experience.
- **💾 Persistent State with IndexedDB**: File and folder metadata is cached in IndexedDB, providing instant loads after the initial directory scan.
- **🎨 Dual Views & Theming**: Switch between a classic list view and a visual grid view. Includes automatic light/dark mode support.
- **🖱️ Rich Interactions**: Features include drag-to-resize terminal, context menus, multi-select, and intuitive keyboard navigation.

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
    git clone https://github.com/your-username/gemini-file-manager.git
    cd gemini-file-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your Gemini API Key:**
    - Create a file named `.env.local` in the root of the project.
    - Add your Gemini API key to this file. You can use `.env.local.example` as a template.

    **.env.local**
    ```
    VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    > **Note:** The `VITE_` prefix is required by Vite to expose the environment variable to the client-side code.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:5173`.

---

## 🔧 How It Works: Architectural Overview

This application is a pure client-side web app with no backend. Here's a look at the core components:

### 1. File System Service (`services/fileSystemService.ts`)

- **Entry Point**: This service is the primary interface to the local file system.
- **Permissions**: It handles requesting user permission to access directories via `window.showDirectoryPicker()`.
- **Ingestion Engine**: The `ingestDirectory` function recursively scans a selected directory.
- **Operations**: Manages all file I/O, including creating folders (`mkdir`), deleting files (`rm`), and applying the AI-powered organization structure.

### 2. Database Service (`services/database.ts`)

- **Caching Layer**: To avoid re-scanning the entire directory tree on every page load, the app uses **IndexedDB** as a persistent cache for file and folder metadata.
- **Data Model**: It stores `FileNode` objects, which contain serializable information like `name`, `path`, `size`, and `modified` date. Crucially, non-serializable `FileSystemHandle` objects are **not** stored.
- **Efficiency**: This caching strategy makes subsequent loads instantaneous and allows the app to function offline after the first scan.

### 3. Gemini Service (`services/geminiService.ts`)

- **AI Brains**: This service interfaces with the Google Gemini API.
- **Prompt Engineering**: It takes a list of file names, constructs a carefully engineered prompt, and asks the `gemini-2.5-flash` model to return organization suggestions.
- **JSON Mode**: It leverages Gemini's JSON mode with a predefined schema to ensure the API returns clean, structured data that the application can immediately use.

### 4. React Components & State Management

- **`App.tsx`**: The root component that orchestrates the entire application state using React hooks (`useState`, `useCallback`, `useEffect`).
- **Navigation Logic**: The core `navigateTo` function is the single source of truth for changing directories. It fetches metadata from the database and then dynamically re-acquires live `FileSystemHandle`s for the files in the current view. This "just-in-time" handle acquisition is key to the app's design.
- **Modularity**: The UI is broken down into logical components for the header, sidebar, file views (grid/list), modals, and the integrated terminal and editor.

---

## 🖼️ Screenshots

*(Add screenshots of your application here to showcase its features)*

| Grid View (Dark Mode) | Smart Organize Modal |
| :-------------------: | :--------------------: |
| _[Image Placeholder]_ | _[Image Placeholder]_ |

| Editor with Vim Mode | Integrated Terminal |
| :--------------------: | :-------------------: |
| _[Image Placeholder]_ | _[Image Placeholder]_ |

---

## 🤝 Contributing

Contributions are welcome! If you have a suggestion or find a bug, please open an issue to discuss it.

To contribute code:
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
