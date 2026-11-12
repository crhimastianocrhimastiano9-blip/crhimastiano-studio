export function AiMusicAssistant() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>IA</p>
      <h2 style={{ margin: '6px 0 0' }}>Music assistant</h2>

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Suggestion</strong>
          <p>Ajouter une progression de basse plus synthétique sur les 8 derniers temps.</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Prompt</strong>
          <textarea rows={4} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'transparent', color: 'white', padding: 12 }} defaultValue="Ajouter un groove plus aérien avec un hook de synth sur la dernière mesure." />
        </div>
      </div>
    </section>
  );
}
