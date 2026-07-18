export type SuitId = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';
export type GamePhase = 'player' | 'resolving' | 'enemy' | 'transition' | 'ended';

export interface PlayingCard {
  id: string;
  suit: SuitId;
  symbol: string;
  color: CardColor;
  rank: number;
}

export interface EvaluatedHand {
  type: string;
  name: string;
  tier: number;
  base: number;
  high: number;
  cards: PlayingCard[];
  color: '红色' | '黑色';
  comparison: number[];
}

export interface Enemy {
  name: string;
  chapter: string;
  quote: string;
  hp: number;
  icon: string;
  intent: string;
  text: string;
  damage: number;
  suit: string;
}

export interface ResolutionPreview {
  hand: EvaluatedHand;
  chain: number;
  damage: number;
  shared: boolean;
  pact: 'fulfilled' | 'broken' | 'idle';
  shieldGain: number;
  heal: number;
}
