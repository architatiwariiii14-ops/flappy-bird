import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Eye,
  Code,
  Trophy,
  Moon,
  Sun,
  Sunset,
  Sparkles,
  Download,
  Copy,
  Check,
  X
} from 'lucide-react';
import { GameState, TimeOfDay, BirdSkin, Pipe, Cloud, Particle } from '../game/types';
import { soundEngine } from '../game/audio';
import { STANDALONE_FLAPPY_HTML } from '../game/standaloneHtml';

export const FlappyBirdGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // React State for HUD & Custom Settings
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState<number>(0);
  const [sessionHighScore, setSessionHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('flappy_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [progressiveSpeed, setProgressiveSpeed] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [birdSkin, setBirdSkin] = useState<BirdSkin>('classic');
  const [showHitboxes, setShowHitboxes] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState<number>(2.2);

  // References to keep game loop synchronized without stale closures
  const stateRef = useRef({
    gameState: 'START' as GameState,
    score: 0,
    sessionHighScore: 0,
    soundEnabled: true,
    progressiveSpeed: true,
    timeOfDay: 'day' as TimeOfDay,
    birdSkin: 'classic' as BirdSkin,
    showHitboxes: false,
    frames: 0,
    speed: 2.2,
    shake: 0,
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.soundEnabled = soundEnabled;
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    stateRef.current.progressiveSpeed = progressiveSpeed;
  }, [progressiveSpeed]);

  useEffect(() => {
    stateRef.current.timeOfDay = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    stateRef.current.birdSkin = birdSkin;
  }, [birdSkin]);

  useEffect(() => {
    stateRef.current.showHitboxes = showHitboxes;
  }, [showHitboxes]);

  useEffect(() => {
    stateRef.current.sessionHighScore = sessionHighScore;
  }, [sessionHighScore]);

  // Main Canvas & Game Physics
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GROUND_HEIGHT = 85;
  const PIPE_WIDTH = 58;
  const PIPE_GAP = 142; // Generous safe gap for bird navigation

  // Game Entities Refs
  const birdRef = useRef({
    x: 95,
    y: 260,
    radius: 14,
    width: 28,
    height: 22,
    velocity: 0,
    gravity: 0.38,
    jumpForce: -6.8,
    rotation: 0,
    wingAngle: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const cloudsRef = useRef<Cloud[]>([
    { x: 30, y: 75, speed: 0.35, scale: 0.85, opacity: 0.75 },
    { x: 190, y: 130, speed: 0.55, scale: 1.15, opacity: 0.85 },
    { x: 320, y: 55, speed: 0.3, scale: 0.7, opacity: 0.65 },
    { x: 420, y: 105, speed: 0.45, scale: 1.0, opacity: 0.8 },
  ]);
  const particlesRef = useRef<Particle[]>([]);
  const groundOffsetRef = useRef<number>(0);

  // Trigger Feather Particles
  const spawnFeathers = (x: number, y: number, color: string, count: number = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed - 0.8,
        vy: Math.sin(angle) * speed + 0.5,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
        shape: 'feather',
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.1,
      });
    }
  };

  // Trigger Crash Explosion Particles
  const spawnCrashParticles = (x: number, y: number) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4,
        color: ['#facc15', '#f97316', '#ef4444', '#ffffff'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.03 + Math.random() * 0.02,
        shape: 'spark',
      });
    }
  };

  // Reset Game Function
  const resetGame = useCallback(() => {
    pipesRef.current = [];
    particlesRef.current = [];
    birdRef.current.x = 95;
    birdRef.current.y = 260;
    birdRef.current.velocity = 0;
    birdRef.current.rotation = 0;
    stateRef.current.frames = 0;
    stateRef.current.speed = 2.2;
    stateRef.current.shake = 0;
    stateRef.current.score = 0;
    stateRef.current.gameState = 'START';
    setScore(0);
    setCurrentSpeedDisplay(2.2);
    setGameState('START');
  }, []);

  // Flap / Jump Action
  const triggerFlap = useCallback(() => {
    const currentState = stateRef.current.gameState;

    if (currentState === 'START') {
      stateRef.current.gameState = 'PLAYING';
      setGameState('PLAYING');
      birdRef.current.velocity = birdRef.current.jumpForce;
      soundEngine.playFlap();
      spawnFeathers(birdRef.current.x, birdRef.current.y, getSkinColor(stateRef.current.birdSkin));
    } else if (currentState === 'PLAYING') {
      birdRef.current.velocity = birdRef.current.jumpForce;
      soundEngine.playFlap();
      spawnFeathers(birdRef.current.x, birdRef.current.y, getSkinColor(stateRef.current.birdSkin));
    } else if (currentState === 'GAMEOVER') {
      resetGame();
    }
  }, [resetGame]);

  // Skin Main Colors
  const getSkinColor = (skin: BirdSkin) => {
    switch (skin) {
      case 'cyber': return '#38bdf8';
      case 'phoenix': return '#ef4444';
      case 'emerald': return '#10b981';
      case 'classic':
      default: return '#facc15';
    }
  };

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerFlap();
      } else if (e.code === 'KeyR') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFlap, resetGame]);

  // Copy code handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(STANDALONE_FLAPPY_HTML);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download standalone HTML
  const handleDownloadCode = () => {
    const blob = new Blob([STANDALONE_FLAPPY_HTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flappy-bird.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Core Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const spawnPipe = () => {
      const minHeight = 65;
      const maxHeight = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minHeight;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
      const bottomY = topHeight + PIPE_GAP;
      const bottomHeight = CANVAS_HEIGHT - GROUND_HEIGHT - bottomY;

      pipesRef.current.push({
        x: CANVAS_WIDTH,
        topHeight,
        bottomY,
        bottomHeight,
        width: PIPE_WIDTH,
        passed: false,
      });
    };

    const triggerGameOver = () => {
      if (stateRef.current.gameState === 'GAMEOVER') return;
      stateRef.current.gameState = 'GAMEOVER';
      stateRef.current.shake = 14;
      setGameState('GAMEOVER');

      soundEngine.playHit();
      setTimeout(() => soundEngine.playDie(), 90);

      spawnCrashParticles(birdRef.current.x, birdRef.current.y);

      const finalScore = stateRef.current.score;
      if (finalScore > stateRef.current.sessionHighScore) {
        stateRef.current.sessionHighScore = finalScore;
        setSessionHighScore(finalScore);
        try {
          localStorage.setItem('flappy_high_score', finalScore.toString());
        } catch {}
        setTimeout(() => soundEngine.playNewHighScore(), 250);
      }
    };

    const checkCollisions = () => {
      const bird = birdRef.current;
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

      // 1. Ground collision
      if (bird.y + bird.radius >= groundY) {
        bird.y = groundY - bird.radius;
        triggerGameOver();
        return;
      }

      // 2. Ceiling collision
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        triggerGameOver();
        return;
      }

      // 3. Pipe bounding-box collisions
      const bHitLeft = bird.x - 12;
      const bHitRight = bird.x + 12;
      const bHitTop = bird.y - 10;
      const bHitBottom = bird.y + 10;

      for (let i = 0; i < pipesRef.current.length; i++) {
        const p = pipesRef.current[i];
        const pLeft = p.x;
        const pRight = p.x + PIPE_WIDTH;

        // Horizontally overlapping
        if (bHitRight > pLeft && bHitLeft < pRight) {
          // Check top pipe collision
          if (bHitTop < p.topHeight) {
            triggerGameOver();
            return;
          }
          // Check bottom pipe collision
          if (bHitBottom > p.bottomY) {
            triggerGameOver();
            return;
          }
        }
      }
    };

    // Render loop
    const render = () => {
      stateRef.current.frames++;
      const frames = stateRef.current.frames;
      const { timeOfDay, birdSkin, showHitboxes, progressiveSpeed } = stateRef.current;

      // Calculate speed
      let currentSpeed = 2.2;
      if (progressiveSpeed) {
        currentSpeed = 2.2 + Math.min(stateRef.current.score * 0.05, 1.8);
      }
      stateRef.current.speed = currentSpeed;
      if (frames % 30 === 0) {
        setCurrentSpeedDisplay(parseFloat(currentSpeed.toFixed(2)));
      }

      // Screen Shake
      ctx.save();
      if (stateRef.current.shake > 0) {
        const shakeX = (Math.random() - 0.5) * stateRef.current.shake;
        const shakeY = (Math.random() - 0.5) * stateRef.current.shake;
        ctx.translate(shakeX, shakeY);
        stateRef.current.shake *= 0.88;
        if (stateRef.current.shake < 0.2) stateRef.current.shake = 0;
      }

      // 1. SKY BACKGROUND
      drawSky(ctx, timeOfDay, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. DISTANT CITY & HILLS
      drawHorizonScenery(ctx, timeOfDay, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, frames);

      // 3. CLOUDS (Moving clouds mechanic)
      drawClouds(ctx, timeOfDay);

      // 4. PIPES
      drawPipes(ctx, currentSpeed, spawnPipe, checkCollisions);

      // 5. PARTICLES
      drawParticles(ctx);

      // 6. GROUND
      drawGround(ctx, currentSpeed);

      // 7. BIRD
      drawBird(ctx, birdSkin, frames, showHitboxes);

      // 8. HITBOX OVERLAY (Debug Mode)
      if (showHitboxes) {
        drawHitboxVisuals(ctx);
      }

      // 9. OVERLAY UI (Canvas UI according to state)
      if (stateRef.current.gameState === 'START') {
        drawStartOverlay(ctx, frames);
      } else if (stateRef.current.gameState === 'PLAYING') {
        drawInGameScore(ctx, stateRef.current.score);
      } else if (stateRef.current.gameState === 'GAMEOVER') {
        drawGameOverOverlay(ctx, stateRef.current.score, stateRef.current.sessionHighScore);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    // Helper: Draw Sky
    const drawSky = (ctx: CanvasRenderingContext2D, time: TimeOfDay, w: number, h: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h - GROUND_HEIGHT);
      if (time === 'day') {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.55, '#7dd3fc');
        grad.addColorStop(1, '#bae6fd');
      } else if (time === 'sunset') {
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.35, '#701a75');
        grad.addColorStop(0.7, '#c2410c');
        grad.addColorStop(1, '#fde047');
      } else {
        // Night
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.6, '#0f172a');
        grad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars in Night mode
      if (time === 'night') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 30; i++) {
          const starX = (i * 47) % w;
          const starY = (i * 29) % (h - GROUND_HEIGHT - 60);
          const twinkle = Math.sin(stateRef.current.frames * 0.05 + i) > 0 ? 1.5 : 0.8;
          ctx.beginPath();
          ctx.arc(starX, starY, twinkle, 0, Math.PI * 2);
          ctx.fill();
        }

        // Crescent Moon
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w - 70, 75, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(w - 78, 70, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun in Day mode
      if (time === 'day') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(w - 60, 65, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w - 60, 65, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Helper: Draw Horizon Scenery
    const drawHorizonScenery = (
      ctx: CanvasRenderingContext2D,
      time: TimeOfDay,
      w: number,
      h: number,
      gHeight: number,
      frames: number
    ) => {
      const gY = h - gHeight;

      // Distant rolling green/purple hills
      ctx.fillStyle = time === 'night' ? '#111827' : (time === 'sunset' ? '#431407' : '#86efac');
      ctx.beginPath();
      ctx.moveTo(0, gY);
      for (let x = 0; x <= w; x += 40) {
        const hillY = gY - 24 + Math.sin((x + frames * 0.15) * 0.015) * 12;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, gY);
      ctx.closePath();
      ctx.fill();

      // Skyline silhouette
      ctx.fillStyle = time === 'night' ? '#1e293b' : (time === 'sunset' ? '#581c87' : '#4ade80');
      const buildingWidth = 28;
      for (let i = 0; i < w; i += buildingWidth + 12) {
        const bHeight = 25 + ((i * 19) % 45);
        ctx.fillRect(i, gY - bHeight, buildingWidth, bHeight);
        // Little windows
        if (time === 'night') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(i + 6, gY - bHeight + 8, 4, 4);
          ctx.fillRect(i + 16, gY - bHeight + 18, 4, 4);
          ctx.fillStyle = '#1e293b';
        }
      }
    };

    // Helper: Draw Clouds
    const drawClouds = (ctx: CanvasRenderingContext2D, time: TimeOfDay) => {
      const cloudColor = time === 'night'
        ? 'rgba(51, 65, 85, 0.45)'
        : (time === 'sunset' ? 'rgba(254, 215, 170, 0.55)' : 'rgba(255, 255, 255, 0.85)');

      ctx.fillStyle = cloudColor;
      cloudsRef.current.forEach((c) => {
        if (stateRef.current.gameState === 'PLAYING') {
          c.x -= c.speed;
          if (c.x < -120) c.x = CANVAS_WIDTH + 80;
        }

        ctx.beginPath();
        ctx.arc(c.x, c.y, 16 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 18 * c.scale, c.y - 7 * c.scale, 22 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 38 * c.scale, c.y - 2 * c.scale, 18 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 54 * c.scale, c.y + 4 * c.scale, 14 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Helper: Draw Pipes
    const drawPipes = (
      ctx: CanvasRenderingContext2D,
      speed: number,
      spawnPipeFn: () => void,
      checkCollisionsFn: () => void
    ) => {
      const isPlaying = stateRef.current.gameState === 'PLAYING';

      // Pipe interval: spawns every ~100 frames (~1.6 seconds)
      if (isPlaying) {
        if (stateRef.current.frames % 108 === 0) {
          spawnPipeFn();
        }
      }

      for (let i = pipesRef.current.length - 1; i >= 0; i--) {
        const p = pipesRef.current[i];
        if (isPlaying) {
          p.x -= speed;
        }

        // Top Pipe
        renderPipeGraphic(ctx, p.x, 0, PIPE_WIDTH, p.topHeight, true);

        // Bottom Pipe
        renderPipeGraphic(ctx, p.x, p.bottomY, PIPE_WIDTH, p.bottomHeight, false);

        // Score Check
        if (isPlaying && !p.passed && p.x + PIPE_WIDTH < birdRef.current.x - birdRef.current.radius) {
          p.passed = true;
          stateRef.current.score++;
          setScore(stateRef.current.score);
          soundEngine.playScore();
        }

        // Clean offscreen
        if (p.x + PIPE_WIDTH < -30) {
          pipesRef.current.splice(i, 1);
        }
      }

      // Check collision
      if (isPlaying) {
        checkCollisionsFn();
      }
    };

    const renderPipeGraphic = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      isTop: boolean
    ) => {
      // Pipe Shaft gradient
      const shaftGrad = ctx.createLinearGradient(x, 0, x + w, 0);
      shaftGrad.addColorStop(0, '#53ba2a');
      shaftGrad.addColorStop(0.3, '#79df3f');
      shaftGrad.addColorStop(0.7, '#449e22');
      shaftGrad.addColorStop(1, '#2c6b14');

      ctx.fillStyle = shaftGrad;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#1d480d';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // Pipe Lip / Collar
      const lipHeight = 24;
      const lipOverlap = 5;
      const lipY = isTop ? y + h - lipHeight : y;

      const lipGrad = ctx.createLinearGradient(x - lipOverlap, 0, x + w + lipOverlap, 0);
      lipGrad.addColorStop(0, '#66d139');
      lipGrad.addColorStop(0.3, '#8ef14f');
      lipGrad.addColorStop(0.7, '#49a323');
      lipGrad.addColorStop(1, '#235c10');

      ctx.fillStyle = lipGrad;
      ctx.fillRect(x - lipOverlap, lipY, w + lipOverlap * 2, lipHeight);
      ctx.strokeRect(x - lipOverlap, lipY, w + lipOverlap * 2, lipHeight);
    };

    // Helper: Draw Ground
    const drawGround = (ctx: CanvasRenderingContext2D, speed: number) => {
      const gY = CANVAS_HEIGHT - GROUND_HEIGHT;

      if (stateRef.current.gameState === 'PLAYING') {
        groundOffsetRef.current = (groundOffsetRef.current + speed) % 24;
      }

      // Green grass rim
      ctx.fillStyle = '#73c330';
      ctx.fillRect(0, gY, CANVAS_WIDTH, 16);
      ctx.fillStyle = '#55991f';
      ctx.fillRect(0, gY + 13, CANVAS_WIDTH, 4);

      // Sandy soil body
      ctx.fillStyle = '#ded895';
      ctx.fillRect(0, gY + 17, CANVAS_WIDTH, GROUND_HEIGHT - 17);

      // Diagonal soil pattern
      ctx.strokeStyle = '#c5bc72';
      ctx.lineWidth = 3;
      for (let x = -groundOffsetRef.current; x < CANVAS_WIDTH + 24; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, gY + 17);
        ctx.lineTo(x - 12, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Upper boundary line
      ctx.strokeStyle = '#3e2107';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, gY);
      ctx.lineTo(CANVAS_WIDTH, gY);
      ctx.stroke();
    };

    // Helper: Draw Particles
    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'feather') {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            p.rotation += p.rotSpeed || 0;
            ctx.rotate(p.rotation);
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    // Helper: Draw Bird
    const drawBird = (
      ctx: CanvasRenderingContext2D,
      skin: BirdSkin,
      frames: number,
      _showHitbox: boolean
    ) => {
      const bird = birdRef.current;

      // Physics update if playing
      if (stateRef.current.gameState === 'PLAYING') {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Velocity tilt
        if (bird.velocity < 0) {
          bird.rotation = -0.38;
        } else {
          bird.rotation = Math.min(Math.PI / 2, bird.rotation + 0.055);
        }
      } else if (stateRef.current.gameState === 'START') {
        // Idle gentle hover bobbing
        bird.y = 250 + Math.sin(frames * 0.08) * 8;
        bird.rotation = 0;
      }

      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Skin palettes
      let bodyColor = '#facc15';
      let strokeColor = '#854d0e';
      let bellyColor = '#fef08a';
      let wingColor = '#ffffff';

      if (skin === 'cyber') {
        bodyColor = '#06b6d4';
        strokeColor = '#083344';
        bellyColor = '#67e8f9';
        wingColor = '#e0f2fe';
      } else if (skin === 'phoenix') {
        bodyColor = '#f97316';
        strokeColor = '#7c2d12';
        bellyColor = '#fed7aa';
        wingColor = '#ef4444';
      } else if (skin === 'emerald') {
        bodyColor = '#10b981';
        strokeColor = '#064e3b';
        bellyColor = '#a7f3d0';
        wingColor = '#34d399';
      }

      // Bird Main Body (Egg-like oval)
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Belly Highlight
      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(-2, 3, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Large Cartoon Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -5, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Pupil with catchlight
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, -6, 1, 0, Math.PI * 2);
      ctx.fill();

      // Orange Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(11, -2);
      ctx.lineTo(21, 2);
      ctx.lineTo(11, 7);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#7c2d12';
      ctx.stroke();

      // Flapping Wing
      const wingY = Math.sin(frames * 0.28) * 4;
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.ellipse(-6, wingY, 8, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw Hitboxes (Debug training mode)
    const drawHitboxVisuals = (ctx: CanvasRenderingContext2D) => {
      const bird = birdRef.current;
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(bird.x - 12, bird.y - 10, 24, 20);

      // Pipes hitboxes
      ctx.strokeStyle = '#3b82f6';
      pipesRef.current.forEach((p) => {
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.strokeRect(p.x, p.bottomY, PIPE_WIDTH, p.bottomHeight);
      });
      ctx.restore();
    };

    // Helper: Start Screen Overlay
    const drawStartOverlay = (ctx: CanvasRenderingContext2D, frames: number) => {
      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Press Start 2P", system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText('FLAPPY BIRD', CANVAS_WIDTH / 2, 160);

      // Subtitle Instructions
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 145, 320, 290, 100, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const pulse = 1 + Math.sin(frames * 0.1) * 0.05;
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, 355);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP OR PRESS SPACE', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Fly through pipes without crashing', CANVAS_WIDTH / 2, 385);
      ctx.fillText('Controls: Space · Left Click · Tap', CANVAS_WIDTH / 2, 403);

      ctx.restore();
    };

    // Helper: In-Game Running Score
    const drawInGameScore = (ctx: CanvasRenderingContext2D, currentScore: number) => {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.strokeText(currentScore.toString(), CANVAS_WIDTH / 2, 75);
      ctx.fillText(currentScore.toString(), CANVAS_WIDTH / 2, 75);
      ctx.restore();
    };

    // Helper: Game Over Overlay
    const drawGameOverOverlay = (
      ctx: CanvasRenderingContext2D,
      finalScore: number,
      bestScore: number
    ) => {
      ctx.save();

      // Backdrop Darken
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.textAlign = 'center';

      // "GAME OVER" Text
      ctx.font = 'bold 36px "Press Start 2P", system-ui, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText('GAME OVER', CANVAS_WIDTH / 2, 160);
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 160);

      // Scoreboard Plate
      const cardX = CANVAS_WIDTH / 2 - 145;
      const cardY = 205;
      const cardW = 290;
      const cardH = 175;

      ctx.fillStyle = '#e2d99c';
      ctx.strokeStyle = '#544710';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();

      // Inner highlight line
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12);

      // Score Text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9a3412';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SCORE', cardX + 130, cardY + 52);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 30px "Plus Jakarta Sans", tabular-nums, sans-serif';
      ctx.fillText(finalScore.toString(), cardX + cardW - 35, cardY + 56);

      // Best Score Text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9a3412';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('BEST SCORE', cardX + 130, cardY + 115);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 30px "Plus Jakarta Sans", tabular-nums, sans-serif';
      ctx.fillText(bestScore.toString(), cardX + cardW - 35, cardY + 120);

      // Medal Container
      ctx.fillStyle = '#ca8a04';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MEDAL', cardX + 65, cardY + 45);

      // Medal Circle
      const medalRadius = 24;
      let medalColor = '#71717a';
      let medalLabel = '-';
      if (finalScore >= 50) {
        medalColor = '#38bdf8'; // Platinum
        medalLabel = 'PLAT';
      } else if (finalScore >= 35) {
        medalColor = '#eab308'; // Gold
        medalLabel = 'GOLD';
      } else if (finalScore >= 20) {
        medalColor = '#94a3b8'; // Silver
        medalLabel = 'SILVER';
      } else if (finalScore >= 10) {
        medalColor = '#c2410c'; // Bronze
        medalLabel = 'BRONZE';
      }

      ctx.fillStyle = medalColor;
      ctx.beginPath();
      ctx.arc(cardX + 65, cardY + 95, medalRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (medalLabel !== '-') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Press Start 2P", sans-serif';
        ctx.fillText(medalLabel, cardX + 65, cardY + 99);
      }

      // New High Score Ribbon
      if (finalScore >= bestScore && finalScore > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cardX + cardW - 75, cardY + 75, 48, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEW!', cardX + cardW - 51, cardY + 88);
      }

      // Restart Button
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 95, 410, 190, 48, 8);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PLAY AGAIN', CANVAS_WIDTH / 2, 440);

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Game Stage Area */}
      <div className="relative flex flex-col items-center">
        {/* HUD Top Bar above canvas */}
        <div className="w-full max-w-[400px] flex items-center justify-between pb-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Best: <strong className="text-zinc-100 font-mono tabular-nums">{sessionHighScore}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            {progressiveSpeed && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{currentSpeedDisplay}x</span>
              </div>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
              className="p-1.5 hover:text-zinc-100 transition-colors rounded hover:bg-zinc-800"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-300" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
          </div>
        </div>

        {/* Canvas Frame */}
        <div
          ref={containerRef}
          onClick={triggerFlap}
          onTouchStart={(e) => {
            e.preventDefault();
            triggerFlap();
          }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-800 bg-zinc-900 cursor-pointer select-none touch-none transition-transform active:scale-[0.99]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />
        </div>

        {/* Controls and Custom Mechanics Bar */}
        <div className="w-full max-w-[400px] mt-4 flex flex-col gap-3">
          {/* Quick Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Game
            </button>

            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              View Raw HTML
            </button>
          </div>

          {/* Custom Mechanics Panel */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400 font-medium">
              <span>Game Settings & Mechanics</span>
              <span className="text-[11px] text-zinc-500">Instant update</span>
            </div>

            {/* Time of Day Cycle */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Sky Atmosphere:</span>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setTimeOfDay('day')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    timeOfDay === 'day' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  Day
                </button>
                <button
                  onClick={() => setTimeOfDay('sunset')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    timeOfDay === 'sunset' ? 'bg-zinc-800 text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sunset className="w-3 h-3" />
                  Sunset
                </button>
                <button
                  onClick={() => setTimeOfDay('night')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    timeOfDay === 'night' ? 'bg-zinc-800 text-blue-300' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  Night
                </button>
              </div>
            </div>

            {/* Bird Skins */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Bird Skin:</span>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {(['classic', 'cyber', 'phoenix', 'emerald'] as BirdSkin[]).map((skin) => (
                  <button
                    key={skin}
                    onClick={() => setBirdSkin(skin)}
                    className={`px-2 py-1 rounded text-[11px] capitalize font-medium transition-colors ${
                      birdSkin === skin ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {skin}
                  </button>
                ))}
              </div>
            </div>

            {/* Progressive Speed Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <div className="flex flex-col">
                <span className="text-zinc-300">Progressive Speed</span>
                <span className="text-[10px] text-zinc-500">Increases velocity as score rises</span>
              </div>
              <button
                onClick={() => setProgressiveSpeed(!progressiveSpeed)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  progressiveSpeed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {progressiveSpeed ? 'Enabled' : 'Fixed Speed'}
              </button>
            </div>

            {/* Hitbox Debug Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <div className="flex flex-col">
                <span className="text-zinc-300">Show Collision Hitboxes</span>
                <span className="text-[10px] text-zinc-500">Inspect bounding-box detection boundaries</span>
              </div>
              <button
                onClick={() => setShowHitboxes(!showHitboxes)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  showHitboxes ? 'bg-red-950 text-red-300 border border-red-800/80' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <Eye className="w-3 h-3" />
                {showHitboxes ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Standalone Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-zinc-100">Standalone Single-File index.html</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HTML
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 overflow-auto flex-1 font-mono text-xs text-zinc-300 leading-relaxed">
              <pre className="whitespace-pre">
                <code>{STANDALONE_FLAPPY_HTML}</code>
              </pre>
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Save as <strong className="text-zinc-200">index.html</strong> and double-click to run in any browser with zero dependencies.</span>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
