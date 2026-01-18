"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "READY" | "RUNNING" | "GAME_OVER";

type HudState = {
  score: number;
  coins: number;
  speed: number;
  highScore: number;
};

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Coin = {
  x: number;
  y: number;
  radius: number;
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 96;
const PLAYER_SIZE = { width: 40, height: 48 };
const GRAVITY = 2200;
const JUMP_VELOCITY = -820;
const BASE_SPEED = 240;
const SPEED_ACCELERATION = 12;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function RunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>("READY");
  const pausedRef = useRef(false);

  const [status, setStatus] = useState<GameStatus>("READY");
  const [hud, setHud] = useState<HudState>({
    score: 0,
    coins: 0,
    speed: 0,
    highScore: 0,
  });

  const playerRef = useRef({
    x: 72,
    y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE.height,
    velocityY: 0,
    grounded: true,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const distanceRef = useRef(0);
  const elapsedRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const coinTimerRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const highScoreRef = useRef(0);

  const updateStatus = useCallback((next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const updateHighScore = useCallback((score: number) => {
    if (score > highScoreRef.current) {
      highScoreRef.current = score;
      setHud((prev) => ({ ...prev, highScore: score }));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("runner_high_score", String(score));
      }
    }
  }, []);

  const resetGameState = useCallback(() => {
    playerRef.current = {
      x: 72,
      y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE.height,
      velocityY: 0,
      grounded: true,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    distanceRef.current = 0;
    elapsedRef.current = 0;
    obstacleTimerRef.current = 0;
    coinTimerRef.current = 0;
    speedRef.current = BASE_SPEED;
    lastTimeRef.current = null;
    setHud((prev) => ({
      ...prev,
      score: 0,
      coins: 0,
      speed: BASE_SPEED,
    }));
  }, []);

  const spawnObstacle = useCallback(() => {
    const height = clamp(40 + Math.random() * 40, 40, 90);
    const width = clamp(30 + Math.random() * 30, 30, 80);
    obstaclesRef.current.push({
      x: GAME_WIDTH + 20,
      y: GAME_HEIGHT - GROUND_HEIGHT - height,
      width,
      height,
    });
  }, []);

  const spawnCoin = useCallback(() => {
    coinsRef.current.push({
      x: GAME_WIDTH + 20,
      y: GAME_HEIGHT - GROUND_HEIGHT - 120 - Math.random() * 120,
      radius: 10,
    });
  }, []);

  const detectCollision = useCallback(() => {
    const player = playerRef.current;
    const playerBox = {
      x: player.x,
      y: player.y,
      width: PLAYER_SIZE.width,
      height: PLAYER_SIZE.height,
    };

    for (const obstacle of obstaclesRef.current) {
      const hit =
        playerBox.x < obstacle.x + obstacle.width &&
        playerBox.x + playerBox.width > obstacle.x &&
        playerBox.y < obstacle.y + obstacle.height &&
        playerBox.y + playerBox.height > obstacle.y;
      if (hit) return true;
    }

    return false;
  }, []);

  const collectCoins = useCallback(() => {
    const player = playerRef.current;
    const playerBox = {
      x: player.x,
      y: player.y,
      width: PLAYER_SIZE.width,
      height: PLAYER_SIZE.height,
    };

    const remaining: Coin[] = [];
    let collected = 0;
    for (const coin of coinsRef.current) {
      const hit =
        playerBox.x < coin.x + coin.radius * 2 &&
        playerBox.x + playerBox.width > coin.x &&
        playerBox.y < coin.y + coin.radius * 2 &&
        playerBox.y + playerBox.height > coin.y;
      if (hit) {
        collected += 1;
      } else {
        remaining.push(coin);
      }
    }
    coinsRef.current = remaining;
    if (collected > 0) {
      setHud((prev) => ({
        ...prev,
        coins: prev.coins + collected,
        score: prev.score + collected * 50,
      }));
    }
  }, []);

  const jump = useCallback(() => {
    const player = playerRef.current;
    if (!player.grounded) return;
    player.velocityY = JUMP_VELOCITY;
    player.grounded = false;
  }, []);

  const stopLoop = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const gameOver = useCallback(() => {
    stopLoop();
    updateStatus("GAME_OVER");
    updateHighScore(hud.score);
  }, [hud.score, stopLoop, updateHighScore, updateStatus]);

  const updateHud = useCallback((speed: number) => {
    setHud((prev) => ({
      ...prev,
      score: Math.max(prev.score, Math.floor(distanceRef.current / 8)),
      speed: Math.floor(speed),
    }));
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    context.fillStyle = "#0ea5e9";
    context.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

    context.fillStyle = "#94a3b8";
    for (let i = 0; i < GAME_WIDTH; i += 40) {
      context.fillRect(
        i - (distanceRef.current % 40),
        GAME_HEIGHT - GROUND_HEIGHT + 32,
        20,
        6
      );
    }

    context.fillStyle = "#fbbf24";
    for (const coin of coinsRef.current) {
      context.beginPath();
      context.arc(coin.x + coin.radius, coin.y + coin.radius, coin.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "#f97316";
    for (const obstacle of obstaclesRef.current) {
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    const player = playerRef.current;
    context.fillStyle = "#22d3ee";
    context.fillRect(player.x, player.y, PLAYER_SIZE.width, PLAYER_SIZE.height);
  }, []);

  const tick = useCallback(
    (time: number) => {
      if (statusRef.current !== "RUNNING") return;
      if (pausedRef.current) return;

      const lastTime = lastTimeRef.current ?? time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTimeRef.current = time;

      elapsedRef.current += delta;
      speedRef.current = BASE_SPEED + elapsedRef.current * SPEED_ACCELERATION;
      distanceRef.current += speedRef.current * delta;

      const player = playerRef.current;
      player.velocityY += GRAVITY * delta;
      player.y += player.velocityY * delta;

      const groundY = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE.height;
      if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.grounded = true;
      }

      obstacleTimerRef.current += delta;
      if (obstacleTimerRef.current > 1.4) {
        obstacleTimerRef.current = 0;
        spawnObstacle();
      }

      coinTimerRef.current += delta;
      if (coinTimerRef.current > 1.1) {
        coinTimerRef.current = 0;
        if (Math.random() > 0.3) {
          spawnCoin();
        }
      }

      obstaclesRef.current = obstaclesRef.current
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - speedRef.current * delta,
        }))
        .filter((obstacle) => obstacle.x + obstacle.width > -40);

      coinsRef.current = coinsRef.current
        .map((coin) => ({
          ...coin,
          x: coin.x - speedRef.current * delta,
        }))
        .filter((coin) => coin.x + coin.radius * 2 > -20);

      collectCoins();

      if (detectCollision()) {
        gameOver();
        return;
      }

      updateHud(speedRef.current);
      drawFrame();
      animationRef.current = requestAnimationFrame(tick);
    },
    [collectCoins, detectCollision, drawFrame, gameOver, spawnCoin, spawnObstacle, updateHud]
  );

  const startGame = useCallback(() => {
    resetGameState();
    updateStatus("RUNNING");
    animationRef.current = requestAnimationFrame(tick);
  }, [resetGameState, tick, updateStatus]);

  const handleInput = useCallback(() => {
    if (statusRef.current === "READY") {
      startGame();
      return;
    }
    if (statusRef.current === "GAME_OVER") {
      startGame();
      return;
    }
    if (statusRef.current === "RUNNING") {
      jump();
    }
  }, [jump, startGame]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("runner_high_score");
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        highScoreRef.current = parsed;
        setHud((prev) => ({ ...prev, highScore: parsed }));
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = GAME_WIDTH * ratio;
      canvas.height = GAME_HEIGHT * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${(rect.width * GAME_HEIGHT) / GAME_WIDTH}px`;
      const context = canvas.getContext("2d");
      if (context) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      drawFrame();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, [drawFrame]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        stopLoop();
      } else {
        pausedRef.current = false;
        if (statusRef.current === "RUNNING") {
          animationRef.current = requestAnimationFrame(tick);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [stopLoop, tick]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return (
    <div className="game-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={handleInput}
      />
      <div className="hud">
        <div>
          <span className="label">점수</span>
          <strong>{hud.score}</strong>
        </div>
        <div>
          <span className="label">코인</span>
          <strong>{hud.coins}</strong>
        </div>
        <div>
          <span className="label">속도</span>
          <strong>{hud.speed}</strong>
        </div>
        <div>
          <span className="label">최고</span>
          <strong>{hud.highScore}</strong>
        </div>
      </div>
      {(status === "READY" || status === "GAME_OVER") && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{status === "READY" ? "READY" : "GAME OVER"}</h2>
            <p>
              {status === "READY"
                ? "탭/클릭 또는 스페이스로 시작"
                : "다시 도전해보세요!"}
            </p>
            <button className="primary" onClick={startGame}>
              {status === "READY" ? "게임 시작" : "재시작"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
