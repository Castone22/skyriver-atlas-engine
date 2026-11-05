function localChartParent(s,name){
 const moon=moonRecords(s).find(m=>m.name===name&&m.inhabited!==true);
 if(moon)return moon.parent;
 const station=stationRecords(s).find(st=>st.name===name);
 return station?.parent&&(!station.systemMajor||DATA.worlds[station.parent]?.extendedSatelliteChart)?station.parent:null;
}
