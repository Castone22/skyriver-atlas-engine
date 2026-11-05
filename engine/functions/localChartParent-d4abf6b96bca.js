function localChartParent(s,name){
 const moon=moonRecords(s).find(m=>m.name===name&&m.inhabited!==true);
 if(moon)return moon.parent;
 const station=stationRecords(s).find(st=>st.name===name);
 const host=moonRecords(s).find(m=>m.name===station?.parent)?.parent||station?.parent;
 return station&&(station.visibility==='planet'||DATA.worlds[host]?.extendedSatelliteChart)?host:null;
}
