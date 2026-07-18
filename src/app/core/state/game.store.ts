import { Injectable, computed, signal } from '@angular/core';
import { ENEMIES } from '../../content/enemies';
import { EvaluatedHand, GamePhase, PlayingCard, ResolutionPreview } from '../models/game.models';
import { bestHand, createDeck, shuffle } from '../poker/poker-engine';

@Injectable({providedIn:'root'})
export class GameStore {
  readonly deck=signal<PlayingCard[]>([]); readonly discard=signal<PlayingCard[]>([]);
  readonly hand=signal<PlayingCard[]>([]); readonly river=signal<Array<PlayingCard|null>>(Array(7).fill(null));
  readonly selected=signal<number|null>(null); readonly enemyHp=signal(80); readonly enemyMax=signal(80);
  readonly playerHp=signal(42); readonly shield=signal(0); readonly coins=signal(0);
  readonly turn=signal(1); readonly round=signal(1); readonly chain=signal(1);
  readonly lastUsed=signal<string[]>([]); readonly lastColor=signal<'红色'|'黑色'|null>(null);
  readonly bestChain=signal(1); readonly totalDamage=signal(0); readonly phase=signal<GamePhase>('player');
  readonly actionsLeft=signal(2); readonly toast=signal(''); readonly resolution=signal<ResolutionPreview|null>(null);
  readonly result=signal<'win'|'loss'|null>(null);

  readonly enemy=computed(()=>ENEMIES[this.round()-1]);
  readonly riverCount=computed(()=>this.river().filter(card=>card!==null).length);
  readonly currentHand=computed(()=>bestHand(this.river().filter((card):card is PlayingCard=>card!==null)));
  readonly preview=computed(()=>this.calculateResolution(this.currentHand()));
  readonly canPlay=computed(()=>this.phase()==='player'&&this.currentHand()!==null);
  readonly canDiscard=computed(()=>this.phase()==='player'&&this.selected()!==null&&this.actionsLeft()>0);

  constructor(){this.reset();}

  reset():void {
    this.deck.set(shuffle(createDeck()));this.discard.set([]);this.hand.set([]);this.river.set(Array(7).fill(null));
    this.selected.set(null);this.playerHp.set(42);this.shield.set(0);this.coins.set(0);this.turn.set(1);this.round.set(1);
    this.chain.set(1);this.lastUsed.set([]);this.lastColor.set(null);this.bestChain.set(1);this.totalDamage.set(0);
    this.phase.set('player');this.actionsLeft.set(2);this.result.set(null);this.resolution.set(null);this.loadEnemy();this.drawTo(5);
  }

  chooseCard(index:number):void {if(this.phase()!=='player')return;this.selected.update(value=>value===index?null:index);}

  placeAt(index:number):void {
    const selected=this.selected();
    if(this.phase()!=='player'||selected===null||this.actionsLeft()<=0){this.notify(selected===null?'先从手中选一张牌':'本回合已没有放牌次数');return;}
    const hand=[...this.hand()],river=[...this.river()];const incoming=hand.splice(selected,1)[0];
    if(river[index])hand.push(river[index]!);river[index]=incoming;
    this.hand.set(hand);this.river.set(river);this.selected.set(null);this.actionsLeft.update(value=>value-1);
  }

  discardSelected():void {
    const selected=this.selected();if(selected===null||!this.canDiscard())return;
    const hand=[...this.hand()];const [removed]=hand.splice(selected,1);this.hand.set(hand);this.discard.update(cards=>[...cards,removed]);
    this.selected.set(null);this.actionsLeft.update(value=>value-1);this.drawTo(5);
  }

