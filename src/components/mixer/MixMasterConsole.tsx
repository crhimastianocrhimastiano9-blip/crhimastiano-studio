export function DuoStudio() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Duo</p>
      <h2 style={{ margin: '6px 0 0' }}>Studio duo</h2>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Vocal 1</strong>
          <p>Prise de voix principale — doux et clair.</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Vocal 2</strong>
          <p>Harmony — double harmonique à 3 voix.</p>
        </div>
      </div>
    </section>
  );
}
