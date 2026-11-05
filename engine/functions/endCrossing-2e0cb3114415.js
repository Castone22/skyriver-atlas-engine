function endCrossing(){
 cancelTransit();
 clearTimeout(crossingTimer);
 $('workspace').classList.remove('crossing');
 $('blinkScene').replaceChildren();$('orbitCapture').replaceChildren();
 darkGate.disabled=false;
}
