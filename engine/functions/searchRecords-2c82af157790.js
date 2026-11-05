function searchRecords(s){return [...entityRecords(s),...moonRecords(s),...starRecords(s),...stationRecords(s),...s.worlds.map(name=>({name,...DATA.worlds[name]}))]}
