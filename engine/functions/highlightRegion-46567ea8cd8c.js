function highlightRegion(key){
 if(!DATA.regions[key]||highlightedRegion===key)return;
 beginNavigation();highlightedRegion=key;updateRegionDisplay();scaleLabels();renderIndex();if(!selected)renderDetail();endNavigation();
}
