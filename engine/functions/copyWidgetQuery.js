async function copyWidgetQuery(){
 const text=widgetQuery();
 try{await navigator.clipboard.writeText(text)}
 catch{
  // No clipboard permission (a sandboxed embed, an older browser): copy through a hidden field.
  const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(field);field.select();let copied=false;
  try{copied=document.execCommand('copy')}catch{}
  field.remove();
  if(!copied){toast('Widget query: '+text);return}
 }
 toast('Copied widget query: '+text);
}
