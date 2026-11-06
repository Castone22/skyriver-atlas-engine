// A planet is known by its catalogue name (its key). Its article title, the title the wiki shows now,
// and any older titles also find it, so a link or search by an old name still works.
function planetKey(name){
 if(Object.prototype.hasOwnProperty.call(DATA.worlds,name))return name;
 if(!planetKey.index){
  const index=new Map(),articles=DATA.planetArticles||{};
  for(const key of Object.keys(DATA.worlds))
   for(const t of [DATA.worlds[key].articleTitle,articles[key]?.title,articles[key]?.display,...(articles[key]?.aliases||[])]){
    const n=t&&normalizedName(t);if(n&&!index.has(n))index.set(n,key);
   }
  planetKey.index=index;
 }
 return planetKey.index.get(normalizedName(name))||null;
}
