import type { YellowArea as Y } from '../../types/game';

interface Props {
  sheet: Y;
  selectedValue?: number;
  canPlace: boolean;
  onPlace: (p: Record<string, number>) => void;
}

export function YellowArea({ sheet, selectedValue, canPlace, onPlace }: Props) {
  return (
    <div className="color-area yellow" title="Complete pairs (1-2, 3-4, 5-6): 10, 14, 20 pts">
      <h4>Yellow</h4>
      <div className="yellow-grid">
        {[1, 2, 3, 4, 5, 6].map((val) => (
          <div key={val} className="yellow-row">
            <span className="val-label">{val}</span>
            {[0, 1].map((col) => (
              <button
                key={col}
                className={`box ${sheet.marked[val - 1]?.[col] ? 'marked' : ''}`}
                disabled={!canPlace || (selectedValue !== undefined && selectedValue !== val) || !!(sheet.marked[val - 1]?.[col])}
                onClick={() => canPlace && selectedValue === val && !sheet.marked[val - 1]?.[col] && onPlace({ index: col })}
              >
                {sheet.marked[val - 1]?.[col] ? 'X' : ''}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
