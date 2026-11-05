function splitWiki(text,separator='|'){
 const parts=[],tags=[];let start=0,i=0,braces=0,links=0;
 while(i<text.length){
  if(text.startsWith('<!--',i)){const end=text.indexOf('-->',i+4);if(end<0)throw Error('Unclosed comment');i=end+3;continue}
  const tag=text.slice(i).match(/^<(\/?)(tabber|gallery|nowiki|ref|pre|syntaxhighlight)\b[^>]*>/i);
  if(tag){const name=tag[2].toLowerCase();if(tag[1]){if(tags.pop()!==name)throw Error('Unbalanced tag')}else if(!tag[0].endsWith('/>'))tags.push(name);i+=tag[0].length;continue}
  if(text.startsWith('{{',i)){braces++;i+=2;continue}if(text.startsWith('}}',i)){if(--braces<0)throw Error('Unbalanced template');i+=2;continue}
  if(text.startsWith('[[',i)){links++;i+=2;continue}if(text.startsWith(']]',i)){if(--links<0)throw Error('Unbalanced link');i+=2;continue}
  if(text[i]===separator&&!braces&&!links&&!tags.length){parts.push(text.slice(start,i));start=i+1}i++;
 }
 if(braces||links||tags.length)throw Error('Unclosed markup');parts.push(text.slice(start));return parts;
}
