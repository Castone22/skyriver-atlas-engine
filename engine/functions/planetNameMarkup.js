function planetNameMarkup(name){return DATA.worlds[name]?`<span data-planet-title="${esc(name)}">${esc(planetName(name))}</span>`:esc(name)}
