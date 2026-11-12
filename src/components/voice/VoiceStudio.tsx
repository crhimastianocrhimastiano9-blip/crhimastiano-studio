import { useState } from 'react';

const rows = ['Kick', 'Snare', 'Clap', 'Bass'];
const steps = Array.from({ length: 16 }, (_, i) => i);

export function BeatMakerStudio() {
  const [pattern, setPattern] = useState<Record<string, boolean[]>>({
    Kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    Snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    Clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    Bass: [true, false, true, false, false, true, false, true, true, false, true, false, false, true, false, true],
  });

  const toggleStep = (row: string, step: number) => {
    setPattern((current) => ({
      ...current,
      [row]: current[row].map((value, index) => (index === step ? !value : value)),
    }));
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Beatmaker</p>
          <h2 style={{ margin: '6px 0 0' }}>Pattern sequencer</h2>
        </div>
        <button type="button" className="primary-btn">▶ Lecture</button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
            <strong>{row}</strong>
            <div className="step-grid">
              {steps.map((step) => (
                <button
                  key={`${row}-${step}`}
                  type="button"
                  className={`step ${pattern[row][step] ? 'active' : ''}`}
                  onClick={() => toggleStep(row, step)}
                  aria-label={`${row} step ${step + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
