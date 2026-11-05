function resolveHashRoute(){try{return resolveNamedRoute(decodeURIComponent(location.hash.slice(1)))}catch{return null}}
