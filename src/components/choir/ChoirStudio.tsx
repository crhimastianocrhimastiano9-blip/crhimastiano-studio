export function ChoirStudio() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Chœur</p>
      <h2 style={{ margin: '6px 0 0' }}>Arrangement vocal</h2>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Soprano</strong>
          <input type="range" min={0} max={100} defaultValue={78} className="slider" />
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Alto</strong>
          <input type="range" min={0} max={100} defaultValue={64} className="slider" />
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Ténor</strong>
          <input type="range" min={0} max={100} defaultValue={58} className="slider" />
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Basse</strong>
          <input type="range" min={0} max={100} defaultValue={70} className="slider" />
        </div>
      </div>
    </section>
  );
}
