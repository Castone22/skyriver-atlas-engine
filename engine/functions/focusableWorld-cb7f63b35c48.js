function focusableWorld(s,name){if(!s||!name)return null;return systemBodies(s).find(b=>b.type==='World'&&[b.name,planetName(b.name)].some(n=>normalizedName(n)===normalizedName(name)))?.name||null}
