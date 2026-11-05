function imageRecord(record,name){return record?.image?record:DATA.objectImages?.[record?.articleTitle||name]||DATA.objectImages?.[name]||null}
