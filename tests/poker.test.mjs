import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFive,bestHand} from '../public/js/core/poker.js';
const c=(rank,suit='spades')=>({rank,suit,color:['hearts','diamonds'].includes(suit)?'red':'black',id:`${suit}-${rank}`});
test('识别 A2345 小顺子',()=>assert.equal(evaluateFive([c(14,'spades'),c(2,'hearts'),c(3,'clubs'),c(4,'diamonds'),c(5,'spades')]).type,'straight'));
test('识别皇家同花顺',()=>assert.equal(evaluateFive([10,11,12,13,14].map(r=>c(r,'hearts'))).name,'皇家同花顺'));
test('七张牌中选出四条',()=>assert.equal(bestHand([c(9,'spades'),c(9,'hearts'),c(9,'clubs'),c(9,'diamonds'),c(2),c(3),c(4)]).type,'four'));
test('葫芦胜过同一组中的三条',()=>assert.equal(bestHand([c(7),c(7,'hearts'),c(7,'clubs'),c(4),c(4,'hearts'),c(2)]).type,'full-house'));
