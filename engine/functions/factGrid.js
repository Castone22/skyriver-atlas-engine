function factGrid(facts){
 if(!facts.length)return '';
 return '<div class="fact-grid">'+facts.map(([label,value])=>
  `<div><small>${esc(label)}</small><strong>${factValue(label,value)}</strong></div>`
 ).join('')+'</div>';
}
