function savePlanetTitles(){try{localStorage.setItem(PLANET_TITLE_STORAGE,JSON.stringify(Object.fromEntries([...planetTitles].filter(([,r])=>r.pageid))))}catch{}}
