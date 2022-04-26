import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { gameName, maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
        <p>
          {gameName} is a variant of {" "}
          <a href="https://www.powerlanguage.co.uk/wordle/"> 
          Wordle
          </a> by Josh Wardle and is one of three sibling sites{" "}
          <br /><br /> <a href="https://xordle.xyz">Xordle</a> by <a href="https://twitter.com/kellydornhaus">keldor</a><br/>Two secret words, one board, no overlap between the words. 
          <br /><br /> <a href="https://fibble.xyz">Fibble</a> by K &amp; R Garfield, coded by keldor <br/>Lies to you once per row.
          <br /><br /> <a href="https://warmle.org">Warmle</a> by Mike Elliott, coded by keldor <br/>Yellows tell you if you've gotten close in that position.
        </p>
      <hr /> 
      <p className="App-instructions">
        <h1>Fibble rules</h1>
        Letters in your guess are:
        <br />🟩 Green if it's the right letter in the right spot
        <br />🟨 Yellow if it's the right letter in the wrong spot
        <br />⬛ Grey if it does not appear in the word 
        <br />
        <br />But there's one lie in every row!
        <br />The lies are in the same positions for everyone.
        <br />Good luck!
        <br />P.S. You can use 🏴 to track which letters you believe are lies.
      </p>
      <hr />
      <p>
        report issues{" "}
        <a href="https://github.com/6zs/fibble/issues">here</a>
        <br />code based on a fork of <a href="https://github.com/lynn/hello-wordl">hello wordl</a>
      </p>
      <p>
      </p>
    </div>
  );
}
