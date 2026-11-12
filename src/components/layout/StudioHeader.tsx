export function StudioHeader() {
  return (
    <header className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a5b4fc' }}>Crhimastiano</p>
        <h1 style={{ margin: '6px 0 0', fontSize: '2rem' }}>Studio</h1>
      </div>
      <button
        type="button"
        style={{
          border: 'none',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: 'white',
          padding: '10px 16px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Nouveau projet
      </button>
    </header>
  );
}
