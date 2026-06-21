# 🎮 QuizPlay — Multiplayer Real-Time Quiz Game

QuizPlay is a **real-time multiplayer quiz platform** inspired by Kahoot, designed to deliver an engaging and interactive learning experience. The application allows a host to create and control quiz sessions while multiple players join using a unique game PIN and compete in real time.

Unlike traditional quiz applications, QuizPlay introduces **multiple scoring mechanics**, including betting rounds, code output challenges, and confidence-based answering, making every round unique and strategic.

---

# 🌐 Live Demo

🔗 **Website:** *Add your Vercel deployment URL here*

---

# 📌 Project Status

**✅ MVP (Minimum Viable Product) | Portfolio Project**

---

# 🚀 Features

- 🎤 **Host Dashboard** – Create questions and control the entire game.
- 🎮 **Real-Time Multiplayer Gameplay** – Players join instantly using a 6-digit game PIN.
- ⚡ **Live Leaderboard Updates** – Scores synchronize instantly using Firebase Firestore.
- 🎯 **Multiple Quiz Modes** – Betting, Code Output, and Confidence rounds.
- 📱 **Responsive Design** – Optimized for desktop, tablet, and mobile devices.
- 🔥 **Real-Time Synchronization** – Automatic updates without refreshing.
- 🏆 **Animated Final Podium** – Displays the top three winners at the end of the game.

---

# 🛠️ Tech Stack

| Technology | Purpose |
|------------|--------------------------------|
| **React 19** | Frontend Framework |
| **Vite** | Fast Development & Build Tool |
| **Tailwind CSS v4** | Utility-First Styling |
| **Firebase Firestore** | Real-Time Database |
| **Framer Motion** | Animations & Transitions |
| **React Router v7** | Client-Side Routing |
| **Lucide React** | Icons |
| **Vercel** | Deployment & Hosting |

---

# 🏗️ System Architecture

```text
                  Host
                    │
                    ▼
          React + Vite Frontend
                    │
                    ▼
          Firebase Firestore
                    │
                    ▼
      Real-Time Game State Sync
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
 Player 1                     Player N
```

---

# 📸 Application Preview

## 🏠 Join Screen

> Add your screenshot here

```markdown
![Join Screen](images/join-screen.png)
```

---

## 🎤 Host Dashboard

> Add your screenshot here

```markdown
![Host Dashboard](images/host-dashboard.png)
```

---

## 🏆 Leaderboard

> Add your screenshot here

```markdown
![Leaderboard](images/leaderboard.png)
```

---

# 🎮 Game Flow

```text
Host Creates Questions
          │
          ▼
Host Starts Game (PIN Generated)
          │
          ▼
Players Join Using PIN
          │
          ▼
Questions Displayed
          │
          ▼
Players Submit Answers
          │
          ▼
Leaderboard Updates
          │
          ▼
Next Question
          │
          ▼
Final Podium
```

---

# 🎯 Game Modes & Scoring

## 🟡 Betting Round

Players select an answer and place a bet before submitting.

| Outcome | Points |
|------------|----------|
| ✅ Correct | +10 × Bet |
| ❌ Wrong | -5 × Bet |

Example:

- Bet 4 → Correct = +40
- Bet 4 → Wrong = -20

---

## 🔵 Code Output Round

Players quickly answer code output or logic questions.

| Outcome | Points |
|------------|----------|
| ✅ Correct | +150 |
| ❌ Wrong | 0 |

No penalty for incorrect answers.

---

## 🟣 Confidence Round

Players choose a confidence level before answering.

| Confidence | Correct | Wrong |
|------------|----------|----------|
| LOW | +10 | -5 |
| MID | +20 | -10 |
| HIGH | +30 | -15 |

Higher confidence means higher reward and higher risk.

---

# 🏆 Leaderboard & Results

- Live leaderboard after every question
- Instant score synchronization
- Player result screen
- Animated final podium displaying 🥇🥈🥉 winners

---

# ⚙️ Host Controls

| Control | Description |
|------------|--------------------------------|
| Start Game | Begin quiz session |
| Pause / Resume | Pause all player screens |
| Show Results | Display leaderboard |
| Next Question | Move to next round |
| End Game | Display final podium |

---

# 📥 Installation

## Clone Repository

```bash
git clone https://github.com/chandruch1/quiz-game.git
```

## Navigate to Project

```bash
cd quiz-game
```

## Install Dependencies

```bash
npm install
```

---

# 🔥 Firebase Configuration

Create a `.env` file.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

# ▶️ Run Development Server

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# 🌐 Deployment

Deploy using **Vercel**.

```bash
npm run build
```

The project includes SPA routing support using `vercel.json`.

---

# 📁 Project Structure

```text
quiz-game/
│
├── public/
├── src/
│   ├── pages/
│   │   ├── host/
│   │   └── player/
│   ├── firebase.js
│   ├── App.jsx
│   └── index.css
│
├── images/
├── vercel.json
├── vite.config.js
├── package.json
├── README.md
└── LICENSE
```

---

# 🔒 Core Functionalities

- Real-Time Multiplayer Gameplay
- Firebase Synchronization
- Host Dashboard
- Live Leaderboard
- Multiple Scoring Algorithms
- Responsive User Interface
- Animated Game Experience

---

# 🔮 Future Enhancements

- User Authentication
- AI Question Generation
- Multiplayer Team Mode
- Voice-Based Quiz
- Tournament System
- Player Profiles
- Analytics Dashboard
- Custom Themes
- Question Import via CSV

---

# ⚠️ Disclaimer

This project is developed for **educational, research, and portfolio purposes** to demonstrate real-time multiplayer application development using React and Firebase.

---

# 📄 License

This project is licensed under the **MIT License**.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the **"Software"**), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions.

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED **"AS IS"**, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

See the **LICENSE** file for complete details.

---

# 👨‍💻 Author

## CHANDRU.R

**Computer Science and Business Systems (CSBS) Undergraduate**

**Full Stack Developer | Java | Spring Boot | React | Firebase | JavaScript | Real-Time Applications**

Passionate about building scalable, interactive, and user-centric applications using modern web technologies, cloud services, and real-time architectures.

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

⭐ **If you found this project useful, consider giving it a star on GitHub!**
