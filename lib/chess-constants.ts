export const ORIGINAL_SQUARE_SIZE = 0.0578888;
export const TARGET_SQUARE_SIZE = 1.0;
export const SCALE_FACTOR = TARGET_SQUARE_SIZE / ORIGINAL_SQUARE_SIZE;

export const BOARD_Y = 0.017393 * SCALE_FACTOR;

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export type File = typeof FILES[number];
export type Rank = typeof RANKS[number];
export type Square = `${File}${Rank}`;

export function fileToIndex(file: string): number {
  return file.charCodeAt(0) - 97;
}

export function rankToIndex(rank: string): number {
  return parseInt(rank) - 1;
}

export function get3DPosition(square: string): [number, number, number] {
  const file = fileToIndex(square[0]);
  const rank = rankToIndex(square[1]);
  
  const x = (file - 3.5) * TARGET_SQUARE_SIZE;
  const z = (rank - 3.5) * TARGET_SQUARE_SIZE;
  
  return [x, BOARD_Y, z];
}

export function squareToFileRank(square: string): [File, Rank] {
  return [square[0] as File, square[1] as Rank];
}

export const PIECE_SCALE = SCALE_FACTOR;
