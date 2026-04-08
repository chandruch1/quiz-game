import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function PlayerJoin() {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!pin || !name) {
       setError("Game PIN and Nickname are required");
       return;
    }
    setLoading(true);

    const playerId = 'player_' + Date.now();

    if (db) {
      try {
        const gameRef = doc(db, `games`, pin);
        const snapshot = await getDoc(gameRef);
        
        if (snapshot.exists()) {
          const state = snapshot.data();
          if (state.status !== 'lobby') {
            setError("Game has already started.");
            setLoading(false);
            return;
          }
          await setDoc(doc(db, `games`, pin, `players`, playerId), {
            id: playerId,
            name: name,
            score: 0,
            isHost: false
          });
          window.localStorage.setItem('playerId', playerId);
          navigate(`/play/${pin}`);
        } else {
          setError("Game PIN not found.");
        }
      } catch (e) {
        setError("Error connecting to game.");
        console.error(e);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full"></div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-8 w-full max-w-sm relative z-10 text-center">
        <h1 className="text-4xl font-black mb-8 tracking-wider">
          <span className="text-white">QUIZ</span><span className="text-blue-500">PLAY</span>
        </h1>

        {error && <p className="text-red-400 bg-red-400/10 p-3 rounded-lg mb-4 text-sm font-semibold">{error}</p>}

        <form onSubmit={handleJoin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Game PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="glass-input text-center text-2xl font-bold tracking-widest uppercase placeholder:text-slate-500" 
            maxLength={6}
          />
          <input 
            type="text" 
            placeholder="Nickname" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input text-center font-semibold" 
            maxLength={15}
          />
          <button disabled={loading} type="submit" className="glass-button text-xl mt-4 h-14">
            {loading ? 'Joining...' : 'Enter'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-slate-400 text-sm">
          Want to host your own quiz?{' '}
          <button onClick={() => navigate('/host')} className="text-blue-400 font-bold hover:text-blue-300 transition underline underline-offset-4">
            Host a Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
