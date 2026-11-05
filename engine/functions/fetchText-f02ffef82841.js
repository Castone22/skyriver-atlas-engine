async function fetchText(url,timeout=18000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 try{const r=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!r.ok)throw new Error('HTTP '+r.status);const text=await r.text();if(text.length>22000000)throw new Error('Source exceeds size limit');return text}finally{clearTimeout(timer)}
}
