function planetQueryChunks(items,n=40){const chunks=[];for(let i=0;i<items.length;i+=n)chunks.push(items.slice(i,i+n));return chunks}
