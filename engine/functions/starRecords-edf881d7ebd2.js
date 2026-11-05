function starRecords(s){
 if(!hasOrbitChart(s))return [];
 const colors={F:'#fff0bf',G:'#efc887',K:'#e6a071',M:'#da806e',A:'#c1dcff',B:'#a4c6ff'};
 return s.stars.map((star,i)=>({...star,name:star.designation,type:'Star',tag:'Class '+star.spectralClass+' · '+(i===2?'distant companion':'primary star'),source:s.source,tint:colors[star.spectralClass]||'#eae7d9',description:star.designation+' is a class '+star.spectralClass+' component of the '+s.name+' system. '+(i===2?'It lies outside the planetary system of the inner pair.':s.stars.length===1?'The registered planets orbit this star.':'The registered planets orbit the inner AB pair.'),links:[systemArticleTitle(s),...s.primaries.filter(n=>n!==star.designation)]}));
}
