function loadSource(r){
 const key=r.id+'|'+r.slug+'|'+r.deleted;if(sourceTasks.has(key))return sourceTasks.get(key);
 const task=readSource(r).finally(()=>sourceTasks.delete(key));sourceTasks.set(key,task);return task;
}
