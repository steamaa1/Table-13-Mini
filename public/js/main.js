import {createDeck,shuffle,bestHand,rankLabel} from './core/poker.js';

const $ = selector => document.querySelector(selector);
const state = {
  deck:[], discard:[], hand:[], river:Array(7).fill(null), selected:null,
  enemyHp:80, enemyMax:80, playerHp:42, shield:0, coins:0,
  turn:1, round:1, chain:1, lastUsed:[], lastColor:null,
  bestChain:1, totalDamage:0, ended:false, resolving:false
};

const enemies = [
  {name:'催债人', chapter:'第一席 · 债务之桌', quote:'“每一张牌，都要付利息。”', hp:80, icon:'♦', intent:'收债', text:'造成 8 点伤害', damage:8, suit:'♦'},
  {name:'缺脸侍者', chapter:'第二席 · 无面酒馆', quote:'“看不见的牌，才最诚实。”', hp:110, icon:'♣', intent:'暗牌', text:'造成 11 点伤害', damage:11, suit:'♣'},
  {name:'作弊魔术师', chapter:'第三席 · 庄家密室', quote:'“规则从来都站在赢家那边。”', hp:145, icon:'♠', intent:'换牌', text:'造成 14 点伤害，并打乱牌河', damage:14, suit:'♠'}
];

function reset(){
  Object.assign(state,{deck:shuffle(createDeck()),discard:[],hand:[],river:Array(7).fill(null),selected:null,enemyHp:80,enemyMax:80,playerHp:42,shield:0,coins:0,turn:1,round:1,chain:1,lastUsed:[],lastColor:null,bestChain:1,totalDamage:0,ended:false,resolving:false});
  drawTo(5); loadEnemy(); render();
}

function drawTo(count){
  while(state.hand.length<count){
    if(!state.deck.length){state.deck=shuffle(state.discard);state.discard=[];}
    if(!state.deck.length) break;
    state.hand.push(state.deck.pop());
  }
}

function cardNode(card, where, index){
  const button=document.createElement('button');
  button.className=`playing-card ${card.color==='red'?'red':''}`;
  button.type='button'; button.dataset.id=card.id;
  button.setAttribute('role','listitem');
  button.setAttribute('aria-label',`${rankLabel(card.rank)}${card.symbol}`);
  button.innerHTML=`<span class="corner">${rankLabel(card.rank)}<small>${card.symbol}</small></span><span class="suit-center">${card.symbol}</span><span class="corner bottom">${rankLabel(card.rank)}<small>${card.symbol}</small></span>`;
  if(where==='hand'){
    if(state.selected===index) button.classList.add('selected');
    button.onclick=()=>{if(state.resolving)return;state.selected=state.selected===index?null:index;render();};
  }else{
    if(state.lastUsed.includes(card.id)) button.classList.add('used');
    button.onclick=()=>placeAt(index);
  }
  return button;
}

function placeAt(index){
  if(state.resolving||state.ended)return;
  if(state.selected===null){toast('先从手中选一张牌');return;}
  const incoming=state.hand.splice(state.selected,1)[0];
  if(state.river[index]) state.hand.push(state.river[index]);
  state.river[index]=incoming; state.selected=null; drawTo(5); render();
}

function currentHand(){return bestHand(state.river.filter(Boolean));}

function render(){
  $('#river').replaceChildren(...state.river.map((card,index)=>{
    if(card)return cardNode(card,'river',index);
    const slot=document.createElement('button'); slot.className='card-slot'; slot.type='button';
    slot.setAttribute('role','listitem'); slot.setAttribute('aria-label',`空牌位 ${index+1}`); slot.onclick=()=>placeAt(index); return slot;
  }));
  $('#hand').replaceChildren(...state.hand.map((card,index)=>cardNode(card,'hand',index)));

  const hand=currentHand();
  $('#comboName').textContent=hand?hand.name:'等待牌型';
  $('#comboKicker').textContent=hand?`${hand.color}占优 · 五张牌成立`:'牌河尚未成型';
  $('#baseScore').textContent=hand?hand.base:0;
  $('#previewScore').textContent=hand?Math.round(hand.base*state.chain):0;
  $('#playBtn').disabled=!hand||state.ended||state.resolving;
  $('#discardBtn').disabled=state.selected===null||state.ended||state.resolving;
  $('#chainValue').textContent=state.chain.toFixed(1);
  $('#playerHp').textContent=state.playerHp; $('#playerShield').textContent=state.shield; $('#coins').textContent=state.coins;
  $('#deckCount').textContent=state.deck.length; $('#discardCount').textContent=state.discard.length;
  $('#turnLabel').textContent=state.turn; $('#roundLabel').textContent=`${state.round} / 3`; $('#lastColor').textContent=state.lastColor||'—';
  $('#enemyHealthText').textContent=`${Math.max(0,state.enemyHp)} / ${state.enemyMax}`;
  $('#enemyHealthBar').style.width=`${Math.max(0,state.enemyHp/state.enemyMax*100)}%`;
  $('.enemy-health-track').setAttribute('aria-valuenow',Math.max(0,state.enemyHp));
  $('.enemy-health-track').setAttribute('aria-valuemax',state.enemyMax);
  $('#hint').textContent=state.selected===null?'选择一张手牌，然后放入牌河。':'牌已抽出：选择牌河中的位置。';
}

