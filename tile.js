class Tile {
  static colors = [ "#009", "#090", "#900", "#990", "#999", "#030", "#003", "#300" ];
  revealed = false;
  number = 0;
  flagged = false;
  constructor(game, x, y, mine, number) {
    this.game = game;
    this.size = this.game.tileSize;
    this.x = x;
    this.y = y;
    this.mine = mine;
  }

  draw(ctx) {
    if(!this.revealed) {
      ctx.fillStyle = "#ccc";
    } else {
      ctx.fillStyle = "#aaa";
    }
    ctx.fillRect(this.x * this.size, this.y * this.size, this.size, this.size);
    ctx.strokeRect(this.x * this.size, this.y * this.size, this.size, this.size);
    if (this.revealed && !this.mine && this.number > 0) {
      ctx.font = "24px Arial";
      ctx.fillStyle = Tile.colors[this.number - 1];
      ctx.textAlign = "center";
      ctx.fillText(this.number, this.x * this.size + this.size / 2, this.y * this.size + this.size / 2 + 8);
    }
    if(this.revealed && this.mine) {
      ctx.drawImage(this.game.mineImage, this.x * this.size + 4, this.y * this.size + 4, this.size - 8, this.size - 8);
    }
    if(this.flagged) {
      ctx.drawImage(this.game.flagImage, this.x * this.size + 4, this.y * this.size + 4, this.size - 8, this.size - 8);
    }
    if(this.game.debugProbability) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(this.game.ai.probabilityMap[this.x][this.y], this.x * this.size + this.size / 2, this.y * this.size + this.size / 2 + 8);
    }
  }

  calculateAdjacentMines() {
    for(var i = -1; i <= 1; i++) {
      for(var j = -1; j <= 1; j++) {
        if(i == 0 && j == 0)
          continue;
        if(this.x + i < 0 || this.x + i > this.game.board.length - 1)
          continue;
        if(this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
          continue;
        if(this.game.board[this.x + i][this.y + j].mine) {
          this.number++;
        }
      }
    }
  }

  getAdjacentTiles() {
    var list = new Array();
    for(var i = -1; i <= 1; i++) {
      for(var j = -1; j <= 1; j++) {
        if(i == 0 && j == 0)
          continue;
        if(this.x + i < 0 || this.x + i > this.game.board.length - 1)
          continue;
        if(this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
          continue;
        list.push(this.game.board[this.x + i][this.y + j])
      }
    }
    return list;
  }

  getAdjacentUnrevealedTiles() {
    var list = new Array();
    for(var i = -1; i <= 1; i++) {
      for(var j = -1; j <= 1; j++) {
        if(i == 0 && j == 0)
          continue;
        if(this.x + i < 0 || this.x + i > this.game.board.length - 1)
          continue;
        if(this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
          continue;
        if(!this.game.board[this.x + i][this.y + j].revealed && !this.game.board[this.x + i][this.y + j].flagged) {
          list.push(this.game.board[this.x + i][this.y + j])
        }
      }
    }
    return list;
  }

  getAdjacentFlags() {
    var list = new Array();
    for(var i = -1; i <= 1; i++) {
      for(var j = -1; j <= 1; j++) {
        if(i == 0 && j == 0)
          continue;
        if(this.x + i < 0 || this.x + i > this.game.board.length - 1)
          continue;
        if(this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
          continue;
        if(this.game.board[this.x + i][this.y + j].flagged) {
          list.push(this.game.board[this.x + i][this.y + j])
        }
      }
    }
    return list;
  }

  isSatisfied() {
    return this.getAdjacentFlags().length == this.number;
  }

  remainingMines() {
    return this.number - this.getAdjacentFlags().length;
  }

  reveal() {
    if(this.revealed || this.flagged)
      return;
    this.revealed = true;
    if(!this.mine) {
      if(this.number == 0) {
        this.game.revealedTiles++;
        for(var i = -1; i <= 1; i++) {
          for(var j = -1; j <= 1; j++) {
            if(i == 0 && j == 0)
              continue;
            if(this.x + i < 0 || this.x + i > this.game.board.length - 1)
              continue;
            if(this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
              continue;
            if(this.game.board[this.x + i][this.y + j].reveal()) {
            }
          }
        }
      }
    } else {
      this.game.lose();
    }
  }

  flag() {
    if(this.revealed)
      return;
    this.flagged = !this.flagged;
    this.game.checkNumFlags();
  }
}
