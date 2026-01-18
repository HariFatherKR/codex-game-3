import RunnerGame from "../components/RunnerGame";

export default function Home() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Canvas 2D Infinite Runner</p>
        <h1 className="title">달리고, 점프하고, 최고 기록에 도전하세요</h1>
        <p className="subtitle">
          모바일 터치 또는 스페이스 키로 점프! 코인을 수집하고 장애물을 피하세요.
        </p>
      </header>
      <RunnerGame />
    </div>
  );
}