async function settle(){
  const best=currentHand(); if(!best||state.resolving)return;
  state.resolving=true; render();
  const ids=best.cards.map(card=>card.id);
  const shared=ids.some(id=>state.lastUsed.includes(id));
  state.chain=shared?Math.min(4,state.chain+.35):1;
  let pactResult='';
  if(state.lastColor&&state.lastColor!==best.color){state.chain=Math.min(4,state.chain+.25);pactResult='赌约兑现 · 红黑交替';}
  else if(state.lastColor===best.color){state.chain=Math.max(1,state.chain-.25);pactResult='赌约违约 · 颜色重复';}
  state.lastColor=best.color; state.bestChain=Math.max(state.bestChain,state.chain);
  let damage=Math.round(best.base*state.chain);
  if(best.type==='pair'||best.type==='two-pair')state.shield+=best.type==='pair'?6:10;
  if(best.type==='flush'){
    damage+=best.color==='红色'?6:10;
    if(best.color==='红色')state.playerHp=Math.min(42,state.playerHp+4);
  }
  markScoringCards(ids); showCombo(best,damage); await wait(560);
  if(pactResult)toast(pactResult);
  state.enemyHp-=damage; state.totalDamage+=damage; state.coins+=Math.max(1,best.tier); state.lastUsed=ids;
  showDamage(damage); particles(); flashOpponent();
  await wait(240);
  const keep=[...best.cards].sort((a,b)=>b.rank-a.rank).slice(0,2).map(card=>card.id);
  state.river=state.river.map(card=>{
    if(card&&ids.includes(card.id)&&!keep.includes(card.id)){state.discard.push(card);return null;}
    return card;
  });
  if(state.enemyHp<=0){state.resolving=false;winRound();return;}
  enemyTurn(); state.turn++; drawTo(5); state.resolving=false; render();
}

function markScoringCards(ids){
  document.querySelectorAll('#river .playing-card').forEach((node,index)=>{
    if(state.river[index]&&ids.includes(state.river[index].id)){
      node.classList.add('selected'); node.style.transitionDelay=`${index*35}ms`;
    }
  });
}

function showCombo(best,damage){
  const banner=$('#comboBanner');
  banner.querySelector('strong').textContent=best.name;
  banner.querySelector('span').textContent=`${best.base} × ${state.chain.toFixed(1)} = ${damage}`;
  banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
}

function enemyTurn(){
  let damage=enemies[state.round-1].damage;
  if(state.shield>=damage){state.shield-=damage;damage=0;}
  else{damage-=state.shield;state.shield=0;state.playerHp-=damage;}
  if(state.round===3&&state.turn%3===0){state.river=shuffle(state.river);toast('庄家作弊：牌河被调换');}
  if(damage>0){
    $('.table-zone').classList.remove('shake');void $('.table-zone').offsetWidth;$('.table-zone').classList.add('shake');
    toast(`敌人造成 ${damage} 点伤害`);
  }else toast('护盾挡下了这次攻击');
  if(state.playerHp<=0)end(false);
}

function winRound(){
  if(state.round>=3){end(true);return;}
  state.round++;state.turn=1;state.chain=Math.max(1,state.chain-.5);state.lastUsed=[];state.coins+=12;state.playerHp=Math.min(42,state.playerHp+8);
  loadEnemy();toast('椅子被推开，下一名赌客入席。');render();
}

