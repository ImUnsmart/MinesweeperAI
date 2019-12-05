class AI {
  probabilityMap;
  constructor(game) {
    this.game = game;
    this.probabilityMap = new Array(this.game.board.length);
    for(var i = 0; i < this.probabilityMap.length; i++) {
      this.probabilityMap[i] = new Array(this.game.board[i].length);
      for(var j = 0; j < this.probabilityMap[i].length; j++) {
        this.probabilityMap[i][j] = 0.5;
      }
    }
  }

  nextMove() {
    this.calculateProbabilities();
    var board = this.game.board;
    for(var i = 0; i < board.length; i++) {
      for(var j = 0; j < board[i].length; j++) {
        if(!board[i][j].revealed && !board[i][j].flagged) {
          if(this.probabilityMap[i][j] == 1) {
            board[i][j].flag();
            return;
          } else if(this.probabilityMap[i][j] == 0) {
            board[i][j].reveal();
            return;
          }
        }
      }
    }
    this.game.checkWin();
    // WORST CASE SCENARIO
    for(var i = 0; i < board.length; i++) {
      for(var j = 0; j < board[i].length; j++) {
        if(!board[i][j].revealed && Math.random() < 1 - this.probabilityMap[i][j]) {
          board[i][j].reveal();
          return;
        }
      }
    }
  }

  calculateProbabilities() {
    var board = this.game.board;
    var map = this.probabilityMap;
    for(var i = 0; i < board.length; i++) {
      for(var j = 0; j < board.length; j++) {
        var t = board[i][j];
        if(t.revealed) {
          map[i][j] = -1;
          if(t.isSatisfied()) {
            t.getAdjacentUnrevealedTiles().forEach(function(a) {
              if(!a.flagged) map[a.x][a.y] = 0;
            });
          } else {
            var adj = t.getAdjacentUnrevealedTiles();
            if(t.remainingMines() == adj.length) {
              adj.forEach(function(a) {
                if(!a.flagged) map[a.x][a.y] = 1;
              });
            }
          }
        }
      }
    }
  }
}
