function toggleAtlasMotion(focusId){const scroll=$('detail').scrollTop;orbitPaused=!orbitPaused;renderDetail();$('detail').scrollTop=scroll;$(focusId)?.focus({preventScroll:true})}
