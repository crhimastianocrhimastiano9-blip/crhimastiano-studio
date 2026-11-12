export function MobileTabBar() {
  return (
    <nav className="card" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <span>Accueil</span>
        <span>Mix</span>
        <span>IA</span>
        <span>Export</span>
      </div>
    </nav>
  );
}
