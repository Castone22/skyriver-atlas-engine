function focusableWorld(s,name){if(!s||!name)return null;return systemBodies(s).find(b=>b.type==='World'&&normalizedName(b.name)===normalizedName(name))?.name||null}
