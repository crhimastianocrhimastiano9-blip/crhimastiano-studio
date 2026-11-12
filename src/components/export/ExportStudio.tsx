export function ExportStudio() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Export</p>
      <h2 style={{ margin: '6px 0 0' }}>Finaliser le projet</h2>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Format</strong>
          <p>WAV 24-bit • 48 kHz</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Mastering</strong>
          <p>Limiteur • Saturation douce • Stereo bus</p>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="primary-btn">Exporter le mix</button>
        <button type="button" className="secondary-btn">Prévisualiser</button>
      </div>
    </section>
  );
}
