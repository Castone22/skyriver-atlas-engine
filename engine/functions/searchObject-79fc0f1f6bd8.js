function searchObject(s,q){return searchRecords(s).find(b=>matchesSearch(b,q))||searchRecords(s).find(b=>classificationTerms(b).some(v=>v&&normalizedName(v).includes(q)))}
