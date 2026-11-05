function crossRealm(){
 if(active!=='galaxy'||darkGate.disabled)return;
 setIndex(false);
 const target=!darkverse;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){showRealm(target);return}
 darkGate.disabled=true;
 $('workspace').classList.add('crossing');
 $('atlasSelect').disabled=true;
 $('indexToggle').disabled=true;
 transit.rift(darkverse,target,()=>showRealm(target),()=>{endCrossing();darkGate.focus({preventScroll:true})});
}
