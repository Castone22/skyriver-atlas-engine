function savePlanetArticles(){try{localStorage.setItem('atlas-planet-articles-v1:'+__ATLAS__.id,JSON.stringify(DATA.planetArticles||{}))}catch{}}
