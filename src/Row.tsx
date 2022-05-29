import { Clue, clueClass, CluedLetter, clueWord } from "./clue";
import { LongPressDetectEvents, useLongPress } from 'use-long-press';
import { gameDayStoragePrefix } from "./Game";
import { useState } from 'react';

export enum RowState {
  LockedIn,
  Editing,
  Pending,
}

interface RowProps {
  rowState: RowState;
  rowNum: number;
  flagPos: number;
  fibPos: number;
  locks: boolean[][];
  cluedLetters: CluedLetter[];
  annotation?: string;
  clickHandler: (row: number, position: number) => void;
  contextHandler: (row: number, position: number) => void;
}

export function Row(props: RowProps) {
 
  let [lastLongPress, setLastLongPress] = useState(0);
  let suppressClick = () => {
    return new Date().getTime() < 1000 + lastLongPress;
  };

  const bindLongPress = useLongPress((event, context) => {     
      if(isLockedIn){
        setLastLongPress(new Date().getTime());     
        props.contextHandler(props.rowNum, context.context as number);
        event.preventDefault(); 
        event.stopPropagation();           
      }
    }, {
      filterEvents: (event) => { return event.nativeEvent.which !== 3;},
      detect: LongPressDetectEvents.BOTH
    }
  );

  const isLockedIn = props.rowState === RowState.LockedIn;
  const isEditing = props.rowState === RowState.Editing;
  const letterDivs = props.cluedLetters
    .concat(Array(5).fill({ clue: Clue.Absent, letter: "" }))
    .slice(0, 5)
    .map(({ clue, letter }, i) => {
      let letterClass = "Row-letter Row-num-" + props.rowNum;
      let isFlagged = props.flagPos == i;
      if (isLockedIn && clue !== undefined) {
        letterClass += " " + clueClass(clue);
      }      
      if(props.fibPos === i) {
        letterClass += " " + "letter-known-fib";
      }
      if (props.locks[props.rowNum][i]) {
        letterClass += " " + "letter-locked";
      }
      if (isFlagged) {
        letterClass += " " + "letter-flagged";
      }
      const position = i;
      return (
        <td
          {...bindLongPress(position)}
          onClick={ (event:any)=> {
            if(isLockedIn && !suppressClick()) {
              props.clickHandler(props.rowNum, position);
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onContextMenu={ (event:any)=> {
            if(isLockedIn) {
              props.contextHandler(props.rowNum, position);
              event.preventDefault();
              event.stopPropagation();
            }
          }}
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
