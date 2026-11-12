export function ExportStudio() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Export</p>
      <h2 style={{ margin: '6px 0 0' }}>Préparation de fichier</h2>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Format</strong>
          <p>WAV 24-bit • MP3 320 kbps • AIFF</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Résumé</strong>
          <p>Durée : 02:48 • BPM : 118 • Master bus prêt</p>
        </div>
      </div>

      <button type="button" className="primary-btn" style={{ marginTop: 18 }}>Exporter le mix</button>
    </section>
  );
}
