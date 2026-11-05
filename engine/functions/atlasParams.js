function atlasParams(){
 const input=typeof window.SKYRIVER_ATLAS_QUERY==='string'
  ? window.SKYRIVER_ATLAS_QUERY : location.search;
 const params=new URLSearchParams(String(input||'').replace(/^\?/,''));
 const legacy=DATA.legacyHoldings?.[params.get('system')];
 if(Array.isArray(legacy)){
  params.set('system',legacy[0]);
  if(legacy[1]&&!params.get('object'))params.set('object',legacy[1]);
 }
 return params;
}
