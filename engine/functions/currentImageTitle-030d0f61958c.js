function currentImageTitle(record,name){const key=planetKey(name);return key&&planetArticles[key]?.title||record?.articleTitle||canonicalTitle(name)}
