"use client";

import { useEffect, useRef, useState } from "react";

type GameStatus = "READY" | "RUNNING" | "GAME_OVER";

type Runner = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  onGround: boolean;
};

type Obstacle = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Coin = {
  id: number;
  x: number;
  y: number;
  radius: number;
};

const BASE_SPEED = 220;
const BASE_ACCELERATION = 18;
const GRAVITY = 1600;
const JUMP_STRENGTH = 620;
const OBSTACLE_GAP = 1.4;
const COIN_GAP = 1.1;

const createRunner = (groundY: number): Runner => ({
  x: 90,
  y: groundY - 60,
  width: 44,
  height: 60,
  velocityY: 0,
  onGround: true
});

export default function RunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [status, setStatus] = useState<GameStatus>("READY");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [highScore, setHighScore] = useState(0);

  const gameRef = useRef({
    status: "READY" as GameStatus,
    runner: createRunner(0),
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    score: 0,
    coinCount: 0,
    speed: BASE_SPEED,
    acceleration: BASE_ACCELERATION,
    distance: 0,
    lastObstacle: 0,
    lastCoin: 0,
    lastTime: 0,
    lastUiSync: 0,
    obstacleId: 0,
    coinId: 0,
    groundY: 0,
    canvasWidth: 0,
    canvasHeight: 0
  });

  const syncUi = (time: number) => {
    if (time - gameRef.current.lastUiSync < 120) {
      return;
    }
    gameRef.current.lastUiSync = time;
    setScore(Math.floor(gameRef.current.score));
    setCoins(gameRef.current.coinCount);
    setSpeed(Math.floor(gameRef.current.speed));
  };

  const resetGame = () => {
    const groundY = gameRef.current.canvasHeight - 64;
    gameRef.current = {
      ...gameRef.current,
      status: "READY",
      runner: createRunner(groundY),
      obstacles: [],
      coins: [],
      score: 0,
      coinCount: 0,
      speed: BASE_SPEED,
      acceleration: BASE_ACCELERATION,
      distance: 0,
      lastObstacle: 0,
      lastCoin: 0,
      lastTime: 0,
      lastUiSync: 0,
      obstacleId: 0,
      coinId: 0,
      groundY
    };
    setStatus("READY");
    setScore(0);
    setCoins(0);
    setSpeed(BASE_SPEED);
  };

  const startGame = () => {
    gameRef.current.status = "RUNNING";
    setStatus("RUNNING");
  };

  const gameOver = () => {
    gameRef.current.status = "GAME_OVER";
    setStatus("GAME_OVER");
    const finalScore = Math.floor(gameRef.current.score);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      window.localStorage.setItem("runner-high-score", String(finalScore));
    }
  };

  const jump = () => {
    const runner = gameRef.current.runner;
    if (!runner.onGround) {
      return;
    }
    runner.velocityY = -JUMP_STRENGTH;
    runner.onGround = false;
  };

  const handleInput = () => {
    if (gameRef.current.status === "READY") {
      startGame();
      jump();
      return;
    }
    if (gameRef.current.status === "GAME_OVER") {
      resetGame();
      return;
    }
    if (gameRef.current.status === "RUNNING") {
      jump();
    }
  };

  const spawnObstacle = () => {
    const { canvasWidth, groundY } = gameRef.current;
    const height = 40 + Math.random() * 30;
    const width = 28 + Math.random() * 28;
    gameRef.current.obstacles.push({
      id: gameRef.current.obstacleId++,
      x: canvasWidth + 40,
      y: groundY - height,
      width,
      height
    });
  };

  const spawnCoin = () => {
    const { canvasWidth, groundY } = gameRef.current;
    const radius = 10 + Math.random() * 6;
    const heightOffset = 120 + Math.random() * 80;
    gameRef.current.coins.push({
      id: gameRef.current.coinId++,
      x: canvasWidth + 40,
      y: groundY - heightOffset,
      radius
    });
  };

  const updateRunner = (delta: number) => {
    const runner = gameRef.current.runner;
    runner.velocityY += GRAVITY * delta;
    runner.y += runner.velocityY * delta;
    if (runner.y + runner.height >= gameRef.current.groundY) {
      runner.y = gameRef.current.groundY - runner.height;
      runner.velocityY = 0;
      runner.onGround = true;
    }
  };

  const rectsIntersect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  const updateWorld = (delta: number, time: number) => {
    const game = gameRef.current;
    game.speed += game.acceleration * delta;
    game.distance += game.speed * delta;
    game.score = game.distance / 12 + game.coinCount * 50;

    updateRunner(delta);

    const obstacleInterval = Math.max(0.7, OBSTACLE_GAP - game.speed / 900);
    if (time - game.lastObstacle > obstacleInterval) {
      spawnObstacle();
      game.lastObstacle = time;
    }

    const coinInterval = Math.max(0.8, COIN_GAP - game.speed / 1000);
    if (time - game.lastCoin > coinInterval) {
      spawnCoin();
      game.lastCoin = time;
    }

    game.obstacles = game.obstacles
      .map((obstacle) => ({
        ...obstacle,
        x: obstacle.x - game.speed * delta
      }))
      .filter((obstacle) => obstacle.x + obstacle.width > -40);

    game.coins = game.coins
      .map((coin) => ({
        ...coin,
        x: coin.x - game.speed * delta
      }))
      .filter((coin) => coin.x + coin.radius > -40);

    const runnerRect = {
      x: game.runner.x,
      y: game.runner.y,
      width: game.runner.width,
      height: game.runner.height
    };

    for (const obstacle of game.obstacles) {
      if (rectsIntersect(runnerRect, obstacle)) {
        gameOver();
        return;
      }
    }

    game.coins = game.coins.filter((coin) => {
      const coinRect = {
        x: coin.x - coin.radius,
        y: coin.y - coin.radius,
        width: coin.radius * 2,
        height: coin.radius * 2
      };
      if (rectsIntersect(runnerRect, coinRect)) {
        game.coinCount += 1;
        return false;
      }
      return true;
    });

    syncUi(time);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const game = gameRef.current;
    context.clearRect(0, 0, game.canvasWidth, game.canvasHeight);

    context.fillStyle = "#111827";
    context.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

    context.fillStyle = "#1f2937";
    context.fillRect(0, game.groundY, game.canvasWidth, game.canvasHeight - game.groundY);

    context.fillStyle = "#fbbf24";
    context.fillRect(game.runner.x, game.runner.y, game.runner.width, game.runner.height);

    context.fillStyle = "#ef4444";
    game.obstacles.forEach((obstacle) => {
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    context.fillStyle = "#22c55e";
    game.coins.forEach((coin) => {
      context.beginPath();
      context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      context.fill();
    });

    context.fillStyle = "rgba(255,255,255,0.12)";
    context.fillRect(0, game.groundY - 12, game.canvasWidth, 2);
  };

  const loop = (timestamp: number) => {
    if (!gameRef.current.lastTime) {
      gameRef.current.lastTime = timestamp;
    }
    const delta = Math.min(0.05, (timestamp - gameRef.current.lastTime) / 1000);
    gameRef.current.lastTime = timestamp;

    if (gameRef.current.status === "RUNNING") {
      updateWorld(delta, timestamp / 1000);
    }
    draw();

    animationRef.current = requestAnimationFrame(loop);
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const targetWidth = Math.max(320, rect.width);
    const targetHeight = Math.min(rect.height, targetWidth * (16 / 9));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    const context = canvas.getContext("2d");
    if (context) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    gameRef.current.canvasWidth = targetWidth;
    gameRef.current.canvasHeight = targetHeight;
    gameRef.current.groundY = targetHeight - 64;
    if (gameRef.current.status === "READY") {
      gameRef.current.runner = createRunner(gameRef.current.groundY);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("runner-high-score");
    if (stored) {
      const value = Number(stored);
      if (!Number.isNaN(value)) {
        setHighScore(value);
      }
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    resizeObserverRef.current = new ResizeObserver(() => {
      setupCanvas();
    });
    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleInput();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <section className="game-section">
      <div className="hud">
        <div>
          <span className="hud-label">점수</span>
          <strong className="hud-value">{score}</strong>
        </div>
        <div>
          <span className="hud-label">속도</span>
          <strong className="hud-value">{speed}</strong>
        </div>
        <div>
          <span className="hud-label">코인</span>
          <strong className="hud-value">{coins}</strong>
        </div>
        <div>
          <span className="hud-label">하이스코어</span>
          <strong className="hud-value">{highScore}</strong>
        </div>
      </div>
      <div
        className="canvas-wrapper"
        ref={containerRef}
        onPointerDown={() => handleInput()}
      >
        <canvas ref={canvasRef} className="game-canvas" />
        <div className="overlay">
          {status === "READY" && (
            <div className="overlay-card">
              <h2>READY</h2>
              <p>터치 또는 스페이스로 점프하며 시작합니다.</p>
            </div>
          )}
          {status === "GAME_OVER" && (
            <div className="overlay-card">
              <h2>GAME OVER</h2>
              <p>터치 또는 버튼으로 다시 시작하세요.</p>
              <button className="primary-button" onClick={() => resetGame()}>
                다시 시작
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="tips">
        <span>입력: 화면 터치 또는 스페이스 키</span>
        <span>장애물 회피 + 코인 수집으로 점수를 올리세요.</span>
      </div>
    </section>
  );
}
