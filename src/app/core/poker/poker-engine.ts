import { CardColor, EvaluatedHand, PlayingCard, SuitId } from '../models/game.models';

export const SUITS: ReadonlyArray<{id: SuitId; symbol: string; color: CardColor}> = [
  {id:'hearts',symbol:'♥',color:'red'}, {id:'diamonds',symbol:'♦',color:'red'},
  {id:'clubs',symbol:'♣',color:'black'}, {id:'spades',symbol:'♠',color:'black'}
];
export const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14] as const;
const FACE_LABELS:Readonly<Record<number,string>>={11:'J',12:'Q',13:'K',14:'A'};
export const rankLabel = (rank:number):string => FACE_LABELS[rank] ?? String(rank);

export function createDeck(): PlayingCard[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({
    id:`${suit.id}-${rank}`,
    suit:suit.id,
    symbol:suit.symbol,
    color:suit.color,
    rank
  })));
}

export function shuffle<T>(items:ReadonlyArray<T>, random:()=>number=Math.random):T[] {
  const output=[...items];
  for(let index=output.length-1;index>0;index--){
    const target=Math.floor(random()*(index+1));
    [output[index],output[target]]=[output[target],output[index]];
  }
  return output;
}

function combinations<T>(items:ReadonlyArray<T>, size:number):T[][] {
  const result:T[][]=[];
  const walk=(start:number,picked:T[]):void=>{
    if(picked.length===size){result.push(picked);return;}
    for(let index=start;index<=items.length-(size-picked.length);index++) walk(index+1,[...picked,items[index]]);
  };
  walk(0,[]); return result;
}

export function evaluateFive(cards:PlayingCard[]):EvaluatedHand|null {
  if(cards.length!==5)return null;
  const ranks=cards.map(card=>card.rank).sort((a,b)=>a-b);
  const counts=new Map<number,number>();
  ranks.forEach(rank=>counts.set(rank,(counts.get(rank)??0)+1));
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const flush=cards.every(card=>card.suit===cards[0].suit);
  const unique=[...new Set(ranks)];
  let straight=unique.length===5&&unique[4]-unique[0]===4;
  let straightHigh=ranks[4];
  if(unique.join(',')==='2,3,4,5,14'){straight=true;straightHigh=5;}

  let type='high',name='高牌',tier=1,base=5,comparison=[...ranks].sort((a,b)=>b-a);
  if(straight&&flush){type='straight-flush';name=straightHigh===14?'皇家同花顺':'同花顺';tier=9;base=42;comparison=[straightHigh];}
  else if(groups[0][1]===4){type='four';name='四条';tier=8;base=34;comparison=[groups[0][0],groups[1][0]];}
  else if(groups[0][1]===3&&groups[1][1]===2){type='full-house';name='葫芦';tier=7;base=28;comparison=[groups[0][0],groups[1][0]];}
  else if(flush){type='flush';name='同花';tier=6;base=24;comparison=[...ranks].sort((a,b)=>b-a);}
  else if(straight){type='straight';name='顺子';tier=5;base=20;comparison=[straightHigh];}
  else if(groups[0][1]===3){type='three';name='三条';tier=4;base=16;comparison=[groups[0][0],...groups.slice(1).map(group=>group[0]).sort((a,b)=>b-a)];}
  else if(groups[0][1]===2&&groups[1][1]===2){type='two-pair';name='两对';tier=3;base=12;comparison=[Math.max(groups[0][0],groups[1][0]),Math.min(groups[0][0],groups[1][0]),groups[2][0]];}
  else if(groups[0][1]===2){type='pair';name='对子';tier=2;base=8;comparison=[groups[0][0],...groups.slice(1).map(group=>group[0]).sort((a,b)=>b-a)];}

  return {type,name,tier,base,high:comparison[0],cards,color:dominantColor(cards),comparison};
}

function dominantColor(cards:PlayingCard[]):'红色'|'黑色' {
  return cards.filter(card=>card.color==='red').length>=3?'红色':'黑色';
}

function compareValues(left:number[],right:number[]):number {
  for(let index=0;index<Math.max(left.length,right.length);index++){
    const difference=(left[index]??0)-(right[index]??0);
    if(difference!==0)return difference;
  }
  return 0;
}

export function bestHand(cards:PlayingCard[]):EvaluatedHand|null {
  if(cards.length<5)return null;
  return combinations(cards,5)
    .map(hand=>evaluateFive(hand)!)
    .sort((left,right)=>right.tier-left.tier||compareValues(right.comparison,left.comparison))[0];
}
