# 🎮 QuizPlay — Multiplayer Real-Time Quiz Game

> A live, multiplayer quiz game where the host controls the game and players compete in real time — with unique scoring mechanics per round including betting, code output, and confidence-based answers.

---

## 📸 Overview

**QuizPlay** is a full-stack real-time quiz game inspired by Kahoot, with a twist: every round has a different game mechanic that keeps players on their toes. The host creates questions, starts the game, and controls the flow — while players join on their own devices using a 6-digit PIN.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Frontend UI framework |
| **Vite** | Fast development & build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **Firebase Firestore** | Real-time database & game state sync |
| **Framer Motion** | Smooth animations & transitions |
| **React Router v7** | Client-side SPA routing |
| **Lucide React** | Icon library |
| **Vercel** | Production deployment & hosting |

---

## 🗺️ How the Game Works

### Roles
| Role | Path | Description |
|---|---|---|
| 🎤 **Host** | `/host` | Creates questions, starts & controls the game |
| 🎮 **Player** | `/` (join page) | Joins with a 6-digit PIN and their nickname |

### Game Flow
```
Host creates questions → Starts game (6-digit PIN generated)
         ↓
Players join via PIN on their phones
         ↓
Host starts → Question shown on big screen + player phones
         ↓
Players answer (with round-specific mechanics)
         ↓
Auto-advance to Leaderboard when all answered (or host skips)
         ↓
Host moves to next question → Repeat
         ↓
Final Podium 🏆
```

---

## 🎯 Round Rules & Scoring

### 🟡 Round 1 — Betting Round

> **"Put your money where your mouth is."**

In this round, players must **choose both an answer AND place a bet** before submitting.

**How to Play:**
1. Read the question displayed on screen.
2. Select **one** answer option (A, B, C, or D).
3. Place a **bet chip**: choose `2`, `3`, or `4`.
4. Tap **PLACE BET 🎲** to submit.

**Scoring:**
| Outcome | Points |
|---|---|
| ✅ Correct | `+10 × bet` |
| ❌ Wrong | `-5 × bet` |

**Examples:**
- Bet **4**, answer **correct** → `+40 points`
- Bet **4**, answer **wrong** → `-20 points`
- Bet **2**, answer **correct** → `+20 points`
- Bet **2**, answer **wrong** → `-10 points`

> ⚠️ You **must** select both an answer and a bet to submit. High risk = high reward!

---

### 🔵 Round 2 — Code Output Round

> **"Read the code, predict the output."**

This is the **standard speed round**. Questions are typically about code output, logic puzzles, or fast-fire knowledge.

**How to Play:**
1. Read the question (usually a code snippet or logic question).
2. Tap your answer immediately — **no bet required**.
3. First to answer correctly gains the most.

**Scoring:**
| Outcome | Points |
|---|---|
| ✅ Correct | `+150 points` |
| ❌ Wrong | `0 points` |

> 💡 No penalty for wrong answers — just tap fast and stay confident!

---

### 🟣 Round 3 — Confidence Round

> **"How sure are you?"**

Players must choose their **confidence level first**, then pick their answer. Higher confidence means bigger rewards — but also bigger risks.

**How to Play:**
1. Select your **Confidence Level** before answering:
   - `LOW` — small reward, small risk
   - `MID` — medium reward, medium risk
   - `HIGH` — big reward, big risk
2. Tap your **answer** to submit.

**Scoring Table:**
| Confidence | ✅ Correct | ❌ Wrong |
|---|---|---|
| `LOW` | `+10` | `-5` |
| `MID` | `+20` | `-10` |
| `HIGH` | `+30` | `-15` |

> ⚠️ You **must** pick a confidence level before you can select an answer. Lock in your confidence first!

---

## 🏆 Leaderboard & Podium

- After every question, the **Leaderboard** is shown on the host screen with live rankings.
- Players see their own result (✅ Correct / ❌ Wrong) and points earned on their phone.
- At the end, a **Final Podium** animates 🥇🥈🥉 places.

---

## ⚙️ Host Controls

The host has full control over the game:

| Control | Action |
|---|---|
| **Start Game** | Begins the game from the lobby once players have joined |
| **Pause / Resume** | Freezes all player screens with a "PAUSED" overlay |
| **Show Results** | Manually advances to the leaderboard |
| **Next** | Clears player answers and moves to the next question |
| **End Game** | Skips to the Final Podium at any time |

> Auto-advance: The game automatically moves to the leaderboard once **all players have submitted** their answer.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- A Firebase project with Firestore enabled

### 1. Clone the Repository
```bash
git clone https://github.com/chandruch1/quiz-game.git
cd quiz-game
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your Firebase credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to **Firestore Database** → Click **Create database**
4. Set rules to allow reads/writes (for development):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🌐 Deploying to Vercel

This project includes a `vercel.json` that fixes SPA routing (no more 404 on page refresh):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Steps:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add your Firebase environment variables in Vercel's **Project Settings → Environment Variables**
4. Deploy ✅

---

## 📁 Project Structure

```
quiz-game/
├── public/
├── src/
│   ├── pages/
│   │   ├── host/
│   │   │   ├── HostDashboard.jsx   # Create questions & start game
│   │   │   └── HostGame.jsx        # Live game control panel
│   │   └── player/
│   │       ├── PlayerJoin.jsx      # Enter PIN & nickname
│   │       └── PlayerGame.jsx      # All 3 round mechanics + results
│   ├── firebase.js                 # Firebase initialization
│   ├── App.jsx                     # Route definitions
│   └── index.css                   # Global styles
├── vercel.json                     # SPA rewrite rule for Vercel
├── vite.config.js
└── package.json
```

---

## 🙌 Author

Built with ❤️ by **Chandru**  
GitHub: [@chandruch1](https://github.com/chandruch1)
