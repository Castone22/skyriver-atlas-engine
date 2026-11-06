async function imageAPI(params){
 // Codex supplies Access-Control-Allow-Origin itself. origin=* would duplicate it.
 const address=new URL('{{wikiBase|jsstr}}/api.php');Object.entries({action:'query',format:'json',formatversion:'2',redirects:'1',crossorigin:'',maxage:'0',smaxage:'0',...params}).forEach(([key,value])=>address.searchParams.set(key,value));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch(address.href,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Codex unavailable');const result=await response.json();if(result.error||!Array.isArray(result.query?.pages)||result.query.pages.length!==1)throw Error('Invalid Codex response');return result.query.pages[0]}finally{clearTimeout(timeout)}
}