function loadEnemy(){
  const enemy=enemies[state.round-1];state.enemyMax=enemy.hp;state.enemyHp=enemy.hp;
  $('#enemyName').textContent=enemy.name;$('.chapter-label').textContent=enemy.chapter;$('#enemyQuote').textContent=enemy.quote;
  $('#intentIcon').textContent=enemy.icon;$('#intentTitle').textContent=enemy.intent;$('#intentText').textContent=enemy.text;$('#intentDamage').textContent=enemy.damage;
  $('.portrait-suit').textContent=enemy.suit;
  $('#enemyPortrait').dataset.enemy=String(state.round);
}

function discardSelected(){
  if(state.selected===null||state.resolving)return;
  state.discard.push(state.hand.splice(state.selected,1)[0]);state.selected=null;drawTo(5);enemyTurn();state.turn++;render();
}

function showDeck(){
  $('#deckModalCount').textContent=state.deck.length;$('#discardModalCount').textContent=state.discard.length;$('#riverModalCount').textContent=state.river.filter(Boolean).length;
  const all=[...state.deck,...state.discard,...state.hand,...state.river.filter(Boolean)].sort((a,b)=>a.suit.localeCompare(b.suit)||a.rank-b.rank);
  $('#deckPreview').replaceChildren(...all.map(card=>{
    const node=document.createElement('div');node.className=`preview-card ${card.color==='red'?'red':''}`;node.textContent=`${rankLabel(card.rank)}${card.symbol}`;return node;
  }));
  $('#deckDialog').showModal();
}

function end(win){
  state.ended=true;$('#resultSigil').textContent=win?'♛':'♠';
  $('#resultTitle').textContent=win?'你赢下了十三号牌桌':'你的名字被写进了账本';
  $('#resultText').textContent=win?'三名赌客依次退席。桌下仍传来洗牌声——更深的赌局尚未开放。':'筹码散落一地。调整留牌节奏，利用红黑交替重新挑战。';
  $('#bestChain').textContent=`×${state.bestChain.toFixed(1)}`;$('#totalDamage').textContent=state.totalDamage;$('#endDialog').showModal();render();
}

function toast(text){const node=$('#toast');node.textContent=text;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),1700);}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function flashOpponent(){const portrait=$('#enemyPortrait');portrait.style.filter='brightness(2.2) drop-shadow(0 0 20px #d23d4d)';setTimeout(()=>portrait.style.filter='',180);}
function showDamage(value){const rect=$('#enemyPortrait').getBoundingClientRect(),node=document.createElement('div');node.className='damage-pop';node.textContent=`-${value}`;node.style.left=`${rect.left+rect.width*.62}px`;node.style.top=`${rect.top+rect.height*.45}px`;document.body.appendChild(node);setTimeout(()=>node.remove(),900);}
function particles(){
  const canvas=$('#fx'),ctx=canvas.getContext('2d'),ratio=devicePixelRatio||1;canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;ctx.scale(ratio,ratio);
  const origin=$('#enemyPortrait').getBoundingClientRect();
  const particles=Array.from({length:28},()=>({x:origin.left+origin.width/2,y:origin.top+origin.height/2,vx:(Math.random()-.5)*9,vy:(Math.random()-.75)*8,a:1,size:2+Math.random()*3}));let frame=0;
  (function tick(){ctx.clearRect(0,0,innerWidth,innerHeight);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.a-=.03;ctx.globalAlpha=Math.max(0,p.a);ctx.fillStyle=Math.random()>.45?'#f1cc7b':'#d23d4d';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(frame*.08);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();});ctx.globalAlpha=1;if(frame++<34)requestAnimationFrame(tick);else ctx.clearRect(0,0,innerWidth,innerHeight);})();
}

$('#playBtn').onclick=settle;$('#discardBtn').onclick=discardSelected;
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('[data-close]').onclick=()=>$('#helpDialog').close();
$('#deckBtn').onclick=showDeck;$('#deckPile').onclick=showDeck;$('[data-close-deck]').onclick=()=>$('#deckDialog').close();
$('#restartBtn').onclick=()=>{$('#endDialog').close();reset();};
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if($('#helpDialog').open)$('#helpDialog').close();if($('#deckDialog').open)$('#deckDialog').close();}
  if(event.key>='1'&&event.key<='5'&&!state.resolving){const index=Number(event.key)-1;if(state.hand[index]){state.selected=index;render();}}
  if(event.key.toLowerCase()==='d')discardSelected();
  if(event.key==='Enter'&&!$('#playBtn').disabled)settle();
});

reset();
