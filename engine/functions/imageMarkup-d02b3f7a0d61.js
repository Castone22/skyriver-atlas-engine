function imageMarkup(asset,name){
 if(!asset?.image)return '<div class="image-placeholder">No article image available</div>';
 const image=asset.image.startsWith('asset:')?DATA.assets[asset.image.slice(6)]:asset.image,article=asset.imageSource?.articleUrl;
 if(!article||!image)return '<div class="image-placeholder">No article image available</div>';
 return `<a class="image-reference" href="${esc(article)}" target="_blank" rel="noopener" aria-label="Open ${esc(name)} image source article"><img class="world-thumb" src="${esc(image)}" alt="${esc(name)} — reference image from its Codex article"></a>`;
}
