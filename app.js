/* VoicePilot - Web Speech recognition + pattern-matched command engine. */
(()=>{
const $=s=>document.querySelector(s);
const JOKES=['Why do programmers prefer dark mode? Because light attracts bugs.','I told my computer I needed a break. Now it won\'t stop sending me KitKat ads.','Why did the developer go broke? He used up all his cache.','There are 10 kinds of people: those who understand binary and those who don\'t.','A SQL query walks into a bar, sees two tables, and asks... "Can I join you?"'];
const NOTES_KEY='voicepilot-notes';
let notes=JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');
const timers=[];
const num={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,forty:40,sixty:60};
function words2num(s){let t=0;s.split(/[\s-]+/).forEach(w=>{if(num[w]!=null)t+=num[w];});return t||null;}
function say(text,action){
  const log=$('#log');
  const m=document.createElement('div');m.className='msg bot';
  m.innerHTML=text+(action?`<span class="act">${action}</span>`:'');
  log.append(m);log.scrollTop=log.scrollHeight;
  try{const u=new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g,''));speechSynthesis.speak(u);}catch(e){}
}
function user(text){
  const log=$('#log');const m=document.createElement('div');m.className='msg user';m.textContent=text;
  log.append(m);log.scrollTop=log.scrollHeight;
}
function renderTimers(){
  const el=$('#timers');el.innerHTML='';
  timers.forEach((t,i)=>{
    const left=Math.max(0,Math.round((t.end-Date.now())/1000));
    const mm=Math.floor(left/60),ss=left%60;
    const d=document.createElement('span');d.className='timer';
    d.innerHTML=`${t.label}: ${mm}:${String(ss).padStart(2,'0')} <i title="Cancel">×</i>`;
    d.querySelector('i').onclick=()=>{clearInterval(t.h);timers.splice(i,1);renderTimers();};
    el.append(d);});
}
setInterval(()=>{if(timers.length)renderTimers();},1000);
function handle(raw){
  const q=raw.trim().toLowerCase();if(!q)return;
  user(raw.trim());
  let m;
  if(m=q.match(/(?:set(?: a| an)?|start(?: a| an)?) timer for (?:(\d+(?:\.\d+)?)|([a-z\s-]+?)) ?(second|minute|hour)s?/)){
    const n=m[1]?+m[1]:words2num(m[2]);
    if(!n){say('I heard a timer but not the length. Try "set a timer for 5 minutes".');return;}
    const mult={second:1,minute:60,hour:3600}[m[3]];
    const ms=Math.min(3600,n*mult)*1000;
    const label=`${n} ${m[3]}${n>1?'s':''}`;
    const h=setInterval(()=>{
      if(Date.now()>=end){clearInterval(h);const i=timers.findIndex(t=>t.h===h);if(i>=0)timers.splice(i,1);renderTimers();
        say(`Time's up - your ${label} timer finished!`,'TIMER DONE');toast('Timer done: '+label);}
    },500);
    const end=Date.now()+ms;
    timers.push({end,label,h});renderTimers();
    say(`Timer set for ${label}.`,'TIMER');return;}
  if(m=q.match(/^(?:calculate|compute|what(?:'s| is)|solve|how much is)\s+(.+)$/)){
    let expr=m[1].replace(/plus/g,'+').replace(/minus/g,'-').replace(/times|multiplied by/g,'*').replace(/divided by/g,'/').replace(/percent of/g,'/100*').replace(/[^0-9+\-*/().%\s]/g,'');
    try{const v=Function('"use strict";return('+expr+')')();
      if(typeof v==='number'&&isFinite(v)){say(`${m[1]} = <b>${Math.round(v*10000)/10000}</b>`,'CALCULATOR');return;}}catch(e){}
    say('I couldn\'t compute that one. Try "what is 128 divided by 4".');return;}
  if(/what time is it|^time$|current time/.test(q)){
    say('It\'s '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.','CLOCK');return;}
  if(/what(?:'s| is)( the)? (date|day)|today/.test(q)){
    say('Today is '+new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})+'.','DATE');return;}
  if(m=q.match(/(?:take a note|remember|note(?: down)?)(?::| that)? (.+)/)){
    notes.unshift({text:m[1],ts:Date.now()});localStorage.setItem(NOTES_KEY,JSON.stringify(notes.slice(0,50)));
    say(`Noted: "${m[1]}". You have ${notes.length} note${notes.length>1?'s':''}.`,'NOTE SAVED');return;}
  if(/read my notes|show my notes|my notes/.test(q)){
    if(!notes.length){say('No notes yet. Say "take a note: buy milk".');return;}
    say('Your notes:<br>'+notes.slice(0,6).map((n,i)=>`${i+1}. ${n.text.replace(/</g,'&lt;')}`).join('<br>'),'NOTES');return;}
  if(/clear (my )?notes/.test(q)){notes=[];localStorage.setItem(NOTES_KEY,'[]');say('Notes cleared.','NOTES');return;}
  if(/tell me a joke|joke|make me laugh/.test(q)){say(JOKES[Math.floor(Math.random()*JOKES.length)],'JOKE');return;}
  if(/flip a coin/.test(q)){say(Math.random()<.5?'Heads.':'Tails.','COIN FLIP');return;}
  if(m=q.match(/roll (a )?(die|dice)/)){say('You rolled a '+(1+Math.floor(Math.random()*6))+'.','DICE');return;}
  if(m=q.match(/random number (?:between|from) (\d+) (?:and|to) (\d+)/)){
    const a=+m[1],b=+m[2];say(String(a+Math.floor(Math.random()*(b-a+1)))+' - between '+a+' and '+b+'.','RANDOM');return;}
  if(/countdown from (\d+)/.test(q)){const n=Math.min(20,+q.match(/countdown from (\d+)/)[1]);
    say(Array.from({length:n},(_,i)=>n-i).join(', ')+'!','COUNTDOWN');return;}
  if(/open (google|youtube|maps|gmail|github)/.test(q)){const site=q.match(/open (google|youtube|maps|gmail|github)/)[1];
    const urls={google:'https://google.com',youtube:'https://youtube.com',maps:'https://maps.google.com',gmail:'https://mail.google.com',github:'https://github.com'};
    window.open(urls[site],'_blank');say('Opening '+site+'.','LAUNCH');return;}
  if(/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q)){say('Hello! Ask me for a timer, some math, a note, or a joke.','HELLO');return;}
  if(/thank/.test(q)){say('You\'re welcome!','POLITE');return;}
  if(/what can you do|^help$|commands/.test(q)){say('Scroll down to the command grid - timers, notes, math, time, date, jokes, coin flips, dice, countdowns, and opening sites.','HELP');return;}
  if(/how are you/.test(q)){say('Running at full clock speed, thanks for asking!','STATUS');return;}
  if(/your name/.test(q)){say('I\'m VoicePilot, your in-browser voice assistant.','ABOUT');return;}
  say('I didn\'t catch a command in that. Tap a card below to see what I understand.');
}
const CMDS=[
 ['Set a timer','"set a timer for 5 minutes" / "timer for 30 seconds"'],
 ['Do math','"what is 128 divided by 4" / "calculate 15 percent of 80"'],
 ['Take a note','"take a note: call mom tomorrow"'],
 ['Read my notes','"read my notes"'],
 ['Clear notes','"clear my notes"'],
 ['What time is it','"what time is it"'],
 ['Today\'s date','"what\'s the date today"'],
 ['Tell a joke','"tell me a joke"'],
 ['Flip a coin','"flip a coin"'],
 ['Roll dice','"roll a die"'],
 ['Random number','"random number between 1 and 100"'],
 ['Countdown','"countdown from 10"'],
 ['Open sites','"open youtube" / "open maps"'],
 ['Small talk','"hello" / "how are you" / "what\'s your name"'],
];
const cg=$('#cmds');
CMDS.forEach(([b,s])=>{const el=document.createElement('button');el.className='cmd';
  el.innerHTML=`<b>${b}</b><span>${s}</span>`;
  el.onclick=()=>{const ex=s.match(/"([^"]+)"/);if(ex)handle(ex[1]);};cg.append(el);});
// speech recognition
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,listening=false;
const mic=$('#mic'),micState=$('#micState'),transcript=$('#transcript');
if(!SR){micState.textContent='Speech recognition not available in this browser - typed commands work below';}
else{
  rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.maxAlternatives=1;
  rec.onresult=e=>{
    let interim='',final='';
    for(const r of e.results)(r.isFinal?final+=r[0].transcript:interim+=r[0].transcript);
    transcript.innerHTML=(final||interim)?`${final}<span class="interim">${interim}</span>`:'Listening...';
    if(final)handle(final);};
  rec.onend=()=>{listening=false;mic.classList.remove('listening');micState.textContent='Tap the mic and speak';};
  rec.onerror=e=>{listening=false;mic.classList.remove('listening');
    micState.textContent=e.error==='not-allowed'?'Microphone blocked - allow mic access in the address bar':'Speech error: '+e.error+' - try typing below';};
}
mic.onclick=()=>{
  if(!rec){toast('Speech recognition unavailable here - use typed commands');return;}
  if(listening){rec.stop();return;}
  try{rec.start();listening=true;mic.classList.add('listening');
    micState.textContent='Listening - speak now';transcript.textContent='Listening...';
    speechSynthesis.cancel();}catch(e){}
};
$('#typed').onkeydown=e=>{if(e.key==='Enter'&&e.target.value.trim()){handle(e.target.value);e.target.value='';}};
say('VoicePilot ready. Tap the mic or a command card.','SYSTEM');
})();
