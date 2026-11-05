function showRealm(dark){
 darkverse=dark;
 $('orbitRoot').toggleAttribute('dark',dark);
 $('orbitRoot').inert=dark;

 $('workspace').classList.toggle('darkverse',dark);
 $('galaxy').inert=dark;
 darkSignal.hidden=!dark;
 darkGate.classList.toggle('prime',!dark);
 const caption=darkGate.firstElementChild;
 caption.textContent=dark?'Return to Prime':'Enter Darkverse';
 caption.classList.toggle('signal-text',!dark);
 caption.dataset.echo=dark?'':'Enter Darkverse';
 darkGate.setAttribute('aria-label',caption.textContent);
 $('atlasSelect').disabled=dark;
 $('indexToggle').disabled=dark;
}
