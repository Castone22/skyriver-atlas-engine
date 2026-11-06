// The article title the wiki has for a planet now, or null while it is not known.
function planetArticle(name){const key=planetKey(name);return key&&DATA.planetArticles?.[key]?.title||null}
