function setIndex(open){$('index').hidden=!open;$('indexToggle').setAttribute('aria-expanded',String(open));if(open){renderIndex();$('search').focus()}}
