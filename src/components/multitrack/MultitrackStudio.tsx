export function MultitrackStudio() {
  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Multitrack Studio</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ padding: 12, borderRadius: 10, background: '#1f2937' }}>Piste 1 — Drums</div>
        <div style={{ padding: 12, borderRadius: 10, background: '#1f2937' }}>Piste 2 — Bass</div>
        <div style={{ padding: 12, borderRadius: 10, background: '#1f2937' }}>Piste 3 — Vocals</div>
      </div>
    </section>
  );
}
