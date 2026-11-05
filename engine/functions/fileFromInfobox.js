function fileFromInfobox(box){
 if(!box)return null;
 if(box.fields.has('image'))return infoboxFile(box.fields.get('image'));
 const first=(box.positional[0]||'').trim();
 return /^(?:\[\[\s*(?:File|Image):|(?:File|Image):)|^[^\[\]{}<>|\n]+\.(?:png|jpe?g|webp|gif|svg|tiff?|bmp)$/i.test(first)?infoboxFile(first):null;
}
