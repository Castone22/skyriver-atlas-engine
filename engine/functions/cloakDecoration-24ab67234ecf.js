function cloakDecoration(s){
 if(!s.cloaked)return '';
 // Three periods keep the moving fill continuous across either rail.
 const side=`<svg viewBox="0 0 48 120" preserveAspectRatio="none" focusable="false"><g class="shroud-tide"><path d="M-4 -120H21 q23 15 0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 t0 30 H-4Z"/></g><g class="shroud-veil"><path d="M-4 -120H14 q18 20 0 40 t0 40 t0 40 t0 40 t0 40 t0 40 t0 40 t0 40 t0 40 H-4Z"/></g></svg>`;
 return `<div class="tora-rails" aria-hidden="true"><div>${side}</div><div>${side}</div></div>`;
}
