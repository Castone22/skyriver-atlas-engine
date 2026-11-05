function atlasParams(){
 const input=location.href.startsWith('about:srcdoc') && typeof window.SKYRIVER_ATLAS_QUERY==='string'
  ? window.SKYRIVER_ATLAS_QUERY : location.search;
 return new URLSearchParams(input);
}
