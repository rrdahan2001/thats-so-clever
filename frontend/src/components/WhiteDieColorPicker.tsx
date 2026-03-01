import type { DieColor } from '../types/game';

const ALL_COLORS: { id: DieColor; label: string }[] = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'orange', label: 'Orange' },
  { id: 'purple', label: 'Purple' },
];

interface WhiteDieColorPickerProps {
  dieValue: number;
  validColors?: DieColor[];
  onChoose: (color: DieColor) => void;
  onCancel: () => void;
}

export function WhiteDieColorPicker({
  dieValue,
  validColors = ['yellow', 'blue', 'green', 'orange', 'purple'],
  onChoose,
  onCancel,
}: WhiteDieColorPickerProps) {
  const colors = ALL_COLORS.filter((c) => validColors.includes(c.id));
  return (
    <div className="white-die-picker-overlay" onClick={onCancel}>
      <div className="white-die-picker" onClick={(e) => e.stopPropagation()}>
        <h4>White die ({dieValue}) – use as which color?</h4>
        <div className="picker-buttons">
          {colors.map(({ id, label }) => (
            <button key={id} className={`picker-btn ${id}`} onClick={() => onChoose(id)}>
              {label}
            </button>
          ))}
        </div>
        <button className="picker-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
