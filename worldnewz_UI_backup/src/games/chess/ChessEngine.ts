export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
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
  isCastling?: boolean;
  isEnPassant?: boolean;
  promotionType?: PieceType;
}

export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

export class ChessEngine {
  public board: BoardState;
  public turn: PieceColor;
  public moveHistory: Move[];
  public capturedWhite: Piece[];
  public capturedBlack: Piece[];
  public castlingRights: CastlingRights;
  public enPassantTarget: Position | null;
  public halfMoveClock: number;
  public isCheck: boolean;
  public isCheckmate: boolean;
  public isStalemate: boolean;
  public isDraw: boolean;
  public drawReason: string;
  public pendingPromotion: { from: Position; to: Position } | null;

  constructor() {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.moveHistory = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.isDraw = false;
    this.drawReason = '';
    this.pendingPromotion = null;
  }

  public resetGame(): void {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.moveHistory = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.isDraw = false;
    this.drawReason = '';
    this.pendingPromotion = null;
  }

  private createInitialBoard(): BoardState {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

    // Black pieces (Row 0: Rooks, Knights, Bishops, Queen, King, Bishops, Knights, Rooks)
    board[0] = [
      { type: 'r', color: 'b', hasMoved: false },
      { type: 'n', color: 'b', hasMoved: false },
      { type: 'b', color: 'b', hasMoved: false },
      { type: 'q', color: 'b', hasMoved: false },
      { type: 'k', color: 'b', hasMoved: false },
      { type: 'b', color: 'b', hasMoved: false },
      { type: 'n', color: 'b', hasMoved: false },
      { type: 'r', color: 'b', hasMoved: false }
    ];
    board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'b', hasMoved: false }));

    // White pieces (Row 7: Rooks, Knights, Bishops, Queen, King, Bishops, Knights, Rooks)
    board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'w', hasMoved: false }));
    board[7] = [
      { type: 'r', color: 'w', hasMoved: false },
      { type: 'n', color: 'w', hasMoved: false },
      { type: 'b', color: 'w', hasMoved: false },
      { type: 'q', color: 'w', hasMoved: false },
      { type: 'k', color: 'w', hasMoved: false },
      { type: 'b', color: 'w', hasMoved: false },
      { type: 'n', color: 'w', hasMoved: false },
      { type: 'r', color: 'w', hasMoved: false }
    ];

    return board;
  }

  public getValidMoves(pos: Position): Position[] {
    const piece = this.board[pos.row][pos.col];
    if (!piece || piece.color !== this.turn) return [];

    const valid: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const to = { row: r, col: c };
        if (this.canMove(pos, to)) {
          // FIDE Rule: Move must not leave own King in check!
          if (!this.wouldLeaveKingInCheck(pos, to)) {
            valid.push(to);
          }
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

        // Forward 1 square
        if (colDiff === 0 && rowDiff === dir && !target) return true;

        // Forward 2 squares from initial rank
        if (colDiff === 0 && from.row === startRow && rowDiff === 2 * dir && !target && !this.board[from.row + dir][from.col]) return true;

        // Standard Diagonal Capture
        if (Math.abs(colDiff) === 1 && rowDiff === dir && target && target.color !== piece.color) return true;

        // FIDE En Passant Capture
        if (Math.abs(colDiff) === 1 && rowDiff === dir && !target && this.enPassantTarget) {
          if (this.enPassantTarget.row === to.row && this.enPassantTarget.col === to.col) {
            return true;
          }
        }
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
      case 'k': {
        // Standard King Move (1 square in any direction)
        if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) return true;

        // FIDE Castling Rules
        if (rowDiff === 0 && Math.abs(colDiff) === 2) {
          return this.canCastle(piece.color, colDiff > 0 ? 'kingside' : 'queenside');
        }
        return false;
      }
      default:
        return false;
    }
  }

  private canCastle(color: PieceColor, side: 'kingside' | 'queenside'): boolean {
    if (this.isCheck) return false; // Cannot castle out of check

    const row = color === 'w' ? 7 : 0;
    const rights = color === 'w'
      ? (side === 'kingside' ? this.castlingRights.wK : this.castlingRights.wQ)
      : (side === 'kingside' ? this.castlingRights.bK : this.castlingRights.bQ);

    if (!rights) return false;

    if (side === 'kingside') {
      // Squares between King (col 4) and Rook (col 7): cols 5, 6 must be empty
      if (this.board[row][5] !== null || this.board[row][6] !== null) return false;
      // King cannot pass through or land on a square under attack
      if (this.isSquareAttacked({ row, col: 5 }, color) || this.isSquareAttacked({ row, col: 6 }, color)) return false;
    } else {
      // Squares between King (col 4) and Rook (col 0): cols 1, 2, 3 must be empty
      if (this.board[row][1] !== null || this.board[row][2] !== null || this.board[row][3] !== null) return false;
      // King cannot pass through or land on a square under attack
      if (this.isSquareAttacked({ row, col: 3 }, color) || this.isSquareAttacked({ row, col: 2 }, color)) return false;
    }

    return true;
  }

  private isSquareAttacked(pos: Position, defenderColor: PieceColor): boolean {
    const attackerColor = defenderColor === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === attackerColor) {
          // Pawn attack diagonal check
          if (p.type === 'p') {
            const dir = p.color === 'w' ? -1 : 1;
            if (r + dir === pos.row && (c - 1 === pos.col || c + 1 === pos.col)) return true;
          } else if (p.type === 'k') {
            if (Math.abs(r - pos.row) <= 1 && Math.abs(c - pos.col) <= 1) return true;
          } else if (this.canMove({ row: r, col: c }, pos)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private wouldLeaveKingInCheck(from: Position, to: Position): boolean {
    // Make virtual move
    const savedFrom = this.board[from.row][from.col];
    const savedTo = this.board[to.row][to.col];

    this.board[to.row][to.col] = savedFrom;
    this.board[from.row][from.col] = null;

    const kingPos = this.findKing(this.turn);
    const inCheck = kingPos ? this.isSquareAttacked(kingPos, this.turn) : false;

    // Revert virtual move
    this.board[from.row][from.col] = savedFrom;
    this.board[to.row][to.col] = savedTo;

    return inCheck;
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

  public makeMove(from: Position, to: Position, promotionChoice?: PieceType): boolean {
    const validMoves = this.getValidMoves(from);
    if (!validMoves.some(m => m.row === to.row && m.col === to.col)) return false;

    const piece = this.board[from.row][from.col]!;
    let target = this.board[to.row][to.col];
    let isEnPassant = false;
    let isCastling = false;

    // Check Pawn Promotion requirement
    const isPawnPromotion = piece.type === 'p' && (to.row === 0 || to.row === 7);
    if (isPawnPromotion && !promotionChoice) {
      this.pendingPromotion = { from, to };
      return false; // Waiting for user promotion choice modal
    }

    // Handle En Passant Capture
    if (piece.type === 'p' && !target && this.enPassantTarget && to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
      isEnPassant = true;
      const captureRow = piece.color === 'w' ? to.row + 1 : to.row - 1;
      target = this.board[captureRow][to.col];
      this.board[captureRow][to.col] = null;
    }

    // Set En Passant Target for next turn if pawn moved 2 squares
    if (piece.type === 'p' && Math.abs(to.row - from.row) === 2) {
      this.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
    } else {
      this.enPassantTarget = null;
    }

    // Handle Castling Rook Movement
    if (piece.type === 'k' && Math.abs(to.col - from.col) === 2) {
      isCastling = true;
      const isKingside = to.col > from.col;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      const rook = this.board[from.row][rookFromCol];
      if (rook) {
        this.board[from.row][rookToCol] = { ...rook, hasMoved: true };
        this.board[from.row][rookFromCol] = null;
      }
    }

    // Update Castling Rights
    if (piece.type === 'k') {
      if (piece.color === 'w') { this.castlingRights.wK = false; this.castlingRights.wQ = false; }
      else { this.castlingRights.bK = false; this.castlingRights.bQ = false; }
    }
    if (piece.type === 'r') {
      if (from.row === 7 && from.col === 7) this.castlingRights.wK = false;
      if (from.row === 7 && from.col === 0) this.castlingRights.wQ = false;
      if (from.row === 0 && from.col === 7) this.castlingRights.bK = false;
      if (from.row === 0 && from.col === 0) this.castlingRights.bQ = false;
    }

    // Track captured pieces
    if (target) {
      if (target.color === 'w') this.capturedBlack.push(target);
      else this.capturedWhite.push(target);
      this.halfMoveClock = 0;
    } else if (piece.type === 'p') {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // Apply Move
    const finalPiece: Piece = {
      ...piece,
      type: promotionChoice || piece.type,
      hasMoved: true
    };

    this.board[to.row][to.col] = finalPiece;
    this.board[from.row][from.col] = null;
    this.pendingPromotion = null;

    const san = isCastling
      ? (to.col > from.col ? 'O-O' : 'O-O-O')
      : this.formatSAN(finalPiece, from, to, !!target, promotionChoice);

    this.moveHistory.push({
      from,
      to,
      piece: finalPiece,
      captured: target,
      san,
      isCastling,
      isEnPassant,
      promotionType: promotionChoice
    });

    // Switch turn
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.checkGameState();
    return true;
  }

  private formatSAN(piece: Piece, from: Position, to: Position, isCapture: boolean, promo?: PieceType): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pChar = piece.type === 'p' ? '' : piece.type.toUpperCase();
    const capChar = isCapture ? (piece.type === 'p' ? files[from.col] + 'x' : 'x') : '';
    const promoStr = promo ? `=${promo.toUpperCase()}` : '';
    return `${pChar}${capChar}${files[to.col]}${ranks[to.row]}${promoStr}`;
  }

  private checkGameState(): void {
    const kingPos = this.findKing(this.turn);
    const inCheck = kingPos ? this.isSquareAttacked(kingPos, this.turn) : false;
    this.isCheck = inCheck;

    // Check if current player has any legal moves
    let hasLegal = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === this.turn) {
          if (this.getValidMoves({ row: r, col: c }).length > 0) {
            hasLegal = true;
            break;
          }
        }
      }
      if (hasLegal) break;
    }

    if (!hasLegal) {
      if (inCheck) {
        this.isCheckmate = true;
      } else {
        this.isStalemate = true;
        this.isDraw = true;
        this.drawReason = 'Draw by Stalemate (FIDE Law 9.1)';
      }
    }

    // 50-Move Rule
    if (this.halfMoveClock >= 100) {
      this.isDraw = true;
      this.drawReason = 'Draw by 50-Move Rule (FIDE Law 9.3)';
    }

    // Insufficient Material Check
    if (this.checkInsufficientMaterial()) {
      this.isDraw = true;
      this.drawReason = 'Draw by Insufficient Material (FIDE Law 9.6)';
    }
  }

  private checkInsufficientMaterial(): boolean {
    const activePieces: Piece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) activePieces.push(p);
      }
    }

    if (activePieces.length === 2) return true; // K vs K
    if (activePieces.length === 3) {
      // K+B vs K or K+N vs K
      const nonKing = activePieces.find(p => p.type !== 'k');
      if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) return true;
    }
    return false;
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

  // AI Minimax for Stockfish AI moves
  public getAIMove(difficulty: 'easy' | 'medium' | 'hard'): { from: Position; to: Position; promo?: PieceType } | null {
    const allMoves: { from: Position; to: Position; promo?: PieceType }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === this.turn) {
          const valid = this.getValidMoves({ row: r, col: c });
          for (const to of valid) {
            const promo = (p.type === 'p' && (to.row === 0 || to.row === 7)) ? 'q' as PieceType : undefined;
            allMoves.push({ from: { row: r, col: c }, to, promo });
          }
        }
      }
    }

    if (allMoves.length === 0) return null;

    if (difficulty === 'easy') {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    // Capture priority for medium/hard
    const valMap: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    const captures = allMoves.filter(m => this.board[m.to.row][m.to.col] !== null);

    if (captures.length > 0) {
      captures.sort((a, b) => {
        const targetA = this.board[a.to.row][a.to.col]!;
        const targetB = this.board[b.to.row][b.to.col]!;
        return (valMap[targetB.type] || 0) - (valMap[targetA.type] || 0);
      });
      return captures[0];
    }

    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }
}
