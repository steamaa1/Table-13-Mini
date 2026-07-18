import { bestHand, evaluateFive } from './poker-engine';
import { PlayingCard, SuitId } from '../models/game.models';

const card=(rank:number,suit:SuitId='spades'):PlayingCard=>({
  rank,suit,id:`${suit}-${rank}`,
  symbol:{hearts:'♥',diamonds:'♦',clubs:'♣',spades:'♠'}[suit],
  color:suit==='hearts'||suit==='diamonds'?'red':'black'
});

describe('PokerEngine',()=>{
  it('识别 A2345 小顺子',()=>{
    expect(evaluateFive([card(14),card(2,'hearts'),card(3,'clubs'),card(4,'diamonds'),card(5)])?.type).toBe('straight');
  });

  it('识别皇家同花顺',()=>{
    expect(evaluateFive([10,11,12,13,14].map(rank=>card(rank,'hearts')))?.name).toBe('皇家同花顺');
  });

  it('从七张牌中选出四条',()=>{
    expect(bestHand([card(9),card(9,'hearts'),card(9,'clubs'),card(9,'diamonds'),card(2),card(3),card(4)])?.type).toBe('four');
  });

  it('对子比较优先使用对子点数而非最高踢脚',()=>{
    const result=bestHand([
      card(14),card(9),card(9,'hearts'),card(5),card(3),
      card(13,'clubs'),card(13,'diamonds')
    ]);
    expect(result?.type).toBe('two-pair');
    expect(result?.comparison.slice(0,2)).toEqual([13,9]);
  });

  it('比较两个一对组合时选择更大的对子',()=>{
    const result=bestHand([
      card(14),card(9),card(9,'hearts'),card(4),card(3),
      card(13,'clubs'),card(13,'diamonds')
    ]);
    expect(result?.comparison[0]).toBe(13);
  });
});
