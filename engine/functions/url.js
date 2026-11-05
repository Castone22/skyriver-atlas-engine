function url(name){
 // Link a planet by its Codex page id when the atlas synchronises article titles and knows it.
 if(__ATLAS__.flags.planetPageLinks){const key=planetKey(name);if(key&&planetArticles[key]?.pageid)return 'https://skyrivercodex.lzridgecodes.net/index.php?curid='+planetArticles[key].pageid;}
 const reference=referenceTargets.get(name);
 let title=reference?.referencePage||titles[name]||(__ATLAS__.flags.planetArticleTitles&&DATA.worlds[name]?planetArticleName(name):canonicalTitle(name));
 if(__ATLAS__.flags.normalizeTitleApostrophes)title=title.replaceAll('’',"'").replaceAll('‘',"'");
 title=title.replaceAll(' ','_');
 const anchor=reference?.referenceSection?'#'+encodeURIComponent(reference.referenceSection):'';
 return 'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent(title)+anchor;
}
