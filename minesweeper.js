/**
 * @file minesweeper.js
 * @author Devin Arena
 * @since 12/5/2019
 * @description Grabs the DOM and handles main game logic. 
 *              AI and Tile are just helper files.
 */

var canvas = document.getElementById("GameCanvas");

var ctx = canvas.getContext("2d");

var board;
var mines;
var tileSize;
let canvasSize;

let boardSize = 20;
let lost = false;
var won = false;
let numMines = 60;
let numFlags = 0;
let time = 0;
let guiY;

var ai;
let aiSolve = false;
var debugProbability = false;
var revealedTiles = 0;

var flagImage = new Image();
flagImage.src = "image/flag.png";
var mineImage = new Image();
mineImage.src = "image/mine.png";

var init = () => {
  canvasSize = 640;
  createBoard(boardSize);
  guiY = tileSize * boardSize + 1;
  ai = new AI(this);

  setInterval(update, 1000 / 60);
}

var update = () => {
  render();

  if (!won && !lost) {
    time++;
    if (time % (60 * 0.1) === 0) {
      if (aiSolve)
        ai.nextMove();
      else if (debugProbability) {
        ai.calculateProbabilities();
      }
    }
  }
}

var render = () => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      board[i][j].draw(ctx);
    }
  }

  ctx.fillStyle = "#eee";
  ctx.fillRect(0, guiY, canvasSize, 159);
  ctx.fillStyle = "#333";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.drawImage(mineImage, canvasSize / 3 - 64, guiY + 56 - 32);
  ctx.fillText(numMines - numFlags, canvasSize / 3, guiY + 54 + 1);
  ctx.fillText(formatTime(), 2 * canvasSize / 3, guiY + 54 + 1);

  if (lost) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.fillRect(tileSize, canvasSize / 2 - tileSize * 2, canvasSize - tileSize * 2, tileSize * 3);
    ctx.strokeRect(tileSize, canvasSize / 2 - tileSize * 2, canvasSize - tileSize * 2, tileSize * 3);
    ctx.fillStyle = "#300";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("You lost, press F5 to restart.", canvasSize / 2, canvasSize / 2 - tileSize / 4);
  }

  if (won) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.fillRect(tileSize, canvasSize / 2 - tileSize * 3, canvasSize - tileSize * 2, tileSize * 5);
    ctx.strokeRect(tileSize, canvasSize / 2 - tileSize * 3, canvasSize - tileSize * 2, tileSize * 5);
    ctx.fillStyle = "#030";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("You won!", canvasSize / 2, canvasSize / 2 - tileSize);
    ctx.font = "24px Arial";
    ctx.fillText("Time: " + formatTime(), canvasSize / 2, canvasSize / 2);
    ctx.fillText("Press F5 to play again.", canvasSize / 2, canvasSize / 2 + tileSize);
  }
}

var createBoard = (size) => {
  tileSize = canvasSize / size;
  generateMines(size * size);
  board = new Array(size);
  for (let i = 0; i < size; i++) {
    board[i] = new Array(size);
    for (let j = 0; j < size; j++) {
      board[i][j] = new Tile(this, i, j, mines.includes(i * 20 + j));
    }
  }
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (!board[i][j].mine) {
        board[i][j].calculateAdjacentMines();
      }
    }
  }
}

var generateMines = (numTiles) => {
  let possible = new Array(numTiles);
  mines = new Array(numMines);
  for (let i = 0; i < numTiles; i++) {
    possible[i] = i;
  }
  for (let i = 0; i < numMines; i++) {
    let index = Math.round(Math.random() * numTiles);
    mines[i] = index;
    possible.splice(index, i);
  }
}

var lose = () => {
  lost = true;
  aiSolve = false;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      board[i][j].revealed = true;
    }
  }
}

var checkWin = () => {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      let t = board[i][j];
      if (!t.revealed && !t.mine)
        return;
      if (t.mine && !t.flagged)
        return;
    }
  }
  won = true;
  aiSolve = false;
  debugProbability = false;
  numFlags = numMines;
}

var checkNumFlags = () => {
  numFlags = 0;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      let t = board[i][j];
      if (t.flagged)
        numFlags++;
    }
  }
}

var formatTime = () => {
  let seconds = Math.round(time / 60);
  let min = Math.floor(seconds / 60);
  seconds -= min * 60;
  if (seconds < 10)
    return min + ":0" + seconds;
  return min + ":" + seconds;
}

window.onload = () => {
  init();
};

// Input for a left click event
canvas.addEventListener('click', (evt) => {
  let rect = canvas.getBoundingClientRect();
  let x = evt.clientX - rect.left;
  let y = evt.clientY - rect.top;
  if (!lost && !won) {
    let tileX = Math.floor(x / tileSize);
    let tileY = Math.floor(y / tileSize);
    board[tileX][tileY].reveal();
    checkWin();
  }
});

// Input for a right click event
canvas.addEventListener('contextmenu', (evt) => {
  evt.preventDefault();
  let rect = canvas.getBoundingClientRect();
  let x = evt.clientX - rect.left;
  let y = evt.clientY - rect.top;
  if (!lost && !won) {
    let tileX = Math.floor(x / tileSize);
    let tileY = Math.floor(y / tileSize);
    board[tileX][tileY].flag();
    checkWin();
  }
});

window.addEventListener("keydown", (evt) => {
  console.log(evt.key);
  if (evt.key === 'a') {
    if (!aiSolve) {
      aiSolve = true;
      console.log("AI will now solve...")
    } else {
      aiSolve = false;
      console.log("AI stopped solving...")
    }
  }
  if (evt.key === 'd') {
    debugProbability = !debugProbability;
  }
});
