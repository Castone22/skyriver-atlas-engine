function entityRecords(s){return (DATA.entities||[]).filter(b=>b.system===s?.id).map((b,i)=>({...b,type:'Entity',code:'E'+(i+1)}))}
