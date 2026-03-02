import type { BlueArea as B } from '../../types/game';
import { BLUE_FOX_INDICES } from '../../constants/foxes';

interface Props {
  sheet: B;
  blueWhiteSum?: number;
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

export function BlueArea({ sheet, blueWhiteSum = 0, canPlace, onPlace }: Props) {
  return (
    <div className="color-area blue" title="Marks scale: 1→1, 2→3, 3→6, 4→7, 5→10, 6→15, 7→21, 8→28, 9→37, 10→46, 11→56">
      <h4>Blue (Blue+White sum)</h4>
      <div className="blue-grid">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sum, idx) => (
          <button
            key={sum}
            className={`box ${sheet.marked[idx] ? 'marked' : ''} ${BLUE_FOX_INDICES.includes(idx) ? 'has-fox' : ''}`}
            disabled={!canPlace || sheet.marked[idx] || (blueWhiteSum > 0 && blueWhiteSum !== sum)}
            onClick={() => canPlace && !sheet.marked[idx] && blueWhiteSum === sum && onPlace({ index: idx })}
          >
            {sum}
            {sheet.marked[idx] && ' X'}
            {BLUE_FOX_INDICES.includes(idx) && <FoxIcon />}
          </button>
        ))}
      </div>
    </div>
  );
}
