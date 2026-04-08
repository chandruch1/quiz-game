import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, getDocs, collection, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// ── Scoring tables ─────────────────────────────────────────────
// Round 1: answer correct → +betValue, wrong → -betValue
// Round 2: correct → +150, wrong → 0
// Round 3: LOW correct+10/wrong-5 | MID correct+20/wrong-10 | HIGH correct+30/wrong-15
const CONFIDENCE_SCORE = {
  LOW:  { correct: 10,  wrong: -5  },
  MID:  { correct: 20,  wrong: -10 },
  HIGH: { correct: 30,  wrong: -15 },
};

const BET_OPTIONS        = [2, 3, 4];
const CONFIDENCE_OPTIONS = ['LOW', 'MID', 'HIGH'];
const OPTION_COLORS      = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

export default function PlayerGame() {
  const { gamePin } = useParams();
  const navigate    = useNavigate();

  const [gameState,       setGameState]       = useState(null);
  const [questions,       setQuestions]       = useState([]);
  const [playerData,      setPlayerData]      = useState({ score: 0 });
  const [hasAnswered,     setHasAnswered]     = useState(false);
  const [lastResult,      setLastResult]      = useState({ isCorrect: false, points: 0 });

  // Per-question selections (reset on each new question)
  const [selectedOption,  setSelectedOption]  = useState(null);   // MCQ answer
  const [betValue,        setBetValue]        = useState(null);   // Round 1
  const [confidenceLevel, setConfidenceLevel] = useState(null);  // Round 3

  const playerId = window.localStorage.getItem('playerId');

  // ── Firestore listeners ────────────────────────────────────────
  useEffect(() => {
    if (!playerId) { navigate('/'); return; }

    // 1. Game state listener
    const unsubGame = onSnapshot(doc(db, 'games', gamePin), (snap) => {
      if (!snap.exists()) { navigate('/'); return; }
      const data = snap.data();
      setGameState(data);

      // Reset per-question state whenever the question index changes
      if (
        data.status === 'question' &&
        window.localStorage.getItem('currentQ') !== String(data.currentQuestionIndex)
      ) {
        setHasAnswered(false);
        setSelectedOption(null);
        setBetValue(null);
        setConfidenceLevel(null);
        window.localStorage.setItem('currentQ', String(data.currentQuestionIndex));
      }
    });

    // 2. Player's own document listener (live score)
    const unsubPlayer = onSnapshot(
      doc(db, 'games', gamePin, 'players', playerId),
      (snap) => { if (snap.exists()) setPlayerData(snap.data()); }
    );

    // 3. Fetch questions once (sorted by numeric doc ID)
    const fetchQuestions = async () => {
      try {
        const qSnap = await getDocs(collection(db, 'games', gamePin, 'questions'));
        const sorted = qSnap.docs
          .sort((a, b) => parseInt(a.id) - parseInt(b.id))
          .map(d => d.data());
        setQuestions(sorted);
      } catch (e) { console.error('fetchQuestions:', e); }
    };
    fetchQuestions();

    return () => { unsubGame(); unsubPlayer(); };
  }, [gamePin, playerId, navigate]);

  // ── Submit answer ──────────────────────────────────────────────
  const submitAnswer = async (optOverride) => {
    const finalAnswer = optOverride || selectedOption;
    if (hasAnswered || !gameState || gameState.isPaused || !finalAnswer) return;

    const question  = questions[gameState.currentQuestionIndex];
    if (!question) return;

    const isCorrect = finalAnswer === question.correctAnswer;
    let   points    = 0;

    if (question.round === 1) {
      // Bet scoring: correct → +betValue, wrong → -betValue
      const bv = betValue ?? BET_OPTIONS[0]; // default to 2 if somehow null
      points = isCorrect ? bv : -bv;
    } else if (question.round === 2) {
      points = isCorrect ? 150 : 0;
    } else if (question.round === 3) {
      const lvl = confidenceLevel ?? 'MID';
      points = isCorrect ? CONFIDENCE_SCORE[lvl].correct : CONFIDENCE_SCORE[lvl].wrong;
    }

    setHasAnswered(true);
    setLastResult({ isCorrect, points });

    try {
      await updateDoc(doc(db, 'games', gamePin, 'players', playerId), {
        answer:         finalAnswer,
        isCorrect,
        pointsEarned:   points,
        score:          (playerData?.score || 0) + points,
        betValue:       betValue        ?? null,
        confidenceLevel: confidenceLevel ?? null,
      });
    } catch (e) {
      console.error('submitAnswer write error:', e);
    }
  };

  // ── Loading state ──────────────────────────────────────────────
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Safe current question (null-guard prevents blank page)
  const currentQuestion =
    questions.length > 0 && gameState.currentQuestionIndex >= 0
      ? questions[gameState.currentQuestionIndex] ?? null
      : null;

  // Derive submit-readiness per round
  const canSubmitR1 = !!selectedOption && betValue !== null;
  const canSubmitR3 = confidenceLevel !== null; // answer selected via button click

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-y-auto">
      <AnimatePresence mode="wait">

        {/* LOBBY */}
        {gameState.status === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center w-full max-w-sm glass-panel p-8"
          >
            <h2 className="text-3xl font-bold mb-4 text-green-400">You're in! 🎉</h2>
            <div className="mt-8 animate-pulse text-slate-500">Waiting for host to start...</div>
          </motion.div>
        )}

        {/* Syncing questions */}
        {gameState.status === 'question' && questions.length === 0 && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-sm glass-panel p-8"
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-200">Loading Question...</h2>
          </motion.div>
        )}

        {/* ── ROUND 1: Answer + Bet ── */}
        {gameState.status === 'question' && !hasAnswered && currentQuestion?.round === 1 && (
          <motion.div
            key="q-r1"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg mx-auto flex flex-col gap-4 relative"
          >
            {gameState.isPaused && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <h2 className="text-4xl font-black text-white tracking-widest animate-pulse">PAUSED</h2>
              </div>
            )}

            {/* Question */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 text-center shadow-lg">
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2 block">Round 1 · Betting</span>
              <h2 className="text-2xl md:text-3xl font-bold">{currentQuestion.question}</h2>
            </div>

            {/* MCQ Options */}
            <div className="grid grid-cols-2 gap-3 h-[28vh]">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(opt)}
                  className={`${OPTION_COLORS[i]} rounded-2xl shadow-lg border-b-8 p-3 text-xl font-bold
                    flex items-center justify-center break-words transition-all
                    ${selectedOption === opt
                      ? 'ring-4 ring-white border-black/40 scale-105'
                      : 'border-black/20 opacity-80 hover:opacity-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Bet Chips [2] [3] [4] */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-inner">
              <h3 className="text-center font-bold mb-3 text-slate-300">
                🪙 Place Your Bet
                <span className="ml-2 text-xs text-slate-500">(correct → +bet, wrong → −bet)</span>
              </h3>
              <div className="flex gap-3 justify-center">
                {BET_OPTIONS.map(val => (
                  <button
                    key={val}
                    onClick={() => setBetValue(val)}
                    className={`w-16 h-16 rounded-full font-black text-2xl border-4 transition-all flex items-center justify-center
                      ${betValue === val
                        ? 'bg-yellow-500 border-yellow-200 text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={() => submitAnswer()}
              disabled={!canSubmitR1}
              className="glass-button bg-blue-600 h-16 text-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {!selectedOption ? 'Select an answer' : betValue === null ? 'Choose a bet' : 'PLACE BET 🎲'}
            </button>
          </motion.div>
        )}

        {/* ── ROUND 2: Standard MCQ ── */}
        {gameState.status === 'question' && !hasAnswered && currentQuestion?.round === 2 && (
          <motion.div
            key="q-r2"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg mx-auto flex flex-col gap-4 relative"
          >
            {gameState.isPaused && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <h2 className="text-4xl font-black text-white tracking-widest animate-pulse">PAUSED</h2>
              </div>
            )}

            <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 text-center shadow-lg">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block">Round 2 · Code Output</span>
              <h2 className="text-2xl md:text-3xl font-bold">{currentQuestion.question}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 h-[55vh]">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitAnswer(opt)}
                  className={`${OPTION_COLORS[i]} rounded-2xl shadow-lg border-b-8 border-black/20
                    active:border-b-0 active:translate-y-2 transition-all p-4
                    text-xl md:text-2xl font-bold flex items-center justify-center break-words text-white`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ROUND 3: Answer + Confidence ── */}
        {gameState.status === 'question' && !hasAnswered && currentQuestion?.round === 3 && (
          <motion.div
            key="q-r3"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg mx-auto flex flex-col gap-4 relative"
          >
            {gameState.isPaused && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <h2 className="text-4xl font-black text-white tracking-widest animate-pulse">PAUSED</h2>
              </div>
            )}

            <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 text-center shadow-lg">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block">Round 3 · Confidence</span>
              <h2 className="text-2xl md:text-3xl font-bold">{currentQuestion.question}</h2>
            </div>

            {/* Confidence selector */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-inner">
              <h3 className="text-center font-bold mb-1 text-slate-300">🎯 Select Confidence Level</h3>
              <p className="text-center text-xs text-slate-500 mb-3">Higher confidence = bigger reward or bigger risk</p>
              <div className="flex bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                {CONFIDENCE_OPTIONS.map(lvl => {
                  const meta = { LOW: '±5/10', MID: '±10/20', HIGH: '±15/30' };
                  return (
                    <button
                      key={lvl}
                      onClick={() => setConfidenceLevel(lvl)}
                      className={`flex-1 py-3 font-bold transition flex flex-col items-center gap-0.5
                        ${confidenceLevel === lvl
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                      <span>{lvl}</span>
                      <span className="text-xs opacity-60">{meta[lvl]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MCQ Buttons (click to select + submit) */}
            <p className="text-center text-xs text-slate-500">
              {confidenceLevel === null ? '⬆ Choose confidence first, then tap your answer' : 'Tap your answer to submit'}
            </p>
            <div className="grid grid-cols-2 gap-4 h-[38vh]">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { if (confidenceLevel) submitAnswer(opt); }}
                  disabled={!confidenceLevel}
                  className={`${OPTION_COLORS[i]} rounded-2xl shadow-lg border-b-8 border-black/20
                    active:border-b-0 active:translate-y-2 transition-all p-4
                    text-xl font-bold flex items-center justify-center break-words text-white
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Waiting after answered */}
        {gameState.status === 'question' && hasAnswered && (
          <motion.div
            key="answered"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center glass-panel p-8 max-w-sm"
          >
            <h2 className="text-3xl font-bold mb-4 text-slate-200">Answer Submitted! ✅</h2>
            <div className="w-16 h-16 border-4 border-slate-600 border-t-white rounded-full animate-spin mx-auto mt-8" />
            <p className="mt-8 text-slate-400 font-semibold">Waiting for others...</p>
          </motion.div>
        )}

        {/* LEADERBOARD: show result */}
        {gameState.status === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center p-8 max-w-sm rounded-2xl text-white shadow-2xl
              ${lastResult.isCorrect ? 'bg-green-600' : 'bg-red-600'}`}
          >
            <h2 className="text-5xl font-black mb-4">
              {lastResult.isCorrect ? '✅ Correct!' : '❌ Incorrect!'}
            </h2>
            <div className="text-7xl mb-6 font-bold">
              {lastResult.points > 0 ? `+${lastResult.points}` : lastResult.points}
            </div>
            <div className="bg-black/20 rounded-xl p-4 inline-block shadow-inner border border-black/10">
              <span className="text-lg opacity-80 uppercase font-bold tracking-wider block mb-1">Total Score</span>
              <span className="text-3xl font-black">{playerData?.score ?? 0}</span>
            </div>
            <p className="mt-8 text-sm opacity-70 font-semibold uppercase tracking-widest">
              Look at the big screen for ranks
            </p>
          </motion.div>
        )}

        {/* PODIUM */}
        {gameState.status === 'podium' && (
          <motion.div
            key="podium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center glass-panel p-8 max-w-sm"
          >
            <h2 className="text-4xl font-black mb-4 text-yellow-500">Game Over! 🎉</h2>
            <div className="text-8xl mb-8">🏆</div>
            <p className="text-xl font-bold text-slate-300">Did you make the podium?</p>
            <button onClick={() => navigate('/')} className="mt-8 glass-button">Play Again</button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
