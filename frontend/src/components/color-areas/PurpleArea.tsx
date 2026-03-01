import type { PurpleArea as P } from '../../types/game';

interface Props {
  sheet: P;
  selectedValue?: number;
  canPlace: boolean;
  onPlace: (p: Record<string, number>) => void;
}

export function PurpleArea({ sheet, selectedValue = 0, canPlace, onPlace }: Props) {
  const nextIdx = sheet.values.findIndex((v) => v === null);
  const prev = nextIdx === 0 ? 0 : (sheet.values[nextIdx - 1] ?? 0);
  const valid = prev === 6 || (selectedValue > prev && selectedValue > 0);

  return (
    <div className="color-area purple" title="Sum of all values (each must be > previous, 6 resets)">
      <h4>Purple (ascending)</h4>
      <div className="purple-grid">
        {sheet.values.map((v, idx) => (
          <button
            key={idx}
            className={`box ${v !== null ? 'filled' : ''}`}
            disabled={!canPlace || idx !== nextIdx || !valid}
            onClick={() => canPlace && idx === nextIdx && valid && onPlace({})}
          >
            {v ?? (idx === nextIdx ? selectedValue : '')}
          </button>
        ))}
      </div>
    </div>
  );
}
