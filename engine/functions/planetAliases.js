// Other titles a planet has had, for searching.
function planetAliases(name){const key=planetKey(name),a=key&&DATA.planetArticles?.[key];return a?[...new Set([a.title,a.display,...(a.aliases||[])].filter(Boolean))]:[]}
