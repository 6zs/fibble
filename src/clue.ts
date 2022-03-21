import { pick } from "./util";
import { Fib } from "./Game"

export enum Clue {
  Absent,
  Elsewhere,
  Correct,
}

export interface CluedLetter {
  clue?: Clue;
  letter: string;
}

export function clue(word: string, target: string): CluedLetter[] {
  let elusive: string[] = [];
  target.split("").forEach((letter, i) => {
    if (word[i] !== letter) {
      elusive.push(letter);
    }
  });
  return word.split("").map((letter, i) => {
    let j: number;
    if (target[i] === letter) {
      return { clue: Clue.Correct, letter };
    } else if ((j = elusive.indexOf(letter)) > -1) {
      // "use it up" so we don't clue at it twice
      elusive[j] = "";
      return { clue: Clue.Elsewhere, letter };
    } else {
      return { clue: Clue.Absent, letter };
    }
  });
}

export function tellfib(trueClue: CluedLetter, offset: number): CluedLetter {
  if (trueClue.clue === undefined) {
    return trueClue;
  }
  const answers = [Clue.Correct, Clue.Elsewhere, Clue.Absent];
  const index = answers.lastIndexOf(trueClue.clue);
  if (index >= 0) {
    trueClue.clue = answers[(index+offset)%answers.length];
  }
  return trueClue;
}

export function fibclue(word: string, target: string, fib: Fib): CluedLetter[] {
  let trueClues: CluedLetter[] = clue(word, target);
  if (trueClues[fib.position] !== undefined) {
    trueClues[fib.position] = tellfib(trueClues[fib.position], fib.offset);
  }
  return trueClues;
}

export function clueClass(clue: Clue): string {
  if (clue === Clue.Absent) {
    return "letter-absent";
  } else if (clue === Clue.Elsewhere) {
    return "letter-elsewhere";
  } else {
    return "letter-correct";
  }
}

export function clueWord(clue: Clue): string {
  if (clue === Clue.Absent) {
    return "no";
  } else if (clue === Clue.Elsewhere) {
    return "elsewhere";
  } else {
    return "correct";
  }
}

export function describeClue(clue: CluedLetter[]): string {
  return clue
    .map(({ letter, clue }) => letter.toUpperCase() + " " + clueWord(clue!))
    .join(", ");
}
