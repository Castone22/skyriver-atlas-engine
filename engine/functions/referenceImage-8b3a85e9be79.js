function referenceImage(record,name){
 const title=currentImageTitle(record,name),cached=liveImages.get(title);
 return `<div id="articleImage" data-image-title="${esc(title)}">${cached?.asset?imageMarkup(cached.asset,name):embeddedImageMarkup(record,name)}</div><div class="image-tools"><button id="refreshArticleData" type="button">Refresh data</button><span id="articleImageStatus" role="status" aria-live="polite">${typeof fetch==='function'?'Checking Codex…':'Saved article image'}</span></div>`;
}
