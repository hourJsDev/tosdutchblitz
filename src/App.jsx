import React, { useState, useEffect, useRef } from "react";
import { Trash2, Trophy, UserPlus, ChevronUp, ChevronDown, Play, Camera, LogOut, AlertTriangle, Calculator, X, RotateCcw, Sparkles, TrendingUp, Angry, Smile } from "lucide-react";
import Bg from "../public/bg.jpg";
import Queen from "../public/cham.jpg";
import logo from "../public/logo.png";
import Fire from "./Fire";
/**
 * DUTCH BLITZ SCORE MANAGER (v2.9)
 * Features:
 * - Dual Leaderboard: Highlighting the leader and an "Underdog" with cheer-up messages.
 * - Inline Score History: Round-by-round points displayed under the total.
 * - Persistent History & Undo Feature.
 */

const App = () => {
  // --- State ---
  const [players, setPlayers] = useState([]);
  const [targetScore, setTargetScore] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerImage, setNewPlayerImage] = useState("");
  const [winner, setWinner] = useState(null);
  const action = useRef(false);

  // Score Modal State
  const [activeScoringPlayer, setActiveScoringPlayer] = useState(null);
  const [roundPoints, setRoundPoints] = useState("");

  const fileInputRef = useRef(null);
  const scoreInputRef = useRef(null);

  // Cheer up messages for the underdog
  const cheerUpMessages = [
    "Coming for that comeback!",
    "Slow and steady wins the race!",
    "The comeback will be legendary!",
    "Just getting warmed up!",
    "Saving the best for last!",
    "Plotting a master move...",
    "Don't count them out yet!",
  ];

  // --- Persistence ---
  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem("dutch_blitz_players_v5");
      const savedTarget = localStorage.getItem("dutch_blitz_target_v5");
      const savedPlaying = localStorage.getItem("dutch_blitz_is_playing_v5");

      if (savedPlayers) {
        const parsed = JSON.parse(savedPlayers);
        if (Array.isArray(parsed)) setPlayers(parsed);
      }
      if (savedTarget) setTargetScore(parseInt(savedTarget, 10) || 75);
      if (savedPlaying) setIsPlaying(JSON.parse(savedPlaying));
    } catch (e) {
      console.error("Failed to load from storage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dutch_blitz_players_v5", JSON.stringify(players));
      localStorage.setItem("dutch_blitz_target_v5", targetScore.toString());
      localStorage.setItem("dutch_blitz_is_playing_v5", JSON.stringify(isPlaying));
    } catch (e) {
      console.error("Failed to save to storage", e);
    }

    if (isPlaying && !winner) {
      const potentialWinner = players.find((p) => p.score >= targetScore);
      if (potentialWinner) setWinner(potentialWinner);
    }
  }, [players, targetScore, winner, isPlaying]);

  useEffect(() => {
    if (activeScoringPlayer) {
      setTimeout(() => scoreInputRef.current?.focus(), 100);
    }
  }, [activeScoringPlayer]);

  // --- Handlers ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 200;
        let width = img.width,
          height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        setNewPlayerImage(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const newPlayer = {
      id: Date.now().toString(),
      name: String(newPlayerName.trim()),
      image: newPlayerImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newPlayerName)}`,
      score: 0,
      history: [],
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName("");
    setNewPlayerImage("");
  };

  const startGame = () => {
    if (players.length < 1) return;
    setPlayers((p) => p.map((p) => ({ ...p, score: 0, history: [] })));
    setIsPlaying(true);
    setWinner(null);
  };

  const handleApplyScore = (isPlus) => {
    const points = parseInt(isPlus ? roundPoints : roundPoints * -1, 10);
    if (isNaN(points)) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === activeScoringPlayer.id) {
          return { ...p, score: p.score + points, history: [...(p.history || []), points] };
        }
        return p;
      }),
    );
    setActiveScoringPlayer(null);
    setRoundPoints("");
  };

  const undoLastScore = (playerId) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId && p.history?.length > 0) {
          const newHistory = [...p.history];
          const lastScore = newHistory.pop();
          return { ...p, score: p.score - lastScore, history: newHistory };
        }
        return p;
      }),
    );
  };

  const movePlayer = (index, direction) => {
    if (isPlaying) return;
    const newPlayers = [...players];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPlayers.length) return;
    [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
    setPlayers(newPlayers);
  };

  // --- Logic for Leaderboard ---
  const sortedByScore = [...players].sort((a, b) => b.score - a.score);
  const topPlayer = sortedByScore[0];
  const lowestPlayer = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  return (
    <div className={`min-h-screen text-slate-900 font-sans p-4 pt-0 md:p-8`}>
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isPlaying && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
              <div className="w-[150px]">
                <img className="w-full h-full object-center object-cover" alt="" src={logo} />
              </div>
            </div>
          </div>

          {isPlaying ? (
            <button onClick={() => setWinner(topPlayer)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300">
              <LogOut className="w-4 h-4" /> Finish
            </button>
          ) : (
            <button
              onClick={startGame}
              disabled={players.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" /> Start Game
            </button>
          )}
        </header>

        {/* SETUP SCREEN */}
        {!isPlaying && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="h-[220px] rounded-2xl overflow-hidden">
              <img className="w-full h-full object-center object-cover" alt="" src={Bg} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Target Points</label>
              <div className="flex gap-2">
                {[75, 100, 150].map((val) => (
                  <button
                    key={val}
                    onClick={() => setTargetScore(val)}
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                      targetScore === val ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-transparent border-slate-100 text-slate-400"
                    }`}
                  >
                    {val}
                  </button>
                ))}
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-24 text-center bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Custom"
                />
              </div>
            </div>

            <form onSubmit={addPlayer} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-slate-300 cursor-pointer"
                >
                  {newPlayerImage ? <img src={newPlayerImage} className="w-full h-full object-cover" alt="" /> : <Camera className="w-6 h-6 text-slate-400" />}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <input
                  type="text"
                  placeholder="Member Name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 text-xl font-bold bg-transparent border-none outline-none"
                />
              </div>
              <button type="submit" disabled={!newPlayerName} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">
                Add Player
              </button>
            </form>
          </div>
        )}

        {/* DUAL HIGHLIGHT LEADERBOARD */}
        {isPlaying && topPlayer && topPlayer.score !== 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Top Player Card */}
            <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-xl shadow-indigo-100 animate-in slide-in-from-left duration-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Almost Blitzed</span>
                <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex items-center gap-3">
                <img src={topPlayer.image} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" alt="" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{topPlayer.name}</h3>
                  <div className="h-2 bg-indigo-900/40 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all duration-700" style={{ width: `${Math.min(100, (topPlayer.score / targetScore) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Underdog Card */}
            {lowestPlayer && lowestPlayer.id !== topPlayer.id && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">The Underdog</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center gap-3">
                  <img src={lowestPlayer.image} className="w-12 h-12 rounded-xl object-cover grayscale opacity-70" alt="" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{lowestPlayer.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {cheerUpMessages[Math.floor((lowestPlayer.score + players.length) % cheerUpMessages.length)]}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAYER LIST */}
        <div className="space-y-3">
          {players.map((player, index) => (
            <div key={player.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex items-stretch">
              {!isPlaying && (
                <div className="flex flex-col bg-slate-50 border-r px-1 py-2 justify-center gap-1">
                  <button onClick={() => movePlayer(index, -1)} className="p-1 text-slate-400">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => movePlayer(index, 1)} className="p-1 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex-1 p-4 flex items-center gap-4">
                <img src={player.image} alt="" className="w-16 h-16 rounded-2xl object-cover border bg-slate-50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-lg truncate">{player.name}</h4>
                    {!isPlaying && (
                      <button onClick={() => setPlayers((p) => p.filter((x) => x.id !== player.id))} className="text-slate-200 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isPlaying && (
                    <div className="mt-1">
                      <p className="text-3xl font-black text-slate-900 leading-none">{player.score}</p>
                      {player.history?.length > 0 && (
                        <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar">
                          {player.history.map((pt, i) => (
                            <span
                              key={i}
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                                pt >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                              }`}
                            >
                              {pt >= 0 ? `+${pt}` : pt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-[5px]">
                  {isPlaying && (
                    <button
                      onClick={() => {
                        setActiveScoringPlayer(player);
                        action.current = false;
                      }}
                      className="h-12 w-12 flex items-center justify-center bg-red-100 text-red-600 rounded-xl active:scale-90 transition-all shrink-0"
                    >
                      <Angry className="w-5 h-5" />
                    </button>
                  )}
                  {isPlaying && (
                    <button
                      onClick={() => {
                        setActiveScoringPlayer(player);
                        action.current = true;
                      }}
                      className="h-12 w-12 flex items-center justify-center bg-green-100 text-green-600 rounded-xl active:scale-90 transition-all shrink-0"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CALC MODAL */}
        {activeScoringPlayer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-900">{activeScoringPlayer.name}</h3>
                <button onClick={() => setActiveScoringPlayer(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-2xl w-full  aspect-[4/3] overflow-hidden mb-[10px]">
                <img className="w-full h-full object-center object-cover" alt="" src={Queen} />
              </div>
              <input
                ref={scoreInputRef}
                type="number"
                inputMode="numeric"
                value={roundPoints}
                placeholder="0"
                onChange={(e) => setRoundPoints(e.target.value)}
                className="w-full text-4xl font-black p-4 bg-slate-100 rounded-2xl outline-none mb-6"
              />
              <div className="flex justify-end mb-4">
                <button onClick={() => handleApplyScore(action.current)} className="py-4 w-[100px] rounded-2xl font-bold bg-green-600 text-white shadow-lg">
                  Save
                </button>
              </div>
              {activeScoringPlayer.history?.length > 0 && (
                <button
                  onClick={() => {
                    undoLastScore(activeScoringPlayer.id);
                    setActiveScoringPlayer(null);
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Undo Round (last score)
                </button>
              )}
            </div>
          </div>
        )}

        {/* WINNER MODAL */}
        {winner && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Match Over!</h2>
              <img src={winner.image} alt="" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-slate-50 mb-4" />
              <p className="text-xl font-bold text-indigo-600 mb-8 uppercase">{String(winner.name)} Blitzed!</p>
              <div className="space-y-3">
                <button onClick={startGame} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg">
                  New Match
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setWinner(null);
                  }}
                  className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold"
                >
                  Roster
                </button>
              </div>
            </div>
          </div>
        )}
        {isPlaying && <Fire />}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default App;
