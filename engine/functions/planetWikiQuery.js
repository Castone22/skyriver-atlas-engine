async function planetWikiQuery(parameters){
 // Match the Codex's own CORS configuration used by the live infobox reader.
 // Do NOT add origin=* because this wiki already supplies its Access-Control-Allow-Origin.
 const api=new URL('https://skyrivercodex.lzridgecodes.net/api.php');
 for(const [key,val] of Object.entries({action:'query',format:'json',formatversion:'2',redirects:'1',prop:'info',crossorigin:'',maxage:'0',smaxage:'0',...parameters}))api.searchParams.set(key,val);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(api.href,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Codex title lookup failed');
  const data=await response.json();
  if(data.error||!Array.isArray(data.query?.pages))throw Error('Invalid Codex title response');
  return data.query;
 }finally{clearTimeout(timer)}
}
