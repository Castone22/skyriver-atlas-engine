function openStation(name){
 const s=resolveSystem(selected),st=s&&stationRecords(s).find(b=>b.category==='TORA'&&b.name===name);
 if(widgetMode||!st)return;
 beginNavigation();if(!systemFocused)setSystemFocus(true);
 planetFocus=null;selectedWorld=st.name;stationOverview=true;
 renderDetail();$('systemFocus').scrollTop=0;setDetailOpen(false);$('leaveStation')?.focus({preventScroll:true});endNavigation();
}
