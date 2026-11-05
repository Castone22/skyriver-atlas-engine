function resolveSystem(value){
 const bare=String(value||'').trim().replace(/[ _-]+system$/i,'');
 return allRecords.find(s=>matchesRecord(s,value))||allRecords.find(s=>hasOrbitChart(s)&&matchesRecord(s,bare))||null;
}
