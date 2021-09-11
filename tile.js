/**
 * @file tile.js
 * @author Devin Arena
 * @since 12/5/2019
 * @description Stores tile information and handles rendering, calculating
 *              adjacent mines, storing satisfaction (how many mines are around its number),
 *              flagging, and revealing logic.
 */

class Tile {
  // colors for revealed number tiles
  static colors = ["#009", "#090", "#900", "#990", "#999", "#030", "#003", "#300"];

  /**
   * Default constructor for tile, takes minesweeper instance,
   * x and y coordinates, and if this is a mine or not.
   * 
   * @param {minesweeper.js} game instance to use
   * @param {number} x the x coordinate of this tile
   * @param {number} y the y coordinate of this tile
   * @param {boolean} mine if this is a mine or not
   */
  constructor(game, x, y, mine) {
    this.game = game;
    this.size = this.game.tileSize;
    this.x = x;
    this.y = y;
    this.mine = mine;
    this.revealed = false;
    this.number = 0;
    this.flagged = false;
  }

  /**
   * Draws this tile differently based on if its revealed, flagged, a mine, etc.
   * 
   * @param {Context} ctx the draw context 
   */
  draw = (ctx) => {
    // if not revealed, tis a normal tile color
    if (!this.revealed) {
      ctx.fillStyle = "#ccc";
    } else {
      // if it is, its a lighter revealed color
      ctx.fillStyle = "#aaa";
      // if its a mine, use a dark red color
      if (this.number === -3) {
        ctx.fillStyle = "#a11";
      }
    }
    // draws the actual tile and outline
    ctx.fillRect(this.x * this.size, this.y * this.size, this.size, this.size);
    ctx.strokeRect(this.x * this.size, this.y * this.size, this.size, this.size);
    if (this.revealed) {
      // if its revealed and has a number, render the number at the center of the tile
      if (!this.mine && this.number > 0) {
        ctx.font = "24px Arial";
        ctx.fillStyle = Tile.colors[this.number - 1];
        ctx.textAlign = "center";
        ctx.fillText(this.number, this.x * this.size + this.size / 2, this.y * this.size + this.size / 2 + 8);
      } else if (this.mine) {
        // if its a mine, draw the mine at the center of the tile
        ctx.drawImage(this.game.mineImage, this.x * this.size + 4, this.y * this.size + 4, this.size - 8, this.size - 8);
      }
    }
    // if we flagged this tile, draw the flag at the center
    if (this.flagged) {
      ctx.drawImage(this.game.flagImage, this.x * this.size + 4, this.y * this.size + 4, this.size - 8, this.size - 8);
    }
    // if the debug map is on, draw this tiles mine probability
    if (this.game.debugProbability) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(this.game.ai.probabilityMap[this.x][this.y], this.x * this.size + this.size / 2, this.y * this.size + this.size / 2 + 8);
    }
  }

  /**
   * Calculates adjacent mines to this tile, sets this tiles
   * number based on the number of adjacent mines.
   */
  calculateAdjacentMines = () => {
    // grab adjacent tiles
    let adjTiles = this.getAdjacentTiles();
    for (let tile of adjTiles) {
      // if adjacent tile is a mine, increment mine counter
      if (tile.mine) {
        this.number++;
      }
    }
  }

  /**
   * Gets adjacent tiles and returns a them in an Array.
   * 
   * @returns {Array<Tile>} the adjacent tiles
   */
  getAdjacentTiles = () => {
    let list = new Array();
    // check upper left to bottom right tiles
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) // ignore this tile
          continue;
        // bounds checking
        if (this.x + i < 0 || this.x + i > this.game.board.length - 1)
          continue;
        if (this.y + j < 0 || this.y + j > this.game.board[this.x].length - 1)
          continue;
        // add the adjacent tile to this list.
        list.push(this.game.board[this.x + i][this.y + j])
      }
    }
    return list;
  }

  /**
   * Gets the adjacent tiles which have not yet been revealed.
   * 
   * @returns {Array<Tile>} a list of the adjacent tiles that have not yet been revealed
   */
  getAdjacentUnrevealedTiles = () => {
    // simply get adjacent tiles and filter out the revealed ones
    return this.getAdjacentTiles().filter(tile => {
      return !tile.revealed ? tile : null;
    });
  }

  /**
   * Gets the adjacent tiles which have been flagged.
   * 
   * @returns {Array<Tile>} a list of adjacent tiles that have been flagged
   */
  getAdjacentFlags = () => {
    // simply return the adjacent tiles with flags
    return this.getAdjacentUnrevealedTiles().filter(tile => {
      return tile.flagged ? tile : null;
    });
  }

  /**
   * Whether or not this tile is satisfied. Satisfied tiles
   * have a number equal to their number of adjacent flagged tiles.
   * 
   * @returns true if adjacent flags equal its number, otherwise false
   */
  isSatisfied = () => {
    return this.getAdjacentFlags().length === this.number;
  }

  /**
   * A recursive function to reveal this tile and flood reveal
   * any tiles with an number of 0 (blank tiles with no adjacent mines).
   */
  reveal = () => {
    // base case, don't reveal flagged 
    if (this.revealed || this.flagged)
      return;
    this.revealed = true;
    if (!this.mine) {
      // if we're not a mine and a blank tile, attempt to flood reveal around it
      if (this.number === 0) {
        // for counter
        this.game.revealedTiles++;
        // reveal every adjacent tile to attempt flood reveal
        this.getAdjacentTiles().forEach(tile => {
          tile.reveal();
        });
      }
    } else {
      // we revealed a mine, the game is lost
      this.game.lose();
      // for dark red color
      this.number = -3;
    }
  }

  /**
   * Flags this tile as a potential mine or removes the flag
   * and updates the game mine counter (checkNumFlags).
   */
  flag = () => {
    // can not flag revealed tiles
    if (this.revealed)
      return;
    // toggle flag
    this.flagged = !this.flagged;
    // update mine counter
    this.game.checkNumFlags();
  }
}
