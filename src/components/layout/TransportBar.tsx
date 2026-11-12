export function TransportBar() {
  return (
    <div className="card" style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button">⏮</button>
        <button type="button">▶</button>
        <button type="button">⏭</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>118 BPM</span>
        <span>4/4</span>
        <span>C Major</span>
      </div>
    </div>
  );
}
