function matchesSearch(record,q){return [record.name,planetLabel(record.name),record.nickname,...planetAliases(record.name),...(record.aliases||[])].some(v=>normalizedName(v).includes(q))}
