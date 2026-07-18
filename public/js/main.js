import {createDeck,shuffle,bestHand,rankLabel} from './core/poker.js';
const $=s=>document.querySelector(s);
const state={deck:[],discard:[],hand:[],river:Array(7).fill(null),selected:null,enemyHp:80,enemyMax:80,playerHp:42,shield:0,coins:0,turn:1,round:1,chain:1,lastUsed:[],lastColor:null,bestChain:1,totalDamage:0,ended:false};
const enemies=[
  {name:'催债人',hp:80,icon:'♦',intent:'收债',text:'造成 8 点伤害',damage:8},
  {name:'缺脸侍者',hp:110,icon:'♣',intent:'暗牌',text:'造成 11 点伤害',damage:11},
  {name:'作弊魔术师',hp:145,icon:'♠',intent:'换牌',text:'造成 14 点伤害，并打乱牌河',damage:14}
];
function reset(){Object.assign(state,{deck:shuffle(createDeck()),discard:[],hand:[],river:Array(7).fill(null),selected:null,enemyHp:80,enemyMax:80,playerHp:42,shield:0,coins:0,turn:1,round:1,chain:1,lastUsed:[],lastColor:null,bestChain:1,totalDamage:0,ended:false});drawTo(5);loadEnemy();render();}
function drawTo(n){while(state.hand.length<n){if(!state.deck.length){state.deck=shuffle(state.discard);state.discard=[];}if(!state.deck.length)break;state.hand.push(state.deck.pop());}}
function cardNode(card,where,index){const b=document.createElement('button');b.className=`playing-card ${card.color==='red'?'red':''}`;b.type='button';b.dataset.id=card.id;b.setAttribute('role','listitem');b.setAttribute('aria-label',`${rankLabel(card.rank)}${card.symbol}`);b.innerHTML=`<span class="corner">${rankLabel(card.rank)}<small>${card.symbol}</small></span><span class="suit-center">${card.symbol}</span><span class="corner bottom">${rankLabel(card.rank)}<small>${card.symbol}</small></span>`;
  if(where==='hand'){if(state.selected===index)b.classList.add('selected');b.onclick=()=>{state.selected=state.selected===index?null:index;render();};}
  else{if(state.lastUsed.includes(card.id))b.classList.add('used');b.onclick=()=>placeAt(index);}
  return b;
}
function placeAt(index){if(state.selected===null){toast('请先选择一张手牌');return;}const incoming=state.hand.splice(state.selected,1)[0];if(state.river[index])state.hand.push(state.river[index]);state.river[index]=incoming;state.selected=null;drawTo(5);render();}
function render(){
  $('#river').replaceChildren(...state.river.map((card,i)=>{if(card)return cardNode(card,'river',i);const slot=document.createElement('button');slot.className='card-slot';slot.type='button';slot.setAttribute('role','listitem');slot.setAttribute('aria-label',`空牌位 ${i+1}`);slot.onclick=()=>placeAt(i);return slot;}));
  $('#hand').replaceChildren(...state.hand.map((c,i)=>cardNode(c,'hand',i)));
  const hand=bestHand(state.river.filter(Boolean));
  $('#comboName').textContent=hand?hand.name:'等待牌型';$('#comboScore').textContent=hand?`基础伤害 ${hand.base}`:'至少放入五张牌';
  $('#playBtn').disabled=!hand||state.ended;$('#discardBtn').disabled=state.selected===null||state.ended;
  $('#chainValue').textContent=`×${state.chain.toFixed(1)}`;$('#playerHp').textContent=state.playerHp;$('#playerShield').textContent=state.shield;$('#coins').textContent=state.coins;$('#deckCount').textContent=state.deck.length;$('#discardCount').textContent=state.discard.length;$('#turnLabel').textContent=state.turn;$('#roundLabel').textContent=`${state.round} / 3`;$('#lastColor').textContent=state.lastColor||'—';
  $('#enemyHealthText').textContent=`${Math.max(0,state.enemyHp)} / ${state.enemyMax}`;$('#enemyHealthBar').style.width=`${Math.max(0,state.enemyHp/state.enemyMax*100)}%`;$('.health-bar').setAttribute('aria-valuenow',Math.max(0,state.enemyHp));$('.health-bar').setAttribute('aria-valuemax',state.enemyMax);
  $('#hint').textContent=state.selected===null?'先选择一张手牌，再选择或替换一个牌位。':'已选中手牌：点击牌河中的位置放置。';
}
function settle(){const best=bestHand(state.river.filter(Boolean));if(!best)return;const ids=best.cards.map(c=>c.id);const shared=ids.some(id=>state.lastUsed.includes(id));state.chain=shared?Math.min(4,state.chain+.35):1;
  if(state.lastColor&&state.lastColor!==best.color){state.chain=Math.min(4,state.chain+.25);toast('赌约兑现：红黑交替！');}else if(state.lastColor===best.color){state.chain=Math.max(1,state.chain-.25);toast('赌约违约：颜色重复');}
  state.lastColor=best.color;state.bestChain=Math.max(state.bestChain,state.chain);let damage=Math.round(best.base*state.chain);
  if(best.type==='pair'||best.type==='two-pair'){const gain=best.type==='pair'?6:10;state.shield+=gain;}
  if(best.type==='flush'){damage+=best.color==='红色'?6:10;if(best.color==='红色')state.playerHp=Math.min(42,state.playerHp+4);}
  state.enemyHp-=damage;state.totalDamage+=damage;state.coins+=Math.max(1,best.tier);state.lastUsed=ids;showDamage(damage);particles();
  const keep=[...best.cards].sort((a,b)=>b.rank-a.rank).slice(0,2).map(c=>c.id);state.river=state.river.map(c=>{if(c&&ids.includes(c.id)&&!keep.includes(c.id)){state.discard.push(c);return null;}return c;});
  if(state.enemyHp<=0){winRound();return;}enemyTurn();state.turn++;drawTo(5);render();}
