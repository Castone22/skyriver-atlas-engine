function url(name){
 const reference=referenceTargets.get(name);
 const title=(reference?.referencePage||titles[name]||canonicalTitle(name)).replaceAll('’',"'").replaceAll('‘',"'").replaceAll(' ','_');
 const anchor=reference?.referenceSection?'#'+encodeURIComponent(reference.referenceSection):'';
 return 'https://skyrivercodex.lzridgecodes.net/index.php?title='+encodeURIComponent(title)+anchor;
}
