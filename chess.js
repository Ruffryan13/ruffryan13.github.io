(() => {
  const FILES = "abcdefgh";
  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const PROMOTIONS = ["q", "r", "b", "n"];
  const KNIGHT_STEPS = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  const KING_STEPS = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ];
  const SLIDING_DIRECTIONS = {
    bishop: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    rook: [[-1, 0], [0, -1], [0, 1], [1, 0]],
    queen: [
      [-1, -1], [-1, 0], [-1, 1], [0, -1],
      [0, 1], [1, -1], [1, 0], [1, 1]
    ]
  };

  function colorOf(piece) {
    return piece === piece.toUpperCase() ? "w" : "b";
  }

  function opposite(color) {
    return color === "w" ? "b" : "w";
  }

  function squareName(square) {
    return `${FILES[square % 8]}${8 - Math.floor(square / 8)}`;
  }

  function parseSquare(name) {
    if (!/^[a-h][1-8]$/.test(name)) return null;
    return (8 - Number(name[1])) * 8 + FILES.indexOf(name[0]);
  }

  function parseFen(fen) {
    const [placement, activeColor, castling, enPassant, halfmove, fullmove] = fen.split(" ");
    const ranks = placement.split("/");
    if (ranks.length !== 8 || !["w", "b"].includes(activeColor)) {
      throw new Error("Invalid FEN position.");
    }

    const board = [];
    for (const rank of ranks) {
      let width = 0;
      for (const symbol of rank) {
        if (/^[1-8]$/.test(symbol)) {
          const spaces = Number(symbol);
          width += spaces;
          for (let i = 0; i < spaces; i += 1) board.push(null);
        } else if (/^[pnbrqkPNBRQK]$/.test(symbol)) {
          width += 1;
          board.push(symbol);
        } else {
          throw new Error("Invalid FEN piece placement.");
        }
      }
      if (width !== 8) throw new Error("Invalid FEN rank width.");
    }

    if (board.length !== 64) throw new Error("Invalid FEN board size.");
    const epSquare = enPassant === "-" ? null : parseSquare(enPassant);
    if (enPassant !== "-" && epSquare === null) throw new Error("Invalid FEN en passant square.");
    return {
      board,
      turn: activeColor,
      castling: castling === "-" ? "" : castling,
      enPassant: epSquare,
      halfmove: Number(halfmove) || 0,
      fullmove: Number(fullmove) || 1
    };
  }

  function isInside(row, file) {
    return row >= 0 && row < 8 && file >= 0 && file < 8;
  }

  function isSquareAttacked(board, target, byColor) {
    const targetRow = Math.floor(target / 8);
    const targetFile = target % 8;

    const pawnSourceRow = targetRow + (byColor === "w" ? 1 : -1);
    for (const fileOffset of [-1, 1]) {
      const sourceFile = targetFile + fileOffset;
      if (!isInside(pawnSourceRow, sourceFile)) continue;
      const piece = board[pawnSourceRow * 8 + sourceFile];
      if (piece && colorOf(piece) === byColor && piece.toLowerCase() === "p") return true;
    }

    for (const [rowOffset, fileOffset] of KNIGHT_STEPS) {
      const row = targetRow + rowOffset;
      const file = targetFile + fileOffset;
      if (!isInside(row, file)) continue;
      const piece = board[row * 8 + file];
      if (piece && colorOf(piece) === byColor && piece.toLowerCase() === "n") return true;
    }

    for (const [rowOffset, fileOffset] of KING_STEPS) {
      const row = targetRow + rowOffset;
      const file = targetFile + fileOffset;
      if (!isInside(row, file)) continue;
      const piece = board[row * 8 + file];
      if (piece && colorOf(piece) === byColor && piece.toLowerCase() === "k") return true;
    }

    for (const [pieceType, directions] of Object.entries(SLIDING_DIRECTIONS)) {
      for (const [rowOffset, fileOffset] of directions) {
        let row = targetRow + rowOffset;
        let file = targetFile + fileOffset;
        while (isInside(row, file)) {
          const piece = board[row * 8 + file];
          if (piece) {
            if (colorOf(piece) === byColor) {
              const type = piece.toLowerCase();
              const matchingPiece = pieceType === "bishop" ? "b" : pieceType === "rook" ? "r" : "q";
              if (type === matchingPiece || type === "q") return true;
            }
            break;
          }
          row += rowOffset;
          file += fileOffset;
        }
      }
    }
    return false;
  }

  function kingSquare(board, color) {
    const king = color === "w" ? "K" : "k";
    return board.indexOf(king);
  }

  function isInCheck(board, color) {
    const square = kingSquare(board, color);
    return square !== -1 && isSquareAttacked(board, square, opposite(color));
  }

  function applyMoveToBoard(board, move) {
    const next = board.slice();
    const piece = next[move.from];
    next[move.from] = null;
    if (move.enPassant) {
      next[move.to + (colorOf(piece) === "w" ? 8 : -8)] = null;
    }
    if (move.castle) {
      const rookMoves = {
        "K": [63, 61],
        "Q": [56, 59],
        "k": [7, 5],
        "q": [0, 3]
      };
      const [rookFrom, rookTo] = rookMoves[move.castle];
      next[rookTo] = next[rookFrom];
      next[rookFrom] = null;
    }
    next[move.to] = move.promotion
      ? colorOf(piece) === "w" ? move.promotion.toUpperCase() : move.promotion
      : piece;
    return next;
  }

  class ChessGame {
    constructor(fen = START_FEN) {
      this.loadFen(fen);
    }

    loadFen(fen) {
      const position = parseFen(fen);
      this.board = position.board;
      this.turn = position.turn;
      this.castling = position.castling;
      this.enPassant = position.enPassant;
      this.halfmove = position.halfmove;
      this.fullmove = position.fullmove;
      this.history = [];
      this.positionCounts = new Map();
      this.claimedDraw = null;
      this._recordPosition();
    }

    reset() {
      this.loadFen(START_FEN);
    }

    _positionKey() {
      const hasLegalEnPassant = this.enPassant !== null
        && this._pseudoMoves(this.turn)
          .filter((move) => move.enPassant)
          .some((move) => !isInCheck(applyMoveToBoard(this.board, move), this.turn));
      return [
        this.board.map((piece) => piece || "-").join(""),
        this.turn,
        this.castling || "-",
        hasLegalEnPassant ? squareName(this.enPassant) : "-"
      ].join(" ");
    }

    _recordPosition() {
      const key = this._positionKey();
      this.positionCounts.set(key, (this.positionCounts.get(key) || 0) + 1);
    }

    _pseudoMoves(color) {
      const moves = [];
      const add = (from, to, extra = {}) => moves.push({ from, to, ...extra });

      for (let from = 0; from < 64; from += 1) {
        const piece = this.board[from];
        if (!piece || colorOf(piece) !== color) continue;
        const row = Math.floor(from / 8);
        const file = from % 8;
        const type = piece.toLowerCase();

        if (type === "p") {
          const direction = color === "w" ? -1 : 1;
          const startRow = color === "w" ? 6 : 1;
          const promotionRow = color === "w" ? 0 : 7;
          const nextRow = row + direction;
          if (isInside(nextRow, file) && !this.board[nextRow * 8 + file]) {
            const to = nextRow * 8 + file;
            if (nextRow === promotionRow) {
              for (const promotion of PROMOTIONS) add(from, to, { promotion });
            } else {
              add(from, to);
              const doubleRow = row + direction * 2;
              if (row === startRow && !this.board[doubleRow * 8 + file]) {
                add(from, doubleRow * 8 + file, { doublePawn: true });
              }
            }
          }

          for (const fileOffset of [-1, 1]) {
            const targetFile = file + fileOffset;
            if (!isInside(nextRow, targetFile)) continue;
            const to = nextRow * 8 + targetFile;
            const targetPiece = this.board[to];
            const capture = targetPiece && colorOf(targetPiece) !== color && targetPiece.toLowerCase() !== "k";
            const enPassant = to === this.enPassant;
            if (!capture && !enPassant) continue;
            if (nextRow === promotionRow) {
              for (const promotion of PROMOTIONS) add(from, to, { promotion, enPassant: Boolean(enPassant) });
            } else {
              add(from, to, { enPassant: Boolean(enPassant) });
            }
          }
          continue;
        }

        if (type === "n" || type === "k") {
          const steps = type === "n" ? KNIGHT_STEPS : KING_STEPS;
          for (const [rowOffset, fileOffset] of steps) {
            const targetRow = row + rowOffset;
            const targetFile = file + fileOffset;
            if (!isInside(targetRow, targetFile)) continue;
            const to = targetRow * 8 + targetFile;
            const targetPiece = this.board[to];
            if (!targetPiece || colorOf(targetPiece) !== color && targetPiece.toLowerCase() !== "k") {
              add(from, to);
            }
          }
          if (type === "k") this._addCastlingMoves(moves, from, color);
          continue;
        }

        const directions = type === "b"
          ? SLIDING_DIRECTIONS.bishop
          : type === "r"
            ? SLIDING_DIRECTIONS.rook
            : SLIDING_DIRECTIONS.queen;
        for (const [rowOffset, fileOffset] of directions) {
          let targetRow = row + rowOffset;
          let targetFile = file + fileOffset;
          while (isInside(targetRow, targetFile)) {
            const to = targetRow * 8 + targetFile;
            const targetPiece = this.board[to];
            if (!targetPiece) {
              add(from, to);
            } else {
              if (colorOf(targetPiece) !== color && targetPiece.toLowerCase() !== "k") add(from, to);
              break;
            }
            targetRow += rowOffset;
            targetFile += fileOffset;
          }
        }
      }
      return moves;
    }

    _addCastlingMoves(moves, from, color) {
      const kingStart = color === "w" ? 60 : 4;
      if (from !== kingStart || isInCheck(this.board, color)) return;
      const enemy = opposite(color);
      const kingSide = color === "w" ? "K" : "k";
      const queenSide = color === "w" ? "Q" : "q";
      const rankStart = color === "w" ? 56 : 0;
      const rook = color === "w" ? "R" : "r";
      const king = color === "w" ? "K" : "k";
      const transitIsSafe = (square) => {
        const transitBoard = this.board.slice();
        transitBoard[from] = null;
        transitBoard[square] = king;
        return !isInCheck(transitBoard, color);
      };
      if (this.castling.includes(kingSide)
        && this.board[rankStart + 7] === rook
        && !this.board[kingStart + 1]
        && !this.board[kingStart + 2]
        && transitIsSafe(kingStart + 1)
        && !isSquareAttacked(this.board, kingStart + 2, enemy)) {
        moves.push({ from, to: kingStart + 2, castle: kingSide });
      }
      if (this.castling.includes(queenSide)
        && this.board[rankStart] === rook
        && !this.board[kingStart - 1]
        && !this.board[kingStart - 2]
        && !this.board[kingStart - 3]
        && transitIsSafe(kingStart - 1)
        && !isSquareAttacked(this.board, kingStart - 2, enemy)) {
        moves.push({ from, to: kingStart - 2, castle: queenSide });
      }
    }

    legalMoves(from = null) {
      const color = this.turn;
      const legal = this._pseudoMoves(color).filter((move) => {
        const nextBoard = applyMoveToBoard(this.board, move);
        return !isInCheck(nextBoard, color);
      });
      return from === null ? legal : legal.filter((move) => move.from === from);
    }

    _san(move, legalMoves) {
      const piece = this.board[move.from];
      if (move.castle) return move.castle.toLowerCase() === "k" ? "O-O" : "O-O-O";
      const type = piece.toLowerCase();
      const isCapture = Boolean(this.board[move.to] || move.enPassant);
      let prefix = type === "p" ? "" : type.toUpperCase();
      if (type !== "p") {
        const alternatives = legalMoves.filter((candidate) =>
          candidate.from !== move.from
          && candidate.to === move.to
          && this.board[candidate.from].toLowerCase() === type
        );
        if (alternatives.length) {
          const sameFile = alternatives.some((candidate) => candidate.from % 8 === move.from % 8);
          const sameRank = alternatives.some((candidate) => Math.floor(candidate.from / 8) === Math.floor(move.from / 8));
          if (!sameFile) prefix += FILES[move.from % 8];
          else if (!sameRank) prefix += String(8 - Math.floor(move.from / 8));
          else prefix += squareName(move.from);
        }
      } else if (isCapture) {
        prefix = FILES[move.from % 8];
      }
      let notation = `${prefix}${isCapture ? "x" : ""}${squareName(move.to)}`;
      if (move.promotion) notation += `=${move.promotion.toUpperCase()}`;
      return notation;
    }

    move(from, to, promotion = null) {
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from > 63 || to < 0 || to > 63) {
        return { ok: false, reason: "invalid-square" };
      }
      const currentState = this.state();
      if (currentState.checkmate || currentState.draw) return { ok: false, reason: "game-over" };
      const legalMoves = this.legalMoves();
      const candidates = legalMoves.filter((move) => move.from === from && move.to === to);
      if (!candidates.length) return { ok: false, reason: "illegal-move" };
      const requiresPromotion = candidates.some((move) => move.promotion);
      if (requiresPromotion && !promotion) {
        return { ok: false, promotionRequired: true, choices: PROMOTIONS.slice() };
      }
      const selectedPromotion = typeof promotion === "string" ? promotion.toLowerCase() : null;
      const move = requiresPromotion
        ? candidates.find((candidate) => candidate.promotion === selectedPromotion)
        : candidates[0];
      if (!move) return { ok: false, reason: "invalid-promotion" };

      const piece = this.board[from];
      const capturedPiece = move.enPassant ? (this.turn === "w" ? "p" : "P") : this.board[to];
      const san = this._san(move, legalMoves);
      const before = {
        board: this.board.slice(),
        turn: this.turn,
        castling: this.castling,
        enPassant: this.enPassant,
        halfmove: this.halfmove,
        fullmove: this.fullmove
      };

      this.board = applyMoveToBoard(this.board, move);
      if (piece === "K") this.castling = this.castling.replace(/[KQ]/g, "");
      if (piece === "k") this.castling = this.castling.replace(/[kq]/g, "");
      const rookRights = { 0: "q", 7: "k", 56: "Q", 63: "K" };
      if (piece.toLowerCase() === "r" && rookRights[from]) {
        this.castling = this.castling.replace(rookRights[from], "");
      }
      if (capturedPiece && capturedPiece.toLowerCase() === "r" && rookRights[to]) {
        this.castling = this.castling.replace(rookRights[to], "");
      }
      this.enPassant = move.doublePawn ? (from + to) / 2 : null;
      this.halfmove = piece.toLowerCase() === "p" || capturedPiece ? 0 : this.halfmove + 1;
      if (this.turn === "b") this.fullmove += 1;
      this.turn = opposite(this.turn);

      const afterMove = this.state();
      const suffix = afterMove.checkmate ? "#" : afterMove.inCheck ? "+" : "";
      const record = {
        move: { ...move },
        san: `${san}${suffix}`,
        before
      };
      this.history.push(record);
      this._recordPosition();
      return { ok: true, san: record.san, state: this.state() };
    }

    undo() {
      if (this.claimedDraw) this.claimedDraw = null;
      const record = this.history.pop();
      if (!record) return false;
      const currentKey = this._positionKey();
      const count = this.positionCounts.get(currentKey) || 0;
      if (count <= 1) this.positionCounts.delete(currentKey);
      else this.positionCounts.set(currentKey, count - 1);
      this.board = record.before.board;
      this.turn = record.before.turn;
      this.castling = record.before.castling;
      this.enPassant = record.before.enPassant;
      this.halfmove = record.before.halfmove;
      this.fullmove = record.before.fullmove;
      return true;
    }

    claimDraw() {
      const currentState = this.state();
      if (currentState.draw || !currentState.claimableDraw) return false;
      this.claimedDraw = currentState.claimableDraw;
      return true;
    }

    _insufficientMaterial() {
      const material = [];
      for (let square = 0; square < 64; square += 1) {
        const piece = this.board[square];
        if (piece && piece.toLowerCase() !== "k") material.push({ type: piece.toLowerCase(), square });
      }
      if (material.length === 0) return true;
      if (material.some((piece) => ["p", "r", "q"].includes(piece.type))) return false;
      if (material.length === 1) return true;
      if (material.every((piece) => piece.type === "b")) {
        const squareColors = new Set(material.map((piece) =>
          (Math.floor(piece.square / 8) + piece.square % 8) % 2
        ));
        return squareColors.size === 1;
      }
      return false;
    }

    state() {
      const legal = this.legalMoves();
      const inCheck = isInCheck(this.board, this.turn);
      const checkmate = legal.length === 0 && inCheck;
      const stalemate = legal.length === 0 && !inCheck;
      const repetition = this.positionCounts.get(this._positionKey()) || 0;
      let drawReason = null;
      let claimableDraw = null;
      if (stalemate) drawReason = "stalemate";
      else if (!checkmate && this.claimedDraw) drawReason = `${this.claimedDraw} (claimed)`;
      else if (!checkmate && this.halfmove >= 150) drawReason = "75-move rule";
      else if (!checkmate && repetition >= 5) drawReason = "fivefold repetition";
      else if (!checkmate && this._insufficientMaterial()) drawReason = "insufficient material";
      else if (!checkmate && this.halfmove >= 100) claimableDraw = "50-move rule";
      else if (!checkmate && repetition >= 3) claimableDraw = "threefold repetition";

      const side = this.turn === "w" ? "White" : "Black";
      const winner = this.turn === "w" ? "Black" : "White";
      let label;
      if (checkmate) label = `Checkmate — ${winner} wins`;
      else if (drawReason) label = `Draw — ${drawReason}`;
      else label = `${inCheck ? "Check — " : ""}${side} to move`;
      return {
        turn: this.turn,
        inCheck,
        checkmate,
        stalemate,
        draw: Boolean(drawReason),
        drawReason,
        claimableDraw,
        winner: checkmate ? opposite(this.turn) : null,
        legalMoves: legal.length,
        label
      };
    }
  }

  window.ChessGame = ChessGame;
  window.ChessRules = { parseSquare, squareName, isSquareAttacked };
})();
