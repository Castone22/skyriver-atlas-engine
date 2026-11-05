function textSVG(content,attrs,parent){const t=svg('text',attrs,parent);t.textContent=__ATLAS__.flags.svgTextSyncedTitles?planetName(content):content;return t}
