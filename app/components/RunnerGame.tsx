"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameState = "READY" | "RUNNING" | "GAME_OVER";

type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  grounded: boolean;
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
  collected: boolean;
};

type GameSnapshot = {
  state: GameState;
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  speed: number;
  distance: number;
  coinCount: number;
  obstacleTimer: number;
  coinTimer: number;
};

const WORLD_WIDTH = 360;
const WORLD_HEIGHT = 640;
const GROUND_Y = 540;
const BASE_SPEED = 220;
const MAX_SPEED = 520;
const ACCELERATION = 12;
const GRAVITY = 1600;
const JUMP_VELOCITY = -620;
const UI_UPDATE_INTERVAL = 120;

const createInitialSnapshot = (): GameSnapshot => ({
  state: "READY",
  player: {
    x: 60,
    y: GROUND_Y - 52,
    width: 42,
    height: 52,
    velocityY: 0,
    grounded: true,
  },
  obstacles: [],
  coins: [],
  speed: BASE_SPEED,
  distance: 0,
  coinCount: 0,
  obstacleTimer: 0,
  coinTimer: 0,
});

const intersects = (a: Player, b: Obstacle) => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

const intersectsCoin = (a: Player, coin: Coin) => {
  const closestX = Math.max(a.x, Math.min(coin.x, a.x + a.width));
  const closestY = Math.max(a.y, Math.min(coin.y, a.y + a.height));
  const dx = coin.x - closestX;
  const dy = coin.y - closestY;
  return dx * dx + dy * dy <= coin.radius * coin.radius;
};

