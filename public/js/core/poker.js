export const SUITS = [
  { id: 'hearts', symbol: '♥', color: 'red' },
  { id: 'diamonds', symbol: '♦', color: 'red' },
  { id: 'clubs', symbol: '♣', color: 'black' },
  { id: 'spades', symbol: '♠', color: 'black' }
];
export const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];
export const rankLabel = value => ({11:'J',12:'Q',13:'K',14:'A'}[value] || String(value));
export function createDeck(){
  return SUITS.flatMap(suit => RANKS.map(rank => ({ id:`${suit.id}-${rank}`, suit:suit.id, symbol:suit.symbol, color:suit.color, rank })));
}
export function shuffle(items, random=Math.random){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
function combinations(items, size){
  const result=[];
  const walk=(start,pick)=>{if(pick.length===size){result.push(pick);return;}for(let i=start;i<=items.length-(size-pick.length);i++)walk(i+1,[...pick,items[i]]);};
  walk(0,[]); return result;
}
export function evaluateFive(cards){
  if(cards.length!==5) return null;
  const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
  const counts=new Map(); ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const flush=cards.every(c=>c.suit===cards[0].suit);
  const unique=[...new Set(ranks)];
  let straight=false, high=ranks[4];
  if(unique.length===5 && unique[4]-unique[0]===4) straight=true;
  if(unique.join(',')==='2,3,4,5,14'){straight=true;high=5;}
  let type='high',name='高牌',tier=1,base=5;
  if(straight&&flush){type='straight-flush';name=high===14?'皇家同花顺':'同花顺';tier=9;base=42;}
  else if(groups[0][1]===4){type='four';name='四条';tier=8;base=34;}
  else if(groups[0][1]===3&&groups[1][1]===2){type='full-house';name='葫芦';tier=7;base=28;}
  else if(flush){type='flush';name='同花';tier=6;base=24;}
  else if(straight){type='straight';name='顺子';tier=5;base=20;}
  else if(groups[0][1]===3){type='three';name='三条';tier=4;base=16;}
  else if(groups[0][1]===2&&groups[1][1]===2){type='two-pair';name='两对';tier=3;base=12;}
  else if(groups[0][1]===2){type='pair';name='对子';tier=2;base=8;}
  return {type,name,tier,base,high,cards,color:dominantColor(cards),rankScore:groups.flatMap(g=>[g[1],g[0]])};
}
function dominantColor(cards){const red=cards.filter(c=>c.color==='red').length;return red>=3?'红色':'黑色';}
export function bestHand(cards){
  if(cards.length<5)return null;
  return combinations(cards,5).map(evaluateFive).sort((a,b)=>b.tier-a.tier||b.high-a.high||compareScores(b.rankScore,a.rankScore))[0];
}
function compareScores(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d;}return 0;}
