function zoomBy(factor,p={x:750,y:500}){const k=Math.max(.65,Math.min(8,view.k*factor)),q=k/view.k;view={k,x:p.x-(p.x-view.x)*q,y:p.y-(p.y-view.y)*q};paint()}
