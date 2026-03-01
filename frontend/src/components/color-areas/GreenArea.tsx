import type { GreenArea as G } from '../../types/game';

const MINS = [1, 2, 3, 4, 5, 6];

interface Props {
  sheet: G;
  selectedValue?: number;
  canPlace: boolean;
  onPlace: (p: Record<string, number>) => void;
}

export function GreenArea({ sheet, selectedValue = 0, canPlace, onPlace }: Props) {
  const nextIdx = sheet.marked.findIndex((v) => v === null);
  return (
    <div className="color-area green" title="Marks score by count: 0,1,3,6,10,15,21">
      <h4>Green</h4>
      <div className="green-grid">
        {MINS.map((min, idx) => (
          <button
            key={idx}
            className={`box ${sheet.marked[idx] !== null ? 'filled' : ''}`}
            disabled={!canPlace || idx !== nextIdx || selectedValue < min}
            onClick={() => canPlace && idx === nextIdx && selectedValue >= min && onPlace({})}
          >
            min {min}
            {sheet.marked[idx] !== null && `: ${sheet.marked[idx]}`}
          </button>
        ))}
      </div>
    </div>
  );
}
