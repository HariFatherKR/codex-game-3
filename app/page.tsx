import RunnerGame from "../components/RunnerGame";

export default function HomePage() {
  return (
    <main className="page">
      <div className="game-shell">
        <header className="header">
          <h1>Infinite Runner</h1>
          <p>스페이스 또는 화면 탭으로 점프하세요.</p>
        </header>
        <RunnerGame />
      </div>
    </main>
  );
}
