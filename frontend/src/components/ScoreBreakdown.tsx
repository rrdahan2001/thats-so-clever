import type { ScoringSheet } from '../types/game';
import {
  getYellowScore,
  getBlueScore,
  getGreenScore,
  getOrangeScore,
  getPurpleScore,
  getFoxBonus,
  getTotalScore,
} from '../utils/scoring';

export const SCORING_FORMULAS = {
  yellow: 'Complete pairs (1–2, 3–4, 5–6): 10, 14, 20 pts',
  blue: 'Marks scale: 1→1, 2→3, 3→6, 4→7, 5→10, 6→15, 7→21, 8→28, 9→37, 10→46, 11→56',
  green: 'Marks score: 0,1,3,6,10,15,21 (by count)',
  orange: 'Sum of values × multiplier (1x,1x,1x,2x,1x,3x)',
  purple: 'Sum of all values (each must be > previous, 6 resets)',
  fox: 'Foxes × lowest color score (0 if any color is 0)',
  foxHowToEarn:
    'Earn foxes by completing bonus spaces (marked with fox icons) in each color area: complete rows or columns in Yellow and Blue; mark specific bonus boxes in Green, Orange, and Purple. Each fox = lowest color score at game end.',
};

interface ScoreBreakdownProps {
  sheet: ScoringSheet;
}

export function ScoreBreakdown({ sheet }: ScoreBreakdownProps) {
  const yellow = getYellowScore(sheet);
  const blue = getBlueScore(sheet);
  const green = getGreenScore(sheet);
  const orange = getOrangeScore(sheet);
  const purple = getPurpleScore(sheet);
  const fox = getFoxBonus(sheet);
  const total = getTotalScore(sheet);

  const foxEarned = sheet.foxes > 0;

  return (
    <div className="score-breakdown">
      <h5>Score breakdown</h5>
      <ul>
        <li title={SCORING_FORMULAS.yellow} className="yellow">
          Yellow: {yellow} pts
        </li>
        <li title={SCORING_FORMULAS.blue} className="blue">
          Blue: {blue} pts
        </li>
        <li title={SCORING_FORMULAS.green} className="green">
          Green: {green} pts
        </li>
        <li title={SCORING_FORMULAS.orange} className="orange">
          Orange: {orange} pts
        </li>
        <li title={SCORING_FORMULAS.purple} className="purple">
          Purple: {purple} pts
        </li>
        <li title={SCORING_FORMULAS.fox} className="fox">
          Fox: +{fox} pts
        </li>
      </ul>
      <div
        className={`fox-bonus-callout ${fox === 0 ? 'zero' : ''}`}
        title={foxEarned ? SCORING_FORMULAS.fox : SCORING_FORMULAS.foxHowToEarn}
      >
        {foxEarned && fox > 0 ? (
          <>Fox bonus: {sheet.foxes} fox{sheet.foxes !== 1 ? 'es' : ''} × {Math.min(yellow, blue, green, orange, purple)} (lowest) = +{fox} pts</>
        ) : foxEarned && fox === 0 ? (
          <>Fox bonus: {sheet.foxes} fox{sheet.foxes !== 1 ? 'es' : ''} earned, but lowest color is 0 so no bonus yet</>
        ) : (
          <>{SCORING_FORMULAS.foxHowToEarn}</>
        )}
      </div>
      <p className="total">Total: {total} pts</p>
      <details className="formulas">
        <summary>Scoring rules</summary>
        <dl>
          <dt>Yellow</dt>
          <dd>{SCORING_FORMULAS.yellow}</dd>
          <dt>Blue</dt>
          <dd>{SCORING_FORMULAS.blue}</dd>
          <dt>Green</dt>
          <dd>{SCORING_FORMULAS.green}</dd>
          <dt>Orange</dt>
          <dd>{SCORING_FORMULAS.orange}</dd>
          <dt>Purple</dt>
          <dd>{SCORING_FORMULAS.purple}</dd>
          <dt>Fox</dt>
          <dd>{SCORING_FORMULAS.fox}</dd>
          <dd className="fox-how-to">{SCORING_FORMULAS.foxHowToEarn}</dd>
        </dl>
      </details>
    </div>
  );
}
