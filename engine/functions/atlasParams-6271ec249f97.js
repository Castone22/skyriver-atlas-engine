function atlasParams(){
 const input=typeof window.SKYRIVER_ATLAS_QUERY==='string'
  ? window.SKYRIVER_ATLAS_QUERY : location.search;
 return new URLSearchParams(String(input||'').replace(/^\?/,''));
}
