import { useState } from 'react';
import { getMakes, getModels, getVehicleTypes } from './api';
import type { Make } from './api';
import { MakePicker } from './components/MakePicker';
import { useApi } from './useApi';

const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1; // next model year is usually published early
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i);

export default function App() {
  const [make, setMake] = useState<Make | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [vehicleType, setVehicleType] = useState<string | null>(null);

  // Each request is keyed by everything it depends on; `null` means "not enough input yet".
  const makes = useApi('makes', (signal) => getMakes(signal));
  const types = useApi(make ? `types:${make.id}` : null, (signal) => getVehicleTypes(make!.id, signal));
  const models = useApi(make && year ? `models:${make.id}:${year}:${vehicleType ?? ''}` : null, (signal) =>
    getModels(make!.id, year!, vehicleType, signal),
  );

  function selectMake(next: Make | null) {
    setMake(next);
    setVehicleType(null); // a type filter only makes sense for the make it came from
  }

  return (
    <main>
      <header>
        <h1>Vehicle Explorer</h1>
        <p>Pick a make and model year to see its vehicle types and models.</p>
      </header>

      <section className="card" aria-label="Search">
        <div className="field">
          <label htmlFor="make">Make</label>
          <MakePicker makes={makes.data ?? []} selected={make} onSelect={selectMake} disabled={makes.loading || !!makes.error} />
          {makes.error && (
            <p className="error" role="alert">
              {makes.error} <button onClick={makes.retry}>Retry</button>
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="year">Model year</label>
          <select id="year" value={year ?? ''} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </section>

      {make && (
        <section className="card" aria-label="Vehicle types" aria-live="polite">
          <h2>Vehicle types for {make.name}</h2>
          {types.loading && <p className="muted">Loading vehicle types…</p>}
          {types.error && (
            <p className="error" role="alert">
              {types.error} <button onClick={types.retry}>Retry</button>
            </p>
          )}
          {types.data && types.data.length === 0 && <p className="muted">NHTSA lists no vehicle types for this make.</p>}
          {types.data && types.data.length > 0 && (
            <>
              <div className="chips">
                <button className="chip" aria-pressed={vehicleType === null} onClick={() => setVehicleType(null)}>
                  All types
                </button>
                {types.data.map((t) => (
                  <button key={t.id} className="chip" aria-pressed={vehicleType === t.name} onClick={() => setVehicleType(t.name)}>
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="muted small">Choose a type to narrow the models below.</p>
            </>
          )}
        </section>
      )}

      <section className="card" aria-label="Models" aria-live="polite">
        {!make || !year ? (
          <p className="muted">Select a make and a model year to see matching models.</p>
        ) : (
          <>
            <h2>
              {make.name} models, {year}
              {vehicleType && <span className="muted"> · {vehicleType}</span>}
              {models.data && <span className="count">{models.data.length}</span>}
            </h2>
            {models.loading && <p className="muted">Loading models…</p>}
            {models.error && (
              <p className="error" role="alert">
                {models.error} <button onClick={models.retry}>Retry</button>
              </p>
            )}
            {models.data && models.data.length === 0 && (
              <p className="muted">
                No models found{vehicleType ? ` for “${vehicleType}”` : ''}. Try another year{vehicleType ? ' or “All types”' : ''}.
              </p>
            )}
            {models.data && models.data.length > 0 && (
              <ul className="models">
                {models.data.map((m) => (
                  <li key={`${m.id}-${m.name}`}>{m.name}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
