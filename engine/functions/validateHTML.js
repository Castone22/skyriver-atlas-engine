function validateHTML(html){
 if(!/^\s*<!doctype html/i.test(html)||!/<body[\s>]/i.test(html)||!/<\/html>/i.test(html)||/\bRLCONF\s*=/.test(html))throw new Error('The source did not return an atlas document');
}
