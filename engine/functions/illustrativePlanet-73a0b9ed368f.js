function illustrativePlanet(slot,kind){
 const [size,tint]=illustrativeTypes[kind];return {name:null,type:'World',synthetic:true,layoutSlot:slot,kind,size,tint};
}
