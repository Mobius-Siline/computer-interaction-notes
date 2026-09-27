/* Read static labels from the actual registrations, without running models or mounting DOM. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
function extract(root){
 const read=f=>fs.readFileSync(path.join(root,f),'utf8'), json=f=>JSON.parse(read(f));
 const manifest=json('src/labs/manifest.json'),legacy=json('content/legacy-demos.json'),result={};
 for(const [chapter,config] of Object.entries(manifest.chapters)){
  const notes=json(`content/chapter${chapter}.json`);
  const window={NOTE_DEMOS:structuredClone(legacy),NOTES:{notes}};
  // Deliberately no document, network, timers or native modules: any eager DOM
  // access in a future source fails the build instead of silently fabricating it.
  const context=vm.createContext({window,structuredClone,URL,TextEncoder,TextDecoder});
  const run=f=>vm.runInContext(read(f),context,{filename:f,timeout:2000});
  run('simulations.js');run('note-labs-runtime.js');
  const registrations=[], original=window.NOTE_LABS.register;
  window.NOTE_LABS.register=function(ids,title,task,...rest){registrations.push({ids:[...ids],title,task});return original(ids,title,task,...rest);};
  for(const f of [...manifest.shared,...config.files])run(f);
  assert.deepEqual(registrations.flatMap(x=>x.ids).sort(),[...config.ids].sort(),`chapter${chapter} manifest`);
  for(const note of notes){const meta=window.NOTE_SIMULATIONS.demos[note.id];assert.ok(meta&&window.NOTE_SIMULATIONS.scenes[note.id],note.id);const owner=registrations.find(x=>x.ids.includes(note.id));result[note.id]={title:meta.title,task:meta.task,kind:owner?'lab':meta.kind,owner:owner?owner.ids[0]:note.id};}
 }
 return result;
}
module.exports={extract};
