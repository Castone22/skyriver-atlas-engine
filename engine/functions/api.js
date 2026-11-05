async function api(params){
 const u=new URL(API);Object.entries({action:'query',format:'json',formatversion:2,crossorigin:'',maxage:0,smaxage:0,...params}).forEach(([k,v])=>u.searchParams.set(k,v));
 const j=JSON.parse(await fetchText(u.href));if(j.error)throw new Error(j.error.info||j.error.code);return j;
}
