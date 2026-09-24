export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export type BirdSkin = 'classic' | 'cyber' | 'phoenix' | 'emerald';

export interface Bird {
  x: number;
  y: number;
  radius: number;
  width: number;
  height: number;
  velocity: number;
  gravity: number;
  jumpForce: number;
  rotation: number;
  wingFrame: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
  width: number;
  passed: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'feather' | 'spark' | 'smoke';
  rotation?: number;
  rotSpeed?: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  progressiveSpeed: boolean;
  timeOfDay: TimeOfDay;
  skin: BirdSkin;
  showHitboxes: boolean;
}
