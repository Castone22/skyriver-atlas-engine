function galaxy(){
 $('orbitRoot').hidden=false;orbitSplash.reveal();
 resetRealm();darkGate.hidden=false;
 ++generation;cancelAnimationFrame(anim);clearTimeout(loadTimer);active='galaxy';if(frame){frame.remove();frame=null}
 $('host').replaceChildren();$('host').hidden=true;$('loading').hidden=true;$('galaxy').removeAttribute('hidden');$('heading').hidden=false;$('tools').hidden=false;$('mapNote').hidden=false;$('back').hidden=true;$('sourceLink').hidden=true;$('atlasSelect').value='galaxy';
 view={...savedView};paint();try{history.replaceState(null,'','#galaxy')}catch(e){}
 status(records.size+' stellar atlases · '+(discoveryOK?'connected to Codex':'known directory'),discoveryOK);
}
