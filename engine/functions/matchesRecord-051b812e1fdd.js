function matchesRecord(record,value){const n=normalizedName(value);return !!n&&[record.id,record.name,planetName(record.name),record.nickname,...(record.aliases||[])].some(v=>normalizedName(v)===n)}
