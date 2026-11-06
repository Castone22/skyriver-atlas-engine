// The bodies of a system worth naming on the chart and in the index: planets, moons and stations
// marked `noteworthy` (never the star), in that order.
function noteworthyBodies(s){
 return [...new Set([
  ...s.worlds.filter(name=>DATA.worlds[name]?.noteworthy===true),
  ...moonRecords(s).filter(b=>b.noteworthy===true).map(b=>b.name),
  ...stationRecords(s).filter(b=>b.noteworthy===true).map(b=>b.name)
 ])];
}
