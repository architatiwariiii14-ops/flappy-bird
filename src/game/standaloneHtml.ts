export const STANDALONE_FLAPPY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Flappy Bird Clone</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
    }
    body {
      background-color: #121216;
      color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      border-radius: 12px;
      overflow: hidden;
      border: 3px solid #27272a;
    }
    canvas {
      display: block;
      background-color: #4ec0ca;
      cursor: pointer;
    }
    .hint {
      margin-top: 14px;
      font-size: 13px;
      color: #a1a1aa;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

  <div id="game-container">
    <canvas id="gameCanvas" width="400" height="600"></canvas>
  </div>
  <div class="hint">Press Spacebar, Left Click, or Tap to Fly</div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Web Audio Synthesizer (Zero external audio files)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function playTone(freq, duration, type = 'sine', sweepTo = null) {
      if (!audioCtx) {
        audioCtx = new AudioCtx();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const now = audioCtx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (sweepTo) {
          osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
        }
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    }

    const sound = {
      flap: () => playTone(350, 0.08, 'triangle', 750),
      score: () => {
        playTone(987, 0.12, 'sine');
        setTimeout(() => playTone(1318, 0.18, 'sine'), 60);
      },
      hit: () => playTone(220, 0.2, 'sawtooth', 40),
      die: () => playTone(300, 0.35, 'square', 60)
    };

    // Game Variables
    let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
    let score = 0;
    let highScore = 0;
    let frames = 0;
    const groundHeight = 85;

    // Bird Object
    const bird = {
      x: 80,
      y: 250,
      radius: 14,
      width: 30,
      height: 24,
      velocity: 0,
      gravity: 0.38,
      jumpForce: -6.8,
      rotation: 0,
      reset: function() {
        this.x = 80;
        this.y = 250;
        this.velocity = 0;
        this.rotation = 0;
      },
      flap: function() {
        this.velocity = this.jumpForce;
        sound.flap();
      },
      update: function() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Smooth rotation based on velocity
        if (this.velocity < 0) {
          this.rotation = -0.35;
        } else {
          this.rotation = Math.min(Math.PI / 2, this.rotation + 0.06);
        }
      },
      draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Bird Body (Yellow oval)
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#854d0e';
        ctx.stroke();

        // Belly highlight
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(-2, 2, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak (Orange polygon)
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(21, 2);
        ctx.lineTo(10, 7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Wing
        const wingY = Math.sin(frames * 0.25) * 3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-6, wingY, 8, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }
    };

    // Moving Clouds (Background custom mechanic)
    const clouds = [
      { x: 30, y: 70, speed: 0.4, scale: 0.9 },
      { x: 220, y: 120, speed: 0.6, scale: 1.2 },
      { x: 340, y: 60, speed: 0.35, scale: 0.8 }
    ];

    function updateAndDrawClouds() {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -100) c.x = canvas.width + 50;

        ctx.beginPath();
        ctx.arc(c.x, c.y, 16 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 18 * c.scale, c.y - 6 * c.scale, 20 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 36 * c.scale, c.y, 15 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Pipes Manager
    const pipes = [];
    const pipeWidth = 58;
    const pipeGap = 142; // Always large enough for bird
    let baseSpeed = 2.2;

    function spawnPipe() {
      // Minimum pipe height 60px from top and ground
      const minHeight = 60;
      const maxHeight = canvas.height - groundHeight - pipeGap - minHeight;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
      const bottomY = topHeight + pipeGap;
      const bottomHeight = canvas.height - groundHeight - bottomY;

      pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: bottomY,
        bottomHeight: bottomHeight,
        passed: false
      });
    }

    function updateAndDrawPipes() {
      // Dynamic Speed over time/score mechanic
      const currentSpeed = baseSpeed + Math.min(score * 0.04, 1.4);

      if (gameState === 'PLAYING') {
        if (frames % 105 === 0) {
          spawnPipe();
        }
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        if (gameState === 'PLAYING') {
          p.x -= currentSpeed;
        }

        // Draw Top Pipe
        drawPipeSegment(p.x, 0, pipeWidth, p.topHeight, true);

        // Draw Bottom Pipe
        drawPipeSegment(p.x, p.bottomY, pipeWidth, p.bottomHeight, false);

        // Check Score Passing
        if (gameState === 'PLAYING' && !p.passed && p.x + pipeWidth < bird.x - bird.radius) {
          p.passed = true;
          score++;
          sound.score();
        }

        // Remove offscreen
        if (p.x + pipeWidth < -20) {
          pipes.splice(i, 1);
        }
      }
    }

    function drawPipeSegment(x, y, w, h, isTop) {
      // Pipe Body
      const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
      gradient.addColorStop(0, '#53ba2a');
      gradient.addColorStop(0.35, '#75d63b');
      gradient.addColorStop(0.7, '#439922');
      gradient.addColorStop(1, '#2c6b14');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#1d480d';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // Pipe Collar / Lip
      const lipHeight = 24;
      const lipOverlap = 4;
      const lipY = isTop ? y + h - lipHeight : y;

      const lipGradient = ctx.createLinearGradient(x - lipOverlap, 0, x + w + lipOverlap, 0);
      lipGradient.addColorStop(0, '#65cb3a');
      lipGradient.addColorStop(0.35, '#86e44b');
      lipGradient.addColorStop(0.7, '#489e24');
      lipGradient.addColorStop(1, '#23580f');

      ctx.fillStyle = lipGradient;
      ctx.fillRect(x - lipOverlap, lipY, w + lipOverlap * 2, lipHeight);
      ctx.strokeRect(x - lipOverlap, lipY, w + lipOverlap * 2, lipHeight);
    }

    // Moving Ground
    let groundOffset = 0;
    function drawGround() {
      const gY = canvas.height - groundHeight;
      if (gameState === 'PLAYING') {
        groundOffset = (groundOffset + 2.5) % 24;
      }

      // Upper grass strip
      ctx.fillStyle = '#73c330';
      ctx.fillRect(0, gY, canvas.width, 16);
      ctx.fillStyle = '#55991f';
      ctx.fillRect(0, gY + 14, canvas.width, 3);

      // Dirt body
      ctx.fillStyle = '#ded895';
      ctx.fillRect(0, gY + 17, canvas.width, groundHeight - 17);

      // Ground pattern lines
      ctx.strokeStyle = '#c6bc73';
      ctx.lineWidth = 3;
      for (let x = -groundOffset; x < canvas.width + 24; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, gY + 17);
        ctx.lineTo(x - 12, canvas.height);
        ctx.stroke();
      }

      // Border line
      ctx.strokeStyle = '#41220a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, gY);
      ctx.lineTo(canvas.width, gY);
      ctx.stroke();
    }

    // Precise Bounding Box Collision
    function checkCollisions() {
      const gY = canvas.height - groundHeight;

      // 1. Ground collision
      if (bird.y + bird.radius >= gY) {
        bird.y = gY - bird.radius;
        triggerGameOver();
        return;
      }

      // 2. Ceiling collision
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        triggerGameOver();
        return;
      }

      // 3. Pipe collisions (bounding box with bird's hit dimensions)
      const birdLeft = bird.x - 13;
      const birdRight = bird.x + 13;
      const birdTop = bird.y - 11;
      const birdBottom = bird.y + 11;

      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        const pipeLeft = p.x;
        const pipeRight = p.x + pipeWidth;

        // Check if bird is horizontally aligned with pipe
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          // Top pipe collision
          if (birdTop < p.topHeight) {
            triggerGameOver();
            return;
          }
          // Bottom pipe collision
          if (birdBottom > p.bottomY) {
            triggerGameOver();
            return;
          }
        }
      }
    }

    function triggerGameOver() {
      if (gameState === 'GAMEOVER') return;
      gameState = 'GAMEOVER';
      sound.hit();
      setTimeout(sound.die, 80);
      if (score > highScore) {
        highScore = score;
      }
    }

    function handleAction() {
      if (gameState === 'START') {
        gameState = 'PLAYING';
        bird.flap();
      } else if (gameState === 'PLAYING') {
        bird.flap();
      } else if (gameState === 'GAMEOVER') {
        // Instant Restart
        pipes.length = 0;
        score = 0;
        frames = 0;
        bird.reset();
        gameState = 'START';
      }
    }

    // Input Listeners
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleAction();
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleAction();
    }, { passive: false });

    // UI Rendering
    function drawStartScreen() {
      // Flappy Bird Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText('FLAPPY BIRD', canvas.width / 2, 170);

      // Flap Guide Card
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 130, 290, 260, 95, 12);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('TAP OR PRESS SPACE', canvas.width / 2, 330);

      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.fillText('To Flap & Fly Through Pipes', canvas.width / 2, 355);

      // Floating gentle hover for bird on start screen
      bird.y = 240 + Math.sin(frames * 0.08) * 8;
    }

    function drawScore() {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(score, canvas.width / 2, 70);
      ctx.fillText(score, canvas.width / 2, 70);
      ctx.restore();
    }

    function drawGameOverScreen() {
      ctx.save();
      // Scrim
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Game Over Banner
      ctx.textAlign = 'center';
      ctx.font = 'bold 38px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText('GAME OVER', canvas.width / 2, 160);
      ctx.fillText('GAME OVER', canvas.width / 2, 160);

      // Scoreboard Card
      const cardX = canvas.width / 2 - 140;
      const cardY = 200;
      const cardW = 280;
      const cardH = 175;

      ctx.fillStyle = '#e2d99c';
      ctx.strokeStyle = '#5c4e14';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();

      // Score breakdown
      ctx.textAlign = 'left';
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('SCORE', cardX + 30, cardY + 45);

      ctx.textAlign = 'right';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#1c1917';
      ctx.fillText(score, cardX + cardW - 30, cardY + 50);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('BEST SCORE', cardX + 30, cardY + 115);

      ctx.textAlign = 'right';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#1c1917';
      ctx.fillText(highScore, cardX + cardW - 30, cardY + 120);

      // Medal if score >= 10
      if (score >= 10) {
        ctx.fillStyle = score >= 30 ? '#eab308' : (score >= 20 ? '#cbd5e1' : '#cd7f32');
        ctx.beginPath();
        ctx.arc(cardX + 60, cardY + 145, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Restart prompt button
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 95, 410, 190, 48, 8);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PLAY AGAIN', canvas.width / 2, 440);

      ctx.restore();
    }

    // Main Game Loop
    function gameLoop() {
      frames++;

      // 1. Sky Background
      ctx.fillStyle = '#4ec0ca';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Clouds (Moving clouds mechanic)
      updateAndDrawClouds();

      // 3. Pipes
      updateAndDrawPipes();

      // 4. Ground
      drawGround();

      // 5. Bird Logic & Render
      if (gameState === 'PLAYING') {
        bird.update();
        checkCollisions();
      }
      bird.draw();

      // 6. UI Overlays
      if (gameState === 'START') {
        drawStartScreen();
      } else if (gameState === 'PLAYING') {
        drawScore();
      } else if (gameState === 'GAMEOVER') {
        drawGameOverScreen();
      }

      requestAnimationFrame(gameLoop);
    }

    // Start loop
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>`;
