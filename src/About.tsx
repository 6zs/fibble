import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { gameName, maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
        <p>
          {gameName} is a variant of {" "}
          <a href="https://www.powerlanguage.co.uk/wordle/">
            wordle
          </a>{" "}
          <br />code based on a fork of <a href="https://github.com/lynn/hello-wordl">hello wordl</a>
        </p>
      <p className="App-instructions">
        letters in your guess are:
        <br />🟩 green if it's the right letter in the right spot
        <br />🟨 yellow if it's the right letter in the wrong spot
        <br />⬛ grey if it does not appear in either word 
        <br />
        <br />but there's one fib in every row
        <br />the fibs are in the same positions for everyone
        <br />good luck!
        <br />p.s. you can use 🏴 to track which letters you believe are lies
      </p>
      <hr />
      <p>
        report issues{" "}
        <a href="https://github.com/6zs/fibble/issues">here</a>
      </p>
      <p>
      </p>
    </div>
  );
}
