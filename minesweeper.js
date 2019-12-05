var canvas = document.getElementById("GameCanvas");

var ctx = canvas.getContext("2d");

var board;
var mines;
var tileSize;
var canvasSize;

var boardSize = 20;
var lost = false;
var won = false;
var numMines = 60;
var numFlags = 0;
var time = 0;
var guiY;

var ai;
var aiSolve = false;
var debugProbability = false;
var revealedTiles = 0;

var flagImage = new Image();
flagImage.src = "image/flag.png";
var mineImage = new Image();
mineImage.src = "image/mine.png";

function init() {
  canvasSize = 640;
  createBoard(boardSize);
  guiY = tileSize * boardSize + 1;

  setInterval(update, 1000 / 60);
}

function update() {
  render();

  if (!won && !lost) {
    time++;
    if(time % (60 * 0.2) == 0 && aiSolve) {
      ai.nextMove();
    }
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
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

  if(won) {
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

function createBoard(size) {
  tileSize = canvasSize / size;
  generateMines(size * size);
  board = new Array(size);
  for(var i = 0; i < size; i++) {
    board[i] = new Array(size);
    for(var j = 0; j < size; j++) {
      board[i][j] = new Tile(this, i, j, mines.includes(i * 20 + j));
    }
  }
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
      if(!board[i][j].mine) {
        board[i][j].calculateAdjacentMines();
      }
    }
  }
}

function generateMines(numTiles) {
  var possible = new Array(numTiles);
  mines = new Array(numMines);
  for(var i = 0; i < numTiles; i++) {
    possible[i] = i;
  }
  for(var i = 0; i < numMines; i++) {
    var index = Math.round(Math.random() * numTiles);
    mines[i] = index;
    possible.splice(index, i);
  }
}

function lose() {
  lost = true;
  aiSolve = false;
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
      board[i][j].revealed = true;
    }
  }
}

function checkWin() {
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
      var t = board[i][j];
      if(!t.revealed && !t.mine)
        return;
      if(t.mine && !t.flagged)
        return;
    }
  }
  won = true;
  aiSolve = false;
  debugProbability = false;
  numFlags = numMines;
}

function checkNumFlags() {
  numFlags = 0;
  for(var i = 0; i < board.length; i++) {
    for(var j = 0; j < board[i].length; j++) {
      var t = board[i][j];
      if(t.flagged)
        numFlags++;
    }
  }
}

function formatTime() {
  var seconds = Math.round(time / 60);
  var min = Math.floor(seconds / 60);
  seconds -= min * 60;
  if(seconds < 10)
    return min + ":0" + seconds;
  return min + ":" + seconds;
}

window.onload = function() {
  init();
};

// Input for a left click event
canvas.addEventListener('click', function(evt) {
  var rect = canvas.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  if(!lost && !won) {
    var tileX = Math.floor(x / tileSize);
    var tileY = Math.floor(y / tileSize);
    board[tileX][tileY].reveal();
    checkWin();
  }
});

// Input for a right click event
canvas.addEventListener('contextmenu', function(evt) {
  evt.preventDefault();
  var rect = canvas.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  if(!lost && !won) {
    var tileX = Math.floor(x / tileSize);
    var tileY = Math.floor(y / tileSize);
    board[tileX][tileY].flag();
    checkWin();
  }
});

window.addEventListener("keydown", function(evt) {
  if(evt.keyCode == 65) {
    if(!aiSolve) {
      aiSolve = true;
      ai = new AI(this);
      console.log("AI will now solve...")
    } else {
      aiSolve = false;
      console.log("AI stopped solving...")
    }
  }
  if(evt.keyCode == 68) {
    if(aiSolve) {
      debugProbability = !debugProbability;
    }
  }
});
