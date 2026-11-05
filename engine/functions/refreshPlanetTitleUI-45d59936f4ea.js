function refreshPlanetTitleUI(){
 const active=document.activeElement,activeId=active?.id,world=active?.getAttribute?.('data-world'),indexScroll=$('index').scrollTop,detailScroll=$('detail').scrollTop;
 draw();updateVisibility();updateSelection();applyView();renderIndex();renderDetail();
 $('index').scrollTop=indexScroll;$('detail').scrollTop=detailScroll;
 const target=activeId?$(activeId):world?[...document.querySelectorAll('[data-world]')].find(e=>e.dataset.world===world):null;
 target?.focus({preventScroll:true});
}
