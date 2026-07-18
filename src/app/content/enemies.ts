import { Enemy } from '../core/models/game.models';
export const ENEMIES:ReadonlyArray<Enemy> = [
  {name:'催债人',chapter:'第一席 · 债务之桌',quote:'“每一张牌，都要付利息。”',hp:80,icon:'♦',intent:'收债',text:'造成 8 点伤害',damage:8,suit:'♦'},
  {name:'缺脸侍者',chapter:'第二席 · 无面酒馆',quote:'“看不见的牌，才最诚实。”',hp:110,icon:'♣',intent:'暗牌',text:'造成 11 点伤害',damage:11,suit:'♣'},
  {name:'作弊魔术师',chapter:'第三席 · 庄家密室',quote:'“规则从来都站在赢家那边。”',hp:145,icon:'♠',intent:'换牌',text:'造成 14 点伤害，并打乱牌河',damage:14,suit:'♠'}
];
