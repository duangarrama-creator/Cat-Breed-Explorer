# Cat Breed Explorer & Cat Care 🐱

A web application for exploring cat breeds and managing cat care information.

## Project Overview

This application uses TheCatAPI to retrieve cat breed information and images.

### Main Features
- Explore cat breeds and view breed details.
- Search and sort breeds alphabetically.
- Save favorite cat breeds.
- Register and log in.
- Manage personal cat profiles.
- Create cat care reminders.
- View scan history.

**AI Scanner:** The scanner is currently a prototype. A real AI image-classification model has not yet been integrated.

## Technologies

- React and Vite
- JavaScript and CSS
- Node.js and Express
- SQLite and better-sqlite3
- bcryptjs and express-session
- TheCatAPI

## Installation

### 1. Requirements
- Node.js and npm
- TheCatAPI API key

### 2. Install backend dependencies

From the project root:

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Add your own key to `.env`:

```env
THECATAPI_KEY=YOUR_REAL_API_KEY
PORT=3000
```

Never upload `.env` to GitHub.

### 4. Start the backend

```bash
npm start
```

Backend: `http://localhost:3000`

### 5. Start the frontend

Open another Terminal window:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the Terminal, normally `http://localhost:5173`.

Keep both servers running.

## API Verification

- Backend status: `http://localhost:3000/api/status`
- Cat breeds: `http://localhost:3000/api/breeds`

## React Components

The frontend is separated into reusable components:

- AppHeader
- HeroSection
- MainTabs
- MessageBanner
- LoginRequired
- BreedSection
- BreedDetailModal
- PetsSection
- RemindersSection
- HistorySection
- ReminderAlertModal

## Data Structures and Algorithms

### Insertion Sort

Used to sort breed names from A–Z and Z–A.

- Best case: O(n)
- Average case: O(n²)
- Worst case: O(n²)
- Space: O(n), because the implementation copies the array.

Implementation: `insertionSort()` in `client/src/App.jsx`.

### Hash Table using Map

Stores breed objects using breed IDs as keys.

- Creation: O(n)
- Average lookup: O(1)
- Space: O(n)

Implementation: `breedHashTable` and `openBreed()` in `client/src/App.jsx`.

## Database

SQLite stores user accounts, pets, scan history, and reminders. Passwords are hashed using bcryptjs.

## Production Build

```bash
cd client
npm run build
```

Build output: `client/dist/`.

## Limitations

- The scanner does not yet use a real AI classification model.
- A valid TheCatAPI key is required.
- Production deployment requires backend hosting and persistent database storage.

## Project Documentation

See [DECISION_LOG.md](DECISION_LOG.md) for technical and design decisions.