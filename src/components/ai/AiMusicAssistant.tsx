export function MixMasterConsole() {
  return (
    <section className="card">
      <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Mix</p>
      <h2 style={{ margin: '6px 0 0' }}>Mix master console</h2>

      <div className="grid-2" style={{ marginTop: 18 }}>
        {['Drums', 'Bass', 'Vocals', 'Synth', 'FX', 'Master'].map((channel) => (
          <div key={channel} className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
            <strong>{channel}</strong>
            <input type="range" min={0} max={100} defaultValue={72} className="slider" />
          </div>
        ))}
      </div>
    </section>
  );
}
