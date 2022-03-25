import { useEffect, useRef, useState } from "react";
import { Row, RowState } from "./Row";
import dictionary from "./dictionary.json";
import { Clue, clue, CluedLetter, describeClue, fibclue } from "./clue";
import { Keyboard } from "./Keyboard";
import targetList from "./targets.json";
import {
  gameName,
  pick,
  speak,
  dayNum,
  todayDayNum,
  cheat,
  maxGuesses,
  makeRandom
} from "./util";

import { Day } from "./Stats"

export enum GameState {
  Playing,
  Won,
  Lost,
}

export const gameDayStoragePrefix = "fibble.xyz-game-day-";
export const guessesDayStoragePrefix = "fibble.xyz-guesses-day-";
export const flagsDayStoragePrefix = "fibble.xyz-flags-day-";

export interface Fib
{
  position: number;
  offset: number;
}

function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((t: T) => T)) => void] {
  const [current, setCurrent] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch (e) {
      return initial;
    }
  });
  const setSetting = (value: T | ((t: T) => T)) => {
    try {
      const v = value instanceof Function ? value(current) : value;
      setCurrent(v);
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  };
  return [current, setSetting];
}

interface GameProps {
  maxGuesses: number;
  hidden: boolean;
  colorBlind: boolean;
  keyboardLayout: string;
}

const eligible = targetList.slice(0, targetList.indexOf("murky") + 1).filter((word) => word.length === 5); // Words no rarer than this one

function isValidClue(word: string) {
  if (/\*/.test(word)) {
    return false;
  }
  return true;
}

function countMatching(cluedLetters: CluedLetter[]) : Map<Clue, number> {
  let counts = new Map<Clue,number>();
  for (const letter of cluedLetters) {
    let clue = letter.clue;
    if (clue) {
      let count = counts.get(clue) ?? 0;
      counts.set(clue, count+1);
    }
  }
  return counts;
}

function isGoodInitialGuess(target: string, candidate: string) {
  if (/\*/.test(candidate)) {
    return false;
  }
  if (candidate.length !== target.length) {
    return false;
  }
  let hints = clue(candidate, target);
  let green = countMatching(hints).get(Clue.Correct) ?? 0;
  let yellow = countMatching(hints).get(Clue.Elsewhere) ?? 0;
  return green + yellow < 5;
}

function randomTarget(random: ()=>number): string {
  let candidate: string;
  do {
    candidate = pick(eligible, random);
  } while (!isValidClue(candidate));
  return candidate;
}

function initialGuess(target: string, random: ()=>number): [string] {
  let candidate: string;
  do {
    candidate = pick(eligible, random);
  } while(!isGoodInitialGuess(target, candidate));
  return [candidate];
}

function initialFlags(): number[] {
  let flags = new Array<number>(maxGuesses);
  for (let i = 0; i < maxGuesses; ++i) { 
    flags[i] = -1;
  }
  return flags;
}

function gameOverText(state: GameState, target: string) : string {
  const verbed = state === GameState.Won ? "won" : "lost";
  return `You ${verbed}! The answer was ${target.toUpperCase()}. Play again tomorrow!`; 
}

let uniqueGame = 873642867;
export function makePuzzle(dayNum: number) : Puzzle {
  let random = makeRandom(dayNum+uniqueGame);
  let target = randomTarget(random);
  let fibs = new Array<Fib>(maxGuesses);
  const positions = [0,1,2,3,4];
  for (let i = 0; i < maxGuesses; ++i) {
	  fibs[i]= { position: pick(positions, random), offset: pick([1,2], random) };
  }
 
  let puzzle: Puzzle = {
    target: target,
    initialGuesses: initialGuess(target, random),
    fibs: fibs
  };
  return puzzle;
}

