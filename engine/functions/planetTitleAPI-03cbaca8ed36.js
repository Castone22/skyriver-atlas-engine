async function planetTitleAPI(params){
 const address=new URL('https://skyrivercodex.lzridgecodes.net/api.php');
 Object.entries({action:'query',format:'json',formatversion:'2',prop:'info',redirects:'1',crossorigin:'',maxage:'0',smaxage:'0',...params}).forEach(([k,v])=>address.searchParams.set(k,v));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch(address.href,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Codex title check unavailable');const result=await response.json();if(result.error||!Array.isArray(result.query?.pages))throw Error('Invalid title response');return result.query}finally{clearTimeout(timer)}
}
