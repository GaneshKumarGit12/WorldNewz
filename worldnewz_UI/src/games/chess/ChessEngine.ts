export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (Piece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece | null;
  san?: string;
}

export class ChessEngine {
  public board: BoardState;
  public turn: PieceColor;
  public moveHistory: Move[];
  public capturedWhite: Piece[];
  public capturedBlack: Piece[];
  public isCheck: boolean;
  public isCheckmate: boolean;

  constructor() {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.moveHistory = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.isCheck = false;
    this.isCheckmate = false;
  }

  public resetGame(): void {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.moveHistory = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.isCheck = false;
    this.isCheckmate = false;
  }

  private createInitialBoard(): BoardState {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

    // Black pieces
    board[0] = [
      { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' },
      { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }
    ];
    board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'b' }));

    // White pieces
    board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'w' }));
    board[7] = [
      { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' },
      { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }
    ];

    return board;
  }

  public getValidMoves(pos: Position): Position[] {
    const piece = this.board[pos.row][pos.col];
    if (!piece || piece.color !== this.turn) return [];

    const valid: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.canMove(pos, { row: r, col: c })) {
          valid.push({ row: r, col: c });
        }
      }
    }
    return valid;
  }

  public canMove(from: Position, to: Position): boolean {
    if (from.row === to.row && from.col === to.col) return false;
    const piece = this.board[from.row][from.col];
    const target = this.board[to.row][to.col];

    if (!piece) return false;
    if (target && target.color === piece.color) return false;

    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    switch (piece.type) {
      case 'p': {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? 6 : 1;
        // Forward 1
        if (colDiff === 0 && rowDiff === dir && !target) return true;
        // Forward 2 from start
        if (colDiff === 0 && from.row === startRow && rowDiff === 2 * dir && !target && !this.board[from.row + dir][from.col]) return true;
        // Capture diagonal
        if (Math.abs(colDiff) === 1 && rowDiff === dir && target && target.color !== piece.color) return true;
        return false;
      }
      case 'r':
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(from, to);
      case 'n':
        return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
      case 'b':
        return Math.abs(rowDiff) === Math.abs(colDiff) && this.isPathClear(from, to);
      case 'q':
        return (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) && this.isPathClear(from, to);
      case 'k':
        return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
      default:
        return false;
    }
  }

  private isPathClear(from: Position, to: Position): boolean {
    const rowStep = Math.sign(to.row - from.row);
    const colStep = Math.sign(to.col - from.col);

    let currRow = from.row + rowStep;
    let currCol = from.col + colStep;

    while (currRow !== to.row || currCol !== to.col) {
      if (this.board[currRow][currCol] !== null) return false;
      currRow += rowStep;
      currCol += colStep;
    }
    return true;
  }

  public makeMove(from: Position, to: Position): boolean {
    if (!this.canMove(from, to)) return false;

    const piece = this.board[from.row][from.col]!;
    const target = this.board[to.row][to.col];

    if (target) {
      if (target.color === 'w') this.capturedBlack.push(target);
      else this.capturedWhite.push(target);
    }

    // Pawn promotion to Queen
    let finalPiece = { ...piece };
    if (piece.type === 'p' && (to.row === 0 || to.row === 7)) {
      finalPiece.type = 'q';
    }

    this.board[to.row][to.col] = finalPiece;
    this.board[from.row][from.col] = null;

    const san = this.formatSAN(finalPiece, from, to, !!target);
    this.moveHistory.push({ from, to, piece: finalPiece, captured: target, san });

    // Switch turn
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.checkGameState();
    return true;
  }

  private formatSAN(piece: Piece, from: Position, to: Position, isCapture: boolean): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pChar = piece.type === 'p' ? '' : piece.type.toUpperCase();
    const capChar = isCapture ? (piece.type === 'p' ? files[from.col] + 'x' : 'x') : '';
    return `${pChar}${capChar}${files[to.col]}${ranks[to.row]}`;
  }

  private checkGameState(): void {
    // Check if king of active player is under attack
    const kingPos = this.findKing(this.turn);
    const opponent = this.turn === 'w' ? 'b' : 'w';

    let inCheck = false;
    if (kingPos) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p && p.color === opponent) {
            // Temporarily set turn to opponent to test attack
            this.turn = opponent;
            if (this.canMove({ row: r, col: c }, kingPos)) {
              inCheck = true;
            }
            this.turn = opponent === 'w' ? 'b' : 'w';
          }
        }
      }
    }
    this.isCheck = inCheck;

    // Test for valid moves for active player
    let hasValid = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === this.turn) {
          if (this.getValidMoves({ row: r, col: c }).length > 0) {
            hasValid = true;
            break;
          }
        }
      }
      if (hasValid) break;
    }

    if (!hasValid) {
      this.isCheckmate = true;
    }
  }

  private findKing(color: PieceColor): Position | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  // Simple Minimax AI move generator
  public getAIMove(difficulty: 'easy' | 'medium' | 'hard'): Move | null {
    const allMoves: Move[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === this.turn) {
          const valid = this.getValidMoves({ row: r, col: c });
          for (const to of valid) {
            allMoves.push({ from: { row: r, col: c }, to, piece: p, captured: this.board[to.row][to.col] });
          }
        }
      }
    }

    if (allMoves.length === 0) return null;

    if (difficulty === 'easy') {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    // Capture priority for medium/hard
    const captures = allMoves.filter(m => m.captured !== null && m.captured !== undefined);
    if (captures.length > 0) {
      // Pick highest value capture
      const valMap: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
      captures.sort((a, b) => (valMap[b.captured!.type] || 0) - (valMap[a.captured!.type] || 0));
      return captures[0];
    }

    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }
}
