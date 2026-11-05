function focusableWorld(s,name){if(!s||!name)return null;return systemBodies(s).find(b=>b.type==='World'&&matchesRecord({name:b.name,aliases:planetAliases(b.name)},name))?.name||null}
