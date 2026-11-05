function infoboxFile(value){
 value=value.replace(/<!--[\s\S]*?-->/g,'').trim();if(!value)return null;
 const tabber=value.match(/^<tabber\b[^>]*>([\s\S]*?)<\/tabber>$/i);
 if(/^<atlasembed\b[^>]*\/\s*>$/i.test(value))return null;
 if(tabber){const first=tabber[1].split(/(?:^|\n)\s*\|-\|/).find(tab=>tab.trim());if(!first)return null;return infoboxFile(first.includes('=')?first.slice(first.indexOf('=')+1):first)}
 const pattern='[^\\[\\]{}<>|\\n]+?\\.(?:png|jpe?g|webp|gif|svg|tiff?|bmp)',direct=value.match(new RegExp('^(?:File:|Image:)?('+pattern+')$','i'));
 if(direct)return 'File:'+direct[1].trim().replaceAll('_',' ');
 const files=[...value.matchAll(new RegExp('\\[\\[\\s*(?:File:|Image:)('+pattern+')(?=\\s*(?:\\||\\]\\]))','gi'))];
 if(files.length===1&&value.startsWith('[[')&&value.endsWith(']]')){splitWiki(value);return 'File:'+files[0][1].trim().replaceAll('_',' ')}
 throw Error('Unsupported infobox image');
}
