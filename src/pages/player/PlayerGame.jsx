import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtdb } from '../../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerGame() {
  const { gamePin } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [confidence, setConfidence] = useState('MID');
  const [lastResult, setLastResult] = useState({ isCorrect: false, points: 0 });
  
  // Round 1 States
  const [selectedOption, setSelectedOption] = useState(null);
  const [prediction, setPrediction] = useState('CORRECT');
  const [betAmount, setBetAmount] = useState(1);

  const playerId = window.localStorage.getItem('playerId');

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }

    if (rtdb) {
      const gRef = ref(rtdb, `games/${gamePin}`);
      const unsub = onValue(gRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setGameState(data);
          // Auto reset answer state on new question
          if (data.status === 'question' && window.localStorage.getItem('currentQ') !== String(data.currentQuestionIndex)) {
            setHasAnswered(false);
            setSelectedOption(null);
            setPrediction('CORRECT');
            setBetAmount(1);
            window.localStorage.setItem('currentQ', String(data.currentQuestionIndex));
          }
        } else {
          navigate('/');
        }
      });
      return () => unsub();
    } else {
      // Offline mock polling
      const interval = setInterval(() => {
        const json = window.localStorage.getItem(`mock_game_${gamePin}`);
        if (json) {
          const data = JSON.parse(json);
          setGameState(data);
          if (data.status === 'question' && window.localStorage.getItem('currentQ') !== String(data.currentQuestionIndex)) {
            setHasAnswered(false);
            setSelectedOption(null);
            setPrediction('CORRECT');
            setBetAmount(1);
            window.localStorage.setItem('currentQ', String(data.currentQuestionIndex));
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gamePin, playerId, navigate]);

  const submitAnswer = async (optOverride) => {
    const finalAnswer = optOverride || selectedOption;
    if (hasAnswered || !gameState || gameState.isPaused || !finalAnswer) return;
    setHasAnswered(true);

    const question = gameState.questions[gameState.currentQuestionIndex];
    let isCorrect = finalAnswer === question.correctAnswer;
    
    let pointsEarned = 0;
    
    if (question.round === 1) {
       // Casino Style Betting Logic
       const isPredictionHit = (isCorrect && prediction === 'CORRECT') || (!isCorrect && prediction === 'WRONG');
       if (isPredictionHit) {
           pointsEarned = betAmount * 2;
           isCorrect = true; // Mark True for UI leaderboard "Correct" feedback since they won the bet
       } else {
           pointsEarned = -betAmount;
           isCorrect = false; 
       }
    } else if (isCorrect) {
      if (question.round === 2) pointsEarned = 150;
      if (question.round === 3) {
        if (confidence === 'LOW') pointsEarned = 10;
        if (confidence === 'MID') pointsEarned = 20;
        if (confidence === 'HIGH') pointsEarned = 30;
      }
    } else {
      if (question.round === 3) {
        if (confidence === 'LOW') pointsEarned = -5;
        if (confidence === 'MID') pointsEarned = -10;
        if (confidence === 'HIGH') pointsEarned = -15;
      }
    }
    
    setLastResult({ isCorrect, points: pointsEarned });

    // Update player's score
    const currentScore = gameState.players[playerId]?.score || 0;
    const newScore = currentScore + pointsEarned;

    if (rtdb) {
      try {
        await update(ref(rtdb, `games/${gamePin}/players/${playerId}`), { score: newScore });
        await set(ref(rtdb, `games/${gamePin}/responses/${playerId}`), {
          answer: finalAnswer,
          isCorrect,
          pointsEarned,
          prediction,
          betAmount
        });
      } catch(e) {}
    } else {
      const json = window.localStorage.getItem(`mock_game_${gamePin}`);
      if (json) {
        let state = JSON.parse(json);
        if(!state.players[playerId]) state.players[playerId] = {score: 0};
        state.players[playerId].score += pointsEarned;
        
        if(!state.responses) state.responses = {};
        state.responses[playerId] = {
           answer: finalAnswer, isCorrect, pointsEarned, prediction, betAmount
        };

        window.localStorage.setItem(`mock_game_${gamePin}`, JSON.stringify(state));
      }
    }
  };

  if (!gameState) return <div className="min-h-screen flex items-center justify-center p-4"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-y-auto">
      <AnimatePresence mode="wait">
        
        {gameState.status === 'lobby' && (
          <motion.div key="lobby" initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-center w-full max-w-sm glass-panel p-8">
            <h2 className="text-3xl font-bold mb-4 text-green-400">You're in!</h2>
            <p className="text-xl text-slate-300">See your nickname on the screen.</p>
            <div className="mt-8 animate-pulse text-slate-500">Waiting for host to start...</div>
          </motion.div>
        )}

        {gameState.status === 'question' && !hasAnswered && (
          <motion.div key="question" initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} className="w-full h-full flex flex-col justify-center max-w-lg mx-auto gap-4 relative">
            
            {gameState.isPaused && (
               <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                   <h2 className="text-4xl font-black text-white tracking-widest animate-pulse">PAUSED</h2>
               </div>
            )}
            
            <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 mb-2 shadow-lg text-center shrink-0">
              <h2 className="text-2xl md:text-3xl font-bold">{gameState.questions[gameState.currentQuestionIndex].question}</h2>
            </div>
            
            {gameState.questions[gameState.currentQuestionIndex].round === 1 ? (
              <div className="w-full flex flex-col gap-3 pb-8">
                 <div className="grid grid-cols-2 gap-3 h-[25vh]">
                   {gameState.questions[gameState.currentQuestionIndex].options.map((opt, i) => (
                      <button key={i} onClick={() => setSelectedOption(opt)} className={`rounded-2xl shadow-lg border-b-8 p-3 text-xl font-bold flex items-center justify-center break-words transition-all ${selectedOption === opt ? 'ring-4 ring-white border-black/40 scale-105' : 'border-black/20 opacity-85 hover:opacity-100'} ${['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'][i]}`}>
                        {opt}
                      </button>
                   ))}
                 </div>
                 
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-inner">
                    <h3 className="text-center font-bold mb-3 text-slate-300">Your Prediction</h3>
                    <div className="flex gap-2">
                       <button onClick={()=>setPrediction('CORRECT')} className={`flex-1 py-3 rounded-lg font-bold transition shadow ${prediction === 'CORRECT' ? 'bg-green-500 text-white scale-105 ring-2 ring-white/50' : 'bg-slate-700 text-slate-400'}`}>✅ CORRECT</button>
                       <button onClick={()=>setPrediction('WRONG')} className={`flex-1 py-3 rounded-lg font-bold transition shadow ${prediction === 'WRONG' ? 'bg-red-500 text-white scale-105 ring-2 ring-white/50' : 'bg-slate-700 text-slate-400'}`}>❌ WRONG</button>
                    </div>
                 </div>

                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-inner">
                    <h3 className="text-center font-bold mb-3 text-slate-300">Bet Amount (Chips)</h3>
                    <div className="flex gap-2 justify-around">
                       {[1, 2, 3, 4].map(amt => (
                         <button key={amt} onClick={()=>setBetAmount(amt)} className={`w-14 h-14 rounded-full font-black text-2xl border-4 transition-all flex items-center justify-center ${betAmount === amt ? 'bg-yellow-500 border-yellow-200 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>
                           {amt}
                         </button>
                       ))}
                    </div>
                 </div>
                 
                 <button onClick={()=>submitAnswer()} disabled={!selectedOption} className="mt-2 glass-button bg-blue-600 h-16 text-2xl disabled:opacity-50 disabled:scale-100">
                    PLACE BET
                 </button>
              </div>
            ) : (
                <div className="w-full flex flex-col gap-4">
                  {gameState.questions[gameState.currentQuestionIndex].round === 3 && (
                    <div className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-600 focus-within:ring-2 focus-within:ring-blue-500">
                       <h3 className="text-center font-bold mb-3 text-slate-300">Select Confidence Level</h3>
                       <div className="flex bg-slate-900 rounded-lg overflow-hidden">
                         {['LOW', 'MID', 'HIGH'].map(lvl => (
                           <button key={lvl} onClick={()=>setConfidence(lvl)} className={`flex-1 py-3 font-bold transition ${confidence === lvl ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                             {lvl}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 h-[50vh]">
                    {gameState.questions[gameState.currentQuestionIndex].options.map((opt, i) => {
                      const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                      return (
                        <button 
                          key={i} 
                          onClick={() => submitAnswer(opt)} 
                          className={`${colors[i]} rounded-2xl shadow-lg border-b-8 border-black/20 active:border-b-0 active:translate-y-2 transition-all p-4 text-xl md:text-2xl font-bold flex items-center justify-center break-words text-white`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
              </div>
            )}
          </motion.div>
        )}

        {gameState.status === 'question' && hasAnswered && (
          <motion.div key="answered" initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-center glass-panel p-8 max-w-sm">
            <h2 className="text-3xl font-bold mb-4 text-slate-200">Answer Submitted!</h2>
            <div className="w-16 h-16 border-4 border-slate-600 border-t-white rounded-full animate-spin mx-auto mt-8"></div>
            <p className="mt-8 text-slate-400 font-semibold">Waiting for time to finish...</p>
          </motion.div>
        )}

        {gameState.status === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{opacity:0}} animate={{opacity:1}} className={`text-center p-8 max-w-sm rounded-2xl ${lastResult.isCorrect ? 'bg-green-600' : 'bg-red-600'} text-white shadow-2xl`}>
             <h2 className="text-5xl font-black mb-4">{lastResult.isCorrect ? "Correct!" : "Incorrect!"}</h2>
             <div className="text-7xl mb-6 font-bold">{lastResult.points > 0 ? `+${lastResult.points}` : lastResult.points}</div>
             <div className="bg-black/20 rounded-xl p-4 inline-block shadow-inner mt-2 border border-black/10">
               <span className="text-lg opacity-80 uppercase font-bold tracking-wider block mb-1">Total Score</span>
               <span className="text-3xl font-black">{gameState.players[playerId]?.score || 0}</span>
             </div>
             <p className="mt-8 text-sm opacity-80 font-semibold uppercase tracking-widest text-black/50">Look at the big screen for ranks</p>
          </motion.div>
        )}

        {gameState.status === 'podium' && (
          <motion.div key="podium" initial={{opacity:0}} animate={{opacity:1}} className="text-center glass-panel p-8 max-w-sm">
             <h2 className="text-4xl font-black mb-4 text-yellow-500">Game Over!</h2>
             <div className="text-8xl mb-8">🏆</div>
             <p className="text-xl font-bold text-slate-300">Did you make the podium?</p>
             <button onClick={()=>navigate('/')} className="mt-8 glass-button">Play Again</button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
