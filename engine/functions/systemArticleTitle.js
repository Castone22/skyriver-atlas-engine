function systemArticleTitle(s){
 if(!hasOrbitChart(s))return s?.articleTitle||s?.name||'';
 // An articleTitle that differs from the name (ignoring apostrophe style) was set on purpose and is used as written; otherwise the page is "<name> System".
 const plain=t=>String(t).replace(/[‘’]/g,"'");
 return s.articleTitle&&plain(s.articleTitle)!==plain(s.name)?s.articleTitle:systemNameTitle(s.name);
}
