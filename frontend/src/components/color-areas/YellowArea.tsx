import type { YellowArea as Y } from '../../types/game';
import { YELLOW_FOX_POSITIONS } from '../../constants/foxes';

interface Props {
  sheet: Y;
  selectedValue?: number;
  canPlace: boolean;
  onPlace: (p: Record<string, number>) => void;
}

function FoxIcon() {
  return (
    <span className="fox-icon" title="Fox bonus: complete this cell to earn a fox">
      🦊
    </span>
  );
}

export function YellowArea({ sheet, selectedValue, canPlace, onPlace }: Props) {
  const isFoxCell = (row: number, col: number) =>
    YELLOW_FOX_POSITIONS.some(([r, c]) => r === row && c === col);

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
                className={`box ${sheet.marked[val - 1]?.[col] ? 'marked' : ''} ${isFoxCell(val - 1, col) ? 'has-fox' : ''}`}
                disabled={!canPlace || (selectedValue !== undefined && selectedValue !== val) || !!(sheet.marked[val - 1]?.[col])}
                onClick={() => canPlace && selectedValue === val && !sheet.marked[val - 1]?.[col] && onPlace({ index: col })}
              >
                {sheet.marked[val - 1]?.[col] ? 'X' : ''}
                {isFoxCell(val - 1, col) && <FoxIcon />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
