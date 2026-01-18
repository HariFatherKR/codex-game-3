"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameStatus = "READY" | "RUNNING" | "GAME_OVER";

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
};

type Coin = {
  id: number;
  x: number;
  y: number;
  radius: number;
};

const CANVAS_RATIO = 16 / 9;
const BASE_SPEED = 220;
const SPEED_ACCEL = 6;
const GRAVITY = 1800;
const JUMP_VELOCITY = 640;
const GROUND_OFFSET = 80;
const OBSTACLE_MIN_GAP = 220;
const COIN_MIN_GAP = 180;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>("READY");
  const speedRef = useRef(BASE_SPEED);
  const scoreRef = useRef(0);
  const coinRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const spawnRef = useRef({ obstacle: 0, coin: 0, id: 0 });
  const playerRef = useRef({
    x: 0,
    y: 0,
    width: 40,
    height: 52,
    velocityY: 0,
    onGround: true
  });
  const pausedRef = useRef(false);

  const [status, setStatus] = useState<GameStatus>("READY");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [highScore, setHighScore] = useState(0);

  const formattedScore = useMemo(() => Math.floor(score), [score]);

  const readHighScore = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("runner_high_score");
    if (!stored) return;
    const value = Number.parseInt(stored, 10);
    if (!Number.isNaN(value)) {
      setHighScore(value);
    }
  }, []);

  const writeHighScore = useCallback((value: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("runner_high_score", String(value));
  }, []);

  const resetGame = useCallback(() => {
    statusRef.current = "READY";
    speedRef.current = BASE_SPEED;
    scoreRef.current = 0;
    coinRef.current = 0;
    obstaclesRef.current = [];
    coinsRef.current = [];
    spawnRef.current = { obstacle: 0, coin: 0, id: spawnRef.current.id };
    playerRef.current.velocityY = 0;
    playerRef.current.onGround = true;
    setStatus("READY");
    setScore(0);
    setCoins(0);
    setSpeed(BASE_SPEED);
  }, []);

  const startGame = useCallback(() => {
    statusRef.current = "RUNNING";
    setStatus("RUNNING");
  }, []);

  const triggerJump = useCallback(() => {
    const player = playerRef.current;
    if (!player.onGround) return;
    player.velocityY = -JUMP_VELOCITY;
    player.onGround = false;
  }, []);

  const handleJump = useCallback(() => {
    if (statusRef.current === "READY") {
      startGame();
      triggerJump();
      return;
    }
    if (statusRef.current === "RUNNING") {
      triggerJump();
    }
  }, [startGame, triggerJump]);

  useEffect(() => {
    readHighScore();
  }, [readHighScore]);

  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (document.hidden) {
        lastTimeRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleJump]);

  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const width = container.clientWidth;
      const height = Math.floor(width * CANVAS_RATIO);
      canvas.width = width;
      canvas.height = height;
      playerRef.current.x = width * 0.2;
      playerRef.current.y = height - GROUND_OFFSET - playerRef.current.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (pausedRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = timestamp;

      const canvas = ctx.canvas;
      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - GROUND_OFFSET;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#1a1f2e";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#39405e";
      ctx.fillRect(0, groundY, width, GROUND_OFFSET);

      if (statusRef.current === "RUNNING") {
        speedRef.current += SPEED_ACCEL * delta;
        scoreRef.current += speedRef.current * delta * 0.05;

        spawnRef.current.obstacle -= speedRef.current * delta;
        spawnRef.current.coin -= speedRef.current * delta;

        if (spawnRef.current.obstacle <= 0) {
          const obstacleWidth = 30 + Math.random() * 20;
          const obstacleHeight = 40 + Math.random() * 35;
          obstaclesRef.current.push({
            id: spawnRef.current.id++,
            x: width + obstacleWidth,
            width: obstacleWidth,
            height: obstacleHeight
          });
          spawnRef.current.obstacle =
            OBSTACLE_MIN_GAP + Math.random() * 140;
        }

        if (spawnRef.current.coin <= 0) {
          const radius = 10 + Math.random() * 4;
          const y = groundY - 90 - Math.random() * 80;
          coinsRef.current.push({
            id: spawnRef.current.id++,
            x: width + radius,
            y,
            radius
          });
          spawnRef.current.coin = COIN_MIN_GAP + Math.random() * 100;
        }

        const player = playerRef.current;
        player.velocityY += GRAVITY * delta;
        player.y += player.velocityY * delta;
        if (player.y + player.height >= groundY) {
          player.y = groundY - player.height;
          player.velocityY = 0;
          player.onGround = true;
        }

        obstaclesRef.current = obstaclesRef.current
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - speedRef.current * delta
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > 0);

        coinsRef.current = coinsRef.current
          .map((coin) => ({
            ...coin,
            x: coin.x - speedRef.current * delta
          }))
          .filter((coin) => coin.x + coin.radius > 0);

        const hitObstacle = obstaclesRef.current.some((obstacle) => {
          const px = player.x;
          const py = player.y;
          return (
            px < obstacle.x + obstacle.width &&
            px + player.width > obstacle.x &&
            py < groundY - obstacle.height + obstacle.height &&
            py + player.height > groundY - obstacle.height
          );
        });

        if (hitObstacle) {
          statusRef.current = "GAME_OVER";
          setStatus("GAME_OVER");
          const nextScore = Math.floor(scoreRef.current);
          if (nextScore > highScore) {
            setHighScore(nextScore);
            writeHighScore(nextScore);
          }
        }

        const collected: number[] = [];
        coinsRef.current.forEach((coin) => {
          const player = playerRef.current;
          const cx = coin.x;
          const cy = coin.y;
          const closestX = Math.max(
            player.x,
            Math.min(cx, player.x + player.width)
          );
          const closestY = Math.max(
            player.y,
            Math.min(cy, player.y + player.height)
          );
          const dx = cx - closestX;
          const dy = cy - closestY;
          if (dx * dx + dy * dy < coin.radius * coin.radius) {
            collected.push(coin.id);
          }
        });

        if (collected.length > 0) {
          coinsRef.current = coinsRef.current.filter(
            (coin) => !collected.includes(coin.id)
          );
          coinRef.current += collected.length;
          scoreRef.current += collected.length * 10;
        }
      }

      ctx.fillStyle = "#8df0ff";
      ctx.fillRect(
        playerRef.current.x,
        playerRef.current.y,
        playerRef.current.width,
        playerRef.current.height
      );

      ctx.fillStyle = "#f28d6d";
      obstaclesRef.current.forEach((obstacle) => {
        ctx.fillRect(
          obstacle.x,
          groundY - obstacle.height,
          obstacle.width,
          obstacle.height
        );
      });

      ctx.fillStyle = "#f9e07f";
      coinsRef.current.forEach((coin) => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [highScore, writeHighScore]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setScore(scoreRef.current);
      setCoins(coinRef.current);
      setSpeed(speedRef.current);
      setStatus(statusRef.current);
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="game-shell">
      <header className="game-header">
        <div>
          <h1>Infinite Runner</h1>
          <p className="helper">터치 또는 스페이스로 점프하세요.</p>
        </div>
        <button className="btn" onClick={resetGame} type="button">
          재시작
        </button>
      </header>

      <div className="hud">
        <div className="hud-card">점수: {formattedScore}</div>
        <div className="hud-card">하이스코어: {highScore}</div>
        <div className="hud-card">속도: {speed.toFixed(0)}</div>
        <div className="hud-card">코인: {coins}</div>
      </div>

      <div
        ref={containerRef}
        className="canvas-wrap"
        onPointerDown={handleJump}
        role="button"
        tabIndex={0}
      >
        <canvas ref={canvasRef} />
        {status !== "RUNNING" && (
          <div className="canvas-overlay">
            {status === "READY" && (
              <div>
                <strong>READY</strong>
                <div>화면을 터치하거나 스페이스를 눌러 시작하세요.</div>
              </div>
            )}
            {status === "GAME_OVER" && (
              <div>
                <strong>GAME OVER</strong>
                <div>재시작 버튼으로 다시 도전하세요.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