export default function RunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameSnapshot>(createInitialSnapshot());
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const uiTimeRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>("READY");
  const [score, setScore] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("infiniteRunnerHighScore");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setHighScore(parsed);
      }
    }
  }, []);

  const syncHud = useCallback(() => {
    const snapshot = gameRef.current;
    const computedScore = Math.floor(snapshot.distance / 10) +
      snapshot.coinCount * 25;

    setScore(computedScore);
    setCoinCount(snapshot.coinCount);
    setSpeed(Math.round(snapshot.speed));
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current = createInitialSnapshot();
    gameRef.current.state = "READY";
    setGameState("READY");
    syncHud();
  }, [syncHud]);

  const startRun = useCallback(() => {
    const snapshot = gameRef.current;
    if (snapshot.state === "RUNNING") return;
    if (snapshot.state === "GAME_OVER") return;
    snapshot.state = "RUNNING";
    setGameState("RUNNING");
  }, []);

  const triggerJump = useCallback(() => {
    const snapshot = gameRef.current;
    if (snapshot.state === "READY") {
      snapshot.state = "RUNNING";
      setGameState("RUNNING");
    }
    if (snapshot.state !== "RUNNING") return;
    if (!snapshot.player.grounded) return;
    snapshot.player.velocityY = JUMP_VELOCITY;
    snapshot.player.grounded = false;
  }, []);

  const onGameOver = useCallback(() => {
    const snapshot = gameRef.current;
    snapshot.state = "GAME_OVER";
    setGameState("GAME_OVER");
    const computedScore = Math.floor(snapshot.distance / 10) +
      snapshot.coinCount * 25;
    if (computedScore > highScore) {
      setHighScore(computedScore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "infiniteRunnerHighScore",
          String(computedScore)
        );
      }
    }
  }, [highScore]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (gameRef.current.state === "READY") {
          startRun();
        }
        triggerJump();
      }
      if (event.code === "KeyR") {
        if (gameRef.current.state === "GAME_OVER") {
          resetGame();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [resetGame, startRun, triggerJump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const snapshot = gameRef.current;

      if (snapshot.state === "RUNNING") {
        snapshot.speed = Math.min(
          snapshot.speed + ACCELERATION * delta,
          MAX_SPEED
        );

        snapshot.distance += snapshot.speed * delta;
        snapshot.obstacleTimer += delta;
        snapshot.coinTimer += delta;

        snapshot.player.velocityY += GRAVITY * delta;
        snapshot.player.y += snapshot.player.velocityY * delta;

        if (snapshot.player.y >= GROUND_Y - snapshot.player.height) {
          snapshot.player.y = GROUND_Y - snapshot.player.height;
          snapshot.player.velocityY = 0;
          snapshot.player.grounded = true;
        }

        if (snapshot.obstacleTimer > 1.1) {
          snapshot.obstacleTimer = 0;
          const height = 36 + Math.random() * 28;
          snapshot.obstacles.push({
            x: WORLD_WIDTH + 20,
            y: GROUND_Y - height,
            width: 26 + Math.random() * 16,
            height,
          });
        }

        if (snapshot.coinTimer > 0.8) {
          snapshot.coinTimer = 0;
          const offset = 80 + Math.random() * 120;
          snapshot.coins.push({
            x: WORLD_WIDTH + 20,
            y: GROUND_Y - offset,
            radius: 10,
            collected: false,
          });
        }

        snapshot.obstacles = snapshot.obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - snapshot.speed * delta,
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > -20);

        snapshot.coins = snapshot.coins
          .map((coin) => ({
            ...coin,
            x: coin.x - snapshot.speed * delta,
          }))
          .filter((coin) => coin.x + coin.radius > -20 && !coin.collected);

        for (const obstacle of snapshot.obstacles) {
          if (intersects(snapshot.player, obstacle)) {
            onGameOver();
            break;
          }
        }

        for (const coin of snapshot.coins) {
          if (!coin.collected && intersectsCoin(snapshot.player, coin)) {
            coin.collected = true;
            snapshot.coinCount += 1;
          }
        }
      }

      context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      context.fillStyle = "#0f172a";
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      context.fillStyle = "#1e293b";
      context.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

      context.fillStyle = "#5ce1e6";
      context.fillRect(
        snapshot.player.x,
        snapshot.player.y,
        snapshot.player.width,
        snapshot.player.height
      );

      context.fillStyle = "#fbbf24";
      snapshot.coins.forEach((coin) => {
        if (coin.collected) return;
        context.beginPath();
        context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.fillStyle = "#f87171";
      snapshot.obstacles.forEach((obstacle) => {
        context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      uiTimeRef.current += delta * 1000;
      if (uiTimeRef.current >= UI_UPDATE_INTERVAL) {
        uiTimeRef.current = 0;
        syncHud();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [onGameOver, syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = WORLD_WIDTH * pixelRatio;
      canvas.height = WORLD_HEIGHT * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="game-shell">
      <div className="hud">
        <div>
          점수 <strong>{score}</strong>
        </div>
        <div>
          최고점수 <strong>{highScore}</strong>
        </div>
        <div>
          속도 <strong>{speed}</strong>
        </div>
        <div>
          코인 <strong>{coinCount}</strong>
        </div>
      </div>

      <div
        className="canvas-wrap"
        role="button"
        tabIndex={0}
        onPointerDown={() => {
          if (gameRef.current.state === "READY") {
            startRun();
          }
          triggerJump();
        }}
        onKeyDown={(event) => {
          if (event.key === " ") {
            event.preventDefault();
            triggerJump();
          }
        }}
      >
        <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} />
        {gameState !== "RUNNING" && (
          <div className="overlay">
            {gameState === "READY" && (
              <>
                <h2>INFINITE RUNNER</h2>
                <p>탭 또는 스페이스로 점프하세요.</p>
                <button type="button" onClick={startRun}>
                  시작하기
                </button>
              </>
            )}
            {gameState === "GAME_OVER" && (
              <>
                <h2>GAME OVER</h2>
                <p>점수 {score} · 코인 {coinCount}</p>
                <button type="button" onClick={resetGame}>
                  다시 시작
                </button>
                <span className="helper">R 키로도 재시작 가능</span>
              </>
            )}
          </div>
        )}
      </div>
      <p className="helper">
        모바일: 화면을 탭해서 점프 · 데스크톱: 스페이스 점프
      </p>
    </div>
  );
}