  async settle():Promise<void> {
    const preview=this.preview();if(!preview||!this.canPlay())return;
    this.phase.set('resolving');this.resolution.set(preview);await this.wait(720);
    this.chain.set(preview.chain);this.bestChain.update(value=>Math.max(value,preview.chain));this.lastColor.set(preview.hand.color);
    this.shield.update(value=>value+preview.shieldGain);this.playerHp.update(value=>Math.min(42,value+preview.heal));
    this.enemyHp.update(value=>value-preview.damage);this.totalDamage.update(value=>value+preview.damage);this.coins.update(value=>value+Math.max(1,preview.hand.tier));
    this.lastUsed.set(preview.hand.cards.map(card=>card.id));await this.wait(360);this.consumeScoredCards(preview.hand);
    if(this.enemyHp()<=0){await this.winRound();return;}
    await this.enemyTurn();
  }

  private calculateResolution(hand:EvaluatedHand|null):ResolutionPreview|null {
    if(!hand)return null;const ids=hand.cards.map(card=>card.id);const shared=ids.some(id=>this.lastUsed().includes(id));
    let chain=shared?Math.min(4,this.chain()+.35):1;let pact:ResolutionPreview['pact']='idle';
    if(this.lastColor()&&this.lastColor()!==hand.color){chain=Math.min(4,chain+.25);pact='fulfilled';}
    else if(this.lastColor()===hand.color){chain=Math.max(1,chain-.25);pact='broken';}
    let damage=Math.round(hand.base*chain);let heal=0;const shieldGain=hand.type==='pair'?6:hand.type==='two-pair'?10:0;
    if(hand.type==='flush'){damage+=hand.color==='红色'?6:10;if(hand.color==='红色')heal=4;}
    return {hand,chain,damage,shared,pact,shieldGain,heal};
  }

  private consumeScoredCards(hand:EvaluatedHand):void {
    const ids=hand.cards.map(card=>card.id);const keep=[...hand.cards].sort((a,b)=>b.rank-a.rank).slice(0,2).map(card=>card.id);
    const discarded:PlayingCard[]=[];
    this.river.update(cards=>cards.map(card=>{if(card&&ids.includes(card.id)&&!keep.includes(card.id)){discarded.push(card);return null;}return card;}));
    this.discard.update(cards=>[...cards,...discarded]);
  }

  private async enemyTurn():Promise<void> {
    this.phase.set('enemy');await this.wait(420);let damage=this.enemy().damage;
    const blocked=Math.min(this.shield(),damage);this.shield.update(value=>value-blocked);damage-=blocked;
    if(damage>0)this.playerHp.update(value=>value-damage);
    if(this.round()===3&&this.turn()%3===0){this.river.update(cards=>shuffle(cards));this.notify('庄家作弊：牌河被调换');}
    else this.notify(damage>0?`敌人造成 ${damage} 点伤害`:'护盾挡下了攻击');
    if(this.playerHp()<=0){this.phase.set('ended');this.result.set('loss');return;}
    this.turn.update(value=>value+1);this.actionsLeft.set(2);this.drawTo(5);this.resolution.set(null);this.phase.set('player');
  }

  private async winRound():Promise<void> {
    if(this.round()>=3){this.phase.set('ended');this.result.set('win');return;}
    this.phase.set('transition');await this.wait(650);this.round.update(value=>value+1);this.turn.set(1);this.chain.update(value=>Math.max(1,value-.5));
    this.lastUsed.set([]);this.coins.update(value=>value+12);this.playerHp.update(value=>Math.min(42,value+8));this.actionsLeft.set(2);
    this.loadEnemy();this.resolution.set(null);this.phase.set('player');this.notify('下一名赌客入席');
  }

  private loadEnemy():void {this.enemyMax.set(this.enemy().hp);this.enemyHp.set(this.enemy().hp);}
  private drawTo(count:number):void {
    let deck=[...this.deck()],discard=[...this.discard()],hand=[...this.hand()];
    while(hand.length<count){if(!deck.length){deck=shuffle(discard);discard=[];}if(!deck.length)break;hand.push(deck.pop()!);}
    this.deck.set(deck);this.discard.set(discard);this.hand.set(hand);
  }
  private notify(message:string):void {this.toast.set(message);window.setTimeout(()=>{if(this.toast()===message)this.toast.set('');},1800);}
  private wait(ms:number):Promise<void>{return new Promise(resolve=>window.setTimeout(resolve,ms));}
}
