function url(name){
 const key=planetKey(name);if(key&&planetArticles[key]?.pageid)return 'https://skyrivercodex.lzridgecodes.net/index.php?curid='+planetArticles[key].pageid;
 const reference=referenceTargets.get(name);
 const title=(reference?.referencePage||titles[name]||canonicalTitle(name)).replaceAll(' ','_');
 const anchor=reference?.referenceSection?'#'+encodeURIComponent(reference.referenceSection):'';
 return 'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent(title)+anchor;
}
