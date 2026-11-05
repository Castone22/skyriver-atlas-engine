function acceptPlanetPage(r,page){
 const title=page?.title||null,pageid=page?.pageid||null,changed=r.title!==title||r.pageid!==pageid;
 if(r.title&&r.title!==title&&!r.aliases.includes(r.title))r.aliases.push(r.title);
 r.aliases=r.aliases.slice(-20);r.title=title;r.pageid=pageid;return changed;
}
