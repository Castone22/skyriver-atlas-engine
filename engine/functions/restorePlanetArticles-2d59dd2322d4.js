function restorePlanetArticles(){try{const cache=JSON.parse(localStorage.getItem(PLANET_TITLE_CACHE)||'{}');for(const [key,page] of Object.entries(cache))rememberPlanetArticle(key,page)}catch{}}
