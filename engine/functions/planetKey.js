function planetKey(name){
 if(Object.prototype.hasOwnProperty.call(DATA.worlds,name))return name;
 const n=normalizedName(name);
 return Object.keys(DATA.worlds).find(key=>[DATA.worlds[key].articleTitle,planetArticles[key]?.title].some(t=>t&&normalizedName(t)===n))||null;
}
