/**
 * @file minesweeper.js
 * @author Devin Arena
 * @since 12/5/2019
 * @description Grabs the DOM and handles main game logic. 
 *              AI and Tile are just helper files.
 */

/* 
    NOTE: there are definitely some improvements to be made, but this AI can solve
    puzzles up to 90 mines. After that its effectiveness begins to decrease as the
    puzzles become more extreme.
*/

// var are variables used in global scope while
// let are variables used in function scope (this file)

let canvas = document.getElementById("GameCanvas");

let ctx = canvas.getContext("2d");

// relating to the board
var board;
var mines;
var tileSize;
let canvasSize;
let boardSize = 20;
let lost = false;
var won = false;
let numMines = 60;
let numFlags = 0;
let lightning = true;

// other
let time = 0;
let guiY;

// relating to the AI
var ai;
let aiSolve = false;
var debugProbability = false;
var revealedTiles = 0;

// relating to images
var flagImage = new Image();
flagImage.src = "image/flag.png";
var mineImage = new Image();
mineImage.src = "image/mine.png";

/**
 * Initializes the board, ai, and main game loop.
 */
const init = () => {
  canvasSize = 640;
  // create the board and AI
  createBoard(boardSize);
  guiY = tileSize * boardSize + 1;
  ai = new AI(this);

  // set the game loop
  setInterval(update, 1000 / 60);
}

/**
 * Main game loop method. Renders the screen and if the AI is activated
 * or the debug map is up, handles timed logic (ai moves and calculating
 * probability map).
 */
const update = () => {
  render();

  // if the game is still being played
  if (!won && !lost) {
    time++;
    if (time % (60 * 0.1) === 0 || lightning) {
      // every 1/10 of a second make an AI move or update the map if active.
      if (aiSolve)
        ai.nextMove();
      else if (debugProbability) {
        ai.calculateProbabilities();
      }
    }
  }
}

/**
 * Render method, draws everything on the screen.
 */
const render = () => {
  // draw a black backdrop
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // renders the board (by drawing each tile)
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  // iterate over each row and column and draw the respective tile
  board.forEach(row => {
    row.forEach(tile => {
      tile.draw(ctx);
    });
  });

  // MAIN GUI
  // background
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, guiY, canvasSize, 159);
  // font settings
  ctx.fillStyle = "#333";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  // mine counter
  ctx.drawImage(mineImage, canvasSize / 3 - 64, guiY + 56 - 32);
  ctx.fillText(numMines - numFlags, canvasSize / 3, guiY + 54 + 1);
  // timer
  ctx.fillText(formatTime(), 2 * canvasSize / 3, guiY + 54 + 1);

  // LOSE DIALOG
  if (lost) {
    // container
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.fillRect(tileSize, canvasSize / 2 - tileSize * 2, canvasSize - tileSize * 2, tileSize * 3);
    ctx.strokeRect(tileSize, canvasSize / 2 - tileSize * 2, canvasSize - tileSize * 2, tileSize * 3);
    // font settings
    ctx.fillStyle = "#300";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    // text
    ctx.fillText("You lost, press F5 to restart.", canvasSize / 2, canvasSize / 2 - tileSize / 4);
  }

  // WON DIALOG
  if (won) {
    // container
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.fillRect(tileSize, canvasSize / 2 - tileSize * 3, canvasSize - tileSize * 2, tileSize * 5);
    ctx.strokeRect(tileSize, canvasSize / 2 - tileSize * 3, canvasSize - tileSize * 2, tileSize * 5);
    // font settings
    ctx.fillStyle = "#030";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    // header
    ctx.fillText("You won!", canvasSize / 2, canvasSize / 2 - tileSize);
    ctx.font = "24px Arial";
    // stats and replay message
    ctx.fillText("Time: " + formatTime(), canvasSize / 2, canvasSize / 2);
    ctx.fillText("Press F5 to play again.", canvasSize / 2, canvasSize / 2 + tileSize);
  }
}

/**
 * Generates the board based on size. Designates tiles as 
 * mines and assigns each non-mine tile a number.
 * 
 * @param {number} size the size of the board
 */
const createBoard = (size) => {
  // calculate tileSize (num tiles per row and col)
  tileSize = canvasSize / size;
  // generate random mines
  generateMines(size * size);
  // create the board array
  board = new Array(size);
  for (let i = 0; i < size; i++) {
    // fill the board array with size rows
    board[i] = new Array(size);
    for (let j = 0; j < size; j++) {
      // fill the rows with size tiles
      board[i][j] = new Tile(this, i, j, mines.includes(i * 20 + j));
    }
  }
  // assigns each tile a number if its not a mine
  board.forEach(row => {
    row.forEach(tile => {
      if (!tile.mine) tile.calculateAdjacentMines();
    });
  });
}

