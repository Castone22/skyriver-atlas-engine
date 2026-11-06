// The name to show for a planet: its article's display title on the wiki, else its catalogue name.
function planetName(name){const key=planetKey(name),a=key&&DATA.planetArticles?.[key];return a?.display||a?.title||name}
