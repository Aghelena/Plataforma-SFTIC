import { useContrast } from "../hooks/useContrast";

export default function ContrastSwitcher({ className = "" }) {
  const { mode, setMode, modes } = useContrast();

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="sr-only">Modo de contraste</span>
      <select
        aria-label="Modo de contraste"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
      >
        {modes.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </label>
  );
}
