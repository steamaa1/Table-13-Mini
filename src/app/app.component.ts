import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BattleComponent } from './screens/battle/battle.component';
@Component({selector:'app-root',standalone:true,imports:[BattleComponent],template:'<app-battle></app-battle>',changeDetection:ChangeDetectionStrategy.OnPush})
export class AppComponent {}
