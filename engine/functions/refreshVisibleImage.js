async function refreshVisibleImage(force=false){
 stopImageRefresh();const slot=$('articleImage');if(!slot||widgetMode||typeof fetch!=='function'||document.hidden)return;
 const s=resolveSystem(selected),record=worldRecord(s,selectedWorld)||systemArticleRecord(s),name=selectedWorld||(hasOrbitChart(s)?systemArticleTitle(s):s.name),title=slot.getAttribute('data-image-title');
 $('articleImageStatus').textContent='Checking Codex…';
 const result=await loadLiveImage(title,force);
 if($('articleImage')!==slot)return;
 $('bodyFacts').innerHTML=bodyFacts(s,worldRecord(s,selectedWorld),result);
 const type=result.facts?.find(([label])=>label==='Type');
 $('dossierType').innerHTML=type?factValue('Type',type[1]):esc($('dossierType').dataset.atlasType);
 slot.innerHTML=result.asset?imageMarkup(result.asset,name):embeddedImageMarkup(record,name);
 $('articleImageStatus').textContent=result.error?'Live check unavailable · last available data':result.facts===null?'No Codex infobox · atlas record':'Current Codex infobox';
 const img=slot.querySelector('img');if(img&&result.asset?.image)img.addEventListener('error',()=>{if($('articleImage')!==slot||slot.querySelector('img')!==img)return;slot.innerHTML=embeddedImageMarkup(record,name);liveImages.set(title,{...result,asset:undefined,checkedAt:Date.now(),error:true});$('articleImageStatus').textContent='Image unavailable · showing saved image'});
 if(!document.hidden)liveImageTimer=setTimeout(()=>refreshVisibleImage(true),IMAGE_REFRESH_MS);
}
