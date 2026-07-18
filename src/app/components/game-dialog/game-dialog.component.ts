import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
@Component({selector:'app-game-dialog',standalone:true,templateUrl:'./game-dialog.component.html',styleUrl:'./game-dialog.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class GameDialogComponent {@Input() open=false;@Input() title='';@Input() kicker='';@Output() closeDialog=new EventEmitter<void>();}
