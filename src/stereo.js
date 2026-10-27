// An original, quiet instrumental loop. Audio is created only after a click.
export function createStereoPlayer(buttons, onChange = () => {}) {
 let context, master, timer, nextBar=0, bar=0, playing=false, busy=false;
 const voices=new Set();
 const beat=60/92;
 const chords=[[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,59]];
 const melody=[[76,79,74,72],[72,76,71,69],[69,72,76,74],[71,74,79,76]];
 function note(midi,at,length,volume,type='sine') {
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type=type;oscillator.frequency.value=440*Math.pow(2,(midi-69)/12);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,at+length);
  oscillator.connect(gain).connect(master);oscillator.start(at);oscillator.stop(at+length+.03);
  voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
 }
 function schedule() {
  while(playing&&nextBar<context.currentTime+.25){
   const index=bar%4,chord=chords[index];
   [0,1.5,2.75].forEach(offset=>chord.slice(1).forEach((n,i)=>note(n+12,nextBar+offset*beat+i*.012,beat*.9,.025,'triangle')));
   note(chord[0],nextBar,beat*1.7,.10);note(chord[0]+7,nextBar+beat*2,beat*1.5,.065);
   melody[index].forEach((n,i)=>note(n,nextBar+(i+.5)*beat,beat*.75,.027,'sine'));
   for(let i=0;i<4;i++)note(28,nextBar+i*beat,.12,.07);
   nextBar+=beat*4;bar++;
  }
 }
 function update(){buttons.forEach(button=>{button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'Pause stereo music':'Play stereo music');button.querySelector('.music-label').textContent=playing?'Music on':'Play music';});onChange(playing);}
 async function toggle(){
  if(busy)return;busy=true;
  try{
   if(playing){stop();}
   else{
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');
    if(!context){context=new Audio();master=context.createGain();master.gain.value=0;master.connect(context.destination);}
    await context.resume();if(context.state!=='running')throw new Error('Audio unavailable');
    playing=true;bar=0;nextBar=context.currentTime+.07;master.gain.setTargetAtTime(.55,context.currentTime,.05);schedule();timer=setInterval(schedule,100);
   }
   update();
  }catch{playing=false;clearInterval(timer);update();buttons.forEach(b=>b.querySelector('.music-label').textContent='Try music again');}
  finally{busy=false;}
 }
 buttons.forEach(b=>b.addEventListener('click',toggle));
 function stop(){if(playing){playing=false;clearInterval(timer);master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.015);voices.forEach(voice=>{try{voice.stop(context.currentTime+.06);}catch{}});update();}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop);
 update();return {toggle,get playing(){return playing;}};
}
