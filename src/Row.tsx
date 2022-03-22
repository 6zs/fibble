import { Clue, clueClass, CluedLetter, clueWord } from "./clue";

export enum RowState {
  LockedIn,
  Editing,
  Pending,
}

interface RowProps {
  rowState: RowState;
  rowNum: number;
  flagPos: number;
  cluedLetters: CluedLetter[];
  annotation?: string;
  clickHandler: (row: number, position: number) => void;
}

export function Row(props: RowProps) {
  const isLockedIn = props.rowState === RowState.LockedIn;
  const isEditing = props.rowState === RowState.Editing;
  const letterDivs = props.cluedLetters
    .concat(Array(5).fill({ clue: Clue.Absent, letter: "" }))
    .slice(0, 5)
    .map(({ clue, letter }, i) => {
      let letterClass = "Row-letter";
      let isFlagged = props.flagPos == i;
      if (isLockedIn && clue !== undefined) {
        letterClass += " " + clueClass(clue);
      }
      const position = i;
      return (
        <td
          onClick={(event:any) => {if(isLockedIn){props.clickHandler(props.rowNum, position);}}}
          key={i}
          className={letterClass}
          aria-live={isEditing ? "assertive" : "off"}
          aria-label={
            isLockedIn
              ? letter.toUpperCase() +
                (clue === undefined ? "" : ": " + clueWord(clue))
              : ""
          }
        >
          <div className="Clue-letter">{letter}</div>
          {isFlagged && <div className="Fib-flag-container"><div className="Fib-flag">🏴 </div></div>}
        </td>
      );
    });
  let rowClass = "Row";
  if (isLockedIn) rowClass += " Row-locked-in";
  return (
    <tr className={rowClass}>
      {letterDivs}
      <div className="Fib-flag">
      {isLockedIn && props.flagPos === -1 && <span>🏴 </span>}
      {isLockedIn && props.flagPos !== -1 && <span onClick={(event:any) => {if(isLockedIn){props.clickHandler(props.rowNum, -1);}}}> 🏳️</span>}
      {!isLockedIn && <span>🏳️</span>}
      </div>
      {props.annotation && (
        <span className="Row-annotation">{props.annotation}</span>
      )}
    </tr>
  );
}
