function resolveNamedRoute(name){
 if(!normalizedName(name))return null;
 const system=resolveSystem(name);if(system)return {system,object:null};
 for(const system of allRecords){const object=resolveObjectName(system,name);if(object)return {system,object}}
 const region=resolveRegion(name);return region?{region}:null;
}
