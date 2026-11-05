function notify(text){clearTimeout(noticeTimer);$('notification').textContent=text;$('notification').hidden=false;noticeTimer=setTimeout(()=>$('notification').hidden=true,6500)}
