/** Standard dice pip positions on a 3x3 grid (row, col) */
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

interface DieFaceProps {
  value: number;
  className?: string;
}

export function DieFace({ value, className = '' }: DieFaceProps) {
  const pips = PIP_LAYOUTS[value] ?? [];
  return (
    <div className={`die-face ${className}`} aria-label={`${value}`}>
      <div className="die-pips">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <span
              key={`${row}-${col}`}
              className={`die-pip ${pips.some(([r, c]) => r === row && c === col) ? 'pip-on' : ''}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
