function focusableWorld(s,name){if(!s||!name)return null;return systemBodies(s).find(b=>b.type==='World'&&matchesRecord(DATA.worlds[b.name],name))?.name||null}
