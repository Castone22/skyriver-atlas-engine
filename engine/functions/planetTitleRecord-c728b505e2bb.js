function planetTitleRecord(name){return planetTitles.get(name)||[...planetTitles.values()].find(r=>r.title===name||r.aliases.includes(name))}
