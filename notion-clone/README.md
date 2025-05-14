# Notion Clone

A simple Notion clone built with Next.js, React, TypeScript, and Tailwind CSS. This application allows you to create, edit, and delete markdown notes with support for text highlighting and underlining.

## Features

- Toggle between light and dark mode
- Create and delete notes
- Markdown editor with preview mode
- Text highlighting and underlining with color options
- Add tags to highlighted/underlined text
- Local storage persistence

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand (for state management)
- next-themes (for theme management)
- react-markdown (for markdown rendering)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Click the "+" button in the sidebar to create a new note
- Write markdown content in the editor
- Toggle between edit and preview modes using the buttons in the toolbar
- In preview mode, select text to highlight or underline it with different colors
- Click on highlighted/underlined text to change colors or add tags
- Use the theme toggle in the top right to switch between light and dark mode
