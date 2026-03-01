import type { ScoringSheet as Sheet } from '../types/game';
import { YellowArea } from './color-areas/YellowArea';
import { BlueArea } from './color-areas/BlueArea';
import { GreenArea } from './color-areas/GreenArea';
import { OrangeArea } from './color-areas/OrangeArea';
import { PurpleArea } from './color-areas/PurpleArea';

interface ScoringSheetProps {
  sheet: Sheet;
  isActiveSheet: boolean;
  selectedDie: { color: string; value: number } | null;
  blueWhiteSum: number;
  phase: string;
  onPlace: (area: string, placement: Record<string, number>) => void;
}

export function ScoringSheetComponent({ sheet, isActiveSheet, selectedDie, blueWhiteSum, phase, onPlace }: ScoringSheetProps) {
  const canPlace = Boolean(isActiveSheet && phase === 'placing' && selectedDie);
  const canPlaceBlue = canPlace && (selectedDie?.color === 'blue' || selectedDie?.color === 'white');

  return (
    <div className="scoring-sheet">
      <YellowArea
        sheet={sheet.yellow}
        selectedValue={selectedDie?.value}
        canPlace={canPlace && (selectedDie?.color === 'yellow' || selectedDie?.color === 'white')}
        onPlace={(placement) => onPlace('yellow', placement)}
      />
      <BlueArea
        sheet={sheet.blue}
        blueWhiteSum={blueWhiteSum}
        canPlace={canPlaceBlue}
        onPlace={(placement) => onPlace('blue', placement)}
      />
      <GreenArea
        sheet={sheet.green}
        selectedValue={selectedDie?.value}
        canPlace={canPlace && (selectedDie?.color === 'green' || selectedDie?.color === 'white')}
        onPlace={(placement) => onPlace('green', placement)}
      />
      <OrangeArea
        sheet={sheet.orange}
        selectedValue={selectedDie?.value}
        canPlace={canPlace && (selectedDie?.color === 'orange' || selectedDie?.color === 'white')}
        onPlace={(placement) => onPlace('orange', placement)}
      />
      <PurpleArea
        sheet={sheet.purple}
        selectedValue={selectedDie?.value}
        canPlace={canPlace && (selectedDie?.color === 'purple' || selectedDie?.color === 'white')}
        onPlace={(placement) => onPlace('purple', placement)}
      />
    </div>
  );
}
