function planetAliases(name){const r=planetTitles.get(name);return r?[r.title,...r.aliases].filter(Boolean):[]}
