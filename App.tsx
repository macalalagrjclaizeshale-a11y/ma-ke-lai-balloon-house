
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Balloon, BalloonColor, Dart, GameState } from './types';
import { getEMACommentary, getAuntieCommentary } from './services/geminiService';
import { playPopSound, playWhooshSound } from './services/soundService';
import EMAAnnouncer from './components/EMAAnnouncer';
import AuntieCharacter from './components/AuntieCharacter';

const INITIAL_DARTS = 10;
const BALLOON_RADIUS = 30;
const COLORS = Object.values(BalloonColor);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    dartsLeft: INITIAL_DARTS,
    level: 1,
    balloons: [],
    isGameOver: false,
    streak: 0,
  });

  const [commentary, setCommentary] = useState("Step right up! Try your luck!");
  const [auntieMessage, setAuntieMessage] = useState("Buy more tokens, don't shy!");
  const [isAnnouncerVisible, setIsAnnouncerVisible] = useState(false);
  const [isAuntieVisible, setIsAuntieVisible] = useState(false);
  
  const [activeDart, setActiveDart] = useState<Dart | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emaTimeout = useRef<number | null>(null);
  const auntieTimeout = useRef<number | null>(null);

  const showCommentaries = useCallback((event: any, data: any) => {
    // EMA reaction
    getEMACommentary(event, data).then(msg => {
      setCommentary(msg);
      setIsAnnouncerVisible(true);
      if (emaTimeout.current) clearTimeout(emaTimeout.current);
      emaTimeout.current = window.setTimeout(() => setIsAnnouncerVisible(false), 3000);
    });

    // Auntie reaction (sometimes she's quiet, sometimes she talks)
    if (Math.random() > 0.3) {
      setTimeout(() => {
        getAuntieCommentary(event, data).then(msg => {
          setAuntieMessage(msg);
          setIsAuntieVisible(true);
          if (auntieTimeout.current) clearTimeout(auntieTimeout.current);
          auntieTimeout.current = window.setTimeout(() => setIsAuntieVisible(false), 4000);
        });
      }, 500);
    }
  }, []);

  const generateBalloons = useCallback((level: number) => {
    const newBalloons: Balloon[] = [];
    const cols = Math.min(4 + level, 8);
    const rows = 3;
    const spacingX = 90;
    const spacingY = 100;
    
    const boardWidth = (cols - 1) * spacingX;
    const boardHeight = (rows - 1) * spacingY;
    const startX = (window.innerWidth - boardWidth) / 2;
    const startY = (window.innerHeight - boardHeight) / 2 - 50;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newBalloons.push({
          id: `${r}-${c}-${Math.random()}`,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          radius: BALLOON_RADIUS,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          points: 10 + (level * 5),
          isPopped: false,
          velocity: { x: 0, y: 0 }
        });
      }
    }
    return newBalloons;
  }, []);

  const createPopParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const startNewLevel = useCallback((level: number) => {
    setGameState(prev => ({
      ...prev,
      level,
      balloons: generateBalloons(level),
      dartsLeft: prev.dartsLeft + 3,
    }));
    showCommentaries('level_up', { score: gameState.score, level });
  }, [gameState.score, showCommentaries, generateBalloons]);

  useEffect(() => {
    startNewLevel(1);
  }, []);

  const handlePop = (balloonId: string) => {
    // Play Pop Sound
    playPopSound();

    setGameState(prev => {
      const poppedBalloon = prev.balloons.find(b => b.id === balloonId);
      if (!poppedBalloon) return prev;

      createPopParticles(poppedBalloon.x, poppedBalloon.y, poppedBalloon.color);
      const newBalloons = prev.balloons.map(b => b.id === balloonId ? { ...b, isPopped: true } : b);
      const newStreak = prev.streak + 1;
      const remaining = newBalloons.filter(b => !b.isPopped).length;
      
      if (remaining === 0) {
        setTimeout(() => startNewLevel(prev.level + 1), 800);
      } else if (newStreak % 3 === 0) {
        showCommentaries('streak', { score: prev.score + poppedBalloon.points, streak: newStreak });
      }

      return {
        ...prev,
        score: prev.score + poppedBalloon.points,
        balloons: newBalloons,
        streak: newStreak
      };
    });
  };

  const handleMiss = () => {
    setGameState(prev => {
      const nextDarts = prev.dartsLeft - 1;
      const isOver = nextDarts <= 0;
      showCommentaries(isOver ? 'game_over' : 'miss', { score: prev.score, streak: 0 });
      return { ...prev, dartsLeft: nextDarts, streak: 0, isGameOver: isOver };
    });
  };

  const throwDart = (clientX: number, clientY: number) => {
    if (gameState.isGameOver || activeDart) return;
    
    // Play throw sound
    playWhooshSound();

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight + 100;
    setActiveDart({ x: startX, y: startY, targetX: clientX, targetY: clientY, progress: 0, isActive: true });
  };

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lights and Board
      if (gameState.balloons.length > 0) {
        const first = gameState.balloons[0];
        const last = gameState.balloons[gameState.balloons.length - 1];
        const padding = 60;
        const boardX = first.x - padding;
        const boardY = first.y - padding;
        const boardW = last.x - first.x + padding * 2;
        const boardH = last.y - first.y + padding * 2;
        
        // Wood Board Background
        ctx.fillStyle = '#451a03';
        ctx.fillRect(boardX, boardY, boardW, boardH);
        ctx.strokeStyle = '#2d0f02';
        for (let i = 0; i < boardH; i += 20) {
          ctx.beginPath(); ctx.moveTo(boardX, boardY + i); ctx.lineTo(boardX + boardW, boardY + i); ctx.stroke();
        }
      }

      // Particles
      setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, life: p.life - 0.02 })).filter(p => p.life > 0));
      particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1.0;

      // Balloons
      gameState.balloons.forEach(b => {
        if (!b.isPopped) {
          ctx.beginPath(); ctx.ellipse(b.x, b.y, b.radius, b.radius * 1.2, 0, 0, Math.PI * 2);
          ctx.fillStyle = b.color; ctx.fill();
          
          // Balloon shine
          ctx.beginPath();
          ctx.ellipse(b.x - b.radius/3, b.y - b.radius/3, b.radius/4, b.radius/6, Math.PI/4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();

          // Board attachment pin
          ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(b.x, b.y + b.radius * 1.2, 3, 0, Math.PI * 2); ctx.fill();
        }
      });

      // Dart
      if (activeDart) {
        const newProgress = activeDart.progress + 0.04;
        const curX = activeDart.x + (activeDart.targetX - activeDart.x) * newProgress;
        const curY = activeDart.y + (activeDart.targetY - activeDart.y) * newProgress;
        const scale = 2.5 * (1 - newProgress * 0.6); 
        if (newProgress >= 1) {
          let hit = false;
          gameState.balloons.forEach(b => {
            if (!b.isPopped) {
              const dist = Math.sqrt((curX - b.x)**2 + (curY - b.y)**2);
              if (dist < b.radius + 10) { handlePop(b.id); hit = true; }
            }
          });
          if (!hit) handleMiss();
          setActiveDart(null);
        } else {
          setActiveDart({ ...activeDart, progress: newProgress });
          ctx.save(); ctx.translate(curX, curY);
          const angle = Math.atan2(activeDart.targetY - activeDart.y, activeDart.targetX - activeDart.x);
          ctx.rotate(angle); ctx.scale(scale, scale);
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-10, -3); ctx.lineTo(-10, 3); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-15, -6); ctx.lineTo(-12, 0); ctx.lineTo(-15, 6); ctx.fill();
          ctx.restore();
        }
      }
      animationId = requestAnimationFrame(update);
    };
    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, activeDart, particles]);

  const resize = () => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      setGameState(prev => ({ ...prev, balloons: generateBalloons(prev.level) }));
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0f172a] select-none overflow-hidden font-sans">
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="bg-amber-950/80 backdrop-blur-md p-4 rounded-xl border-4 border-amber-600 shadow-2xl">
          <p className="text-amber-400 text-xs font-black uppercase tracking-tighter">WINNINGS</p>
          <p className="text-4xl font-black text-white drop-shadow-md">★ {gameState.score}</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-amber-950/80 backdrop-blur-md p-4 rounded-xl border-4 border-amber-600 text-center shadow-2xl">
            <p className="text-amber-400 text-xs font-black uppercase tracking-tighter">STAGE</p>
            <p className="text-3xl font-black text-white">{gameState.level}</p>
          </div>
          <div className="bg-amber-950/80 backdrop-blur-md p-4 rounded-xl border-4 border-amber-600 text-center shadow-2xl">
            <p className="text-amber-400 text-xs font-black uppercase tracking-tighter">AMMO</p>
            <div className="flex gap-1 justify-center mt-1">
              {Array.from({ length: Math.min(gameState.dartsLeft, 8) }).map((_, i) => (
                <div key={i} className="w-2 h-6 bg-red-600 rounded-full border border-red-400"></div>
              ))}
              {gameState.dartsLeft > 8 && <span className="text-white font-black ml-1">+{gameState.dartsLeft - 8}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-12 flex z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-red-600' : 'bg-white'} rounded-b-xl shadow-lg`}></div>
        ))}
      </div>

      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair bg-gradient-to-b from-[#1e1b4b] to-[#0f172a]" onClick={(e) => throwDart(e.clientX, e.clientY)} />

      <EMAAnnouncer message={commentary} isVisible={isAnnouncerVisible} />
      <AuntieCharacter message={auntieMessage} isVisible={isAuntieVisible} />

      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-amber-950 border-8 border-amber-600 p-10 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(251,191,36,0.3)]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-amber-900 mx-auto mb-6 shadow-2xl border-4 border-amber-600">
              <i className="fas fa-hat-cowboy text-5xl"></i>
            </div>
            <h2 className="text-6xl font-black text-white mb-2 tracking-tighter italic">FINISH!</h2>
            <button onClick={() => {
                setGameState({ score: 0, dartsLeft: INITIAL_DARTS, level: 1, balloons: generateBalloons(1), isGameOver: false, streak: 0 });
                showCommentaries('level_up', { score: 0, level: 1 });
              }} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl transform transition active:scale-95 uppercase tracking-wider text-2xl border-b-8 border-red-800"
            >
              Buy Tokens
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
