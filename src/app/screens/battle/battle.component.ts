import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';
import { GameDialogComponent } from '../../components/game-dialog/game-dialog.component';
import { PlayingCardComponent } from '../../components/playing-card/playing-card.component';
import { PlayingCard } from '../../core/models/game.models';
import { rankLabel } from '../../core/poker/poker-engine';
import { GameStore } from '../../core/state/game.store';

@Component({selector:'app-battle',standalone:true,imports:[PlayingCardComponent,GameDialogComponent],templateUrl:'./battle.component.html',styleUrl:'./battle.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class BattleComponent {
  readonly helpOpen=signal(false);readonly deckOpen=signal(false);readonly immersive=signal(false);readonly rankLabel=rankLabel;
  readonly suitGroups=computed(()=>[
    {id:'hearts',name:'红桃',symbol:'♥',cards:this.allCards().filter(card=>card.suit==='hearts')},
    {id:'diamonds',name:'方片',symbol:'♦',cards:this.allCards().filter(card=>card.suit==='diamonds')},
    {id:'clubs',name:'梅花',symbol:'♣',cards:this.allCards().filter(card=>card.suit==='clubs')},
    {id:'spades',name:'黑桃',symbol:'♠',cards:this.allCards().filter(card=>card.suit==='spades')}
  ]);
  constructor(readonly game:GameStore){}
  cardTrack(_:number,card:PlayingCard|null):string{return card?.id??'empty';}
  isScoring(card:PlayingCard):boolean{return this.game.resolution()?.hand.cards.some(value=>value.id===card.id)??false;}
  isRetained(card:PlayingCard):boolean {const scored=this.game.resolution()?.hand.cards;if(!scored)return false;return [...scored].sort((a,b)=>b.rank-a.rank).slice(0,2).some(value=>value.id===card.id);}
  isConsuming(card:PlayingCard):boolean{return this.game.resolutionStage()==='consume'&&this.isScoring(card)&&!this.isRetained(card);}
  allCards():PlayingCard[]{return [...this.game.deck(),...this.game.discard(),...this.game.hand(),...this.game.river().filter((card):card is PlayingCard=>card!==null)].sort((a,b)=>a.suit.localeCompare(b.suit)||a.rank-b.rank);}
  closeAll():void{this.helpOpen.set(false);this.deckOpen.set(false);}
  async toggleImmersive():Promise<void>{
    try{
      if(!document.fullscreenElement){await document.documentElement.requestFullscreen();this.immersive.set(true);}
      else{await document.exitFullscreen();this.immersive.set(false);}
    }catch{window.scrollTo({top:Math.max(1,window.scrollY+1),behavior:'smooth'});}
  }
  @HostListener('document:fullscreenchange') syncFullscreen():void{this.immersive.set(Boolean(document.fullscreenElement));}
  @HostListener('window:keydown',['$event']) handleKeyboard(event:KeyboardEvent):void{
    if(event.key==='Escape'){this.closeAll();return;}if(this.helpOpen()||this.deckOpen()||this.game.result())return;
    if(event.key>='1'&&event.key<='5')this.game.chooseCard(Number(event.key)-1);
    if(event.key.toLowerCase()==='d')this.game.discardSelected();
    if(event.key==='Enter'&&this.game.canPlay())void this.game.settle();
  }
}
