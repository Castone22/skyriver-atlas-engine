function applySystemZoom(){const chart=$('orbitDiagram');if(!chart||!systemFocused)return;const w=760/systemZoom,h=580/systemZoom;chart.setAttribute('viewBox',`${380-w/2} ${290-h/2} ${w} ${h}`)}
