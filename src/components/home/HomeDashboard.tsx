export function HomeDashboard() {
  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p>Accès rapide aux studios : multitrack, beatmaker, voix, chœur, duo, mix, IA et export.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 10, background: '#111827' }}>Multitrack</div>
        <div style={{ padding: 12, borderRadius: 10, background: '#111827' }}>Beatmaker</div>
        <div style={{ padding: 12, borderRadius: 10, background: '#111827' }}>Voix</div>
      </div>
    </section>
  );
}
