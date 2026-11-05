function dossierFacts(box){
 if(!box)return null;
 return dossierFields.flatMap(([label,...keys])=>{
  const value=keys.map(key=>box.fields.get(key)).find(Boolean);
  return value?[[label,value]]:[];
 });
}
