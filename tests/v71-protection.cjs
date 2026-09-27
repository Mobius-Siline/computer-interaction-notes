// Narrow, reversible v71 corrections. Every changed fragment must match exactly;
// old freeze assertions then still validate all unmodified bytes and meanings.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=require('./site-v70-protection.json'),root=path.resolve(__dirname,'..');
const hash=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
function historicalFile(file){
 let value=fs.readFileSync(path.join(root,file));
 for(const change of base.permittedCorrections[file]||[]){
  value=value.toString();assert.equal(value.split(change.after).length,2,'v71 correction: '+file);
  value=value.replace(change.after,change.before);
 }
 return value;
}
function historicalNote(note){
 const copy=structuredClone(note),fix=base.triggerCorrection;
 if(copy.id===fix.id){assert.equal(copy.trigger,fix.after);copy.trigger=fix.before;}
 const append=base.appendCorrection;
 if(copy.id===append.id){assert.equal(copy.points.length,append.oldCount+1);assert.equal(copy.points[append.oldCount],append.point);copy.points.pop();assert.deepEqual(copy.pointGroups.at(-1),append.group);copy.pointGroups.pop();}
 return copy;
}
function historicalSearch(){
 const entries=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));
 for(const entry of entries)for(const change of base.searchProjection[entry.id]||[]){
  const i=entry.fields.findIndex(f=>f.anchor===change.anchor);assert.ok(i>=0,change.anchor);
  const field=entry.fields[i];
  if(change.addedHash){assert.equal(hash(field),change.addedHash);entry.fields.splice(i,1);continue;}
  for(const [key,prop]of Object.entries(change.props)){
   assert.equal(hash(field[key]),prop.afterHash,change.anchor+' '+key);
   if(prop.had)field[key]=prop.prefixLength!==undefined?field[key].slice(0,prop.prefixLength):prop.before;else delete field[key];
  }
 }
 return entries;
}
module.exports={base,historicalFile,historicalNote,historicalSearch};
