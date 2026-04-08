import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, doc, writeBatch, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HostDashboard() {
  const [questions, setQuestions] = useState([]);
  const [qData, setQData] = useState({
    question: '',
    optA: '', optB: '', optC: '', optD: '',
    correctAnswer: 'A',
    round: '1',
    timer: '20'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!qData.question || !qData.optA || !qData.optB || !qData.optC || !qData.optD) {
      setError('All fields are required.');
      return;
    }
    setError('');

    const newQ = {
      id: Date.now().toString(),
      question: qData.question,
      options: [qData.optA, qData.optB, qData.optC, qData.optD],
      correctAnswer: qData[`opt${qData.correctAnswer}`],
      round: parseInt(qData.round),
      timer: parseInt(qData.timer)
    };

    setQuestions([...questions, newQ]);

    setQData({
      question: '', optA: '', optB: '', optC: '', optD: '',
      correctAnswer: 'A', round: '1', timer: '20'
    });
  };

  const handleDelete = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startNewGame = async () => {
    if (questions.length === 0) {
      setError("Add at least one question to start a game.");
      return;
    }
    
    // Check if db is explicitly null due to initialization failure
    if (!db) {
      alert("🚨 FIREBASE ERROR: Firebase is not configured. Please open src/firebase.js and insert valid API keys before starting the game.");
      setError("FIREBASE ERROR: Invalid config.");
      return;
    }
    
    // Check if the db instance is actively using the dummy template strings
    if (db.app.options.apiKey === "YOUR_API_KEY_HERE" || !db.app.options.apiKey) {
      alert("🚨 FIREBASE KEYS REQUIRED: You are currently using the placeholder 'YOUR_API_KEY_HERE'. \n\nFirestore cannot write the game data. Please open src/firebase.js and update it with your real Firebase Project credentials from console.firebase.google.com");
      setError("FIREBASE ERROR: Placeholder keys detected.");
      return;
    }
    
    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    const hostId = 'host_' + Date.now();

    setLoading(true);
    setError("Connecting to Firestore database...");

    try {
      const batch = writeBatch(db);
      
      // 1. Create main game document
      const gameRef = doc(db, 'games', gamePin);
      batch.set(gameRef, {
        gamePin,
        hostId,
        status: 'lobby',
        currentRound: questions[0].round,
        currentQuestionIndex: -1,
        isPaused: false
      });

      // 2. Add Host to players subcollection
      const hostRef = doc(db, 'games', gamePin, 'players', hostId);
      batch.set(hostRef, {
        id: hostId,
        name: 'Host',
        isHost: true,
        score: 0
      });

      // 3. Add questions to questions subcollection
      questions.forEach((q, idx) => {
        const qRef = doc(db, 'games', gamePin, 'questions', String(idx));
        batch.set(qRef, q);
      });

      // Create a timeout race so it doesn't hang forever
      const timeoutPromise = new Promise((_, reject) => 
         setTimeout(() => reject(new Error("TIMEOUT")), 5000)
      );

      await Promise.race([batch.commit(), timeoutPromise]);
      
      window.localStorage.setItem('hostId', hostId);
      navigate(`/host/game/${gamePin}`);

    } catch (e) { 
      console.error("Firestore batch write error:", e);
      if (e.message === "TIMEOUT") {
        setError("⏱️ TIMEOUT: Firestore is unresponsive. Did you click the orange 'Create Database' button inside the Firestore tab on your Firebase Console? The database must be actively created first!");
      } else {
        setError("🚨 PERMISSION DENIED: Your Firebase Security Rules are blocking writes. Please update your Rules to 'true' in the Firebase Console!");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Host Dashboard</h1>
          <h2 className="text-xl mb-4 font-semibold">Create Question</h2>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}
          
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Question Text</label>
              <input value={qData.question} onChange={e => setQData({...qData, question: e.target.value})} className="glass-input" placeholder="What is output of 2+2?" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Option A</label>
                <input value={qData.optA} onChange={e => setQData({...qData, optA: e.target.value})} className="glass-input" placeholder="3" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Option B</label>
                <input value={qData.optB} onChange={e => setQData({...qData, optB: e.target.value})} className="glass-input" placeholder="4" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Option C</label>
                <input value={qData.optC} onChange={e => setQData({...qData, optC: e.target.value})} className="glass-input" placeholder="5" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Option D</label>
                <input value={qData.optD} onChange={e => setQData({...qData, optD: e.target.value})} className="glass-input" placeholder="6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Correct Answer</label>
                <select value={qData.correctAnswer} onChange={e => setQData({...qData, correctAnswer: e.target.value})} className="glass-input appearance-none">
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Round</label>
                <select value={qData.round} onChange={e => setQData({...qData, round: e.target.value})} className="glass-input appearance-none">
                  <option value="1">1: Betting</option>
                  <option value="2">2: Code Output</option>
                  <option value="3">3: Confidence</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Timer (s)</label>
                <input type="number" value={qData.timer} onChange={e => setQData({...qData, timer: e.target.value})} className="glass-input" />
              </div>
            </div>

            <button type="submit" className="glass-button flex items-center justify-center gap-2 mt-6">
              <PlusCircle className="w-5 h-5" /> Add Question
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Question List ({questions.length})</h2>
            <button onClick={startNewGame} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition hover:scale-105 shadow-lg shadow-green-500/30">
              <Play className="w-4 h-4" /> Start Game
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {questions.length === 0 ? (
              <p className="text-slate-400 text-center mt-10">No questions added yet. Create some to start!</p>
            ) : (
              questions.map((q, i) => (
                <div key={q.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-600/50 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{i+1}. {q.question}</h3>
                    <div className="text-xs text-slate-400 mt-1 flex gap-3">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Round {q.round}</span>
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{q.timer}s</span>
                      <span className="text-green-400">Answer: {q.correctAnswer}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
