function adjustCamera(amount,x=W/2,y=H/2,source='control',wheelGap=Infinity){
 auto=false;pendingFocus=null;$('detail').hidden=true;
 // Never carry orbital scroll overshoot into map magnification.
 if(amount>0&&(p<.9999||target<1)){
   target=clamp(target+amount,0,1);
   if(target===1){fitMap();wheelEntryGuard=true;}
   if(reduced)p=target;
   return;
 }
 // Let the descent's trackpad momentum finish at the fitted map extent.
 // A new scroll gesture can zoom normally; buttons and keyboard act immediately.
 if(amount>0&&source==='wheel'&&wheelEntryGuard){if(wheelGap<180)return;wheelEntryGuard=false;}
 else if(source!=='wheel'||amount<0)wheelEntryGuard=false;
 const current=target+Math.log(scale/fitScale)/2;
 const next=clamp(current+amount,0,1+Math.log(12)/2);
 if(next<1){if(scale>fitScale*1.0001)zoom(fitScale/scale,x,y);target=next;}
 else{target=1;zoom(Math.exp((next-1)*2)/(scale/fitScale),x,y);}
 if(reduced)p=target;
}
