async function unpack(id){
 const value=snapshots[id];if(!value)throw new Error('No bundled preview');
 if(!('DecompressionStream' in window))throw new Error('This browser cannot open compressed previews. Open the live source instead.');
 const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
 return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
