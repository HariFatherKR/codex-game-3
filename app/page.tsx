"use client";

import { useEffect, useRef, useState } from "react";

const BASE_GRAVITY = 1500;
const JUMP_VELOCITY = -520;
const PIPE_WIDTH = 64;
const PIPE_GAP = 170;
const PIPE_SPAWN_INTERVAL = 1500;
const PLAYER_SIZE = 28;

type GameStatus = "ready" | "playing" | "gameover";

type Pipe = {
  x: number;
  gapY: number;
  scored: boolean;
};

export default function Home() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const stateRef = useRef({
    status: "ready" as GameStatus,
    width: 360,
    height: 640,
    playerY: 320,
    playerVelocity: 0,
    pipes: [] as Pipe[],
    score: 0,
    highScore: 0,
    spawnTimer: 0,
  });

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [friendScore, setFriendScore] = useState<number | null>(null);
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedScore = params.get("score");
    if (sharedScore) {
      const parsed = Number(sharedScore);
      if (!Number.isNaN(parsed)) {
        setFriendScore(parsed);
      }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("flappy-high-score");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setHighScore(parsed);
        stateRef.current.highScore = parsed;
      }
    }
  }, []);

  useEffect(() => {
    stateRef.current.status = status;
  }, [status]);

  const resetGame = (nextStatus: GameStatus) => {
    const { width, height } = stateRef.current;
    stateRef.current.playerY = height * 0.5;
    stateRef.current.playerVelocity = 0;
    stateRef.current.pipes = [];
    stateRef.current.score = 0;
    stateRef.current.spawnTimer = 0;
    setScore(0);
    setStatus(nextStatus);
  };

  const startGame = () => {
    resetGame("playing");
  };

  const triggerJump = () => {
    stateRef.current.playerVelocity = JUMP_VELOCITY;
  };

  const handlePointer = () => {
    if (status === "ready") {
      startGame();
      triggerJump();
      return;
    }
    if (status === "playing") {
      triggerJump();
    }
  };

  const updateHighScore = (value: number) => {
    if (value > stateRef.current.highScore) {
      stateRef.current.highScore = value;
      setHighScore(value);
      window.localStorage.setItem("flappy-high-score", String(value));
    }
  };

  const endGame = () => {
    setStatus("gameover");
    updateHighScore(stateRef.current.score);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    const rect = shell.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    stateRef.current.width = rect.width;
    stateRef.current.height = rect.height;
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const renderPlayer = (x: number, y: number) => {
      const pixel = PLAYER_SIZE / 7;
      const startX = x - PLAYER_SIZE / 2;
      const startY = y - PLAYER_SIZE / 2;

      ctx.fillStyle = "#2b2b2b";
      ctx.fillRect(startX, startY, PLAYER_SIZE, PLAYER_SIZE);

      ctx.fillStyle = "#f9e784";
      ctx.fillRect(startX + pixel, startY + pixel, pixel * 5, pixel * 5);

      ctx.fillStyle = "#1b1b1b";
      ctx.fillRect(startX + pixel * 2, startY + pixel * 2, pixel, pixel);
      ctx.fillRect(startX + pixel * 4, startY + pixel * 2, pixel, pixel);

      ctx.fillStyle = "#ff7a59";
      ctx.fillRect(startX + pixel * 3, startY + pixel * 4, pixel, pixel);
    };

    const renderPipe = (pipe: Pipe) => {
      const { width, height } = stateRef.current;
      const topHeight = pipe.gapY - PIPE_GAP / 2;
      const bottomY = pipe.gapY + PIPE_GAP / 2;
      const bottomHeight = height - bottomY;

      ctx.fillStyle = "#2f8f4e";
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);

      ctx.fillStyle = "#1f5c35";
      ctx.fillRect(pipe.x - 6, topHeight - 18, PIPE_WIDTH + 12, 18);
      ctx.fillRect(pipe.x - 6, bottomY, PIPE_WIDTH + 12, 18);
    };

    const renderCookie = (x: number, y: number, size: number) => {
      ctx.fillStyle = "#1e1b1b";
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3b2f2f";
      ctx.beginPath();
      ctx.arc(x - size * 0.15, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.arc(x + size * 0.2, y + size * 0.15, size * 0.07, 0, Math.PI * 2);
      ctx.arc(x + size * 0.05, y - size * 0.2, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      const delta = Math.min(32, timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, state.width, state.height);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(0, state.height - 80, state.width, 80);
      renderCookie(state.width - 40, state.height - 40, 32);

      if (state.status === "playing") {
        const speed = 190 + state.score * 4;
        state.spawnTimer += delta;

        if (state.spawnTimer >= PIPE_SPAWN_INTERVAL) {
          state.spawnTimer = 0;
          const minY = state.height * 0.25;
          const maxY = state.height * 0.75;
          const gapY = Math.random() * (maxY - minY) + minY;
          state.pipes.push({ x: state.width + 40, gapY, scored: false });
        }

        state.playerVelocity += BASE_GRAVITY * (delta / 1000);
        state.playerY += state.playerVelocity * (delta / 1000);

        state.pipes.forEach((pipe) => {
          pipe.x -= speed * (delta / 1000);
        });

        state.pipes = state.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -40);

        const playerX = state.width * 0.28;
        const playerRect = {
          x: playerX - PLAYER_SIZE / 2,
          y: state.playerY - PLAYER_SIZE / 2,
          w: PLAYER_SIZE,
          h: PLAYER_SIZE,
        };

        if (
          playerRect.y <= 0 ||
          playerRect.y + playerRect.h >= state.height
        ) {
          endGame();
        }

        state.pipes.forEach((pipe) => {
          const topHeight = pipe.gapY - PIPE_GAP / 2;
          const bottomY = pipe.gapY + PIPE_GAP / 2;
          const bottomHeight = state.height - bottomY;

          const hitTop =
            playerRect.x < pipe.x + PIPE_WIDTH &&
            playerRect.x + playerRect.w > pipe.x &&
            playerRect.y < topHeight &&
            playerRect.y + playerRect.h > 0;
          const hitBottom =
            playerRect.x < pipe.x + PIPE_WIDTH &&
            playerRect.x + playerRect.w > pipe.x &&
            playerRect.y < bottomY + bottomHeight &&
            playerRect.y + playerRect.h > bottomY;

          if (hitTop || hitBottom) {
            endGame();
          }

          if (!pipe.scored && pipe.x + PIPE_WIDTH < playerX - PLAYER_SIZE / 2) {
            pipe.scored = true;
            state.score += 1;
            setScore(state.score);
          }
        });
      }

      state.pipes.forEach(renderPipe);
      renderPlayer(state.width * 0.28, state.playerY);

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleRestart = () => {
    resetGame("playing");
    triggerJump();
  };

  const handleShare = async () => {
    const scoreValue = stateRef.current.score;
    const url = new URL(window.location.href);
    url.searchParams.set("score", String(scoreValue));
    const text = `내 점수는 ${scoreValue}점! 이길 수 있어?`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Flappy Cookie", text, url: url.toString() });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url.toString());
        setToast("링크가 복사되었어요!");
      } else {
        setToast("공유를 지원하지 않는 브라우저입니다.");
      }
    } catch (error) {
      setToast("공유에 실패했어요.");
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <main>
      <div className="game-shell" ref={shellRef} onPointerDown={handlePointer}>
        <canvas ref={canvasRef} />
        <div className="hud">
          <div className="hud-score">{score}</div>
          <div className="hud-highscore">최고 {highScore}</div>
        </div>

        {status === "ready" && (
          <div className="overlay">
            <div className="panel">
              <h1>Flappy Cookie</h1>
              <p>화면을 탭해서 점프하세요.</p>
              {friendScore !== null && (
                <p className="caption">친구 점수 {friendScore}점 · Beat this score</p>
              )}
              <div className="button-row">
                <button
                  className="button"
                  onClick={() => {
                    startGame();
                    triggerJump();
                  }}
                >
                  시작하기
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "gameover" && (
          <div className="overlay">
            <div className="panel">
              <h2>게임 오버</h2>
              <p>최종 점수: {score}</p>
              <p>하이스코어: {highScore}</p>
              <div className="button-row">
                <button className="button" onClick={handleRestart}>
                  다시 시작
                </button>
                <button className="button secondary" onClick={handleShare}>
                  점수 공유
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`share-toast ${toast ? "visible" : ""}`}>{toast}</div>
      </div>
    </main>
  );
}
