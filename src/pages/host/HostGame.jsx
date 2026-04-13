import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, collection, onSnapshot, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, SkipForward, Trophy } from 'lucide-react';

export default function HostGame() {
  const { gamePin } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    if (!db) return;

    // Listen to main game document
    const unsubGame = onSnapshot(doc(db, "games", gamePin), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);
      }
    });

    // Listen to players subcollection
    const unsubPlayers = onSnapshot(collection(db, "games", gamePin, "players"), (querySnap) => {
      const pList = [];
      querySnap.forEach((d) => {
        const pData = d.data();
        if (!pData.isHost) pList.push(pData);
      });
      setPlayers(pList);
    });

    // Fetch questions sequentially and ensure correct chronological sorting
    const fetchQuestions = async () => {
       try {
         const qSnap = await getDocs(collection(db, "games", gamePin, "questions"));
         // Sort by the specific document ID string ("0", "1", "2") that we assigned in the Dashboard batch write
         const sortedList = qSnap.docs
           .sort((a, b) => parseInt(a.id) - parseInt(b.id))
           .map(d => d.data());
         setQuestions(sortedList);
       } catch (e) {
         console.error(e);
       }
    };
    fetchQuestions();

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [gamePin]);

  // Auto-advance to leaderboard when everyone has answered
  useEffect(() => {
    if (gameState && gameState.status === 'question' && !gameState.isPaused) {
      const pCount = players.length;
      const rCount = players.filter(p => p.answer !== undefined && p.answer !== null).length;
      if (pCount > 0 && rCount >= pCount) {
        // Inline update to avoid stale closure on showLeaderboard
        updateDoc(doc(db, 'games', gamePin), { status: 'leaderboard' }).catch(() => {});
      }
    }
  }, [gameState, players, gamePin]);

  const updateState = async (updates) => {
    if (db) {
      try {
        await updateDoc(doc(db, `games`, gamePin), updates);
      } catch(e) {}
    }
  };

  const startGame = () => {
    updateState({ status: 'question', currentQuestionIndex: 0 });
  };

  const nextQuestion = async () => {
    if (!gameState) return;
    const nextIdx = gameState.currentQuestionIndex + 1;

    // Clear per-question fields for all players using batched writes
    // Firestore batch limit is 500 operations; chunk in groups of 490
    if (db && players.length > 0) {
      const chunkSize = 490;
      for (let i = 0; i < players.length; i += chunkSize) {
        const chunk = players.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(p => {
          const pRef = doc(db, 'games', gamePin, 'players', p.id);
          batch.update(pRef, {
            answer:          null,
            betValue:        null,
            confidenceLevel: null,
          });
        });
        try { await batch.commit(); } catch (e) { console.error('batch reset error:', e); }
      }
    }

    if (nextIdx >= questions.length) {
      updateState({ status: 'podium' });
    } else {
      updateState({ status: 'question', currentQuestionIndex: nextIdx });
    }
  };

  const showLeaderboard = () => {
    updateState({ status: 'leaderboard' });
  };

  const endGame = () => {
    updateState({ status: 'podium' });
  };

  const togglePause = () => {
    updateState({ isPaused: !gameState.isPaused });
  };

  if (!gameState) return <div className="min-h-screen flex items-center justify-center">Loading Data...</div>;

  const currentQ = questions[gameState.currentQuestionIndex];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col relative text-white">
      {/* Header */}
      <header className="flex justify-between items-center bg-slate-800/50 backdrop-blur top-0 py-4 px-6 rounded-2xl border border-white/10 mb-8 mx-auto w-full max-w-6xl shadow-lg shadow-black/20">
        <h1 className="text-2xl font-bold tracking-wider text-slate-200">GAME <span className="text-blue-400">PIN</span></h1>
        <div className="text-4xl md:text-6xl font-black text-white px-8 py-2 bg-slate-900 rounded-xl border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] tracking-widest leading-none">
          {gamePin}
        </div>
        <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-600">
          <Users className="text-blue-400" />
          <span className="font-bold text-xl">{players.length}</span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {gameState.status === 'lobby' && (
            <motion.div key="lobby" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, y:-50}} className="w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Waiting for players...</h2>
                <p className="text-slate-400">Join using the game PIN</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {players.map((p, i) => (
                  <motion.div initial={{opacity:0, scale:0}} animate={{opacity:1, scale:1}} transition={{type:"spring"}} key={i} className="bg-white/10 backdrop-blur px-6 py-3 rounded-full border border-white/20 font-bold text-lg shadow-xl inline-block">
                    {p.name}
                  </motion.div>
                ))}
              </div>
              {players.length > 0 && (
                <div className="mt-16 flex justify-center">
                  <button onClick={startGame} className="glass-button w-auto text-2xl px-12 py-4 rounded-full flex items-center gap-3">
                    Start Game <Play fill="currentColor" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {gameState.status === 'question' && !currentQ && (
             <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center p-12 glass-panel">
               <div className="w-16 h-16 border-4 border-blue-500 border-t-white rounded-full animate-spin mb-6"></div>
               <h2 className="text-3xl font-bold animate-pulse text-slate-300">Syncing Question Data...</h2>
             </motion.div>
          )}

          {gameState.status === 'question' && currentQ && (
            <motion.div key="question" initial={{opacity:0, x:100}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-100}} className="w-full flex flex-col items-center justify-center">
              <div className="bg-blue-600 px-6 py-2 rounded-full font-bold mb-6 flex gap-3 text-lg items-center shadow-lg">
                <span>ROUND {currentQ.round}</span>
                <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                <span>Question {gameState.currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 leading-tight">
                {currentQ.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                {currentQ.options.map((opt, i) => {
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                  return (
                    <div key={i} className={`${colors[i]} rounded-2xl p-6 text-2xl font-bold shadow-xl border-b-8 border-black/20 min-h-[140px] flex items-center justify-center text-center px-4 hover:brightness-110 transition-all`}>
                      {opt}
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-4 relative z-50">
                <button onClick={togglePause} className={`font-bold py-3 px-8 rounded-xl transition shadow-lg ${gameState.isPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500 text-black'}`}>
                  {gameState.isPaused ? 'Resume Game' : 'Pause Game'}
                </button>
                <button onClick={showLeaderboard} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg">
                  Show Results (Next)
                </button>
                <button onClick={endGame} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg">
                  End Game
                </button>
              </div>

              {gameState.isPaused && (
                <div className="absolute inset-x-0 inset-y-20 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center rounded-3xl">
                  <h1 className="text-6xl md:text-8xl font-black text-white tracking-widest animate-pulse">PAUSED</h1>
                </div>
              )}
            </motion.div>
          )}

          {gameState.status === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="w-full max-w-2xl bg-slate-800 border border-slate-600 p-8 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 justify-center"><Trophy className="text-yellow-400 w-8 h-8" /> Leaderboard</h2>
              <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                {[...players].sort((a,b)=>(b.score||0)-(a.score||0)).map((p, i) => (
                  <div key={p.id || i} className={`flex justify-between items-center p-4 rounded-xl border ${
                    i === 0 ? 'bg-yellow-500/20 border-yellow-400/40' :
                    i === 1 ? 'bg-slate-300/10 border-slate-300/30' :
                    i === 2 ? 'bg-orange-500/10 border-orange-400/30' :
                    'bg-slate-700/50 border-white/5'
                  }`}>
                    <span className="text-xl font-bold text-slate-300 flex items-center gap-3">
                      <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                      {p.name}
                    </span>
                    <span className="text-2xl font-black">{p.score || 0}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={nextQuestion} className="bg-blue-500 hover:bg-blue-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                  Next <SkipForward className="w-5 h-5"/>
                </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'podium' && (() => {
            const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
            return (
              <motion.div key="podium" initial={{opacity:0}} animate={{opacity:1}} className="text-center w-full">
                <h2 className="text-5xl font-black mb-16 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse">
                  Final Podium
                </h2>
                <div className="flex items-end justify-center gap-4 md:gap-8 h-64">
                  {/* 2nd */}
                  {sorted[1] && (
                    <motion.div initial={{height:0}} animate={{height:"60%"}} transition={{delay:0.5}} className="w-32 bg-slate-300/20 backdrop-blur rounded-t-lg relative flex flex-col items-center justify-start pt-4 border-2 border-slate-300/30">
                      <div className="absolute -top-12 text-center w-full">
                        <div className="text-2xl mb-1">🥈</div>
                        <div className="font-bold truncate px-2">{sorted[1].name}</div>
                        <div className="font-black text-blue-300">{sorted[1].score || 0} pt</div>
                      </div>
                    </motion.div>
                  )}
                  {/* 1st */}
                  {sorted[0] && (
                    <motion.div initial={{height:0}} animate={{height:"100%"}} transition={{delay:1}} className="w-40 bg-yellow-500/20 backdrop-blur rounded-t-lg relative flex flex-col items-center justify-start pt-4 border-2 border-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.3)]">
                      <div className="absolute -top-16 text-center w-full">
                        <div className="text-4xl mb-2">🥇</div>
                        <div className="font-bold text-lg truncate px-2">{sorted[0].name}</div>
                        <div className="font-black text-2xl text-yellow-300">{sorted[0].score || 0} pt</div>
                      </div>
                    </motion.div>
                  )}
                  {/* 3rd */}
                  {sorted[2] && (
                    <motion.div initial={{height:0}} animate={{height:"40%"}} transition={{delay:0.2}} className="w-32 bg-orange-500/20 backdrop-blur rounded-t-lg relative flex flex-col items-center justify-start pt-4 border-2 border-orange-500/30">
                      <div className="absolute -top-12 text-center w-full">
                        <div className="text-2xl mb-1">🥉</div>
                        <div className="font-bold truncate px-2">{sorted[2].name}</div>
                        <div className="font-black text-orange-300">{sorted[2].score || 0} pt</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })()}

        </AnimatePresence>
      </main>
    </div>
  );
}
