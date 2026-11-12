* {
  box-sizing: border-box;
}

:root {
  color: #f5f7ff;
  background: #090b14;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-height: 100vh;
}

body {
  background:
    radial-gradient(circle at top, rgba(102, 126, 234, 0.2), transparent 25%),
    linear-gradient(180deg, #050814 0%, #101827 100%);
}

button, input, textarea, select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  width: min(1400px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.studio-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
}

.card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pill {
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.7);
  border-radius: 999px;
  color: #e2e8f0;
  padding: 8px 12px;
}

.primary-btn {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 10px 16px;
  font-weight: 700;
}

.secondary-btn {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  color: #f8fafc;
  padding: 10px 16px;
}

.track-row {
  display: grid;
  grid-template-columns: 140px 1fr 110px 96px;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.level-bar {
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.15);
}

.level-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #34d399, #facc15, #f87171);
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 6px;
}

.step {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(148, 163, 184, 0.08);
}

.step.active {
  background: linear-gradient(135deg, #8b5cf6, #38bdf8);
  border-color: transparent;
}

.mic-wave {
  position: relative;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.6));
  overflow: hidden;
}

.mic-wave::before {
  content: '';
  position: absolute;
  inset: 18px 14px;
  border-radius: 999px;
  background: repeating-linear-gradient(
    90deg,
    rgba(56, 189, 248, 0.12),
    rgba(56, 189, 248, 0.12) 12px,
    rgba(15, 23, 42, 0.12) 12px,
    rgba(15, 23, 42, 0.12) 20px
  );
}

.slider {
  width: 100%;
}

@media (max-width: 900px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }

  .track-row {
    grid-template-columns: 1fr;
  }
}
