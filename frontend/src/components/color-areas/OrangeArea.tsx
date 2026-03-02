import type { OrangeArea as O } from '../../types/game';
import { ORANGE_FOX_INDICES } from '../../constants/foxes';

const MULT = [1, 1, 1, 2, 1, 3];

interface Props {
  sheet: O;
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

export function OrangeArea({ sheet, selectedValue = 0, canPlace, onPlace }: Props) {
  const nextIdx = sheet.values.findIndex((v) => v === null);
  return (
    <div className="color-area orange" title="Sum of values × multiplier (1x,1x,1x,2x,1x,3x)">
      <h4>Orange</h4>
      <div className="orange-grid">
        {sheet.values.map((v, idx) => (
          <div key={idx} className="orange-slot">
            <span className="mult">x{MULT[idx]}</span>
            <button
              className={`box ${v !== null ? 'filled' : ''} ${ORANGE_FOX_INDICES.includes(idx) ? 'has-fox' : ''}`}
              disabled={!canPlace || idx !== nextIdx}
              onClick={() => canPlace && idx === nextIdx && onPlace({})}
            >
              {v ?? (idx === nextIdx ? selectedValue : '')}
              {ORANGE_FOX_INDICES.includes(idx) && <FoxIcon />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
