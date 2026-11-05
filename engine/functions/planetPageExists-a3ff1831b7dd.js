function planetPageExists(p){return p&&p.ns===0&&Number.isSafeInteger(p.pageid)&&p.pageid>0&&!('missing' in p)&&!('invalid' in p)&&!('redirect' in p)&&typeof p.title==='string'}
