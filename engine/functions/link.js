function link(name,label=name,cls=''){return `<a class="${cls}" href="${url(name)}" target="_blank" rel="noopener">${esc(label===name?planetName(name):label)}</a>`}