/**
 * Generates numMines mines assigned to tile 0-numTiles.
 * Ensures each generated position is unique.
 * 
 * @param {number} numTiles the number of tiles
 */
const generateMines = (numTiles) => {
  // create a possible number for each tile
  let possible = new Array(numTiles);
  // init the mines array
  mines = new Array(numMines);
  // init possible with every tile id
  for (let i = 0; i < numTiles; i++) {
    possible[i] = i;
  }
  // assigns a random id to each tile and removes that id from the pool
  for (let i = 0; i < numMines; i++) {
    // grab the index of the tile from the possible array
    let posIndex = Math.round(Math.random() * possible.length);
    // set the tile index associated with the possible index to be a mine
    mines[i] = possible[posIndex];
    // remove the possible index from the possible tiles
    possible.splice(posIndex, 1);
  }
}

/**
 * When a mine is pressed, we lost the game. 
 * Show the lose message and display all tiles.
 */
var lose = () => {
  lost = true;
  aiSolve = false;
  // reveal every tile
  board.forEach(row => {
    row.forEach(tile => {
      tile.revealed = true;
    });
  });
}

/**
 * Determines if you've won the game by making sure every tile is satisfied.
 */
var checkWin = () => {
  let no = false;
  // for every tile on the board
  board.forEach(row => {
    row.forEach(tile => {
      // if this tile is not revealed and not a mine, we haven't won yet
      if (!tile.revealed && !tile.mine)
        no = true;
      // if this tile is 
      if (tile.mine && !tile.flagged)
        no = true;
    });
  });
  if (no)
    return;
  // we've won, stop the ai and turn off the debug map
  won = true;
  aiSolve = false;
  debugProbability = false;
  numFlags = numMines; // to fix an off by one error sometimes
}

/**
 * Calculates the number of flags by checking each tile.
 * Assigns it to the numFlags variable.
 */
var checkNumFlags = () => {
  numFlags = 0;
  board.forEach(row => {
    row.forEach(tile => {
      // if a tile is flagged, increase the number of flags
      if (tile.flagged)
        numFlags++;
    });
  });
}

/**
 * Helper method to format the time as a string.
 * 
 * @returns {String} the formatted time
 */
const formatTime = () => {
  let seconds = Math.round(time / 60); // calc number of seconds (time updates 60 times/sec)
  let min = Math.floor(seconds / 60); // calc the number of minutes
  seconds -= min * 60; // subtract 60 * however many minutes we can factor out
  if (seconds < 10) // pad seconds < 10 (e.g. :1 becomes :01)
    return min + ":0" + seconds;
  return min + ":" + seconds;
}

/**
 * Entry point, starts the game.
 */
window.onload = () => {
  init();
};

/**
 * Left click event, if a tile is pressed, reveal it if possible.
 */
canvas.addEventListener('click', evt => {
  let rect = canvas.getBoundingClientRect();
  let x = evt.clientX - rect.left; // adjusted click x
  let y = evt.clientY - rect.top; // adjusted click y
  if (!lost && !won) { // if we're still playing
    let tileX = Math.floor(x / tileSize); // calcs the tile x at the clicked position
    let tileY = Math.floor(y / tileSize); // calcs the tile y at the clicked position
    board[tileX][tileY].reveal(); // reveal this tile
    checkWin(); // we may have won
  }
});

/**
 * Right click event, if a tile is not revealed, flag it.
 */
canvas.addEventListener('contextmenu', evt => {
  evt.preventDefault(); // don't show menu
  let rect = canvas.getBoundingClientRect();
  let x = evt.clientX - rect.left; // adjusted click x
  let y = evt.clientY - rect.top; // adjusted click y
  if (!lost && !won) { // if we're still playing
    let tileX = Math.floor(x / tileSize); // calcs the tile x at the clicked position
    let tileY = Math.floor(y / tileSize); // calcs the tile y at the clicked position
    board[tileX][tileY].flag(); // flag this tile
    checkWin(); // we may have won
  }
});

/**
 * Handles keyboard events.
 * Pressing 'a' toggles the AI solving
 * Pressing 'd' toggles the probability map
 */
window.addEventListener("keydown", evt => {
  // toggle AI
  if (evt.key === 'a') {
    if (!aiSolve) {
      aiSolve = true;
      console.log("AI will now solve...")
    } else {
      aiSolve = false;
      console.log("AI stopped solving...")
    }
  }
  // toggle probability map
  if (evt.key === 'd') {
    debugProbability = !debugProbability;
  }
});
