import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlayingCard } from '../../core/models/game.models';
import { rankLabel } from '../../core/poker/poker-engine';

@Component({
  selector:'app-playing-card',standalone:true,templateUrl:'./playing-card.component.html',styleUrl:'./playing-card.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class PlayingCardComponent {
  @Input({required:true}) card!:PlayingCard; @Input() selected=false; @Input() scoring=false; @Input() retained=false;
  @Input() compact=false; @Input() disabled=false; @Output() cardClick=new EventEmitter<void>();
  rankLabel=rankLabel;
}
