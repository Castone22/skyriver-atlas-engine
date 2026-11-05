function openStation(name){
 const s=resolveSystem(selected),st=s&&stationRecords(s).find(b=>(b.category==='TORA'||b.name==='Foundry')&&b.name===name);
 if(widgetMode||!st)return;
 beginNavigation();if(!systemFocused)setSystemFocus(true);
 planetFocus=null;selectedWorld=st.name;stationPart=0;stationOverview=true;
 renderDetail();$('systemFocus').scrollTop=0;setDetailOpen(false);$('leaveStation')?.focus({preventScroll:true});endNavigation();
}
