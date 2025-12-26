
export enum BalloonColor {
  Red = '#ef4444',
  Blue = '#3b82f6',
  Green = '#22c55e',
  Yellow = '#eab308',
  Purple = '#a855f7',
  Pink = '#ec4899',
  Cyan = '#06b6d4'
}

export interface Balloon {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: BalloonColor;
  points: number;
  isPopped: boolean;
  velocity: { x: number; y: number };
}

export interface Dart {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  isActive: boolean;
}

export interface GameState {
  score: number;
  dartsLeft: number;
  level: number;
  balloons: Balloon[];
  isGameOver: boolean;
  streak: number;
}
