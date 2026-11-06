// The wiki address for a name: a planet whose page id is known by id, otherwise by title.
function url(name){
 const wiki='{{wikiBase|jsstr}}',key=planetKey(name),pageid=key&&DATA.planetArticles?.[key]?.pageid;
 if(pageid)return wiki+'/index.php?curid='+pageid;
 const reference=referenceTargets.get(name);
 const title=(reference?.referencePage||canonicalTitle(name)).replaceAll(' ','_');
 const anchor=reference?.referenceSection?'#'+encodeURIComponent(reference.referenceSection):'';
 return wiki+'/index.php?title='+encodeURIComponent(title)+anchor;
}