export function emojiBlock(day: Day, colorBlind: boolean) : string {
  const emoji = colorBlind
    ? ["⬛", "🟦", "🟧"]
    : ["⬛", "🟨", "🟩"];
  return day.guesses.map((guess, i) =>
    (day.gameState === GameState.Won && i === (day.guesses.length-1) ? clue(guess,day.puzzle.target) : fibclue(guess, day.puzzle.target, day.puzzle.fibs[i]) )  
          .map((c) => emoji[c.clue ?? 0])
          .join("")
      )
      .join("\n");
}

export interface Puzzle {
  target: string,
  initialGuesses: string[],
  fibs: Array<Fib>
}

function Game(props: GameProps) {

  const [puzzle, setPuzzle] = useState(() => {
    return makePuzzle(dayNum);
  });

  const [gameState, setGameState] = useLocalStorage<GameState>(gameDayStoragePrefix+dayNum, GameState.Playing);
  const [guesses, setGuesses] = useLocalStorage<string[]>(guessesDayStoragePrefix+dayNum, puzzle.initialGuesses);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [hint, setHint] = useState<string>(getHintFromState());
  const [flags, setFlags] = useLocalStorage<number[]>(flagsDayStoragePrefix+dayNum, initialFlags());
   
  const tableRef = useRef<HTMLTableElement>(null);
  async function share(copiedHint: string, text?: string) {
    const url = window.location.origin + window.location.pathname;
    const body = (text ? text + "\n" : "") + url;
    if (
      /android|iphone|ipad|ipod|webos/i.test(navigator.userAgent) &&
      !/firefox/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({ text: body });
        return;
      } catch (e) {
        console.warn("navigator.share failed:", e);
      }
    }
    try {
      await navigator.clipboard.writeText(body);
      setHint(copiedHint);
      return;
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed:", e);
    }
    setHint(url);
  }

  function getHintFromState() {    
    if  (gameState === GameState.Won || gameState === GameState.Lost) {
      return gameOverText(gameState, puzzle.target);
    }
    if ( guesses.length === 0 && currentGuess === undefined ) {
      return `start guessin'`;
    }
    return ``;
  }

  const onClickFlag = (row: number, position: number) => {
    let newFlags = [...flags];
    newFlags[row] = newFlags[row] === position ? -1 : position;
    setFlags(newFlags);
  };
  
  const onKey = (key: string) => {
    if (gameState !== GameState.Playing) {
      return;
    }

    if (guesses.length === props.maxGuesses) {
      return;
    }
    if (/^[a-z]$/i.test(key)) {
      setCurrentGuess((guess) =>
        (guess + key.toLowerCase()).slice(0, 5)
      );
      tableRef.current?.focus();
      setHint(getHintFromState());
    } else if (key === "Backspace") {
      setCurrentGuess((guess) => guess.slice(0, -1));
      setHint(getHintFromState());
    } else if (key === "Enter") {
    
      if (currentGuess.length !== 5) {
        setHint("More letters, please.");
        return;
      }
      if(guesses.includes(currentGuess)) {
        setHint("You've already guessed that!");
        return;
      }      
      if (!dictionary.includes(currentGuess)) {
        setHint(`That's not in the word list!`);
        return;
      }
     
      setGuesses((guesses) => guesses.concat([currentGuess]));
      setCurrentGuess("");
      speak(describeClue(fibclue(currentGuess, puzzle.target, puzzle.fibs[guesses.length])))
      doWinOrLose();
    }
  };

  const doWinOrLose = () => {
    if (puzzle.target === "") {
      return;
    }
    if (guesses.includes(puzzle.target)) {
      setGameState(GameState.Won);
    } else if (guesses.length >= props.maxGuesses) {
      setGameState(GameState.Lost);
    } 
    setHint(getHintFromState());    
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        onKey(e.key);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [currentGuess, gameState]);

  useEffect(() => {
    doWinOrLose();
  }, [currentGuess, gameState, guesses, puzzle.target]);

  let reduceCorrect = (prev: CluedLetter, iter: CluedLetter, currentIndex: number, array: CluedLetter[]) => {
    let reduced: CluedLetter = prev;
    if ( iter.clue !== Clue.Correct ) {
      reduced.clue = Clue.Absent;
    }
    return reduced;
  };

  let letterInfo = new Map<string, Clue>();
  const tableRows = Array(props.maxGuesses)
    .fill(undefined)
    .map((_, i) => {
      const guess = [...guesses, currentGuess][i] ?? "";
      const finalWinningGuess = gameState === GameState.Won && i === guesses.length-1;
      const cluedLetters = finalWinningGuess ? clue(guess,puzzle.target) : fibclue(guess, puzzle.target, puzzle.fibs[i]);
      const lockedIn = i < guesses.length;
      if (lockedIn) {
        for (let j = 0; j < cluedLetters.length; ++j) {
          const { clue, letter } = cluedLetters[j];
          if (clue === undefined) break;
          if (flags[i] == j) continue;
          const old = letterInfo.get(letter);
          if (old === undefined || clue > old) {
            letterInfo.set(letter, clue);
          }
        }
      }
      return (
        <Row
          key={i}
          rowNum={i}
          fibPos={ (gameState === GameState.Playing || i >= guesses.length-1 ) ? -1 : puzzle.fibs[i].position }
          flagPos={
            (gameState === GameState.Won && i === guesses.length-1 ) ? -1 : flags[i]}
          rowState={
            lockedIn
              ? RowState.LockedIn
              : (i === guesses.length)
              ? RowState.Editing
              : RowState.Pending
          }
          cluedLetters={cluedLetters}
          clickHandler={(row: number, position: number) => { if( gameState === GameState.Playing ) { onClickFlag(row, position); } } }
          annotation={`\u00a0`}          
        />
      );
    });

  const cheatText = cheat ? ` ${puzzle.target}` : "";
  const canPrev = dayNum > 1;
  const canNext = dayNum < todayDayNum;
  const prevLink = "?d=" + (dayNum-1).toString();
  const nextLink = "?d=" + (dayNum+1).toString();
  let correctFlags = 0;
  let totalFlags = 0;
  for (let i = 0; i < maxGuesses; ++i) {
    if (puzzle.fibs[i].position === flags[i]) {
      correctFlags++;
    }
    if (flags[i] !== -1) {
      totalFlags++;
    }
  }
  
  const flagShare = (totalFlags > 0) ? (" " + correctFlags.toString() + "/" + totalFlags.toString() + "🏴") : "";

  return (
    <div className="Game" style={{ display: props.hidden ? "none" : "block" }}>
      <div className="Game-options">
      {canPrev && <span><a href={prevLink}>prev</a> |</span>}
      <span>day {dayNum}{`${cheatText}`}</span>
      {canNext && <span>| <a href={nextLink}>next</a></span>}
      </div>
      <table
        className="Game-rows"
        tabIndex={0}
        aria-label="table of guesses"
        ref={tableRef}
      >
        <tbody>{tableRows}</tbody>
      </table>
      <p
        role="alert"
        style={{
          userSelect: /https?:/.test(hint) ? "text" : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {hint || `\u00a0`}
        {gameState !== GameState.Playing && (
          <p>
          <button
            onClick={() => {
              const emoji = props.colorBlind
                ? ["⬛", "🟦", "🟧"]
                : ["⬛", "🟨", "🟩"];
              const score = gameState === GameState.Lost ? "X" : guesses.length;
              share(
                "result copied to clipboard!",
                `${gameName} #${dayNum} ${score}/${props.maxGuesses}${flagShare}\n` +
                  emojiBlock({guesses:guesses, puzzle:puzzle, gameState:gameState, flags:flags}, props.colorBlind)                
              );
            }}
          >
            share emoji results
          </button>
          </p>
        )}
      </p>
      <Keyboard
        layout={props.keyboardLayout}
        letterInfo={letterInfo}
        onKey={onKey}
      />
    </div>
  );
}

export default Game;