function enemyTurn(){let dmg=enemies[state.round-1].damage;if(state.shield>=dmg){state.shield-=dmg;dmg=0;}else{dmg-=state.shield;state.shield=0;state.playerHp-=dmg;}if(state.round===3&&state.turn%3===0){state.river=shuffle(state.river);}if(dmg>0){$('.player-panel').classList.remove('shake');void $('.player-panel').offsetWidth;$('.player-panel').classList.add('shake');toast(`敌人造成 ${dmg} 点伤害`);}if(state.playerHp<=0)end(false);}
function winRound(){if(state.round>=3){end(true);return;}state.round++;state.turn=1;state.chain=Math.max(1,state.chain-.5);state.lastUsed=[];state.coins+=12;state.playerHp=Math.min(42,state.playerHp+8);loadEnemy();toast('赌客退席。新的对手坐下了。');render();}
function loadEnemy(){const e=enemies[state.round-1];state.enemyMax=e.hp;state.enemyHp=e.hp;$('#enemyName').textContent=e.name;$('#intentIcon').textContent=e.icon;$('#intentTitle').textContent=e.intent;$('#intentText').textContent=e.text;$('#enemyStatus').textContent=state.round===3?'庄家作弊中':'等待出牌';}
function discardSelected(){if(state.selected===null)return;state.discard.push(state.hand.splice(state.selected,1)[0]);state.selected=null;drawTo(5);enemyTurn();state.turn++;render();}
function end(win){state.ended=true;$('#resultSigil').textContent=win?'♛':'♠';$('#resultTitle').textContent=win?'你赢下了十三号牌桌':'你的名字被写进了账本';$('#resultText').textContent=win?'三名赌客依次退席，但牌桌深处仍传来洗牌声。这只是一个可玩样品。':'筹码散落一地。调整牌河节奏，再试一次红黑交替连锁。';$('#bestChain').textContent=`×${state.bestChain.toFixed(1)}`;$('#totalDamage').textContent=state.totalDamage;$('#endDialog').showModal();render();}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1700);}
function showDamage(n){const r=$('.enemy-avatar').getBoundingClientRect(),p=document.createElement('div');p.className='damage-pop';p.textContent=`-${n}`;p.style.left=`${r.left+r.width/2}px`;p.style.top=`${r.top+r.height/2}px`;document.body.appendChild(p);setTimeout(()=>p.remove(),900);}
function particles(){const c=$('#fx'),ctx=c.getContext('2d'),d=devicePixelRatio||1;c.width=innerWidth*d;c.height=innerHeight*d;ctx.scale(d,d);const parts=Array.from({length:22},()=>({x:innerWidth/2,y:innerHeight*.42,vx:(Math.random()-.5)*8,vy:(Math.random()-.7)*7,a:1}));let f=0;(function tick(){ctx.clearRect(0,0,innerWidth,innerHeight);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.a-=.035;ctx.globalAlpha=Math.max(0,p.a);ctx.fillStyle=Math.random()>.5?'#ffd98c':'#b27be8';ctx.fillRect(p.x,p.y,3,3);});if(f++<30)requestAnimationFrame(tick);else ctx.clearRect(0,0,innerWidth,innerHeight);})();}
$('#playBtn').onclick=settle;$('#discardBtn').onclick=discardSelected;$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('[data-close]').onclick=()=>$('#helpDialog').close();$('#restartBtn').onclick=()=>{$('#endDialog').close();reset();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#helpDialog').open)$('#helpDialog').close();if(e.key>='1'&&e.key<='5'){const i=Number(e.key)-1;if(state.hand[i]){state.selected=i;render();}}if(e.key.toLowerCase()==='d')discardSelected();if(e.key==='Enter'&&!$('#playBtn').disabled)settle();});
reset();
