/* Run: NODE_PATH=/path/to/jsdom/node_modules node --test tests/notes-regression.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const scriptsFor=chapter=>[...fs.readFileSync(path.join(root,`chapter${chapter}.html`),'utf8').matchAll(/<script src="\.\/([^"?]+)/g)].map(m=>m[1]);
const allNotes=()=>Array.from({length:11},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,`content/chapter${i+1}.json`),'utf8'))).flat();
const releaseVersion=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8')).version;
// v62 authorizes card/display order, not changing historical point identities.
// Project ONLY explicitly allowed metadata to v61; old point text is always
// taken from the current note, so existing historical hashes still catch edits.
const v61Protection=require('./first-four-v61-protection.json');
const v61Rows=new Map(Object.values(v61Protection.chapters).flat().map(row=>[row.id,row]));
// v64 Chapter 5 is guarded against formal v63 below; other chapters stay frozen.
const pptV63=require('./powerpoint-v63-protection.json');
const pptIds=new Set(pptV63.chapter5.map(n=>n.id));
// v65 transfers Chapter6 from old freeze guards to a formal-v64 snapshot below.
const networkV64=require('./network-v64-protection.json');
const networkIds=new Set(networkV64.chapter6.map(n=>n.id));
// v66 transfers only Chapter7 to the formal-v65 guard; historical assertions stay active below.
const multimediaV65=require('./multimedia-v65-protection.json');
const multimediaIds=new Set([...multimediaV65.chapter7.map(n=>n.id),'syllabus-image-editing']);
// v67 transfers Chapter8 to its formal-v66 snapshot; other chapters remain frozen.
const securityV66=require('./security-v66-protection.json');
const securityIds=new Set([...securityV66.chapter8.map(n=>n.id),'syllabus-windows-security']);
// v68 transfers only Chapter9/its two legacy definitions and a quantum label to strict formal-v67 guards.
const frontierV67=require('./frontier-v67-protection.json');
const frontierIds=new Set(frontierV67.chapter9.map(n=>n.id));
const v68Transferred=file=>['content/chapter9.json','content/legacy-demos.json','src/labs/shared/syllabus.js'].includes(file);
// v69 transfers exactly Chapter10 product scope to the formal-v68 guard; other chapters stay frozen.
const databaseV68=require('./database-v68-protection.json');
const databaseIds=new Set(databaseV68.chapter10.map(n=>n.id));
const v69Transferred=file=>['content/chapter10.json','src/labs/chapter10/database.js','src/labs/chapter10/update.js','simulations.js'].includes(file);
// v70 moves only Chapter11 authorization into a strict formal-v69 snapshot below.
const thinkingV69=require('./computational-thinking-v69-protection.json');
const thinkingIds=new Set([...thinkingV69.chapter11.map(n=>n.id),'syllabus-algorithm-strategies']);
const v70Transferred=file=>['content/chapter11.json','src/labs/chapter11/algorithms.js','content/legacy-demos.json'].includes(file);
const reviewedChapterFile=file=>/^content\/chapter(?:[1-9]|10|11)\.json$/.test(file);
const digest=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
function projectV61(note){
 const row=v61Rows.get(note.id),old=structuredClone(note);if(!row)return old;
 for(const [field,change] of Object.entries(row.displayChanges)){if(change.had)old[field]=structuredClone(change.before);else delete old[field];}
 old.points=old.points.slice(0,row.count);return old;
}
function v61Chapter(notes,chapter){return v61Protection.chapters[chapter].map(row=>projectV61(notes.find(n=>n.id===row.id)));}

test('v47 supplements and worked examples preserve the 460 original source identities',()=>{
 const notes=allNotes(),supplements=notes.filter(n=>n.origin==='syllabus');assert.deepEqual(supplements.map(n=>n.id).sort(),[...securityV66.supplementIds,'syllabus-windows-security','syllabus-algorithm-strategies'].sort());
 assert.deepEqual(supplements.filter(n=>n.chapter===2).map(n=>n.id).sort(),['syllabus-windows-paths','syllabus-windows-selection','syllabus-windows-search'].sort());
 assert.ok(supplements.every(n=>n.sources.length===0));assert.equal(notes.flatMap(n=>n.workedExamples||[]).length,16);
 for(const n of notes)for(const example of n.workedExamples||[])assert.ok(n.sources.some(s=>s.year===example.year&&s.q===example.q));
});
function env(chapter=4,{url,oldReadingMode}={}){
  const dom=new JSDOM(`<body data-chapter="${chapter}"></body>`,{url:url||'https://notes.example/chapter'+chapter+'.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.setPointerCapture=()=>{};
  if(oldReadingMode)w.localStorage.setItem('notes-reading-mode',oldReadingMode);
  for(const f of scriptsFor(chapter))w.eval(fs.readFileSync(path.join(root,f),'utf8'));
  return {dom,w,d:w.document};
}
function open(e,id){const c=e.d.getElementById(id);assert.ok(c,`note ${id}`);c.querySelector('.simulation-toggle').click();return c;}
function click(c,action,value){const buttons=[...c.querySelectorAll(`[data-lab-act="${action}"]`)];const b=buttons.find(el=>value===undefined||el.dataset.value===String(value));assert.ok(b,`${action}: ${value??''}`);b.click();}
function change(e,c,name,value){const el=c.querySelector(`[data-field="${name}"]`);assert.ok(el,name);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new e.w.Event('change',{bubbles:true}));}
function choice(c,name,value){const source=c.querySelector(`select[data-field="${name}"]`);assert.ok(source?.hidden,'native popup is removed');const i=[...source.options].findIndex(o=>o.value===value);return source.closest('.notes-picker').querySelector(`[data-choice-index="${i}"]`);}

test('2C preserves old semantic anchors and source identities while expanding only the target notes',()=>{
 const expected=[['merged-5',8,'e160db01967cd98f71fe397930a3fa2106f672181f1fe91dedd6d03f0bd79fed'],['y2022q10',3,'c5136b0ff6b8b4fa04f20d265323bfe3fe474887432a7d4e162cb9be98508f24'],['y2021q56',4,'24e8dc73bd8a930504b7ddabe269c402d65448cdef7b3c6053f101212281db20'],['y2023q52',4,'e79764baa4566e5b4bdf2ce963d23a3f7fe28dec7dd7bf89519c8dce1c9d4143']];
 const e=env(3);
 for(const [id,count,digest] of expected){
  const n=e.w.NOTES.notes.find(n=>n.id===id);
  assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify([n.id,n.points.slice(0,count),n.sources,n.keys])).digest('hex'),digest);
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${id}--point-${i}`);assert.ok(p);assert.equal(p.closest('details'),null);const pieces=[...p.querySelectorAll(`[data-source-field="point-${i}"]`)];assert.equal(pieces.map(x=>x.textContent).join(''),n.points[i]);}
 }
 assert.match(e.d.getElementById('y2023q52').textContent,/不是在原值上增加20磅/);e.dom.window.close();
});
test('2C style changes follow identity and each attribute while direct size remains an exception',()=>{
 const e=env(3),c=open(e,'y2023q52');
 const formats=()=>[...c.querySelectorAll('[data-style-preview]')].map(p=>[p.style.fontSize,p.style.marginTop]);
 assert.deepEqual(formats(),[['20pt','0pt'],['20pt','0pt'],['20pt','0pt'],['24pt','0pt']]);
 click(c,'modify');change(e,c,'draftSize','22');change(e,c,'draftBefore','20');click(c,'cancel');assert.equal(formats()[0][0],'20pt');
 click(c,'modify');change(e,c,'draftSize','22');change(e,c,'draftBefore','20');click(c,'apply');
 assert.deepEqual(formats(),[['22pt','20pt'],['22pt','20pt'],['20pt','0pt'],['24pt','20pt']]);
 click(c,'select',3);click(c,'clearDirect');assert.deepEqual(formats()[3],['22pt','20pt']);assert.equal(c.querySelector('[data-style-paragraph="3"]').dataset.styleId,'heading1');
 change(e,c,'directSize','26');click(c,'direct');assert.deepEqual(formats().map(x=>x[0]),['22pt','22pt','20pt','26pt']);
 c.querySelector('[data-sim-reset]').click();assert.deepEqual(formats(),[['20pt','0pt'],['20pt','0pt'],['20pt','0pt'],['24pt','0pt']]);e.dom.window.close();
});
test('2C creating and applying a named style preserves other identities and keeps explicit exceptions visible',()=>{
 const e=env(3),c=open(e,'y2023q52');click(c,'create');change(e,c,'draftName','');click(c,'apply');assert.ok(c.querySelector('.lab-dialog'));assert.match(c.querySelector('.lab-output').textContent,/非空/);click(c,'cancel');
 click(c,'create');change(e,c,'draftName','专题 <标题>');change(e,c,'draftSize','28');change(e,c,'draftBefore','16');click(c,'apply');
 assert.equal(c.querySelector('[data-style-paragraph="0"]').dataset.styleId,'custom1');assert.match(c.querySelector('[data-style-paragraph="0"]').textContent,/专题 <标题>/);assert.equal(c.querySelector('[data-style-preview="0"]').style.fontSize,'28pt');assert.equal(c.querySelector('[data-style-preview="1"]').style.fontSize,'20pt');
 click(c,'select',2);change(e,c,'targetStyle','custom1');click(c,'useStyle');assert.equal(c.querySelector('[data-style-paragraph="2"]').dataset.styleId,'custom1');assert.equal(c.querySelector('[data-style-preview="2"]').style.fontSize,'20pt');assert.equal(c.querySelector('[data-style-preview="2"]').style.marginTop,'16pt');
 click(c,'clearDirect');assert.equal(c.querySelector('[data-style-preview="2"]').style.fontSize,'28pt');
 click(c,'modify');change(e,c,'draftSize','30');click(c,'apply');assert.equal(c.querySelector('[data-style-preview="0"]').style.fontSize,'30pt');assert.equal(c.querySelector('[data-style-preview="2"]').style.fontSize,'30pt');assert.equal(c.querySelector('[data-style-preview="1"]').style.fontSize,'20pt');e.dom.window.close();
});
test('2C template copies keep independent bodies and old style snapshots after the template changes',()=>{
 const e=env(3),c=open(e,'y2021q56');change(e,c,'fixed','原模板提示');click(c,'save');click(c,'new');
 const content=c.querySelector('[data-field="content"]');content.value='甲 <正文> & 独立';content.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(c,'new');
 assert.equal(c.querySelector('[data-field="content"]').value,'原模板提示');change(e,c,'content','乙的正文');change(e,c,'docSize','22');
 click(c,'switch',0);assert.equal(c.querySelector('[data-field="content"]').value,'甲 <正文> & 独立');assert.equal(c.querySelector('[data-document-title]').style.fontSize,'20pt');
 click(c,'editTemplate');change(e,c,'draftSize','24');change(e,c,'draftFixed','新版提示');click(c,'saveTemplate');
 assert.equal(c.querySelector('[data-field="content"]').value,'甲 <正文> & 独立');assert.equal(c.querySelector('[data-document-title]').style.fontSize,'20pt');
 click(c,'switch',1);assert.equal(c.querySelector('[data-field="content"]').value,'乙的正文');assert.equal(c.querySelector('[data-document-title]').style.fontSize,'22pt');
 click(c,'new');assert.equal(c.querySelector('[data-field="content"]').value,'新版提示');assert.equal(c.querySelector('[data-document-title]').style.fontSize,'24pt');change(e,c,'content','丙自己的正文');assert.match(c.querySelector('[data-template-summary]').textContent,/新版提示/);assert.doesNotMatch(c.querySelector('[data-template-summary]').textContent,/丙自己的正文/);e.dom.window.close();
});
test('2C template cancellation prevents draft leakage and reset clears the demonstration only',()=>{
 const e=env(3),c=open(e,'y2021q56');click(c,'save');click(c,'new');click(c,'new');click(c,'editTemplate');change(e,c,'draftSize','32');change(e,c,'draftFixed','不应保存');
 assert.ok(c.querySelector('[data-lab-act="new"]').disabled);assert.ok(c.querySelector('[data-field="content"]').disabled);assert.ok(c.querySelector('[data-lab-act="switch"]').disabled);
 click(c,'cancelTemplate');click(c,'new');assert.equal(c.querySelector('[data-document-title]').style.fontSize,'20pt');assert.doesNotMatch(c.querySelector('[data-field="content"]').value,/不应保存/);
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-template-summary]'),null);assert.equal(c.querySelectorAll('[data-lab-act="switch"]').length,0);assert.ok(c.querySelector('[data-lab-act="new"]').disabled);e.dom.window.close();
});
test('2C subtopics and searches reach distinct source paragraphs without replacing active models',()=>{
 const e=env(3),input=e.d.getElementById('search-input'),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 for(const [id,i,q] of [['y2023q52',7,'后续段落样式'],['y2021q56',7,'打开并修改模板'],['y2021q56',9,'自动更新文档样式'],['y2022q10',4,'删除自定义样式']]){
  const c=e.d.getElementById(id);if(c.querySelector('.simulation-toggle').getAttribute('aria-expanded')==='false')c.querySelector('.simulation-toggle').click();
  const lab=c.querySelector('[data-lab]'),hash=`#${id}--point-${i}`,link=c.querySelector(`.note-subtopics a[href="${hash}"]`);assert.ok(link);
  input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok([...c.querySelectorAll('.note-search-jumps a')].some(a=>a.hash===hash));
  const found=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(found.matches.some(f=>f.anchor===hash.slice(1)));
  e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="${hash}"]`).click();assert.equal(e.w.location.hash,hash);assert.equal(e.d.activeElement.id,hash.slice(1));assert.equal(c.querySelector('[data-lab]'),lab);
 }
 e.dom.window.close();
});

test('2B appended knowledge preserves every old paragraph, source and key in affected notes',()=>{
 const baseline=[['y2020q41',5,'cd9be7787177b42484540a1143ead60338f4f840fc410379c7d631366a661d15'],['y2020q44',4,'d6aedf090d8747c6d897d0b3bb2716b7ab15cb9fe9dac8bee332a014ba4ac296'],['y2020q61',4,'42537236f3198d3af007158408b4fc0124e8a38783163532035ed1dbc8f122d8'],['y2024q55',4,'ca41e72265fe6993049c1e967a9526dfce8e8d703cdd752b3c5c282b6407e648']];
 const e=env(3);
 for(const [id,count,digest] of baseline){
  const n=e.w.NOTES.notes.find(n=>n.id===id),payload=[n.id,n.points.slice(0,count),n.sources,n.keys];
  assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(payload)).digest('hex'),digest,id);
  for(let i=0;i<n.points.length;i++){
   const point=e.d.getElementById(`${id}--point-${i}`);assert.ok(point);assert.equal(point.closest('details'),null);
   const actual=[...point.querySelectorAll(`[data-source-field="point-${i}"]`)].map(el=>el.textContent).join('');assert.equal(actual,n.points[i],id+'/'+i);
  }
 }
 e.dom.window.close();
});
test('2B local and directory subtopics resolve distinct real search paragraphs',()=>{
 const e=env(3),input=e.d.getElementById('search-input');
 for(const [id,index] of [['y2020q61',10],['y2020q41',9],['y2020q44',6]]){
  const c=open(e,id),hash=`#${id}--point-${index}`,link=c.querySelector(`.note-subtopics a[href="${hash}"]`),directory=e.d.querySelector(`#drawer a[href="${hash}"]`);
  assert.ok(link);assert.equal(link.textContent,directory.textContent);e.d.getElementById('open-drawer').click();directory.click();assert.equal(e.w.location.hash,hash);assert.equal(e.d.activeElement.id,hash.slice(1));assert.equal(c.querySelector('.simulation-toggle').getAttribute('aria-expanded'),'true');
 }
 input.value='应用于';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 for(const id of ['y2020q61','y2020q44']){
  const links=[...e.d.querySelectorAll(`#${id} .note-search-jumps a`)];assert.ok(links.length>1);
  assert.equal(new Set(links.map(a=>a.textContent)).size,links.length);
  for(const a of links)assert.ok(e.d.querySelector(a.hash).classList.contains('note-search-match'));
 }
 e.d.getElementById('clear-search').click();assert.equal(e.d.querySelector('.note-search-jumps'),null);e.dom.window.close();
});
test('2B page setup isolates paper and margins, cancels drafts and undoes section merging',()=>{
 const e=env(3),c=open(e,'y2020q61'),page=()=>c.querySelector('[data-layout-page]').dataset;
 click(c,'breakMenu');click(c,'nextPage');change(e,c,'point','end');click(c,'breakMenu');click(c,'nextPage');click(c,'view',1);
 click(c,'setup');change(e,c,'draftPaper','A5');change(e,c,'draftMargin','10');change(e,c,'draftDirection','landscape');click(c,'cancel');assert.equal(page().paper,'A4');assert.equal(page().margin,'20');
 click(c,'setup');change(e,c,'draftPaper','A5');change(e,c,'draftMargin','10');change(e,c,'draftDirection','landscape');click(c,'apply');assert.equal(page().paper,'A5');assert.equal(page().margin,'10');
 click(c,'view',0);assert.equal(page().paper,'A4');assert.equal(page().direction,'portrait');click(c,'view',2);assert.equal(page().margin,'20');
 click(c,'view',1);click(c,'deleteSection');click(c,'view',0);assert.equal(page().paper,'A5');assert.equal(page().direction,'landscape');click(c,'undo');click(c,'view',0);assert.equal(page().paper,'A4');assert.equal(page().direction,'portrait');
 click(c,'setup');change(e,c,'draftScope','all');change(e,c,'draftMargin','10');click(c,'apply');for(const i of [0,1,2]){click(c,'view',i);assert.equal(page().margin,'10');}e.dom.window.close();
});
test('2B number format changes representation independently of continuation and footer links',()=>{
 const e=env(3),c=open(e,'y2020q41'),footer=()=>c.querySelector('.lab-page-footer').textContent;
 change(e,c,'scenario','numbers');click(c,'num_page',2);click(c,'num_break');click(c,'num_edit');click(c,'num_insert');assert.equal(footer(),'3');
 click(c,'num_format');change(e,c,'numDraftFormat','roman');click(c,'num_cancel');assert.equal(footer(),'3');
 click(c,'num_format');change(e,c,'numDraftFormat','roman');click(c,'num_apply');assert.equal(footer(),'iii');click(c,'num_link');assert.equal(footer(),'iii');
 click(c,'num_format');change(e,c,'numDraftMode','restart');change(e,c,'numDraftStart','1');click(c,'num_apply');assert.equal(footer(),'i');click(c,'num_page',4);assert.equal(footer(),'ii');click(c,'num_page',1);assert.equal(footer(),'1');e.dom.window.close();
});
test('2B partial columns change actual section layout and preserve boundaries when restored',()=>{
 const e=env(3),c=open(e,'y2020q44'),counts=()=>[...c.querySelectorAll('[data-column-count]')].map(x=>x.dataset.columnCount);
 click(c,'isolate');assert.deepEqual(counts(),['1','1','1']);assert.equal(c.querySelectorAll('[data-continuous-break]').length,2);
 click(c,'open');change(e,c,'draftCount','2');change(e,c,'draftLine',true);click(c,'cancel');assert.deepEqual(counts(),['1','1','1']);
 click(c,'open');change(e,c,'draftCount','2');change(e,c,'draftGap','10');change(e,c,'draftLine',true);click(c,'apply');assert.deepEqual(counts(),['1','2','1']);const body=c.querySelector('[data-column-section="2"]');assert.equal(body.dataset.columnGap,'10');assert.equal(body.dataset.columnLine,'true');assert.equal(body.querySelector('[data-column-flow]').style.columnCount,'2');
 click(c,'columnBreak');assert.equal(c.querySelector('[data-column-break]').style.breakBefore,'column');assert.equal(c.querySelectorAll('[data-continuous-break]').length,2);click(c,'removeBreak');assert.equal(c.querySelector('[data-column-break]'),null);
 click(c,'open');change(e,c,'draftCount','1');click(c,'apply');assert.deepEqual(counts(),['1','1','1']);assert.equal(c.querySelectorAll('[data-continuous-break]').length,2);click(c,'undo');assert.deepEqual(counts(),['1','2','1']);
 click(c,'open');change(e,c,'draftScope','all');click(c,'apply');assert.deepEqual(counts(),['2','2','2']);c.querySelector('[data-sim-reset]').click();assert.deepEqual(counts(),['1']);e.dom.window.close();
});
test('2B unsupported single-column break flow keeps the draft and existing readable layout',()=>{
 const e=env(3),c=open(e,'y2020q44');click(c,'isolate');click(c,'open');change(e,c,'draftCount','2');click(c,'apply');click(c,'columnBreak');
 click(c,'open');change(e,c,'draftCount','1');click(c,'apply');assert.ok(c.querySelector('.lab-dialog'));assert.equal(c.querySelector('[data-column-section="2"]').dataset.columnCount,'2');assert.match(c.querySelector('.lab-dialog').textContent,/不是Word本身的限制/);
 click(c,'cancel');click(c,'removeBreak');click(c,'open');change(e,c,'draftCount','1');click(c,'apply');assert.equal(c.querySelector('.lab-dialog'),null);assert.equal(c.querySelector('[data-column-section="2"]').dataset.columnCount,'1');e.dom.window.close();
});
function tap(e,button){button.dispatchEvent(new e.w.MouseEvent('pointerdown',{bubbles:true,button:0}));button.focus();button.dispatchEvent(new e.w.MouseEvent('pointerup',{bubbles:true,button:0}));button.click();}
function pointer(e,el,type,{id=1,x=20,y=20,primary=true,pointerType='touch',...rest}={}){
 const event=new e.w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y,...rest});
 Object.defineProperties(event,{pointerId:{value:id},pointerType:{value:pointerType},isPrimary:{value:primary}});el.dispatchEvent(event);
}
test('touch choices commit once while modifier keys toggle independently',()=>{
 const e=env(2),c=open(e,'y2020q24');let calls=0;const model=e.w.NOTE_LABS.registry.y2020q24,original=model.change;model.change=(...args)=>{calls++;return original(...args);};
 const key=k=>c.querySelector(`[data-lab-act="modifier"][data-value="${k}"]`);
 assert.equal(c.querySelectorAll('.notes-picker.is-inline').length,2);assert.deepEqual([...c.querySelectorAll('.core-modifier-keys button')].map(b=>b.textContent),['Ctrl','Shift','Alt']);
 tap(e,key('ctrl'));assert.equal(key('ctrl').getAttribute('aria-pressed'),'true');assert.equal(e.d.activeElement,key('ctrl'));
 tap(e,key('ctrl'));assert.equal(key('ctrl').getAttribute('aria-pressed'),'false');tap(e,key('ctrl'));
 click(c,'drop');assert.ok(c.querySelector('.lab-file'));assert.match(c.querySelector('[data-file-target]').textContent,/笔记.txt/);
 tap(e,choice(c,'drive','D'));assert.equal(calls,1);assert.doesNotMatch(c.querySelector('[data-file-target]').textContent,/笔记.txt/);
 tap(e,choice(c,'drive','D'));assert.equal(calls,1,'repeated single choice does not reset the model');
 tap(e,key('shift'));assert.equal(key('ctrl').getAttribute('aria-pressed'),'true');assert.equal(key('shift').getAttribute('aria-pressed'),'true');click(c,'drop');assert.match(c.querySelector('[data-file-target]').textContent,/快捷方式/);assert.ok(c.querySelector('.lab-file'));
 click(c,'restore');tap(e,key('ctrl'));click(c,'drop');assert.equal(c.querySelector('.lab-file'),null);
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('select[data-field="drive"]').value,'C');for(const k of ['ctrl','shift','alt'])assert.equal(key(k).getAttribute('aria-pressed'),'false');
 tap(e,key('alt'));click(c,'drop');assert.match(c.querySelector('[data-file-target]').textContent,/快捷方式/);assert.ok(c.querySelector('.lab-file'));e.dom.window.close();
});
test('radio arrows survive rerenders and do not trigger demonstration hotkeys',()=>{
 const e=env(2),c=open(e,'y2020q24');choice(c,'mode','left').focus();
 for(const [key,value] of [['ArrowRight','right'],['ArrowRight','left'],['End','right'],['Home','left']]){e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{bubbles:true,key}));assert.equal(c.querySelector('select[data-field="mode"]').value,value);assert.equal(e.d.activeElement,choice(c,'mode',value));}
 assert.equal(c.querySelector('[data-field="mode"]').closest('.notes-picker').querySelectorAll('[tabindex="0"]').length,1);e.dom.window.close();
});
test('long choices expand locally, cancel with Escape, and close on outside click',()=>{
 const e=env(1),c=open(e,'merged-3');tap(e,choice(c,'mode','size'));const source=c.querySelector('[data-field="unit"]'),box=source.closest('.notes-picker');
 assert.ok(box.classList.contains('is-collapsible'));box.querySelector('.choice-trigger').click();assert.equal(box.querySelector('.choice-options').hidden,false);
 e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{bubbles:true,key:'ArrowDown'}));assert.equal(source.value,'MiB','navigation does not commit before selection');
 e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{bubbles:true,key:'Escape'}));assert.equal(box.querySelector('.choice-options').hidden,true);assert.equal(e.d.activeElement,box.querySelector('.choice-trigger'));
 box.querySelector('.choice-trigger').click();e.d.querySelector('h1').click();assert.equal(box.querySelector('.choice-options').hidden,true);e.dom.window.close();
});
test('blurred input and following touch choice both reach the model',()=>{
 const e=env(1),c=open(e,'merged-3');tap(e,choice(c,'mode','size'));const input=c.querySelector('[data-field="amount"]');input.focus();input.value='2';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 const trigger=c.querySelector('[data-field="unit"]').closest('.notes-picker').querySelector('.choice-trigger');trigger.dispatchEvent(new e.w.MouseEvent('pointerdown',{bubbles:true,button:0}));input.dispatchEvent(new e.w.Event('change',{bubbles:true}));trigger.focus();trigger.click();assert.ok(c.querySelector('.notes-picker.is-open'));
 tap(e,choice(c,'unit','KiB'));assert.match(c.querySelector('.lab-output').textContent,/2 KiB = 2,048 B/);e.dom.window.close();
});
test('native pointer focus transfer keeps the choice open until the option click',async()=>{
 const e=env(3),c=open(e,'syllabus-word-paragraph-spacing');click(c,'open');
 const box=c.querySelector('[data-field="kind"]').closest('.notes-picker');box.querySelector('.choice-trigger').click();
 const option=choice(c,'kind','exact'),focused=e.d.activeElement;
 // Model the browser's intermediate activeElement=body, with the incoming
 // option already identified by FocusEvent.relatedTarget.
 Object.defineProperty(e.d,'activeElement',{configurable:true,get:()=>e.d.body});
 focused.dispatchEvent(new e.w.FocusEvent('focusout',{bubbles:true,relatedTarget:option}));
 await Promise.resolve();
 assert.equal(box.querySelector('.choice-options').hidden,false);
 delete e.d.activeElement;
 option.focus();option.click();
 assert.equal(c.querySelector('[data-field="kind"]').value,'exact');
 assert.ok(c.querySelector('[data-field="amount"]'));e.dom.window.close();
});
test('legacy option updates, disabled groups, and list-box exceptions are preserved',async()=>{
 const e=env(4),host=e.d.createElement('div');host.innerHTML='<fieldset disabled><label>测试<select><option>A</option><option>B</option></select></label></fieldset><label>引用<select size="3"><option>A1:A5</option></select></label>';e.d.body.append(host);e.w.NOTE_CHOICES.enhance(host);
 assert.equal(host.querySelectorAll('.notes-picker').length,1);assert.ok(host.querySelector('.choice-option').disabled);assert.equal(host.querySelector('select[size]').hidden,false);
 host.querySelector('fieldset').disabled=false;e.w.NOTE_CHOICES.enhance(host);assert.equal(host.querySelector('.choice-option').disabled,false);
 const source=host.querySelector('select');source.innerHTML='<option>新条目</option><option selected>当前条目</option>';await new Promise(r=>e.w.setTimeout(r,0));assert.equal(host.querySelector('[aria-checked="true"]').textContent,'当前条目✓');e.dom.window.close();
});
test('one directory contains chapter links and grouped notes with a working focus boundary',()=>{
 const e=env(2),d=e.d,drawer=d.getElementById('drawer'),trigger=d.getElementById('open-drawer');
 assert.equal(d.querySelectorAll('.header-actions button').length,1);assert.equal(d.querySelector('#chapter-select'),null);
 trigger.click();assert.equal(trigger.getAttribute('aria-expanded'),'true');
 const menu=drawer.querySelector('.directory-chapters');assert.equal(menu.open,false);menu.querySelector('summary').click();assert.equal(menu.open,true);
 const links=[...menu.querySelectorAll('a')];assert.equal(links.length,11);assert.match(links[1].textContent,/Windows 10/);assert.equal(links[1].getAttribute('aria-current'),'page');
 assert.equal(new URL(links[3].href).pathname,'/chapter4.html');let prevented;
 d.addEventListener('click',event=>{if(event.target===links[3]){prevented=event.defaultPrevented;event.preventDefault();}});links[3].click();assert.equal(prevented,false,'chapter links retain normal browser navigation');
 menu.querySelector('summary').click();const last=[...drawer.querySelectorAll('.directory-section:last-child .note-list li:last-child a')].at(-1);last.focus();last.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(d.activeElement.id,'close-drawer');
 d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement,last);
 last.click();assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.equal(drawer.hidden,true);assert.equal(e.w.location.hash,last.hash);assert.equal(d.activeElement.id,last.hash.slice(1));assert.equal(last.getAttribute('aria-current'),'location');
 trigger.click();d.getElementById('scrim').click();assert.equal(d.activeElement,trigger);e.dom.window.close();
});
test('460 unique sources; all seven years mapped; canonical notes have valid sections',()=>{
  const e=env();const notes=allNotes();assert.equal(notes.filter(n=>n.origin!=='syllabus').length,220);assert.equal(e.w.NOTES.sourceCount,460);
  const keys=notes.flatMap(n=>n.sources.map(s=>`${s.year}-${s.q}`));assert.equal(new Set(keys).size,460);
  assert.deepEqual(Array.from(notes.flatMap(n=>n.sources).filter(s=>s.year===2022).map(s=>s.q).sort((a,b)=>a-b)),Array.from({length:75},(_,i)=>i+1));
  for(const n of notes)assert.ok(e.w.NOTES.chapters[n.chapter-1].sections.some(s=>s.id===n.section),n.id);
  e.dom.window.close();
});
test('all chapters mount, open, reset and collapse every card without exceptions',()=>{
  for(let chapter=1;chapter<=11;chapter++){
    const e=env(chapter),errors=[];e.w.addEventListener('error',x=>errors.push(x.error?.stack||x.message));
    assert.deepEqual(JSON.parse(JSON.stringify(e.w.NOTES.notes)),allNotes().filter(n=>n.chapter===chapter),'generated content matches canonical chapter');
    assert.equal(e.d.querySelectorAll('.directory-chapters a').length,11);
    assert.equal(e.d.querySelectorAll('[data-reading-mode],details.note-explanation').length,0);
    assert.equal(e.d.querySelectorAll('.directory-section .note-list > li > a').length,e.w.NOTES.notes.length);
    assert.equal(e.d.querySelectorAll('[data-sim-mount]>*').length,0,'scenes are lazy mounted');
    for(const b of e.d.querySelectorAll('.simulation-toggle')){b.click();assert.equal(b.getAttribute('aria-expanded'),'true');const c=b.closest('[data-sim-id]');assert.ok(c.querySelector('[data-sim-mount]').children.length);c.querySelector('[data-sim-reset]').click();b.click();assert.equal(b.getAttribute('aria-expanded'),'false');}
    assert.deepEqual(errors,[],'chapter '+chapter);e.dom.window.close();
  }
});
test('drawer is inert when closed, focus returns, search filters and restores',()=>{
  const e=env();const drawer=e.d.querySelector('#drawer');assert.equal(drawer.getAttribute('aria-hidden'),'true');
  e.d.querySelector('#open-drawer').click();assert.equal(drawer.getAttribute('aria-hidden'),'false');assert.equal(e.d.activeElement.id,'close-drawer');
  e.d.querySelector('#close-drawer').click();assert.equal(drawer.inert,true);assert.equal(e.d.activeElement.id,'open-drawer');
  const search=e.d.querySelector('#search-input');search.value='数据透视表';search.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(e.d.querySelectorAll('.note-item:not(.hidden)').length>=1);search.value='';search.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.equal(e.d.querySelectorAll('.note-item.hidden').length,0);e.dom.window.close();
});
test('salary paste multiplication modifies selected range, not the whole sheet',()=>{
  const e=env(),c=open(e,'y2022q58');click(c,'copy');click(c,'cell','1');click(c,'paste');click(c,'apply');
  const nums=[...c.querySelectorAll('.lab-cell')].map(x=>x.textContent.trim());assert.deepEqual(nums,['10,000','10,925','3,500','12,000']);e.dom.window.close();
});
test('range selection, pivot field drag and fill handle use pointer positions',()=>{
  const e=env();const pointer=(el,type,x,y)=>el.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));
  let c=open(e,'y2022q58');click(c,'copy');let cells=[...c.querySelectorAll('[data-row]')];cells.forEach((x,i)=>x.getBoundingClientRect=()=>({left:100,right:220,top:100+i*45,bottom:145+i*45}));
  pointer(cells[0],'pointerdown',150,120);pointer(cells[0],'pointermove',150,260);pointer(cells[0],'pointerup',150,260);assert.equal(c.querySelectorAll('.lab-cell.lab-selected').length,4);
  c=open(e,'y2024q67');const drag=c.querySelector('[data-key="产品"]'),zone=c.querySelector('[data-lab-drop="row"]');zone.getBoundingClientRect=()=>({left:100,right:250,top:150,bottom:250});pointer(drag,'pointerdown',25,25);pointer(drag,'pointermove',175,200);pointer(drag,'pointerup',175,200);assert.match(c.querySelector('[data-lab-drop="row"]').textContent,/产品/);
  c=open(e,'y2020q57');let handle=c.querySelector('.lab-fill-handle');[...c.querySelectorAll('[data-fill-index]')].forEach((x,i)=>x.getBoundingClientRect=()=>({left:100,right:200,top:100+i*45,bottom:145+i*45}));pointer(handle,'pointerdown',190,135);pointer(handle,'pointermove',190,255);pointer(handle,'pointerup',190,255);assert.match(c.querySelector('[data-fill-index="3"]').textContent,/3120/);e.dom.window.close();
});
test('paste comments keeps data values and copies only annotations',()=>{
  const e=env(),c=open(e,'y2022q61');click(c,'copy');click(c,'all');click(c,'paste');click(c,'apply');assert.equal(c.querySelectorAll('.lab-comment-corner').length,4);assert.match(c.textContent,/ID-004/);e.dom.window.close();
});
test('VLOOKUP absolute range stays fixed, relative range drifts',()=>{
  const e=env(),c=open(e,'y2020q57');click(c,'fill');assert.match(c.querySelector('[data-fill-index="2"]').textContent,/2322/);change(e,c,'locked','false');assert.match(c.querySelector('[data-fill-index="2"]').textContent,/#N\/A/);e.dom.window.close();
});
test('pivot values are derived from source records and filtering changes totals',()=>{
  const e=env(),c=open(e,'y2024q67');click(c,'pick','产品');click(c,'place','row');click(c,'pick','月份');click(c,'place','column');click(c,'pick','销量');click(c,'place','value');assert.match(c.querySelector('.lab-pivot-layout').textContent,/32/);click(c,'pick','分部');click(c,'place','filter');change(e,c,'filter','一部');assert.match(c.querySelector('.lab-pivot-layout').textContent,/12/);e.dom.window.close();
});
test('mail merge IF rule and record navigation generate distinct recipients',()=>{
  const e=env(3),c=open(e,'y2025q36');click(c,'connect');click(c,'name');click(c,'rule');click(c,'apply');click(c,'preview');assert.match(c.querySelector('.lab-paper').textContent,/王宁女士/);click(c,'next');assert.match(c.querySelector('.lab-paper').textContent,/李明先生/);e.dom.window.close();
});
test('Word link refresh differs from embedded copy and missing source',()=>{
  const e=env(3),c=open(e,'y2022q69');change(e,c,'source',1200);click(c,'refresh');assert.match(c.querySelector('.lab-word').textContent,/1200/);change(e,c,'mode','embed');change(e,c,'source',1300);click(c,'refresh');assert.doesNotMatch(c.querySelector('.lab-word').textContent,/1300/);change(e,c,'mode','link');click(c,'path');change(e,c,'source',1400);click(c,'refresh');assert.doesNotMatch(c.querySelector('.lab-word').textContent,/1400/);e.dom.window.close();
});
test('restricted table is readonly and body exception remains editable',()=>{
  const e=env(3),c=open(e,'y2022q71');click(c,'pane');change(e,c,'exception',true);click(c,'protect');assert.equal(c.querySelector('[data-field="cell"]').readOnly,true);assert.equal(c.querySelector('[data-field="body"]').readOnly,false);e.dom.window.close();
});
test('outline import generates real selectable slides',()=>{
  const e=env(5),c=open(e,'y2022q72');click(c,'import');assert.equal(c.querySelectorAll('.lab-deck aside button').length,2);click(c,'page','1');assert.match(c.querySelector('.lab-slide').textContent,/下一年度计划/);assert.doesNotMatch(c.querySelector('.lab-slide').textContent,/年度销售总结/);e.dom.window.close();
});
test('sum loop is computed, not hardcoded; radix and date math handle boundaries',()=>{
  const e=env(11),c=open(e,'y2022q43');change(e,c,'n',5);click(c,'run');assert.match(c.querySelector('.lab-output').textContent,/S=15/);
  assert.equal(e.w.NOTE_LABS.radixConvert('100010.01').hex,'22.4');assert.equal(e.w.NOTE_LABS.radixConvert('11.11').hex,'3.C');assert.equal(e.w.NOTE_LABS.radixConvert('102'),null);assert.equal(e.w.NOTE_LABS.daysBetween('2020-01-01','2021-01-01'),366);e.dom.window.close();
});
test('final labs in every chapter render after each initially exposed action',async()=>{
  const seen=new Set();
  for(let chapter=1;chapter<=11;chapter++){
    const e=env(chapter);
    for(const note of e.w.NOTES.notes){
      if(e.w.NOTE_SIMULATIONS.demos[note.id].kind!=='lab')continue;
      const card=open(e,note.id),id=card.querySelector('[data-lab]').dataset.lab;
      if(seen.has(id))continue;seen.add(id);
      const r=e.w.NOTE_LABS.registry[id],s={...structuredClone(r.initial),uid:'audit'},html=r.render(s);
      assert.ok(html.length>100,id);const isolated=new JSDOM(html);
      for(const el of isolated.window.document.querySelectorAll('[data-lab-act]')){
        if(el.disabled)continue;
        const x={...structuredClone(r.initial),uid:'audit'};await r.action(x,el.dataset.labAct,el.dataset.value);assert.ok(r.render(x).length>100,`${id}/${el.dataset.labAct}`);
      }
      isolated.window.close();
    }
    e.dom.window.close();
  }
});
test('long press opens menu; tap and cancelled hold do not',async()=>{
  const e=env(2),c=open(e,'y2022q75');let folder=c.querySelector('[data-lab-drag="hold"]');
  const p=(el,type)=>el.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:20,clientY:20}));
  p(folder,'pointerdown');p(folder,'pointerup');assert.equal(c.querySelector('.lab-context-menu'),null);
  p(folder,'pointerdown');p(folder,'pointercancel');await new Promise(r=>setTimeout(r,650));assert.equal(c.querySelector('.lab-context-menu'),null);
  p(folder,'pointerdown');await new Promise(r=>setTimeout(r,650));assert.ok(c.querySelector('.lab-context-menu'));e.dom.window.close();
});
test('date grouping keeps different years separate and aggregates same month',()=>{
  const e=env(),c=open(e,'y2024q67');change(e,c,'scenario','grades');click(c,'pick','日期');click(c,'place','row');click(c,'pick','成绩');click(c,'place','value');click(c,'group');assert.match(c.querySelector('.lab-pivot-layout').textContent,/2023\/03/);assert.match(c.querySelector('.lab-pivot-layout').textContent,/2024\/03/);assert.match(c.querySelector('.lab-pivot-layout').textContent,/246/);e.dom.window.close();
});
test('blur caused by a pointer click does not detach the clicked action',()=>{
  const e=env(),c=open(e,'y2022q58');const copy=c.querySelector('[data-lab-act="copy"]');copy.dispatchEvent(new e.w.MouseEvent('pointerdown',{bubbles:true,button:0}));change(e,c,'multiplier',1.2);assert.ok(copy.isConnected);copy.dispatchEvent(new e.w.MouseEvent('pointerup',{bubbles:true,button:0}));copy.click();assert.match(c.querySelector('.lab-output').textContent,/已复制 1.2/);e.dom.window.close();
});
test('Excel wildcard replacement works without an invented option',()=>{
  const e=env(),c=open(e,'y2024q57');click(c,'open');click(c,'replace');assert.match(c.querySelector('table').textContent,/销售部/);assert.doesNotMatch(c.querySelector('table').textContent,/销售部-01/);assert.match(c.querySelector('table').textContent,/DD-001/);e.dom.window.close();
});
test('input state is current even before blur/change fires',()=>{
  const e=env(),c=open(e,'y2022q58'),input=c.querySelector('[data-field="multiplier"]');input.value='1.2';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(c,'copy');assert.match(c.querySelector('.lab-output').textContent,/已复制 1.2/);e.dom.window.close();
});
test('each year is continuous and generated HTML assets exist',()=>{
 const notes=allNotes();for(const [year,count] of [[2020,65],[2021,60],[2022,75],[2023,70],[2024,70],[2025,60],[2026,60]])assert.deepEqual(notes.flatMap(n=>n.sources).filter(s=>s.year===year).map(s=>s.q).sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1));
 for(let ch=1;ch<=11;ch++){const html=fs.readFileSync(path.join(root,`chapter${ch}.html`),'utf8');assert.equal(scriptsFor(ch).filter(f=>/^generated\/chapter\d+\.js$/.test(f)).length,1);assert.equal(scriptsFor(ch).filter(f=>f.startsWith('generated/labs-')).length,1);for(const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)(?:\?[^"]*)?"/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);}
});
test('directory navigation reveals a search-hidden note; shortcuts respect editable context',()=>{
 const e=env(3),search=e.d.querySelector('#search-input');search.value='不存在的搜索';search.dispatchEvent(new e.w.Event('input',{bubbles:true}));e.d.querySelector('#open-drawer').click();e.d.querySelector('#drawer a[href="#y2026q47"]').click();assert.equal(e.d.querySelector('#y2026q47').classList.contains('hidden'),false);assert.equal(search.value,'');
 const editable=e.d.createElement('div');editable.contentEditable='true';editable.setAttribute('contenteditable','true');e.d.body.append(editable);const event=new e.w.KeyboardEvent('keydown',{key:'/',bubbles:true,cancelable:true});editable.dispatchEvent(event);assert.equal(event.defaultPrevented,false);e.dom.window.close();
});
test('Word revision survives disabling tracking and can still be rejected',()=>{
 const e=env(3),c=open(e,'y2023q56');click(c,'track');change(e,c,'draft','明显改善');click(c,'track');assert.match(c.querySelector('del').textContent,/可能产生改善/);click(c,'reject');assert.match(c.querySelector('.lab-paper').textContent,/可能产生改善/);assert.equal(c.querySelector('ins'),null);e.dom.window.close();
});
test('advanced filtering cancellation keeps applied criteria; clear restores source rows',()=>{
 const e=env(),c=open(e,'y2020q9');click(c,'open');click(c,'apply');assert.match(c.textContent,/王宁/);assert.doesNotMatch(c.querySelector('[data-lab] tbody').textContent,/周林/);click(c,'open');change(e,c,'threshold',95);click(c,'cancel');assert.match(c.querySelector('[data-lab] tbody').textContent,/王宁/);click(c,'clear');assert.match(c.querySelector('[data-lab] tbody').textContent,/周林/);e.dom.window.close();
});
test('removing a pivot filter restores unfiltered total; two row fields create subtotals',()=>{
 const e=env(),c=open(e,'y2024q67');for(const [f,z] of [['产品','row'],['销量','value'],['分部','filter']]){click(c,'pick',f);click(c,'place',z);}change(e,c,'filter','一部');click(c,'remove','filter:分部');assert.match(c.querySelector('.lab-pivot-layout').textContent,/50/);click(c,'pick','分部');click(c,'place','row');assert.match(c.querySelector('.lab-pivot-layout').textContent,/产品1 小计/);assert.match(c.querySelector('.lab-pivot-layout').textContent,/95/);e.dom.window.close();
});
test('CSV text versus general changes precision and preserves a quoted comma',()=>{
 const e=env(),c=open(e,'y2021q47');click(c,'start');click(c,'next');click(c,'next');change(e,c,'textColumns','false');click(c,'finish');assert.match(c.textContent,/王,宁/);assert.doesNotMatch(c.querySelector('table').textContent,/001234567890123456/);assert.match(c.querySelector('table').textContent,/1234567890123450/);assert.deepEqual(Array.from(e.w.NOTE_LABS.parseCSV('a,"b,c"\n1,"two""quotes"'),r=>Array.from(r)),[['a','b,c'],['1','two"quotes']]);e.dom.window.close();
});
test('drawing a text box requires tool selection; real pointer drag creates editable content',()=>{
 const e=env(5),c=open(e,'y2021q10');click(c,'tool');const canvas=c.querySelector('[data-lab-drag="box"]');canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:300});for(const [type,x,y] of [['pointerdown',20,30],['pointermove',250,180],['pointerup',250,180]])canvas.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));assert.ok(c.querySelector('.lab-drawn-box'));change(e,c,'text','独立文本框');assert.equal(c.querySelector('textarea').value,'独立文本框');e.dom.window.close();
});
test('Goal Seek candidate can be cancelled; equal zero-profit target is already satisfied',()=>{
 const e=env(),c=open(e,'y2021q58');click(c,'open');click(c,'solve');assert.equal(c.querySelector('[data-field="quantity"]').value,'5000');assert.ok(c.querySelector('[data-field="cost"]').disabled);assert.ok(c.querySelector('[data-field="quantity"]').disabled);click(c,'discard');assert.equal(c.querySelector('[data-field="quantity"]').disabled,false);assert.equal(c.querySelector('[data-field="quantity"]').value,'1000');change(e,c,'price',100);click(c,'open');change(e,c,'target',0);click(c,'solve');assert.match(c.querySelector('.lab-output').textContent,/已等于目标/);e.dom.window.close();
});
test('month fill uses MONTH and relative references, not a fixed answer',()=>{
 const e=env(),c=open(e,'y2025q50');click(c,'fill');assert.match(c.querySelector('[data-fill-index="1"]').textContent,/6月/);assert.match(c.querySelector('[data-fill-index="2"]').textContent,/MONTH\(B5\)/);change(e,c,'date1','2025-02-20');assert.match(c.querySelector('[data-fill-index="1"]').textContent,/2月/);e.dom.window.close();
});
test('conditional averages ignore text until source conversion; VALUE leaves source intact',()=>{
 const e=env(),c=open(e,'y2026q49');assert.match(c.querySelector('.lab-office output').textContent,/结果：25/);change(e,c,'method','value');click(c,'convert');assert.match(c.querySelector('.lab-office output').textContent,/结果：25/);assert.match(c.querySelector('table').textContent,/文本/);change(e,c,'method','error');click(c,'convert');assert.match(c.querySelector('.lab-office output').textContent,/结果：21.5/);e.dom.window.close();
});
test('SUMIF formula escapes literal wildcard input and recalculates edited amounts',()=>{
 const e=env(),c=open(e,'y2026q50');assert.match(c.textContent,/350/);change(e,c,'value0',100);assert.match(c.textContent,/330/);change(e,c,'keyword','?');assert.match(c.querySelector('code').textContent,/\*~\?\*/);assert.match(c.querySelector('output').textContent,/0/);e.dom.window.close();
});
test('Chinese-number spacing and Chinese-Latin spacing are independent',()=>{
 const e=env(3),c=open(e,'y2026q47');click(c,'open');change(e,c,'pn',false);click(c,'apply');assert.match(c.querySelector('output').textContent,/中文与数字：关；中文与西文：开/);e.dom.window.close();
});
test('title slide footer is suppressed without renumbering subsequent slides',()=>{
 const e=env(5),c=open(e,'y2024q65');click(c,'open');change(e,c,'number',true);change(e,c,'hideTitle',true);click(c,'all');assert.equal(c.querySelector('[data-slide-number]').textContent,'1');click(c,'page','1');assert.equal(c.querySelector('[data-slide-number]'),null);click(c,'page','2');assert.equal(c.querySelector('[data-slide-number]').textContent,'3');e.dom.window.close();
});
test('Ctrl adds discontinuous columns and combination chart has a separate success-rate axis',()=>{
 const e=env(),c=open(e,'y2026q52');click(c,'ab');c.querySelector('[data-lab-act="d"]').dispatchEvent(new e.w.MouseEvent('click',{bubbles:true,ctrlKey:true}));click(c,'insert');click(c,'combo');change(e,c,'secondary',true);click(c,'apply');assert.match(c.querySelector('svg').textContent,/成功率%/);assert.ok(c.querySelector('svg polyline'));e.dom.window.close();
});
test('custom show removal is a draft; cancelling retains saved list and all source slides',()=>{
 const e=env(5),c=open(e,'y2026q55');click(c,'open');click(c,'edit');click(c,'select','1');click(c,'remove');click(c,'cancel');assert.match(c.querySelector('.lab-dialog').textContent,/数据/);click(c,'edit');click(c,'remove');click(c,'save');assert.equal(c.querySelectorAll('.core-thumbnails button').length,3);e.dom.window.close();
});
test('sections follow selected slide and black screen hides ink without deleting it',()=>{
 const e=env(5),c=open(e,'y2025q10');click(c,'page','2');click(c,'rename');assert.equal(c.querySelector('[data-field="name"]').value,'第二部分');click(c,'cancel');const r=e.w.NOTE_LABS.registry.y2025q10,s={...structuredClone(r.initial),show:true,strokes:[{page:0,color:'#f00',points:[[0,0],[10,10]]}]};assert.match(r.render(s),/<polyline/);r.action(s,'black');assert.doesNotMatch(r.render(s),/<polyline/);r.action(s,'black');assert.match(r.render(s),/<polyline/);e.dom.window.close();
});
test('task manager ends a process without changing host name; Apply survives Cancel',()=>{
 const e=env(2),c=open(e,'y2026q34');click(c,'end','记事本');assert.doesNotMatch(c.querySelector('tbody').textContent,/记事本/);assert.match(c.querySelector('.lab-browser>header').textContent,/学习电脑/);const f=open(e,'y2025q32');change(e,f,'draft',true);click(f,'apply');change(e,f,'draft',false);click(f,'cancel');assert.doesNotMatch(f.querySelector('.lab-browser-page').textContent,/\.txt/);click(f,'open');assert.equal(f.querySelector('[data-field="draft"]').checked,true);e.dom.window.close();
});
test('GCD handles immediate divisibility and clears results after invalid input',()=>{
 const e=env(11),c=open(e,'y2026q6');change(e,c,'a','12');change(e,c,'b','6');click(c,'start');click(c,'step');assert.match(c.querySelector('output').textContent,/最大公约数：6/);change(e,c,'a','0');click(c,'start');assert.match(c.querySelector('output').textContent,/不能输入0/);assert.doesNotMatch(c.querySelector('output').textContent,/最大公约数/);e.dom.window.close();
});
test('Word formatting properties accumulate and zoom preserves document format',()=>{
 const e=env(3),c=open(e,'merged-7');change(e,c,'size','22');change(e,c,'underline','double');change(e,c,'alignment','center');change(e,c,'zoom','150');assert.equal(c.querySelector('[data-field="size"]').value,'22');assert.equal(c.querySelector('[data-field="underline"]').value,'double');assert.match(c.querySelector('.lab-paper p').getAttribute('style'),/center/);e.dom.window.close();
});
test('Word table position and cell alignment are independent; cancel keeps table position',()=>{
 const e=env(3),c=open(e,'y2020q63');click(c,'properties');change(e,c,'draftAlign','center');click(c,'apply');click(c,'cellMiddle');click(c,'properties');change(e,c,'draftAlign','right');click(c,'cancel');assert.match(c.querySelector('output').textContent,/整表：居中/);assert.match(c.querySelector('.lab-paper td').style.cssText,/vertical-align: middle/);e.dom.window.close();
});
test('Word section numbering continues until explicitly restarted and Cancel discards format',()=>{
 const e=env(3),c=open(e,'y2020q41');change(e,c,'scenario','numbers');click(c,'num_page','2');click(c,'num_break');click(c,'num_edit');click(c,'num_insert');assert.equal(c.querySelector('.lab-page-footer').textContent,'3');click(c,'num_link');assert.equal(c.querySelector('.lab-page-footer').textContent,'3');click(c,'num_format');change(e,c,'numDraftMode','restart');change(e,c,'numDraftStart','1');click(c,'num_cancel');assert.equal(c.querySelector('.lab-page-footer').textContent,'3');click(c,'num_format');change(e,c,'numDraftMode','restart');click(c,'num_apply');assert.equal(c.querySelector('.lab-page-footer').textContent,'1');click(c,'num_page','4');assert.equal(c.querySelector('.lab-page-footer').textContent,'2');e.dom.window.close();
});
test('Word table formula is a cached field and actual F9 updates its selected result',()=>{
 const e=env(3),c=open(e,'y2024q8');change(e,c,'scenario','formula');click(c,'formulaOpen');click(c,'formulaApply');assert.match(c.querySelector('[data-lab-act="fieldSelect"]').textContent,/175/);change(e,c,'score0','90');assert.match(c.querySelector('[data-lab-act="fieldSelect"]').textContent,/175/);click(c,'fieldSelect');c.querySelector('[data-lab-act="fieldSelect"]').dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'F9',bubbles:true,cancelable:true}));assert.match(c.querySelector('[data-lab-act="fieldSelect"]').textContent,/185/);e.dom.window.close();
});
test('TOC page-only update keeps old title while full update reads current heading',()=>{
 const e=env(3),c=open(e,'merged-5');change(e,c,'tab','home');click(c,'style');change(e,c,'tab','references');click(c,'tocInsert');change(e,c,'title','计算机基础');click(c,'cover');change(e,c,'tab','references');click(c,'tocOpen');change(e,c,'tocMode','pages');click(c,'tocApply');assert.match(c.querySelector('.lab-auto-toc').textContent,/第一章 信息技术/);assert.match(c.querySelector('.lab-auto-toc').textContent,/2/);click(c,'tocOpen');change(e,c,'tocMode','all');click(c,'tocApply');assert.match(c.querySelector('.lab-auto-toc').textContent,/计算机基础/);e.dom.window.close();
});
test('Workbook copy creates independent data; moving removes source; new workbook is available',()=>{
 const e=env(),c=open(e,'y2023q11');click(c,'file');click(c,'fileOpen');click(c,'book','0');click(c,'open');assert.equal(c.querySelector('[data-field="copy"]').checked,false);change(e,c,'copy',true);click(c,'apply');change(e,c,'score0','99');click(c,'book','0');assert.equal(c.querySelector('[data-field="score0"]').value,'86');click(c,'open');change(e,c,'target','new');click(c,'apply');assert.match(c.textContent,/工作簿/);click(c,'book','0');assert.doesNotMatch(c.querySelector('.lab-tabs').textContent,/总表/);e.dom.window.close();
});
test('Freeze panes depends on actual selected cell and can be removed',()=>{
 const e=env(),c=open(e,'y2024q58');click(c,'cell','3:3');click(c,'menu');click(c,'freeze');assert.match(c.querySelector('output').textContent,/前2行和前2列/);assert.match(c.querySelector('tbody td').style.cssText,/position: sticky/);click(c,'menu');click(c,'unfreeze');assert.doesNotMatch(c.querySelector('tbody td').style.cssText,/position: sticky/);e.dom.window.close();
});
test('Print settings are a draft; orientation and fit produce different page layouts',()=>{
 const e=env(),c=open(e,'y2023q10');click(c,'preview');assert.match(c.textContent,/第 1 \/ 2 页/);click(c,'open');click(c,'tab','page');change(e,c,'orientation','landscape');click(c,'cancel');assert.match(c.textContent,/A4 纵向/);click(c,'open');click(c,'tab','page');change(e,c,'orientation','landscape');click(c,'apply');assert.match(c.textContent,/第 1 \/ 1 页/);e.dom.window.close();
});
test('External link loss retains the last calculated value until source becomes available',()=>{
 const e=env(),c=open(e,'y2021q9');change(e,c,'external','320');click(c,'path');change(e,c,'external','999');assert.match(c.querySelector('table').textContent,/320/);assert.doesNotMatch(c.querySelector('table').textContent,/999/);click(c,'path');assert.match(c.querySelector('table').textContent,/999/);e.dom.window.close();
});
test('Validation error disables background editing; Retry enables it without accepting',()=>{
 const e=env(),c=open(e,'y2021q25');click(c,'open');click(c,'apply');change(e,c,'draft','未知');click(c,'commit');assert.equal(c.querySelector('[data-field="draft"]').disabled,true);assert.equal(c.querySelector('[data-lab-act="commit"]').disabled,true);click(c,'retry');assert.equal(c.querySelector('[data-field="draft"]').disabled,false);assert.match(c.querySelector('table').textContent,/男/);e.dom.window.close();
});
test('Reference copying supports base-26 columns and rejects fractional displacement',()=>{
 const e=env(),c=open(e,'merged-10');change(e,c,'style','relative');change(e,c,'dx','25');assert.match(c.querySelector('.lab-office table').textContent,/=AA3/);change(e,c,'dy','1.5');assert.match(c.querySelector('.lab-office table').textContent,/请输入整数/);change(e,c,'dy','-3');assert.match(c.querySelector('.lab-office table').textContent,/#REF!/);e.dom.window.close();
});
test('Clear filter retains arrows; turning filter off removes them and restores rows',()=>{
 const e=env(),c=open(e,'y2026q51');change(e,c,'mode','auto');click(c,'auto');click(c,'clear');assert.match(c.querySelector('.note-lab thead').textContent,/性别 ▾/);click(c,'auto');click(c,'toggleAuto');assert.doesNotMatch(c.querySelector('.note-lab thead').textContent,/▾/);assert.match(c.querySelector('.note-lab tbody').textContent,/周林/);e.dom.window.close();
});
test('CSV reimport cancel restores previously imported rows and options',()=>{
 const e=env(),c=open(e,'y2021q47');click(c,'start');click(c,'next');click(c,'next');click(c,'finish');const previous=c.querySelector('table').textContent;click(c,'start');click(c,'next');change(e,c,'delimiter','tab');click(c,'cancel');assert.equal(c.querySelector('table').textContent,previous);e.dom.window.close();
});
test('Combination chart cancel preserves applied axis configuration',()=>{
 const e=env(),c=open(e,'y2026q52');click(c,'ab');c.querySelector('[data-lab-act="d"]').dispatchEvent(new e.w.MouseEvent('click',{bubbles:true,ctrlKey:true}));click(c,'insert');click(c,'combo');change(e,c,'secondary',true);click(c,'apply');click(c,'combo');change(e,c,'secondary',false);click(c,'cancel');assert.match(c.querySelector('svg').textContent,/成功率%/);e.dom.window.close();
});
test('Word and Excel show their canonical comparison tables, external reset controls, and keep keyboard focus',()=>{
 let count=0;for(const ch of [3,4]){const e=env(ch);count+=e.d.querySelectorAll('.note-comparison').length;assert.equal(e.d.querySelectorAll('.simulation-footer').length,0);const c=open(e,ch===3?'merged-7':'merged-10');assert.equal(c.querySelector('[data-sim-reset]').closest('.lab-office'),null);const control=c.querySelector('[data-field]');control.focus();control.dispatchEvent(new e.w.Event('change',{bubbles:true}));assert.equal(e.d.activeElement.closest('.notes-picker')?.querySelector('select').dataset.field||e.d.activeElement.dataset.field,control.dataset.field);e.dom.window.close();}assert.equal(count,allNotes().filter(n=>[3,4].includes(n.chapter)&&n.comparison).length);
});
test('Trend forecast preserves slope and places its endpoint on the same month scale',()=>{
 const e=env(),c=open(e,'y2024q68');click(c,'open');change(e,c,'draft','1');click(c,'apply');let line=c.querySelector('[data-trend-line]');assert.equal(line.getAttribute('x2'),'280');const firstY=line.getAttribute('y2');click(c,'open');change(e,c,'draft','3');click(c,'cancel');assert.equal(c.querySelector('[data-trend-line]').getAttribute('y2'),firstY);click(c,'open');change(e,c,'draft','3');click(c,'apply');line=c.querySelector('[data-trend-line]');assert.equal(line.getAttribute('x2'),'360');assert.ok(Number(line.getAttribute('y2'))<Number(firstY));e.dom.window.close();
});
test('Table header choice preserves old titles as data and Enter expands actual rows',()=>{
 const e=env(),c=open(e,'y2024q59');click(c,'open');change(e,c,'draftHeader',false);click(c,'apply');assert.match(c.querySelector('.lab-office tbody').textContent,/列1 ▾列2姓名成绩/);change(e,c,'newa','陈晨');change(e,c,'newb','88');c.querySelector('[data-field="newb"]').dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.match(c.querySelector('output').textContent,/A1:B5/);click(c,'convert');click(c,'convertApply');assert.match(c.querySelector('.lab-office tbody').textContent,/陈晨88/);assert.doesNotMatch(c.querySelector('.lab-office tbody').textContent,/▾/);e.dom.window.close();
});
test('Blank replacement distinguishes zero-length cells from one space and supports undo',()=>{
 const e=env(),c=open(e,'y2023q60');click(c,'all');click(c,'open');click(c,'apply');assert.match(c.querySelector('output').textContent,/2 处/);assert.equal(c.querySelector('[data-row="2"]').textContent,' ');click(c,'cancel');assert.match(c.querySelector('[data-row="1"]').textContent,/缺考/);click(c,'undo');assert.doesNotMatch(c.querySelector('[data-row="1"]').textContent,/缺考/);e.dom.window.close();
});
test('Word page start rejects decimals and text-to-table preserves leading empty fields',()=>{
 const e=env(3),c=open(e,'y2020q41');change(e,c,'scenario','numbers');click(c,'num_edit');click(c,'num_format');change(e,c,'numDraftStart','1.5');click(c,'num_apply');assert.ok(c.querySelector('.lab-dialog'));assert.match(c.querySelector('output').textContent,/整数/);const t=open(e,'y2024q8');change(e,t,'scenario','convert');change(e,t,'raw','\t成绩\n王宁\t80');click(t,'convertOpen');click(t,'convertApply');assert.equal(t.querySelector('.lab-paper table th').textContent,'');e.dom.window.close();
});
test('MID and RIGHT calculate editable source and reject illegal numeric arguments',()=>{
 const e=env(),c=open(e,'y2020q56');change(e,c,'start','0');assert.equal(c.querySelector('[data-extract-result]').textContent,'#VALUE!');change(e,c,'fn','RIGHT');change(e,c,'count','3');change(e,c,'text','SD002');assert.equal(c.querySelector('[data-extract-result]').textContent,'002');change(e,c,'count','-1');assert.equal(c.querySelector('[data-extract-result]').textContent,'#VALUE!');e.dom.window.close();
});
test('Column boundary drag reveals unchanged date and cancelled drag retains committed width',()=>{
 const e=env(),c=open(e,'y2020q7');assert.match(c.querySelector('[data-hash-date]').textContent,/#/);const p=(el,type,x)=>el.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:100}));let h=c.querySelector('[data-lab-drag="column"]');p(h,'pointerdown',100);p(h,'pointermove',220);p(h,'pointerup',220);assert.equal(c.querySelector('[data-hash-date]').textContent,'2026/9/5 14:30');assert.equal(c.querySelector('[data-width-readout]').textContent,'250 px');h=c.querySelector('[data-lab-drag="column"]');p(h,'pointerdown',220);p(h,'pointermove',150);p(h,'pointercancel',150);assert.equal(c.querySelector('[data-width-readout]').textContent,'250 px');e.dom.window.close();
});
test('Text fill ends at pointer row and serial values preserve leading zeroes',()=>{
 const e=env(),c=open(e,'y2020q48');const h=c.querySelector('[data-lab-drag="fill"]');c.querySelectorAll('[data-fill-index]').forEach((el,i)=>el.getBoundingClientRect=()=>({left:100,right:200,top:100+i*40,bottom:140+i*40}));for(const [type,y] of [['pointerdown',130],['pointermove',210],['pointerup',210]])h.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:180,clientY:y}));change(e,c,'mode','series');assert.match(c.querySelector('[data-fill-index="2"]').textContent,/002024000003/);assert.doesNotMatch(c.querySelector('[data-fill-index="3"]').textContent,/002024/);e.dom.window.close();
});
test('Clear formats preserves value while deleting a B cell shifts only column B',()=>{
 const e=env(),c=open(e,'y2024q10');click(c,'menu');click(c,'clear','formats');assert.match(c.querySelector('output').textContent,/底层值 0.128；常规格式/);click(c,'undo');click(c,'deleteDialog');click(c,'cancel');assert.match(c.querySelector('output').textContent,/0.128/);click(c,'deleteDialog');click(c,'delete');assert.match(c.querySelector('output').textContent,/底层值 0.25/);assert.equal(c.querySelector('.lab-office tbody tr td:nth-child(2)').textContent,'甲');e.dom.window.close();
});
test('Consolidation aligns out-of-order labels and cancel preserves applied result',()=>{
 const e=env(),c=open(e,'y2023q57');click(c,'open');for(const i of [0,1,2]){change(e,c,'reference',String(i));click(c,'add-reference');}click(c,'apply');assert.match(c.querySelector('.lab-office tbody').textContent,/王宁867992/);const before=c.querySelector('.lab-office tbody').textContent;click(c,'open');click(c,'remove-reference');click(c,'cancel');assert.equal(c.querySelector('.lab-office tbody').textContent,before);change(e,c,'preset','left');click(c,'open');assert.match(c.querySelector('.lab-dialog').textContent,/A\$2:\$B\$4/);click(c,'apply');assert.match(c.querySelector('.lab-office tbody').textContent,/王宁257/);e.dom.window.close();
});
test('Across-center retains selectable B1 while merge changes actual cell structure',()=>{
 const e=env(),c=open(e,'y2020q47');click(c,'range');click(c,'format');change(e,c,'draft','across');click(c,'apply');click(c,'cell','1');assert.equal(c.querySelector('[aria-label="名称框"]').value,'B1');assert.equal(c.querySelector('[aria-label="编辑栏"]').value,'');click(c,'range');click(c,'merge');assert.ok(c.querySelector('td[colspan="4"]'));assert.equal(c.querySelector('[data-lab-act="cell"][data-value="1"]'),null);e.dom.window.close();
});
test('Word shortcut controls move and extend actual editable textarea selection',()=>{
 const e=env(3),c=open(e,'y2024q7');let editor=c.querySelector('[data-selection-editor]');const total=editor.value.length;editor.setSelectionRange(4,4);editor.dispatchEvent(new e.w.Event('select'));click(c,'key','ctrlShiftEnd');editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionStart,4);assert.equal(editor.selectionEnd,total);click(c,'key','ctrlHome');editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionEnd,0);editor.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'End',ctrlKey:true,bubbles:true,cancelable:true}));assert.equal(c.querySelector('[data-selection-editor]').selectionStart,total);e.dom.window.close();
});
test('Caption references keep identity across inserted figures and explicit field updates',()=>{
 const e=env(3),c=open(e,'merged-6');click(c,'captionOpen');click(c,'captionApply');click(c,'referenceOpen');click(c,'referenceApply');assert.equal(c.querySelector('[data-lab-act="field"][data-value="reference"]').textContent,'图 2');click(c,'prepend');assert.equal(c.querySelector('[data-lab-act="field"][data-value="reference"]').textContent,'图 2');click(c,'updateAll');assert.equal(c.querySelector('[data-lab-act="field"][data-value="reference"]').textContent,'图 3');for(let i=0;i<3;i++)click(c,'deleteFirst');click(c,'updateAll');assert.match(c.querySelector('[data-lab-act="field"][data-value="reference"]').textContent,/未找到引用源/);e.dom.window.close();
});
test('Footnote click selects a reference; only Delete removes it and renumbers',()=>{
 const e=env(3),c=open(e,'y2022q55');click(c,'insert');click(c,'select','1');click(c,'insert');click(c,'selectRef','0');assert.equal(c.querySelectorAll('sup').length,2);click(c,'deleteRef');assert.equal(c.querySelectorAll('sup').length,1);assert.equal(c.querySelector('sup').textContent,'1');e.dom.window.close();
});
test('Section breaks isolate middle-page orientation; setup cancellation retains applied direction',()=>{
 const e=env(3),c=open(e,'y2020q61');click(c,'breakMenu');click(c,'nextPage');change(e,c,'point','end');click(c,'breakMenu');click(c,'nextPage');click(c,'view','1');click(c,'directionMenu');click(c,'direction','landscape');assert.equal(c.querySelector('[data-layout-page]').dataset.direction,'landscape');click(c,'view','0');assert.equal(c.querySelector('[data-layout-page]').dataset.direction,'portrait');click(c,'view','2');assert.equal(c.querySelector('[data-layout-page]').dataset.direction,'portrait');click(c,'setup');change(e,c,'draftDirection','landscape');click(c,'cancel');assert.equal(c.querySelector('[data-layout-page]').dataset.direction,'portrait');e.dom.window.close();
});
test('Layer selection is unrestricted; one step and bring-to-front change different orders',()=>{
 const e=env(3),c=open(e,'y2025q56');click(c,'pane');c.querySelector('[data-layer-row="right"]').click();click(c,'layer','forward');assert.match(c.querySelector('output').textContent,/从底向上第2层/);click(c,'frontMenu');click(c,'layer','front');assert.match(c.querySelector('output').textContent,/从底向上第3层/);click(c,'undo');assert.match(c.querySelector('output').textContent,/从底向上第2层/);e.dom.window.close();
});
test('RAM loses unsaved edits while the saved SSD file survives a power cycle',()=>{
 const e=env(1),c=open(e,'y2026q3');change(e,c,'ram','已保存版本');click(c,'save');change(e,c,'ram','未保存的修改');click(c,'power');assert.equal(c.querySelector('textarea'),null);assert.equal(c.querySelector('[data-saved-file]').textContent,'已保存版本');click(c,'power');assert.equal(c.querySelector('textarea').value,'');click(c,'load');assert.equal(c.querySelector('textarea').value,'已保存版本');e.dom.window.close();
});
test('Capacity and bit models calculate independently and reject overflow-sized inputs',()=>{
 const e=env(1),m=e.w.NOTE_LABS.registry['merged-3'],s=structuredClone(m.initial);m.action(s,'bit','0');assert.match(m.render(s),/193/);s.mode='size';s.unit='MiB';assert.match(m.render(s),/1,048,576/);s.unit='MB';assert.match(m.render(s),/1,000,000/);s.amount='1e308';assert.doesNotMatch(m.render(s),/∞|Infinity/);s.mode='image';s.width='1024';s.height='768';s.depth='24';assert.match(m.render(s),/2,359,296/);e.dom.window.close();
});
test('CPU advances PC on fetch and stores the sum only at STORE',()=>{
 const e=env(1),m=e.w.NOTE_LABS.registry['merged-1'],s=structuredClone(m.initial);s.left='5';s.right='8';m.action(s,'step');assert.equal(s.pc,1);assert.equal(s.ir,'LOAD 10');for(let i=0;i<5;i++)m.action(s,'step');assert.equal(s.acc,13);assert.equal(s.result,0);for(let i=0;i<6;i++)m.action(s,'step');assert.equal(s.result,13);assert.equal(s.halted,true);m.action(s,'restart');s.left='1e308';m.action(s,'step');assert.equal(s.phase,0);e.dom.window.close();
});
test('File drag uses destination volume and actual pointerup modifier keys',()=>{
 const e=env(2),c=open(e,'y2020q24');
 const drag=(mods={})=>{const f=c.querySelector('[data-lab-drag="file"]');c.querySelector('[data-file-target]').getBoundingClientRect=()=>({left:150,right:290,top:80,bottom:240});for(const [type,x,y] of [['pointerdown',20,50],['pointermove',200,140],['pointerup',200,140]])f.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y,...mods}));};
 change(e,c,'drive','D');drag();assert.ok(c.querySelector('[data-lab-drag="file"]'));assert.equal(c.querySelectorAll('[data-file-result]').length,1);change(e,c,'drive','C');drag({ctrlKey:true});assert.ok(c.querySelector('[data-lab-drag="file"]'));change(e,c,'drive','D');drag({shiftKey:true});assert.equal(c.querySelector('[data-lab-drag="file"]'),null);
 for(const mods of [{ctrlKey:true,shiftKey:true},{altKey:true}]){change(e,c,'drive','C');drag(mods);assert.ok(c.querySelector('.lab-file'));assert.match(c.querySelector('[data-file-target]').textContent,/快捷方式/);}
 change(e,c,'drive','C');change(e,c,'mode','right');click(c,'modifier','ctrl');drag();assert.ok(c.querySelector('.lab-context-menu'));assert.equal(c.querySelectorAll('[data-file-result]').length,0);click(c,'cancel');assert.ok(c.querySelector('.lab-file'));e.dom.window.close();
});
test('Duplicate file copy reports a conflict rather than claiming another copy',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2020q24,s=structuredClone(m.initial);s.drive='D';m.action(s,'drop');m.action(s,'drop');assert.equal(s.target.length,1);assert.match(s.message,/已存在/);assert.equal(s.source,true);e.dom.window.close();
});
test('Recycle Bin restores original files and Delete in the bin requests permanent removal',()=>{
 const e=env(2),c=open(e,'y2020q3');click(c,'select','2');click(c,'delete');click(c,'tab','bin');assert.match(c.querySelector('table').textContent,/复习提纲/);click(c,'restore');click(c,'tab','folder');click(c,'select','2');click(c,'delete');click(c,'tab','bin');c.querySelector('.note-lab').dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}));assert.ok(c.querySelector('.lab-dialog'));click(c,'confirm');assert.equal(c.querySelectorAll('[data-lab-act="select"]').length,0);e.dom.window.close();
});
test('Clipboard permits repeated text pastes but completes a file cut only on successful paste',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2025q33,s=structuredClone(m.initial);s.sourceText='复习';m.action(s,'cut');assert.equal(s.sourceText,'');m.action(s,'paste');m.action(s,'sleep');m.action(s,'sleep');m.action(s,'paste');assert.equal(s.targetText,'复习复习');s.mode='file';m.action(s,'cut');assert.equal(s.sourceFile,true);assert.equal(s.cut,true);m.action(s,'paste');assert.equal(s.sourceFile,false);assert.equal(s.targetFile,true);assert.equal(s.buffer,null);e.dom.window.close();
});
test('A topmost inactive window does not take keyboard focus from the active text field',()=>{
 const e=env(2),c=open(e,'y2020q2');click(c,'activate','A');const a=c.querySelector('[data-field="textA"]');assert.equal(e.d.activeElement,a);assert.equal(c.querySelector('[data-window="B"]').style.zIndex,'3');assert.equal(c.querySelector('[data-window="A"]').style.zIndex,'2');change(e,c,'textA','只改A');assert.equal(c.querySelector('[data-field="textB"]').value,'B中的笔记');e.dom.window.close();
});
test('PowerPoint deletion follows the selected page or object; hidden slides are skipped in playback',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2020q12,s=structuredClone(m.initial);m.action(s,'page','4');m.action(s,'delete');assert.deepEqual(Array.from(s.slides,x=>x.id),[1,2,3]);m.action(s,'undo');m.action(s,'object');m.action(s,'delete');assert.equal(s.slides.length,4);assert.equal(s.slides[3].object,false);m.action(s,'page','1');m.action(s,'hide');m.action(s,'show');assert.equal(s.playing,2);m.action(s,'next');assert.equal(s.playing,3);e.dom.window.close();
});
test('Master and layout text changes propagate only to their own descendants',()=>{
 const e=env(5),c=open(e,'y2020q11');click(c,'view');change(e,c,'masterText','母版甲');assert.equal([...c.querySelectorAll('.core-master-logo')].filter(el=>el.textContent==='母版甲').length,3);click(c,'node','A/content');change(e,c,'masterText','内容版式文字');assert.equal([...c.querySelectorAll('.core-layout-text')].filter(el=>el.textContent==='内容版式文字').length,2);change(e,c,'hide',true);assert.equal(c.querySelectorAll('.core-local-text').length,5);assert.equal([...c.querySelectorAll('.core-master-logo')].filter(el=>el.textContent==='母版甲').length,2);e.dom.window.close();
});
test('Theme application supports discontinuous selection and keeps unselected pages unchanged',()=>{
 const e=env(5),c=open(e,'y2020q53');c.querySelector('[data-lab-act="page"][data-value="4"]').dispatchEvent(new e.w.MouseEvent('click',{bubbles:true,ctrlKey:true}));click(c,'menu');click(c,'selectedTheme');const rows=[...c.querySelectorAll('.note-lab tbody tr')].map(tr=>tr.textContent);assert.match(rows[0],/紫藤/);assert.match(rows[3],/紫藤/);assert.match(rows[1],/樱粉/);assert.match(rows[2],/樱粉/);e.dom.window.close();
});
test('Footer dialog disables external layout changes and cancellation leaves applied fields untouched',()=>{
 const e=env(5),c=open(e,'y2024q65');click(c,'open');assert.equal(c.querySelector('[data-field="layout"]').matches(':disabled'),true);change(e,c,'number',true);click(c,'cancel');assert.equal(c.querySelector('[data-slide-number]'),null);e.dom.window.close();
});
test('Custom show reordered references determine playback without reordering source slides',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2026q55,s=structuredClone(m.initial);m.action(s,'edit');m.action(s,'select','2');m.action(s,'up');m.action(s,'save');assert.deepEqual(Array.from(s.saved),[0,2,1]);m.action(s,'show');m.action(s,'next');assert.equal(s.saved[s.playing],2);m.action(s,'next');assert.equal(s.saved[s.playing],1);m.action(s,'next');assert.equal(s.show,false);assert.match(m.render(s),/源文稿|源幻灯片/);e.dom.window.close();
});
test('Rehearsal pauses, preserves unvisited saved times and cannot double-advance a boundary click',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2023q13,s=structuredClone(m.initial);let now=0;e.w.Date.now=()=>now;s.saved=[10,20,30];m.action(s,'start');now=1000;m.action(s,'pause');now=6000;m.tick(s);assert.equal(s.elapsed,1);m.action(s,'finish');m.action(s,'save');assert.deepEqual(Array.from(s.saved),[1,20,30]);s.saved=[1,1,1];m.action(s,'play');now=7100;m.action(s,'next');assert.equal(s.page,1);e.dom.window.close();
});
test('Transitions use the entering slide settings; animation timing controls completion and automatic advance',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry['merged-11'],s=structuredClone(m.initial);let now=0;e.w.Date.now=()=>now;s.settings[0].effect='none';m.action(s,'start');assert.equal(s.phase,'slide');assert.match(m.render(s),/opacity:1/);m.action(s,'screen');assert.equal(s.current,1);assert.equal(s.phase,'transition');now=600;m.tick(s);assert.equal(s.phase,'slide');m.action(s,'screen');s.settings[1].auto=true;s.settings[1].after=.5;now=2600;m.tick(s);assert.equal(s.current,1);now=3600;m.tick(s);assert.equal(s.current,2);e.dom.window.close();
});
test('Playback keyboard handling preserves native buttons and grouped notes retain all source points',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry['merged-11'],s=structuredClone(m.initial);s.show=true;let prevented=false;const button=e.d.createElement('button');assert.equal(m.keydown(s,{key:'Enter',target:button,preventDefault:()=>prevented=true}),undefined);assert.equal(prevented,false);for(const id of ['merged-11','y2020q11']){const n=e.w.NOTES.notes.find(x=>x.id===id);assert.deepEqual(Array.from(n.pointGroups.flatMap(g=>g.indices)).sort((a,b)=>a-b),Array.from({length:n.points.length},(_,i)=>i));assert.equal(e.d.querySelectorAll('#'+id+' .note-point-group li').length,n.points.length);}e.dom.window.close();
});

test('network transfer uses the bottleneck, payload proportion and actual elapsed time',()=>{
 const e=env(6),r=e.w.NOTE_LABS.registry.y2020q26,s=structuredClone(r.initial),calc=e.w.NOTE_LABS.networkMath.transfer;
 let x=calc(s);assert.equal(x.capacity,20);assert.equal(x.goodput,16);assert.equal(x.bits,16777216);
 s.first='1000';assert.equal(calc(s).seconds,x.seconds);s.second='40';assert.equal(calc(s).seconds,x.seconds/2);
 s.second='0';assert.equal(calc(s),null);s.second='20';let now=1000;e.w.Date.now=()=>now;r.action(s,'start');now=1200;r.tick(s);assert.equal(s.elapsed,.2);assert.match(r.render(s),/aria-valuenow="0"/);now=5000;r.tick(s);assert.equal(s.running,false);assert.match(r.render(s),/aria-valuenow="100"/);e.dom.window.close();
});
test('URL resolution treats a trailing slash, queries and fragments separately',()=>{
 const e=env(6),c=open(e,'y2026q14');change(e,c,'base','https://notes.example/course/');change(e,c,'target','page.html?q=1#part');assert.match(c.querySelector('.ext-address').textContent,/\/course\/page.html\?q=1#part/);change(e,c,'base','https://notes.example/course');assert.match(c.querySelector('.ext-address').textContent,/https:\/\/notes.example\/page.html/);change(e,c,'target','javascript:alert(1)');assert.equal(c.querySelector('.ext-address'),null);assert.match(c.textContent,/有效的HTTP/);e.dom.window.close();
});
test('IPv6 canonicalization handles zero runs, legal single-group compression and invalid forms',()=>{
 const e=env(6),parse=e.w.NOTE_LABS.networkMath.ipv6;
 assert.equal(parse('::').full,'0000:0000:0000:0000:0000:0000:0000:0000');assert.equal(parse('2001:0:0:1:0:0:1:1').canonical,'2001::1:0:0:1:1');assert.equal(parse('1:2:3:4:5:6::8').canonical,'1:2:3:4:5:6:0:8');assert.equal(parse('2001:DB8::1').canonical,'2001:db8::1');
 for(const raw of ['1::2::3','1:2:3:4:5:6:7:8:9','1:2:3:4:5:6:7:8::','::ffff:192.0.2.1','g::1'])assert.equal(parse(raw),null,raw);e.dom.window.close();
});
test('PCM byte counts preserve channels and reject fractional samples; quantization uses finite levels',()=>{
 const e=env(7),m=e.w.NOTE_LABS.mediaMath,s=structuredClone(e.w.NOTE_LABS.registry.y2024q32.initial);
 assert.equal(m.pcm(s).bytes,10584000);s.channels='2';assert.equal(m.pcm(s).bytes,21168000);s.duration='.001';assert.equal(m.pcm(s),null);
 const levels=new Set(m.samples(s).map(x=>x.q));assert.ok(levels.size<=8);assert.ok(m.samples(s).every(x=>x.q>=-1&&x.q<=1));const c=open(e,'y2024q32');change(e,c,'mode','pcm');change(e,c,'channels','2');assert.match(c.textContent,/21,168,000/);e.dom.window.close();
});
test('run-length coding restores its input but cannot recover earlier grayscale reduction',()=>{
 const e=env(7),m=e.w.NOTE_LABS.mediaMath;assert.deepEqual(JSON.parse(JSON.stringify(m.runLength([1,1,2,3,3]))),[[1,2],[2,1],[3,2]]);assert.equal(m.parsePixels('0,256'),null);
 const c=open(e,'merged-14');change(e,c,'raw','30,31,30,31');assert.match(c.textContent,/这次反而变大/);change(e,c,'mode','reduce');assert.match(c.textContent,/否，编码前已丢失灰度差别/);assert.match(c.textContent,/是，游程可逐项还原/);e.dom.window.close();
});
test('firewall matches the unchanged packet across source, port, direction and protocol',()=>{
 const e=env(8),c=open(e,'merged-16'),m=e.w.NOTE_LABS.securityMath;
 assert.equal(m.cidr('10.20.8.0/   '),null);assert.equal(m.cidr('10.20.8.0/0x10'),null);assert.equal(m.cidr('10.20.8.0/1e1'),null);assert.equal(m.inSubnet('203.0.113.27','0.0.0.0/0'),true);assert.equal(m.inSubnet('10.20.8.16','10.20.8.16/32'),true);assert.equal(m.inSubnet('10.20.8.17','10.20.8.16/32'),false);
 click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/203.0.113.27.*已阻止/);change(e,c,'source','10.20.9.16');click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/允许通过/);change(e,c,'protocol','UDP');click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/没有命中/);change(e,c,'protocol','TCP');change(e,c,'direction','out');click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/出站.*已阻止/);e.dom.window.close();
});
test('dragging firewall rules changes first-match behavior without changing the packet',()=>{
 const e=env(8),c=open(e,'merged-16');change(e,c,'source','10.20.8.16');click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/允许通过/);
 const rows=[...c.querySelectorAll('[data-lab-drop]')];rows.forEach((el,i)=>el.getBoundingClientRect=()=>({left:100,right:400,top:100+i*100,bottom:200+i*100}));const h=c.querySelector('[data-key="2"]');const p=(type,x,y)=>h.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));p('pointerdown',180,250);p('pointermove',180,150);p('pointerup',180,150);c.querySelector('[data-lab-act="send"]').dispatchEvent(new e.w.MouseEvent('pointerdown',{bubbles:true,button:0}));click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/10.20.8.16.*已阻止.*第1条/);e.dom.window.close();
});
const settle=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}assert.fail('async model did not finish');};
test('real signature UI verifies original, rejects tampering and rejects a different public key',async()=>{
 const e=env(8),c=open(e,'merged-15');click(c,'keys');await settle(()=>c.querySelector('.lab-output').textContent.includes('新密钥已生成'));click(c,'sign');await settle(()=>c.querySelector('.lab-output').textContent.includes('已用发送方私钥签名'));click(c,'verify');await settle(()=>c.querySelector('.lab-output').textContent.includes('验签通过'));
 change(e,c,'received','被篡改的消息');click(c,'verify');await settle(()=>c.querySelector('.lab-output').textContent.includes('验签失败'));change(e,c,'received','本周学习计算机网络');change(e,c,'signer','other');click(c,'verify');await settle(()=>c.querySelector('.lab-output').textContent.includes('验签失败'));e.dom.window.close();
});
test('real RSA-OAEP restores messages, rejects modified ciphertext and displays empty plaintext',async()=>{
 const e=env(8),r=e.w.NOTE_LABS.registry['merged-15'],s=structuredClone(r.initial);await r.action(s,'keys');s.mode='encryption';s.text='实际密文';await r.action(s,'encrypt');assert.equal(s.cipher.length,512);await r.action(s,'decrypt');assert.equal(s.clear,'实际密文');s.cipher=(s.cipher[0]==='0'?'1':'0')+s.cipher.slice(1);await r.action(s,'decrypt');assert.equal(s.decrypted,false);assert.match(s.message,/解密失败/);s.text='';await r.action(s,'encrypt');await r.action(s,'decrypt');assert.equal(s.decrypted,true);assert.match(r.render(s),/空字符串/);s.mode='hash';s.text='abc';await r.action(s,'hash');assert.equal(s.digest,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');e.dom.window.close();
});
test('natural join matches all shared attributes and projection removes actual duplicates',()=>{
 const e=env(10),c=open(e,'merged-20');let tables=c.querySelectorAll('.note-lab table');assert.equal(tables[2].querySelectorAll('tbody tr').length,2);assert.doesNotMatch(tables[2].textContent,/91/);change(e,c,'mode','project');tables=c.querySelectorAll('.note-lab table');assert.equal(tables[2].querySelectorAll('tbody tr').length,2);change(e,c,'left','01,甲,A\n02,乙,A');tables=c.querySelectorAll('.note-lab table');assert.equal(tables[2].querySelectorAll('tbody tr').length,1);change(e,c,'mode','select');change(e,c,'filter','Z');assert.match(c.textContent,/结果为空关系/);e.dom.window.close();
});
test('SQL operations accumulate, preserve NULL semantics and never revive a dropped table',()=>{
 const e=env(10),m=e.w.NOTE_LABS.dataMath,db=m.initialDB();m.sqlExecute(db,'DELETE FROM students WHERE score < 60;');assert.deepEqual(Array.from(db.rows,r=>r.id),[1,3,4]);assert.equal(m.sqlExecute(db,'DELETE FROM students WHERE score < 60;').message,'DELETE删除了0行；表、字段和约束仍保留。');m.sqlExecute(db,'ALTER TABLE students ADD COLUMN remark TEXT;');m.sqlExecute(db,"INSERT INTO students (id,name,score) VALUES (5,'O''Brien',75);");assert.equal(db.rows.at(-1).name,"O'Brien");assert.equal(db.rows.at(-1).remark,null);m.sqlExecute(db,'UPDATE students SET score = 60 WHERE score IS NULL;');assert.equal(db.rows.find(r=>r.id===4).score,60);m.sqlExecute(db,'DELETE FROM students;');assert.equal(db.exists,true);assert.equal(db.columns.length,4);m.sqlExecute(db,'DROP TABLE students;');assert.equal(db.exists,false);assert.throws(()=>m.sqlExecute(db,'SELECT * FROM students;'),/已被DROP/);e.dom.window.close();
});
test('SQL invalid numeric precision and identifiers cannot silently change the table',()=>{
 const e=env(10),c=open(e,'y2024q36');for(const sql of ['UPDATE students SET score=9007199254740993;','UPDATE students SET score='+ '9'.repeat(400)+';','UPDATE students SET score=1.1234567;','ALTER TABLE students ADD COLUMN select TEXT;']){change(e,c,'sql',sql);click(c,'execute');assert.equal(c.querySelector('.note-lab table').querySelectorAll('tbody tr').length,4);assert.match(c.querySelector('.note-lab table').textContent,/88/);assert.match(c.querySelector('.lab-output').textContent,/不执行|不支持/);}change(e,c,'example','drop');click(c,'execute');assert.match(c.textContent,/表不存在/);click(c,'undo');assert.equal(c.querySelector('.note-lab table').querySelectorAll('tbody tr').length,4);e.dom.window.close();
});
test('bubble sorting computes one pass, both directions and stable equal values',()=>{
 const e=env(11),r=e.w.NOTE_LABS.registry.y2024q69,s=structuredClone(r.initial);r.action(s,'load');r.action(s,'pass');assert.deepEqual(Array.from(s.items,x=>x.value),[5,2,8,7,3,9]);assert.equal(s.comparisons,5);assert.equal(s.done,false);r.action(s,'all');assert.deepEqual(Array.from(s.items,x=>x.value),[2,3,5,7,8,9]);s.raw='3,1,3,-2';s.direction='desc';r.action(s,'load');r.action(s,'all');assert.deepEqual(Array.from(s.items,x=>x.value),[3,3,1,-2]);assert.deepEqual(Array.from(s.items.filter(x=>x.value===3),x=>x.origin),[1,3]);s.raw='1,2,3';s.direction='asc';r.action(s,'load');r.action(s,'all');assert.equal(s.pass,1);assert.equal(s.swaps,0);e.dom.window.close();
});
test('released cloud instance cannot resume billing through its resize action',()=>{
 // v68 ports the same release/resize invariant from the legacy renderer to the state lab.
 const e=env(9),c=open(e,'y2026q39');click(c,'cloudResize');assert.equal(c.querySelector('[data-vcpu]').textContent,'8');assert.equal(c.querySelector('[data-vram]').textContent,'16 GB');assert.equal(c.querySelector('[data-bill]').textContent,'¥1.28/h');click(c,'cloudRelease');assert.equal(c.querySelector('[data-instance-state]').textContent,'已释放');const resize=c.querySelector('[data-lab-act="cloudResize"]');assert.equal(resize.disabled,true);resize.click();assert.equal(c.querySelector('[data-bill]').textContent,'¥0.00/h');change(e,c,'service','PaaS');assert.equal(c.querySelector('[data-bill]').textContent,'¥0.00/h');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-instance-state]').textContent,'运行中');assert.equal(c.querySelector('[data-lab-act="cloudResize"]').disabled,false);assert.equal(c.querySelector('[data-vcpu]').textContent,'2');e.dom.window.close();
});

test('search matches separated normalized terms without indexing changing demo output',()=>{
 const e=env(3),s=e.d.querySelector('#search-input');
 const search=q=>{s.value=q;s.dispatchEvent(new e.w.Event('input',{bubbles:true}));return [...e.d.querySelectorAll('.note-item:not(.hidden)')].map(x=>x.id);};
 const a=search('word'),b=search('ＷＯＲＤ');assert.ok(a.length);assert.deepEqual(b,a);
 const c=open(e,'y2026q47');const token='演示临时输入不属于笔记';const p=e.d.createElement('p');p.textContent=token;c.querySelector('.simulation-body').append(p);
 assert.deepEqual(search(token),[]);
 const note=e.w.NOTES.notes.find(n=>n.id==='y2026q47');const key=note.title.slice(0,4);assert.ok(search(key+'  '+note.conclusion.slice(0,4)).includes(note.id));
 assert.ok(search('邮件 合并').length);e.dom.window.close();
});
test('empty search explains recovery and restores every note with focus on search',()=>{
 const e=env(6),s=e.d.querySelector('#search-input');s.value='找不到的知识点xyz';s.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 assert.equal(e.d.querySelector('#search-empty').hidden,false);assert.equal(e.d.querySelector('#clear-search').hidden,false);assert.equal(e.d.querySelector('#result-count').textContent,`0 / ${e.w.NOTES.notes.length}条`);
 e.d.querySelector('#restore-notes').click();assert.equal(e.d.querySelectorAll('.note-item:not(.hidden)').length,e.w.NOTES.notes.length);assert.equal(e.d.querySelector('#search-empty').hidden,true);assert.equal(e.d.querySelector('#clear-search').hidden,true);assert.equal(e.d.activeElement,s);
 s.value='IPv6';s.dispatchEvent(new e.w.Event('input',{bubbles:true}));e.d.querySelector('#clear-search').click();assert.equal(s.value,'');assert.equal(e.d.querySelectorAll('.note-item.hidden').length,0);e.dom.window.close();
});
test('directory isolates background and transfers focus to the selected hidden note',()=>{
 const e=env(3),s=e.d.querySelector('#search-input');s.value='找不到的知识点xyz';s.dispatchEvent(new e.w.Event('input',{bubbles:true}));e.d.querySelector('#open-drawer').click();
 assert.equal(e.d.querySelector('#main-content').inert,true);assert.equal(e.d.querySelector('.site-header').inert,true);
 e.d.querySelector('#drawer a[href="#y2026q47"]').click();assert.equal(e.w.location.hash,'#y2026q47');assert.equal(e.d.activeElement.id,'y2026q47');assert.equal(e.d.querySelector('#main-content').inert,false);assert.equal(e.d.querySelector('#search-empty').hidden,true);
 e.d.querySelector('#open-drawer').click();e.d.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(e.d.activeElement.id,'open-drawer');assert.equal(e.d.querySelector('.site-header').inert,false);e.dom.window.close();
});

test('foreign pointers cannot replace or finish the active file drag',()=>{
 const e=env(2),c=open(e,'y2020q24'),file=c.querySelector('.lab-file'),lab=c.querySelector('[data-lab]');
 c.querySelector('[data-file-target]').getBoundingClientRect=()=>({left:150,right:290,top:80,bottom:240});
 pointer(e,file,'pointerdown',{x:20,y:50});pointer(e,file,'pointermove',{x:200,y:140});
 pointer(e,file,'pointerdown',{id:2,primary:false,x:200,y:140});pointer(e,lab,'pointerup',{id:2,primary:false,x:200,y:140});
 assert.ok(c.querySelector('.lab-file'));assert.equal(c.querySelectorAll('[data-file-result]').length,0);
 pointer(e,file,'pointerup',{x:200,y:140});assert.equal(c.querySelector('.lab-file'),null);assert.equal(c.querySelectorAll('[data-file-result]').length,1);e.dom.window.close();
});
test('lost capture cancels a file drag without committing its preview',()=>{
 const e=env(2),c=open(e,'y2020q24'),file=c.querySelector('.lab-file');
 c.querySelector('[data-file-target]').getBoundingClientRect=()=>({left:150,right:290,top:80,bottom:240});
 pointer(e,file,'pointerdown');pointer(e,file,'pointermove',{x:200,y:140});pointer(e,file,'lostpointercapture',{x:200,y:140});
 assert.ok(c.querySelector('.lab-file'));assert.equal(c.querySelector('.lab-file').style.transform,'');assert.equal(c.querySelectorAll('[data-file-result]').length,0);e.dom.window.close();
});
test('reset and collapse cancel a pending long-press action',async()=>{
 const e=env(2),c=open(e,'y2020q24'),model=e.w.NOTE_LABS.registry.y2020q24,original=model.action;let menus=0;
 model.action=(...args)=>{if(args[1]==='menu')menus++;return original(...args);};
 pointer(e,c.querySelector('.lab-file'),'pointerdown');c.querySelector('[data-sim-reset]').click();
 await new Promise(resolve=>setTimeout(resolve,650));assert.equal(menus,0);
 pointer(e,c.querySelector('.lab-file'),'pointerdown');c.querySelector('.simulation-toggle').click();
 await new Promise(resolve=>setTimeout(resolve,650));assert.equal(menus,0);e.dom.window.close();
});
test('typing, copying and pasting preserve literal entities and markup',()=>{
 const e=env(2),c=open(e,'y2025q33'),raw='AT&amp;T &lt;标题&gt; <b>原样</b>',source=c.querySelector('[data-field="sourceText"]');
 source.value=raw;source.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(c,'copy');
 assert.equal(c.querySelector('[data-field="sourceText"]').value,raw);assert.equal(c.querySelector('[data-clipboard]').textContent,'文本：'+raw);
 click(c,'paste');click(c,'paste');assert.equal(c.querySelector('[data-field="targetText"]').value,raw+raw);e.dom.window.close();
});
test('generated entrypoints keep the release version, required styles and source data',()=>{
 for(let ch=1;ch<=11;ch++){
  const e=env(ch),html=fs.readFileSync(path.join(root,`chapter${ch}.html`),'utf8');
  assert.equal(e.w.NOTES.version,releaseVersion);
  if(ch>=6)assert.match(html,/notes-extended\.css/);
  for(const link of e.d.querySelectorAll('a[href*=".html?v="]'))assert.ok(link.href.includes('?v='+releaseVersion),link.href);
  assert.equal(new Set(scriptsFor(ch)).size,scriptsFor(ch).length);
  assert.equal(e.w.NOTES.notes.every(n=>n.chapter===ch),true);e.dom.window.close();
 }
});
test('quantity discount changes at 20 and keeps absolute lookup behavior',()=>{
 const e=env(4),c=open(e,'y2020q57');change(e,c,'task','discount');click(c,'fill');
 const value=i=>c.querySelector(`[data-fill-index="${i}"]`).textContent;
 assert.match(value(0),/1,628/);change(e,c,'quantity0',20);assert.match(value(0),/1,546.6/);change(e,c,'quantity0',21);assert.match(value(0),/1,546.6/);
 change(e,c,'locked','false');assert.match(value(2),/#N\/A/);e.dom.window.close();
});
test('cross-sheet conditional formatting follows identifiers through reordering and missing keys',()=>{
 const e=env(4),c=open(e,'y2025q52');const highlighted=()=>[...c.querySelectorAll('.lab-row-emphasis')].map(el=>el.closest('tr').querySelector('[data-field^="id"]').value);
 assert.deepEqual(highlighted(),['A01']);click(c,'reorder');assert.deepEqual(highlighted(),['A01']);change(e,c,'id1','A01');change(e,c,'value1',100);assert.deepEqual(highlighted(),['A01','A01']);
 change(e,c,'id0','missing');assert.match(c.textContent,/#N\/A/);assert.deepEqual(highlighted(),['A01']);e.dom.window.close();
});
test('duplicate text identifiers highlight every occurrence and retain leading zeroes',()=>{
 const e=env(4),c=open(e,'y2020q52');change(e,c,'rule','duplicate');assert.equal(c.querySelectorAll('.lab-highlight').length,2);
 change(e,c,'id2','A03');assert.equal(c.querySelectorAll('.lab-highlight').length,0);change(e,c,'id0','000000000000000018');change(e,c,'id1','000000000000000018');assert.equal(c.querySelectorAll('.lab-highlight').length,2);assert.equal(c.querySelector('[data-field="id0"]').value,'000000000000000018');e.dom.window.close();
});
test('numeric formatting is distinct from arithmetic conversion and whitespace remains text',()=>{
 const e=env(4),c=open(e,'y2026q49');change(e,c,'method','format');click(c,'convert');assert.match(c.querySelector('.lab-office output').textContent,/结果：25/);
 change(e,c,'method','multiply');click(c,'convert');assert.match(c.querySelector('.lab-office output').textContent,/结果：21.5/);
 change(e,c,'method','format');click(c,'convert');assert.doesNotMatch(c.textContent,/原存储类型仍是文本/);
 change(e,c,'amount0','   ');change(e,c,'method','value');click(c,'convert');assert.match(c.querySelector('tbody tr').textContent,/文本/);assert.match(c.querySelector('tbody tr').textContent,/#VALUE!/);e.dom.window.close();
});
test('Word fullwidth conversion and character colors remain independent of paragraph alignment',()=>{
 const e=env(3),c=open(e,'merged-7');change(e,c,'color','#c03535');change(e,c,'highlight','#fff29a');click(c,'width','half');assert.match(c.querySelector('.lab-paper').textContent,/2026/);
 click(c,'select','1');change(e,c,'alignment','distribute');assert.match(c.querySelectorAll('.lab-paper p')[1].style.cssText,/text-align-last: justify/);
 change(e,c,'alignment','justify');assert.equal(c.querySelectorAll('.lab-paper p')[1].style.textAlignLast,'auto');
 click(c,'select','0');assert.equal(c.querySelector('[data-field="color"]').value,'#c03535');assert.equal(c.querySelector('[data-field="highlight"]').value,'#fff29a');e.dom.window.close();
});
test('outline moves each same-level title with its body and updates TOC by stable identity',()=>{
 const e=env(3),c=open(e,'merged-5');change(e,c,'tab','home');click(c,'style');click(c,'select','1');click(c,'style');change(e,c,'tab','references');click(c,'tocInsert');change(e,c,'tab','view');click(c,'view','outline');click(c,'move','up');
 const body=c.querySelector('.lab-workspace').textContent;assert.ok(body.lastIndexOf('操作系统管理硬件和软件资源。')<body.lastIndexOf('数据是信息的符号化表示。'));
 change(e,c,'tab','references');click(c,'tocOpen');change(e,c,'tocMode','pages');click(c,'tocApply');assert.equal(c.querySelector('.lab-auto-toc p b').textContent,'2');e.dom.window.close();
});
test('image dimensions use height 8.5 by width 6 and cropping preserves the target ratio',()=>{
 const e=env(3),c=open(e,'merged-9');change(e,c,'height',6);assert.ok(Math.abs(Number(c.querySelector('[data-field="width"]').value)-6*6/8.5)<1e-8);
 change(e,c,'width',5);assert.ok(Math.abs(Number(c.querySelector('[data-field="height"]').value)-5*8.5/6)<1e-8);
 change(e,c,'mode','crop');assert.equal(c.querySelector('svg').getAttribute('viewBox'),'0 65 600 720');assert.equal(c.querySelector('[data-field="height"]').value,'6');e.dom.window.close();
});
test('equation structures survive save, delete and reinsert; header border commits or cancels',()=>{
 const e=env(3),c=open(e,'y2023q7');click(c,'insert');change(e,c,'numerator','x+2');assert.match(c.querySelector('mfrac').textContent,/x\+2/);click(c,'save');click(c,'delete');assert.equal(c.querySelector('math'),null);click(c,'restore');assert.match(c.querySelector('math').textContent,/x\+2/);
 const h=open(e,'y2024q54');click(h,'edit');click(h,'menu');change(e,h,'width',3);change(e,h,'color','#c03535');click(h,'apply');assert.match(h.querySelector('.lab-page-header').style.borderBottom,/3pt/);click(h,'menu');change(e,h,'width',.5);click(h,'close');assert.match(h.querySelector('.lab-page-header').style.borderBottom,/3pt/);e.dom.window.close();
});
test('chart category and series animation groups reveal different sets of bars',()=>{
 const e=env(5),c=open(e,'merged-12');const visible=()=>c.querySelectorAll('g[opacity="1"]').length;
 click(c,'start');assert.equal(visible(),4);click(c,'next');assert.equal(visible(),8);change(e,c,'mode','series');click(c,'start');assert.equal(visible(),3);click(c,'next');assert.equal(visible(),6);e.dom.window.close();
});
test('background edits, apply-all and reset affect their intended pages',()=>{
 const e=env(5),c=open(e,'y2020q54');change(e,c,'source','stationery');change(e,c,'transparency',38);change(e,c,'x',12);assert.equal(c.querySelector('[data-background-layer]').style.opacity,'0.62');click(c,'all');click(c,'page','1');assert.equal(c.querySelector('[data-field="x"]').value,'12');click(c,'reset');assert.equal(c.querySelector('[data-field="source"]').value,'none');click(c,'page','0');assert.equal(c.querySelector('[data-field="source"]').value,'stationery');e.dom.window.close();
});
test('section selection is separate from collapse and applies transitions to the selected scope',()=>{
 const e=env(5),c=open(e,'y2025q10');click(c,'section','0');assert.ok(c.querySelector('[data-lab-act="page"][data-value="1"]'));change(e,c,'tab','transition');change(e,c,'transition','fade');assert.match(c.querySelector('[data-lab-act="page"][data-value="1"]').textContent,/淡化/);assert.match(c.querySelector('[data-lab-act="page"][data-value="2"]').textContent,/无/);
 click(c,'collapseSection','0');assert.equal(c.querySelector('[data-lab-act="page"][data-value="1"]'),null);click(c,'transitionAll');assert.match(c.querySelector('[data-lab-act="page"][data-value="2"]').textContent,/淡化/);e.dom.window.close();
});
test('animation reorder preserves object durations and mouseover obeys action settings',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry['merged-11'],s=structuredClone(m.initial);s.firstDuration=2;s.secondDuration=1;m.action(s,'animUp');assert.deepEqual(Array.from(s.order),['shape','title']);assert.equal(s.firstDuration,2);
 s.show=true;s.current=1;s.phase='slide';s.phaseStart=e.w.Date.now();s.actionTrigger='hover';s.actionTarget=0;
 m.action(s,'jump');assert.equal(s.current,1);m.action(s,'hoverJump');assert.equal(s.current,0);e.dom.window.close();
});
test('multiple pivot values remain side by side and recompute with a class filter',()=>{
 const e=env(4),c=open(e,'y2024q67');change(e,c,'scenario','grades');for(const field of ['成绩','数学','外语','总分']){click(c,'pick',field);click(c,'place','value');}
 assert.equal(c.querySelectorAll('[data-lab-drop="value"] button').length,4);assert.match(c.querySelector('.lab-pivot-layout').textContent,/337/);click(c,'pick','班级');click(c,'place','filter');change(e,c,'filter','一班');assert.match(c.querySelector('.lab-pivot-layout').textContent,/261/);change(e,c,'filterLabel','班级选择');assert.match(c.querySelector('[data-field="filter"]').closest('label').textContent,/班级选择/);e.dom.window.close();
});
test('salary pie excludes detail rows and detects an included grand total',()=>{
 const e=env(4),c=open(e,'y2020q58');change(e,c,'scenario','wages');click(c,'wageSort');click(c,'wageOpen');click(c,'wageApply');click(c,'wageLevel','2');click(c,'wageSelect','summary');click(c,'wageChart');assert.match(c.querySelector('figcaption').textContent,/6,000/);assert.doesNotMatch(c.querySelector('figcaption').textContent,/总计/);
 click(c,'wageSelect','whole');click(c,'wageChart');assert.match(c.querySelector('figcaption').textContent,/总计/);assert.match(c.querySelector('.lab-output').textContent,/不符合/);e.dom.window.close();
});
test('Boolean parentheses and ordered proximity change the retrieved records',()=>{
 const e=env(6),c=open(e,'y2026q28');change(e,c,'mode','boolean');assert.equal(c.querySelectorAll('[data-lab] tbody tr')[0].lastElementChild.textContent,'✓ 检出');change(e,c,'expression','parentheses');assert.equal(c.querySelectorAll('[data-lab] tbody tr')[0].lastElementChild.textContent,'未检出');change(e,c,'mode','near');assert.equal(c.querySelectorAll('[data-lab] tbody tr')[1].lastElementChild.textContent,'✓ 匹配');change(e,c,'ordered','true');assert.equal(c.querySelectorAll('[data-lab] tbody tr')[1].lastElementChild.textContent,'不匹配');e.dom.window.close();
});

test('collapsing a drag preview restores committed column width on reopening',()=>{
 const e=env(4),c=open(e,'y2020q7'),handle=c.querySelector('[data-lab-drag="column"]');
 pointer(e,handle,'pointerdown',{x:100,y:100});pointer(e,handle,'pointermove',{x:220,y:100});
 c.querySelector('.simulation-toggle').click();c.querySelector('.simulation-toggle').click();
 assert.equal(c.querySelector('[data-width-readout]').textContent,'130 px');e.dom.window.close();
});

test('editing a horizontally scrolled table keeps its position and focused input',()=>{
 const e=env(4),c=open(e,'y2020q57');change(e,c,'task','discount');const scroller=c.querySelector('.lab-table-scroll');scroller.scrollLeft=115;
 const input=c.querySelector('[data-field="quantity0"]');input.focus();change(e,c,'quantity0',20);
 assert.equal(c.querySelector('.lab-table-scroll').scrollLeft,115);assert.equal(e.d.activeElement.dataset.field,'quantity0');assert.equal(e.d.activeElement.value,'20');e.dom.window.close();
});
test('a transfer completed during a plain button press paints after an outside release or cancel',async()=>{
 for(const type of ['pointerup','pointercancel']){
  const e=env(6),timers=[];let now=10000;e.w.Date.now=()=>now;e.w.setInterval=fn=>{timers.push(fn);return 1;};e.w.clearInterval=()=>{};
  const c=open(e,'y2020q26');click(c,'start');now+=500;timers.forEach(fn=>fn());const before=c.querySelector('.lab-output').textContent;
  pointer(e,c.querySelector('[data-lab-act="reset"]'),'pointerdown',{id:37});now+=5000;timers.forEach(fn=>fn());assert.equal(c.querySelector('.lab-output').textContent,before,'no redraw removes the pressed button');
  pointer(e,e.d.body,type,{id:37});await new Promise(r=>setTimeout(r,10));assert.match(c.querySelector('.lab-output').textContent,/文件已到达/);assert.equal(c.querySelector('[data-lab-act="start"]').disabled,false);e.dom.window.close();
 }
});
test('idle drawing surfaces allow ordinary scrolling; only active tools claim a gesture',()=>{
 const e=env(5),box=open(e,'y2021q10'),ink=open(e,'y2025q10');
 for(const [c,selector] of [[box,'.lab-draw-slide'],[ink,'.lab-ink-slide']]){
  const canvas=c.querySelector(selector);let captured=false;canvas.setPointerCapture=()=>{captured=true;};pointer(e,canvas,'pointerdown');const event=new e.w.MouseEvent('pointermove',{bubbles:true,cancelable:true,clientY:150});Object.defineProperty(event,'pointerId',{value:1});canvas.dispatchEvent(event);pointer(e,canvas,'pointerup');assert.equal(captured,false);assert.equal(event.defaultPrevented,false);
 }
 click(box,'tool');assert.ok(box.querySelector('[data-lab-drag="box"]'));click(box,'tool');assert.equal(box.querySelector('[data-lab-drag="box"]'),null);
 click(ink,'show');assert.equal(ink.querySelector('[data-lab-drag="ink"]'),null);click(ink,'pen');assert.ok(ink.querySelector('[data-lab-drag="ink"]'));click(ink,'black');assert.equal(ink.querySelector('[data-lab-drag="ink"]'),null);e.dom.window.close();
});
test('unique filtering preserves all source records and its copied list survives clearing',()=>{
 const e=env(4),c=open(e,'y2020q49');change(e,c,'scenario','unique');const rows=()=>c.querySelectorAll('table')[0].querySelectorAll('tbody tr').length;
 assert.equal(rows(),5);click(c,'uniqueOpen');click(c,'uniqueApply');assert.equal(rows(),3);click(c,'uniqueClear');assert.equal(rows(),5);
 click(c,'uniqueOpen');change(e,c,'destination','copy');click(c,'uniqueApply');assert.equal(rows(),5);assert.equal(c.querySelectorAll('table')[1].querySelectorAll('tbody tr').length,3);click(c,'uniqueClear');assert.equal(c.querySelectorAll('table').length,2);
 change(e,c,'scenario','delete');click(c,'select');click(c,'open');click(c,'apply');assert.equal(rows(),2);click(c,'undo');assert.equal(rows(),3);e.dom.window.close();
});
test('scholarship eligibility intersects the copied top-quarter set with all five thresholds',()=>{
 const e=env(4),c=open(e,'y2020q9');change(e,c,'scenario','scholarship');const tables=()=>[...c.querySelectorAll('[data-lab] table')].map(t=>[...t.querySelectorAll('tbody tr')].map(r=>r.textContent));
 assert.equal(tables()[0].length,8);click(c,'rankOpen');click(c,'rankCancel');assert.equal(tables()[0].length,8);click(c,'rankOpen');click(c,'rankApply');assert.equal(tables()[0].length,2);
 click(c,'rankCopy');click(c,'subjectsOpen');click(c,'subjectsApply');assert.equal(tables()[1].length,1);assert.match(tables()[1][0],/王宁/);assert.doesNotMatch(tables()[1][0],/李明|赵敏/);
 click(c,'rankClear');assert.equal(tables()[0].length,8);assert.equal(tables()[1].length,1);click(c,'subjectsClear');assert.equal(tables()[1].length,2);e.dom.window.close();
});
test('class-text subtotals count records rather than distinct class names',()=>{
 const e=env(4),c=open(e,'y2020q58');click(c,'sort');click(c,'open');change(e,c,'aggregate','count');change(e,c,'class',true);for(const key of ['math','english','computer'])change(e,c,key,false);click(c,'apply');click(c,'level','2');
 const text=c.querySelector('table').textContent;assert.match(text,/一班 小计 · 班级计数 2/);assert.match(text,/二班 小计 · 班级计数 2/);assert.match(text,/总计 · 班级计数 4/);e.dom.window.close();
});
test('chart title, axis titles and legend position are separate visible elements',()=>{
 const e=env(4),c=open(e,'y2026q52');click(c,'ab');change(e,c,'ctrl',true);click(c,'d');click(c,'insert');click(c,'elements');change(e,c,'title','航天发射统计');change(e,c,'axes',true);change(e,c,'legend','right');
 assert.equal(c.querySelector('[data-chart-title]').textContent,'航天发射统计');assert.equal(c.querySelector('[data-axis-title="horizontal"]').textContent,'年份');assert.equal(c.querySelector('[data-axis-title="vertical"]').textContent,'发射次数');assert.ok(c.querySelector('[data-chart-legend="right"] .study-chart-legend'));
 change(e,c,'showTitle',false);assert.equal(c.querySelector('[data-chart-title]'),null);assert.equal(c.querySelectorAll('[data-axis-title]').length,2);e.dom.window.close();
});
test('text autofit menu keeps shape growth in the shape-format entry',()=>{
 const e=env(5),c=open(e,'y2026q54');click(c,'menu');assert.equal(c.querySelector('[aria-label="占位符自动调整选项"] [data-lab-act="shape"]'),null);click(c,'shrink');assert.equal(c.querySelector('.lab-placeholder p').style.fontSize,'16px');assert.equal(c.querySelector('.lab-placeholder.grow'),null);
 click(c,'format');click(c,'shape');assert.equal(c.querySelector('.lab-placeholder p').style.fontSize,'24px');assert.ok(c.querySelector('.lab-placeholder.grow'));e.dom.window.close();
});
test('draft hides document images; Web layout restores them and remains editable',()=>{
 const e=env(3),c=open(e,'merged-5');assert.equal(c.querySelectorAll('[data-document-image]').length,2);click(c,'view','draft');assert.equal(c.querySelectorAll('[data-document-image]').length,0);click(c,'view','web');assert.equal(c.querySelectorAll('[data-document-image]').length,2);change(e,c,'title','网页中编辑');assert.match(c.querySelector('.lab-workspace').textContent,/网页中编辑/);click(c,'view','print');assert.match(c.querySelector('.lab-workspace').textContent,/网页中编辑/);e.dom.window.close();
});
test('colloquial aliases retrieve the intended concept without reading mutable learner input',()=>{
 for(const [chapter,query,id] of [[3,'目录不显示标题','merged-5'],[4,'去重','y2020q49'],[5,'文字放不下','y2026q54']]){
  const e=env(chapter),input=e.d.querySelector('#search-input');input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.equal(e.d.getElementById(id).classList.contains('hidden'),false);e.dom.window.close();
 }
});


test('full-site search normalizes aliases and resolves every note paragraph and related link',()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8')), notes=allNotes(),byId=new Map(notes.map(n=>[n.id,n]));
 assert.equal(index.filter(x=>x.kind==='note').length,notes.length);
 for(let chapter=1;chapter<=11;chapter++){
  const e=env(chapter);
  for(const entry of index.filter(x=>x.chapter===chapter))for(const field of entry.fields)assert.ok(e.d.getElementById(field.anchor),field.anchor);
  for(const n of notes.filter(x=>x.chapter===chapter)){
   const article=e.d.getElementById(n.id);
   assert.equal(article.querySelectorAll('[data-note-point]').length,n.points.length);
   for(const [i,p] of n.points.entries()){
    const expected=e.d.createElement('div');expected.innerHTML=p;
    const anchor=e.d.getElementById(`${n.id}--point-${i}`);assert.equal(anchor.dataset.notePoint,String(i));
    const fragments=[...article.querySelectorAll(`[data-source-field="point-${i}"]`)];
    assert.equal(fragments.map(el=>el.textContent).join(''),expected.textContent,'all original prose survives structure and demo relocation');
    assert.ok(fragments.some(el=>anchor.contains(el)),'historical anchor still contains its original knowledge prose');
   }
   for(const link of article.querySelectorAll('.note-related ul a')){const url=new URL(link.href);assert.ok(byId.has(url.hash.slice(1)));assert.equal(url.pathname,`/chapter${byId.get(url.hash.slice(1)).chapter}.html`);}
  }
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'),'utf8'));assert.equal(Object.keys(e.w.NOTE_LABS.registry).length,manifest.chapters[chapter].models,'no unrelated chapter registrations');
  if(chapter===4){e.w.eval(fs.readFileSync(path.join(root,'notes-search.js'),'utf8'));const find=q=>e.w.NOTE_SEARCH.search(index,q);assert.ok(find('ＶＬＯＯＫＵＰ FALSE').some(r=>r.id==='y2020q57'));assert.ok(find('黑屏').some(r=>r.chapter===5));assert.ok(find('Ctrl Shift').some(r=>r.id==='y2020q24'));assert.equal(find('不存在的组合词 abcxyz').length,0);assert.ok(find('Delete').some(r=>r.kind==='comparison'));}
  e.dom.window.close();
 }
});
test('full prose ignores the removed preference and paragraph jumps preserve the live demonstration',()=>{
 const e=env(2,{oldReadingMode:'quick'}),c=open(e,'y2020q24');click(c,'modifier','ctrl');const lab=c.querySelector('[data-lab]');
 assert.equal(e.d.querySelectorAll('[data-reading-mode],details.note-explanation').length,0);assert.equal(e.w.localStorage.getItem('notes-reading-mode'),null);
 const target=e.d.getElementById('y2020q24--point-1');assert.equal(target.closest('details'),null);
 e.w.location.hash='#'+target.id;e.w.dispatchEvent(new e.w.HashChangeEvent('hashchange'));assert.equal(target.classList.contains('note-search-target'),true);
 assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-lab-act="modifier"][data-value="ctrl"]').getAttribute('aria-pressed'),'true');e.dom.window.close();
});
test('PPT rename fixes its target and leaving slideshow synchronizes page, section and transition',()=>{
 const e=env(5),c=open(e,'y2025q10');click(c,'rename');const name=c.querySelector('[data-field="name"]');name.value='改名后的第一节';name.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 assert.equal(c.querySelector('[data-lab-act="section"][data-value="1"]').disabled,true);assert.equal(c.querySelector('[data-lab-act="new"]').disabled,true);click(c,'section','1');click(c,'apply');assert.match(c.querySelector('[data-lab-act="section"][data-value="0"]').textContent,/改名后的第一节/);assert.match(c.querySelector('[data-lab-act="section"][data-value="1"]').textContent,/第二部分/);
 click(c,'show');click(c,'next');click(c,'next');click(c,'end');click(c,'rename');assert.equal(c.querySelector('[data-field="name"]').value,'第二部分');change(e,c,'name','不应保存');click(c,'cancel');assert.match(c.querySelector('[data-lab-act="section"][data-value="1"]').textContent,/第二部分/);
 const m=e.w.NOTE_LABS.registry.y2025q10,s=structuredClone(m.initial);m.action(s,'rename');m.action(s,'section','1');m.action(s,'new');m.action(s,'show');assert.equal(s.selected,0);assert.equal(s.sections.length,2);assert.equal(s.show,false);m.action(s,'cancel');s.transitions=['none','fade','push'];m.action(s,'show');m.action(s,'next');m.action(s,'next');m.action(s,'end');assert.equal(s.selected,1);assert.equal(s.transition,'push');assert.equal(s.selection,'page');e.dom.window.close();
});
test('advanced-filter copies survive mode switches, clearing, and source filtering',()=>{
 const e=env(4),c=open(e,'y2020q9');click(c,'open');change(e,c,'destination','copy');click(c,'apply');const m=e.w.NOTE_LABS.registry.y2020q9,s=structuredClone(m.initial);s.destination='copy';m.action(s,'apply');const copy=JSON.stringify(s.copy);m.change(s,'mode','auto');m.action(s,'auto');m.action(s,'clear');m.change(s,'mode','advanced');assert.equal(JSON.stringify(s.copy),copy);
 change(e,c,'mode','auto');click(c,'auto');click(c,'clear');change(e,c,'mode','advanced');assert.match(c.querySelector('.lab-output').textContent,/副本/);assert.ok(c.querySelectorAll('table').length>=2);e.dom.window.close();
});
test('timed transfer and presentations patch live regions without replacing stable controls',async()=>{
 for(const [chapter,id,action] of [[6,'y2020q26','start'],[5,'y2023q13','start'],[5,'merged-11','start']]){
  const e=env(chapter),c=open(e,id);let now=1000;e.w.Date.now=()=>now;click(c,action);const lab=c.querySelector('[data-lab]'),control=lab.querySelector(id==='y2020q26'?'[data-lab-act="reset"]':id==='y2023q13'?'[data-lab-act="pause"]':'[data-lab-act="stop"]');const before=lab.textContent;control.focus();now+=300;await new Promise(resolve=>setTimeout(resolve,250));
  assert.equal(lab.contains(control),true,id+' keeps control node');assert.equal(e.d.activeElement,control,id+' keeps focus');assert.notEqual(lab.textContent,before,id+' advances output');
  const m=e.w.NOTE_LABS.registry[id];assert.ok(m.frameKey&&m.patchFrame);e.dom.window.close();
 }
});

function homeEnv(url='https://notes.example/index.html',fetchIndex){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=fetchIndex||(async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'))}));
 for(const match of html.matchAll(/<script src="\.\/([^"?]+)/g))w.eval(fs.readFileSync(path.join(root,match[1]),'utf8'));
 return {dom,w,d:w.document};
}
const typeGlobal=(e,value)=>{const field=e.d.getElementById('global-search');field.value=value;field.dispatchEvent(new e.w.Event('input',{bubbles:true}));};
test('more search results append in place, focus the next item and restore through the URL',async()=>{
 const e=homeEnv();typeGlobal(e,'数据');await new Promise(setImmediate);
 const list=e.d.getElementById('global-results'),first=list.firstElementChild;assert.equal(list.children.length,30);
 e.d.getElementById('search-more').click();assert.equal(list.children.length,60);assert.equal(list.firstElementChild,first);assert.equal(e.d.activeElement,list.children[30].querySelector('a'));
 const url=e.w.location.href;assert.equal(new URL(url).searchParams.get('shown'),'60');
 const next=homeEnv(url);await new Promise(setImmediate);assert.equal(next.d.getElementById('global-results').children.length,60);
 typeGlobal(next,'SUMIF');await new Promise(setImmediate);assert.equal(new URL(next.w.location.href).searchParams.has('shown'),false);
 next.w.history.pushState(null,'',url);next.w.dispatchEvent(new next.w.PopStateEvent('popstate'));await new Promise(setImmediate);assert.equal(next.d.getElementById('global-results').children.length,60);
 e.dom.window.close();next.dom.window.close();
});
test('manually opened comparisons retain their place when following a source and restoring',async()=>{
 const e=homeEnv(),topic=e.d.getElementById('compare-cmp-delete-context');topic.querySelector('summary').click();await new Promise(r=>setTimeout(r,0));assert.equal(e.w.location.hash,'#'+topic.id);
 const source=topic.querySelector('a');source.addEventListener('click',event=>event.preventDefault());source.click();const next=homeEnv(e.w.location.href);assert.equal(next.d.getElementById(topic.id).open,true);
 next.d.getElementById(topic.id).querySelector('summary').click();await new Promise(r=>setTimeout(r,0));assert.equal(next.w.location.hash,'#browse-comparisons');e.dom.window.close();next.dom.window.close();
});
test('chapter queries restore, highlight paragraphs and temporarily open source matches',()=>{
 const e=env(2,{url:'https://notes.example/chapter2.html?q=Ctrl%20Shift'}),input=e.d.getElementById('search-input'),c=open(e,'y2020q24');click(c,'modifier','ctrl');const lab=c.querySelector('[data-lab]');
 assert.equal(input.value,'Ctrl Shift');assert.equal(c.classList.contains('hidden'),false);assert.ok(c.querySelectorAll('.note-search-match').length);
 const search=query=>{input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));};
 search('2020');const source=e.d.querySelector('.note-provenance.note-search-match');assert.equal(source.open,true);search('');assert.equal(source.open,false);
 search('2020');source.querySelector('summary').click();source.querySelector('summary').click();search('');assert.equal(source.open,true,'manual opening survives clearing');
 search('找不到的知识点xyz');e.d.getElementById('open-drawer').click();e.d.querySelector('#drawer a[href="#y2020q24"]').click();assert.equal(input.value,'');assert.equal(new URL(e.w.location.href).searchParams.has('q'),false);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-value="ctrl"]').getAttribute('aria-pressed'),'true');
 e.dom.window.close();
});
test('Chinese composition waits for the committed query on both search pages',async()=>{
 const e=env(2),input=e.d.getElementById('search-input');input.value='未提交拼音xyz';input.dispatchEvent(new e.w.InputEvent('input',{bubbles:true,isComposing:true}));assert.equal(e.d.querySelectorAll('.note-item.hidden').length,0);
 input.value='Ctrl';input.dispatchEvent(new e.w.CompositionEvent('compositionend',{bubbles:true}));assert.equal(new URL(e.w.location.href).searchParams.get('q'),'Ctrl');assert.ok(e.d.querySelectorAll('.note-item.hidden').length);
 const h=homeEnv(),global=h.d.getElementById('global-search');global.dispatchEvent(new h.w.CompositionEvent('compositionstart',{bubbles:true}));global.value='未提交拼音xyz';global.dispatchEvent(new h.w.InputEvent('input',{bubbles:true,isComposing:true}));assert.equal(h.d.getElementById('global-search-results').hidden,true);
 global.value='数据';global.dispatchEvent(new h.w.CompositionEvent('compositionend',{bubbles:true}));await new Promise(setImmediate);assert.equal(h.d.getElementById('global-results').children.length,30);e.dom.window.close();h.dom.window.close();
});
test('Word titles remain literal in navigation, status and updated tables of contents',()=>{
 const e=env(3),c=open(e,'merged-5'),value='标题<i data-v46-probe>原文</i>&lt;';change(e,c,'title',value);change(e,c,'tab','home');click(c,'style');click(c,'select','0');
 assert.ok(c.querySelector('.lab-output').textContent.includes(value));assert.equal(c.querySelector('[data-v46-probe]'),null);
 change(e,c,'tab','references');click(c,'tocInsert');assert.ok(c.querySelector('.lab-auto-toc').textContent.includes(value));change(e,c,'title',value+'新');click(c,'tocOpen');click(c,'tocApply');assert.ok(c.querySelector('.lab-auto-toc').textContent.includes(value+'新'));assert.equal(c.querySelector('[data-v46-probe]'),null);e.dom.window.close();
});
test('restarting an active text import cannot replace the cancellation snapshot',()=>{
 const e=env(4),c=open(e,'y2021q47');for(const action of ['start','next','next','finish'])click(c,action);
 const original=c.querySelector('table').textContent;click(c,'start');assert.equal(c.querySelector('[data-lab-act="start"]').disabled,true);click(c,'start');click(c,'cancel');assert.equal(c.querySelector('table').textContent,original);assert.match(c.querySelector('.lab-output').textContent,/原表数据保留/);
 const m=e.w.NOTE_LABS.registry.y2021q47,s=structuredClone(m.initial);for(const action of ['start','next','next','finish','start','start','cancel'])m.action(s,action);assert.equal(s.imported,true);assert.equal(s.step,0);m.action(s,'cancel');assert.equal(s.imported,true);
 m.action(s,'start');m.action(s,'finish');assert.equal(s.step,1,'finish requires the last wizard page');m.action(s,'cancel');assert.equal(s.imported,true);e.dom.window.close();
});
test('search begun from a comparison survives refresh and shared URL restoration',async()=>{
 const e=homeEnv('https://notes.example/index.html#compare-cmp-delete-context');assert.equal(e.d.querySelector('.comparison-topic[open]').id,'compare-cmp-delete-context');typeGlobal(e,'Delete');await new Promise(setImmediate);
 const url=e.w.location.href;assert.equal(new URL(url).hash,'');assert.equal(new URL(url).searchParams.get('q'),'Delete');assert.ok(e.d.querySelectorAll('#global-results li').length);
 const next=homeEnv(url);await new Promise(setImmediate);assert.equal(next.d.getElementById('global-search').value,'Delete');assert.equal(next.d.getElementById('global-search-results').hidden,false);assert.ok(next.d.querySelectorAll('#global-results li').length);e.dom.window.close();next.dom.window.close();
});
test('deferred search respects the newest query, clearing and retry after a failed index',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 const e=homeEnv(undefined,()=>pending);typeGlobal(e,'Delete');typeGlobal(e,'SUMIF');resolve({ok:true,json:async()=>index});await new Promise(setImmediate);assert.match(e.d.getElementById('global-results').textContent,/SUMIF/);assert.equal(e.d.getElementById('global-search').value,'SUMIF');e.dom.window.close();
 let finish;const unfinished=new Promise(r=>finish=r),f=homeEnv(undefined,()=>unfinished);typeGlobal(f,'Delete');f.d.getElementById('global-clear').click();finish({ok:true,json:async()=>index});await new Promise(setImmediate);assert.equal(f.d.getElementById('global-search-results').hidden,true);assert.equal(f.d.getElementById('browse-notes').hidden,false);f.dom.window.close();
 let calls=0;const g=homeEnv(undefined,async()=>{if(++calls===1)throw Error('offline');return {ok:true,json:async()=>index};});typeGlobal(g,'Delete');await new Promise(setImmediate);assert.equal(g.d.getElementById('search-retry').hidden,false);g.d.getElementById('search-retry').click();await new Promise(setImmediate);assert.ok(g.d.querySelectorAll('#global-results li').length);typeGlobal(g,'<img src=x onerror=alert(1)>');await new Promise(setImmediate);assert.equal(g.d.querySelector('#global-results img'),null);g.dom.window.close();
});

test('v47 disk cleanup confirms the selected categories once and cancellation frees no space',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2024q5,s=structuredClone(m.initial);m.change(s,'downloads',true);m.action(s,'review');assert.equal(s.pending.size,6380);m.action(s,'cancel');assert.equal(s.used,184000);m.action(s,'review');m.action(s,'confirm');assert.equal(s.used,177620);assert.equal(s.remaining.downloads,0);assert.equal(s.remaining.recycle,420);m.action(s,'confirm');assert.equal(s.used,177620);e.dom.window.close();
});
test('v47 workbook preserves new sheets and protects the final visible sheet',()=>{
 const e=env(4),m=e.w.NOTE_LABS.registry.y2020q8,s=structuredClone(m.initial);m.action(s,'new');m.action(s,'new');assert.equal(s.sheets.length,4);m.action(s,'hide');m.action(s,'delete');m.action(s,'cancel');assert.equal(s.sheets.length,4);m.action(s,'delete');m.action(s,'confirm');m.action(s,'hide');assert.equal(s.sheets.filter(x=>x.visible).length,1);m.action(s,'delete');assert.equal(s.pending,null);assert.match(s.message,/最后一张/);e.dom.window.close();
});
test('v47 formula parser respects precedence, decimals, long integers and errors',()=>{
 const e=env(4),parse=e.w.NOTE_LABS.registry.y2024q11.parseInput;
 for(const [input,result] of [['=(2+3)*4','20'],['=0.1+0.2','0.3'],['=1000000000000+1','1000000000001'],['2*3','2*3'],['=2×3','#NAME?'],['=4/0','#DIV/0!']])assert.equal(parse(input).value,result,input);e.dom.window.close();
});
test('v47 binary borrowing crosses consecutive zeroes without changing the arithmetic result',()=>{
 const e=env(1),m=e.w.NOTE_LABS.registry.y2020q31,s=structuredClone(m.initial);m.change(s,'a','10000');m.change(s,'b','00001');m.action(s,'load');for(let i=0;i<5;i++)m.action(s,'step');assert.match(m.render(s),/15/);assert.match(m.render(s),/01111/);e.dom.window.close();
});
test('v47 UPDATE invalidates a stale preview and escapes displayed SQL string literals',()=>{
 const e=env(10),c=open(e,'y2023q15');click(c,'preview');change(e,c,'score','65');assert.equal(c.querySelector('[data-lab-act="run"]').disabled,true);click(c,'preview');click(c,'run');assert.match(c.querySelector('.note-lab table').textContent,/李明65/);change(e,c,'id',"02'");assert.match(c.querySelector('.lab-code').textContent,/id = '02''';/);click(c,'preview');assert.match(c.querySelector('output').textContent,/命中0行/);change(e,c,'where','false');click(c,'preview');click(c,'run');assert.equal([...c.querySelectorAll('.note-lab tbody tr')].filter(r=>r.textContent.endsWith('65')).length,3);e.dom.window.close();
});
test('v47 shared printing follows submission order and rejects new jobs after sharing closes',()=>{
 const e=env(6),m=e.w.NOTE_LABS.registry.y2026q13,s=structuredClone(m.initial);m.action(s,'submit','B');m.action(s,'submit','A');assert.deepEqual(Array.from(s.jobs,j=>j.owner),['B','A']);m.change(s,'shared',false);m.action(s,'submit','A');assert.equal(s.jobs.length,2);m.action(s,'print');assert.equal(s.jobs[0].owner,'A');m.action(s,'cancel',String(s.jobs[0].id));assert.equal(s.jobs.length,0);e.dom.window.close();
});
test('v47 disabled devices retain missing-driver state until a driver is installed',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2026q8,s=structuredClone(m.initial);m.action(s,'enable');m.action(s,'enable');assert.equal(s.mode,'driver');m.action(s,'update');assert.equal(s.mode,'normal');m.change(s,'mode','absent');m.action(s,'scan');assert.equal(s.mode,'absent');assert.doesNotMatch(m.render(s),/未知设备/);e.dom.window.close();
});
test('v47 restore quotas, desktop drafts and quick-access shortcuts keep independent state',()=>{
 const e=env(2),r=e.w.NOTE_LABS.registry;let m=r.y2026q33,s=structuredClone(m.initial);m.action(s,'toggle');m.action(s,'confirm');m.change(s,'quota',10);m.action(s,'delete');assert.equal(s.points.length,0);assert.equal(s.enabled,false);assert.match(m.render(s),/没有可用还原点/);
 m=r.y2026q25;s=structuredClone(m.initial);m.action(s,'open');m.change(s,'draftComputer',true);m.change(s,'draftRecycle',false);m.action(s,'apply');m.change(s,'draftRecycle',true);m.action(s,'cancel');assert.equal(s.computer,true);assert.equal(s.recycle,false);
 m=r.y2026q35;s=structuredClone(m.initial);m.action(s,'unpin');assert.equal(s.exists,true);m.action(s,'pin');m.action(s,'delete');m.action(s,'pin');assert.equal(s.pinned,false);assert.equal(s.exists,false);e.dom.window.close();
});
test('v47 default presentation view is committed explicitly and applied on reopening',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2024q46,s=structuredClone(m.initial);for(const a of ['file','options','advanced'])m.action(s,a);m.change(s,'draft','sorter');m.action(s,'cancel');m.action(s,'reopen');assert.equal(s.view,'normal');for(const a of ['file','options','advanced'])m.action(s,a);m.change(s,'draft','notes');m.action(s,'save');assert.equal(s.view,'normal');m.action(s,'reopen');assert.equal(s.view,'notes');e.dom.window.close();
});
test('v47 slide duplicate preserves content and repeated insertion increases the deck',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2024q12,s=structuredClone(m.initial);m.action(s,'duplicate');assert.equal(s.docs[0].slides[1].title,'牡丹');assert.equal(s.docs[0].slides[1].body,s.docs[0].slides[0].body);m.action(s,'new');m.action(s,'new');assert.equal(s.docs[0].slides.length,5);assert.equal(s.docs[0].slides[3].body,'');m.action(s,'document');assert.equal(s.docs.length,2);assert.equal(s.docs[0].slides.length,5);e.dom.window.close();
});
test('v47 picture replacement preserves identity but reinsertion creates a new object',()=>{
 const e=env(5),m=e.w.NOTE_LABS.registry.y2026q53,s=structuredClone(m.initial);m.change(s,'crop',20);m.action(s,'replace');assert.equal(s.source,'B');assert.equal(s.crop,20);assert.equal(s.animation,true);m.action(s,'reinsert');m.action(s,'inspect');assert.equal(s.object,2);assert.equal(s.source,'B');assert.equal(s.animation,false);assert.equal(s.crop,0);e.dom.window.close();
});
test('v47 ordinary textboxes have no placeholder menu and mixed fonts scale proportionally',()=>{
 const e=env(5),c=open(e,'y2026q54');click(c,'menu');click(c,'shrink');assert.deepEqual([...c.querySelectorAll('.lab-placeholder p')].map(p=>p.style.fontSize),['16px','12px','12px']);change(e,c,'object','textbox');assert.equal(c.querySelector('.lab-autofit'),null);click(c,'format');click(c,'shrink');assert.equal(c.querySelector('.lab-placeholder p').style.fontSize,'16px');e.dom.window.close();
});
test('v47 frame playback pauses after programmatic slider updates without changing total duration',async()=>{
 const e=env(7);try{const c=open(e,'y2020q38');click(c,'play');await new Promise(r=>setTimeout(r,90));const slider=c.querySelector('[data-field="time"]');assert.ok(Number(slider.value)>0);assert.equal(slider.value,slider.defaultValue);click(c,'play');const time=c.querySelector('[data-field="time"]').value;await new Promise(r=>setTimeout(r,60));assert.equal(c.querySelector('[data-field="time"]').value,time);change(e,c,'fps','60');assert.match(c.querySelector('.note-lab table').textContent,/60 fps \/ 120 帧/);}finally{e.dom.window.close();}
});
test('v47 seeking past downloaded media produces zero buffer and waits for data',()=>{
 const e=env(7),m=e.w.NOTE_LABS.registry.y2023q18,s=structuredClone(m.initial);m.change(s,'position',20);m.action(s,'play');m.change(s,'rate',0);m.action(s,'tick');assert.equal(s.position,20);assert.equal(s.downloaded,12);assert.match(m.render(s),/等待下载/);m.change(s,'rate',2);for(let i=0;i<5;i++)m.action(s,'tick');assert.equal(s.downloaded,22);assert.equal(s.position,21);e.dom.window.close();
});
test('v47 block tampering remains visible when changing admission mode or recomputing one block',()=>{
 const e=env(9),m=e.w.NOTE_LABS.registry['merged-17'],s=structuredClone(m.initial);m.change(s,'block0','甲向乙转账100');m.action(s,'verify');assert.match(s.message,/1/);m.change(s,'mode','permissioned');assert.match(m.render(s),/发现被改动/);m.action(s,'rehash');m.action(s,'verify');assert.match(s.message,/2/);e.dom.window.close();
});
test('v47 conceptual readouts and hyperlink source agree with their selected condition',()=>{
 let e=env(8),c=open(e,'y2026q16');c.querySelector('[data-sim-choice="0"]').click();assert.match(c.querySelector('[data-service-screen]').textContent,/不可用/);assert.equal(c.querySelector('[data-cia-a]').textContent,'受损');e.dom.window.close();
 e=env(6);c=open(e,'y2020q36');const hash=e.w.location.hash;c.querySelector('[data-preview-link]').click();assert.equal(e.w.location.hash,hash);c.querySelector('[data-sim-choice="3"]').click();assert.equal(c.querySelector('[data-preview-link]').hasAttribute('href'),false);assert.equal(c.querySelector('[data-anchor-attribute]').hidden,true);e.dom.window.close();
});
test('v47 expanded operation surface preserves live nodes and focus when returning',()=>{
 const e=env(4);e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};
 const c=open(e,'y2024q11'),lab=c.querySelector('[data-lab]');change(e,c,'raw','=8*7');click(c,'apply');const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);assert.equal(c.querySelector('[data-lab]'),lab);assert.match(c.querySelector('.note-lab table').textContent,/56/);c.querySelector('[data-demo-close]').click();assert.equal(c.querySelector('dialog'),null);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(e.d.activeElement,opener);e.dom.window.close();
});
test('v47 Office ribbon buttons switch the displayed commands and retain button focus',()=>{
 const e=env(3),c=open(e,'merged-5');const target=c.querySelector('[data-lab-tab="tab"][data-value="home"]');assert.ok(target);target.focus();target.click();assert.ok(c.querySelector('[data-lab-act="style"]'));assert.equal(e.d.activeElement.dataset.labTab,'tab');assert.equal(e.d.activeElement.dataset.value,'home');assert.equal(c.querySelectorAll('.lab-office nav button[aria-pressed="true"]').length,1);e.dom.window.close();
});
test('v47 text fields can be counted in a PivotTable value area',()=>{
 const e=env(4),c=open(e,'y2024q67');click(c,'pick','产品');click(c,'place','value');assert.equal(c.querySelector('[data-field="aggregate"]').value,'count');assert.match(c.querySelector('.lab-pivot-layout').textContent,/总计6/);e.dom.window.close();
});
test('v47 syllabus models recalculate trends, protection, print sheets and input tables',()=>{
 let e=env(4),c=open(e,'syllabus-sparkline');change(e,c,'raw','4,-8,5,10');change(e,c,'type','win');assert.match(c.querySelector('svg').getAttribute('aria-label'),/4、-8、5、10/);change(e,c,'raw','4,坏值,5,10');assert.equal(c.querySelector('svg'),null);
 c=open(e,'syllabus-worksheet-protection');click(c,'protect');assert.equal(c.querySelector('[data-field="a"]').disabled,true);assert.equal(c.querySelector('[data-field="b"]').disabled,false);click(c,'protect');assert.equal(c.querySelector('[data-field="a"]').disabled,false);
 c=open(e,'syllabus-excel-whatif-table');assert.match(c.querySelector('.note-lab tbody').textContent,/80400010050001206000/);change(e,c,'price',60);assert.match(c.querySelector('.note-lab tbody').textContent,/80480010060001207200/);e.dom.window.close();
 e=env(3);c=open(e,'syllabus-word-print-controls');change(e,c,'range','2-4');change(e,c,'duplex','true');click(c,'preview');assert.match(c.querySelector('.lab-workspace').textContent,/需要4张纸/);change(e,c,'range','9');click(c,'preview');assert.equal(c.querySelector('.lab-mini-deck'),null);e.dom.window.close();
});
test('v47 multikey sort honors secondary ties and both score directions',()=>{
 const e=env(4),m=e.w.NOTE_LABS.registry['syllabus-excel-multikey-sort'],s=structuredClone(m.initial);m.action(s,'sort');assert.deepEqual(Array.from(s.rows,x=>x.id),['01','02','04','03']);m.change(s,'first','score');m.change(s,'descending','false');m.action(s,'sort');assert.deepEqual(Array.from(s.rows,x=>x.id),['04','03','01','02']);e.dom.window.close();
});
test('file selection supports real Ctrl/Shift ranges and rejects duplicate or invalid names',()=>{
 const e=env(2),c=open(e,'syllabus-windows-selection');
 const select=(id,keys={})=>c.querySelector(`[data-lab-act="choose"][data-value="${id}"]`).dispatchEvent(new e.w.MouseEvent('click',{bubbles:true,...keys}));
 const selected=()=>[...c.querySelectorAll('[data-lab-act="choose"][aria-pressed="true"]')].map(b=>Number(b.dataset.value));
 select(2);select(4,{shiftKey:true});assert.deepEqual(selected(),[2,3,4]);select(3,{ctrlKey:true});assert.deepEqual(selected(),[2,4]);
 select(5,{ctrlKey:true,shiftKey:true});assert.deepEqual(selected(),[2,3,4,5]);
 click(c,'clear');click(c,'modifier','ctrl');select(1);select(5);assert.deepEqual(selected(),[1,5]);click(c,'modifier','ctrl');
 select(1);change(e,c,'name','02 练习.txt');click(c,'rename');assert.match(c.querySelector('.lab-output').textContent,/已有同名/);assert.match(c.querySelector('[data-value="1"]').textContent,/01 笔记.txt/);
 change(e,c,'name','NUL.txt');click(c,'rename');assert.match(c.querySelector('.lab-output').textContent,/名称无效/);
 change(e,c,'name','<img>.txt');click(c,'new');assert.equal(c.querySelector('img'),null);assert.equal(c.querySelectorAll('[data-lab-act="choose"]').length,5);
 change(e,c,'name','新目录');click(c,'new');assert.equal(c.querySelectorAll('[data-lab-act="choose"]').length,6);assert.match(c.querySelector('.lab-output').textContent,/未创建文档/);
 c.querySelector('[data-lab-act="choose"][data-value="6"]').focus();e.d.activeElement.dispatchEvent(new e.w.KeyboardEvent('keydown',{bubbles:true,key:'F2'}));assert.equal(e.d.activeElement.dataset.field,'name');
 e.dom.window.close();
});
test('path navigation distinguishes parent from history; filename matches respect scope',()=>{
 const e=env(2),c=open(e,'syllabus-windows-paths');click(c,'go','C:\\课程');click(c,'up');assert.equal(c.querySelector('[data-current-path]').textContent,'C:\\');
 click(c,'back');assert.equal(c.querySelector('[data-current-path]').textContent,'C:\\课程');click(c,'back');assert.equal(c.querySelector('[data-current-path]').textContent,'D:\\资料');
 change(e,c,'address','Z:\\缺失');click(c,'address');assert.equal(c.querySelector('[data-current-path]').textContent,'D:\\资料');
 const search=open(e,'syllabus-windows-search');assert.match(search.querySelector('.lab-output').textContent,/匹配 1 项/);change(e,search,'scope','all');assert.match(search.querySelector('.lab-output').textContent,/匹配 2 项/);
 change(e,search,'pattern','笔记*.txt');assert.match(search.querySelector('.lab-output').textContent,/匹配 4 项/);change(e,search,'pattern','*复习*.txt');change(e,search,'scope','current');assert.match(search.querySelector('.lab-output').textContent,/匹配 0 项/);change(e,search,'scope','tree');assert.match(search.querySelector('.lab-output').textContent,/匹配 1 项/);
 change(e,search,'pattern','[.*');assert.match(search.querySelector('.lab-output').textContent,/匹配 0 项/);e.dom.window.close();
});
test('ZIP sequential actions preserve names, reject conflicts and show independent extraction',()=>{
 const e=env(2),c=open(e,'y2022q75');click(c,'menu');click(c,'rename');click(c,'menu');click(c,'zip');assert.match(c.querySelector('[data-lab-drag="hold"]').textContent,/年度总结.zip/);assert.match(c.querySelector('[data-lab-act="open"]').textContent,/年度总结.zip.zip/);
 click(c,'open');click(c,'extract');assert.match(c.querySelector('[data-extracted]').textContent,/年度总结.zip/);
 c.querySelector('[data-sim-reset]').click();click(c,'menu');click(c,'zip');click(c,'menu');click(c,'rename');assert.match(c.querySelector('.lab-output').textContent,/已有.*不能/);assert.doesNotMatch(c.querySelector('[data-lab-drag="hold"]').textContent,/年度总结.zip/);e.dom.window.close();
});
test('file attributes retain independent display, association and folder permission state',()=>{
 const e=env(2),c=open(e,'merged-4');click(c,'extension');assert.doesNotMatch(c.querySelector('[data-property-file] b').textContent,/docx/);click(c,'extension');assert.equal(c.querySelector('[data-property-file] b').textContent,'report.docx');
 click(c,'readonly');click(c,'save');assert.match(c.querySelector('.lab-output').textContent,/拒绝覆盖/);click(c,'new');assert.match(c.querySelector('.lab-output').textContent,/已在文件夹中新建/);
 click(c,'permission');click(c,'new');assert.match(c.querySelector('.lab-output').textContent,/拒绝访问/);change(e,c,'app','WordPad');assert.match(c.querySelector('[data-property-file]').textContent,/写字板|WordPad/);assert.match(c.querySelector('[data-property-file]').textContent,/只读/);
 click(c,'hidden');assert.match(c.querySelector('[data-property-file]').textContent,/不显示/);click(c,'showHidden');assert.equal(c.querySelector('[data-property-file] b').textContent,'report.docx');assert.match(c.querySelector('[data-property-file]').textContent,/隐藏/);e.dom.window.close();
});
test('long notes expose real search paragraph anchors and clear transient jump links',async()=>{
 const e=env(2),input=e.d.getElementById('search-input');input.value='EFS';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 const c=e.d.getElementById('merged-4'),links=[...c.querySelectorAll('.note-search-jumps a')];assert.ok(links.length>=2);assert.ok(links.some(a=>a.hash==='#merged-4--point-11'));assert.ok(links.every(a=>e.d.querySelector(a.hash)?.classList.contains('note-search-match')));
 links[0].click();await new Promise(resolve=>e.w.setTimeout(resolve,0));assert.equal(e.w.location.hash,links[0].hash);
 e.d.getElementById('clear-search').click();assert.equal(e.d.querySelector('.note-search-jumps'),null);assert.equal(e.d.querySelector('.note-search-match'),null);assert.equal(e.d.querySelectorAll('.note-item:not(.hidden)').length,28);e.dom.window.close();
});

test('Word paragraph spacing applies independent values and cancellation preserves the page',()=>{
 const e=env(3),c=open(e,'syllabus-word-paragraph-spacing');
 const sample=()=>c.querySelector('[data-spacing-line]').style.height;
 const original=sample();click(c,'open');change(e,c,'before','12');change(e,c,'after','24');change(e,c,'kind','double');
 click(c,'cancel');assert.equal(sample(),original);assert.equal(c.querySelector('[data-spacing-before]').style.height,'0pt');
 click(c,'open');change(e,c,'before','12');change(e,c,'after','24');change(e,c,'kind','exact');change(e,c,'amount','10');click(c,'apply');
 assert.equal(c.querySelector('[data-spacing-before]').style.height,'12pt');assert.equal(c.querySelector('[data-spacing-after]').style.height,'24pt');assert.equal(sample(),'10pt');assert.match(c.querySelector('output').textContent,/固定值 10磅.*裁切/);
 click(c,'open');change(e,c,'kind','minimum');change(e,c,'amount','10');click(c,'apply');assert.equal(sample(),'18pt');assert.equal(c.querySelectorAll('[data-spacing-line]').length,3);e.dom.window.close();
});
test('Word Home and Shift+Home use the active line while Ctrl+A selects the actual editable document',()=>{
 const e=env(3),c=open(e,'y2024q7');let editor=c.querySelector('[data-selection-editor]');editor.value='\n第一行\n第二行文字';editor.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 editor=c.querySelector('[data-selection-editor]');editor.setSelectionRange(0,0);editor.dispatchEvent(new e.w.Event('select'));click(c,'key','home');editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionStart,0);
 editor.setSelectionRange(8,8);editor.dispatchEvent(new e.w.Event('select'));editor.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'Home',shiftKey:true,bubbles:true,cancelable:true}));editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionStart,5);assert.equal(editor.selectionEnd,8);assert.equal(editor.selectionDirection,'backward');
 click(c,'key','end');editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionStart,editor.value.length);assert.equal(editor.selectionStart,editor.selectionEnd);click(c,'key','all');editor=c.querySelector('[data-selection-editor]');assert.equal(editor.selectionStart,0);assert.equal(editor.selectionEnd,editor.value.length);e.dom.window.close();
});
test('Word text editing moves the actual selection and keeps clipboard text after paste and undo',()=>{
 const e=env(3),c=open(e,'syllabus-word-text-editing');let editor=c.querySelector('[data-edit-text]');const original=editor.value;
 editor.setSelectionRange(0,2);editor.dispatchEvent(new e.w.Event('select'));editor.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'c',ctrlKey:true,bubbles:true,cancelable:true}));
 editor=c.querySelector('[data-edit-text]');assert.equal(editor.value,original);assert.equal(c.querySelector('[data-edit-clipboard]').textContent,'笔记');
 click(c,'cut');editor=c.querySelector('[data-edit-text]');assert.equal(editor.value,original.slice(2));editor.setSelectionRange(editor.value.length,editor.value.length);editor.dispatchEvent(new e.w.Event('select'));click(c,'paste');editor=c.querySelector('[data-edit-text]');assert.equal(editor.value,original.slice(2)+'笔记');
 click(c,'paste');assert.equal(c.querySelector('[data-edit-text]').value,original.slice(2)+'笔记笔记');click(c,'undo');assert.equal(c.querySelector('[data-edit-text]').value,original.slice(2)+'笔记');assert.equal(c.querySelector('[data-edit-clipboard]').textContent,'笔记');
 click(c,'undo');click(c,'undo');assert.equal(c.querySelector('[data-edit-text]').value,original);e.dom.window.close();
});

// v51 display-only compatibility snapshot: IDs, ordered prose and source identities from v50.
// A future knowledge correction must explicitly review this snapshot and its old semantic anchors.
test('reading metadata preserves v50 historical point semantics and source identities',()=>{
 const digests=[["syllabus-windows-selection", "0bbdba56a5b90f1aca10a007f4018eefe0f3c86f31e6d58d892a39423f59ebcf"], ["syllabus-windows-search", "2a9d22aca37178caeb0adf24cf39832feea8173195d090bd2678e350bbb0aa4f"], ["merged-4", "f19f447594cff3504e291c464bee5a761203c392d046a66651d56dcc51e4c339"], ["y2022q75", "d1dfb7b5825a4c7d1e45636900fd45ef5d858503ddc037794ef75c747e712527"], ["syllabus-word-text-editing", "4acb50661b47845d2652af32a5f838e83ed9e0e3f02ff6e00f1692b8a9a9d47a"], ["y2023q55", "e5d100571cfaca103bb9a896ea2b4fa9d49aa8577a5513100e7cb62054b24274"], ["syllabus-word-paragraph-spacing", "c179f6c288551d883b4d34408d9870ef98b41b46506cd19bc4a309d4aeae5a58"]];
 const notes=allNotes(),hash=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
 for(const [id,expected] of digests){const n=notes.find(note=>note.id===id);assert.equal(hash([n.id,n.points,n.sources]),expected,id);}
 for(const chapter of [2,3]){
  const e=env(chapter);
  for(const n of e.w.NOTES.notes.filter(n=>n.pointPresentation||n.fieldPresentation)){
   e.w.NOTE_PRESENTATION.validate(n);
   for(const field of ['boundary','trigger']){
    const fragments=[...e.d.getElementById(n.id).querySelectorAll(`[data-source-field="${field}"]`)];
    const source=e.d.createElement('div');source.innerHTML=n[field];assert.equal(fragments.map(el=>el.textContent).join(''),source.textContent,n.id+'/'+field);
   }
  }
  e.dom.window.close();
 }
});
test('same-group search hits expose distinct actual excerpts and do not index step list items',()=>{
 const e=env(2),input=e.d.getElementById('search-input');
 for(const query of ['EFS','压缩','隐藏']){
  input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
  const links=[...e.d.querySelectorAll('#merged-4 .note-search-jumps a')];assert.ok(links.length>=2,query);
  assert.equal(new Set(links.map(a=>a.textContent.trim())).size,links.length,query+' has distinct entrances');
  for(const a of links){assert.ok(a.querySelector('strong').textContent);assert.ok(a.querySelector('.note-hit-summary').textContent.includes(query));assert.ok(e.d.querySelector(a.hash).classList.contains('note-search-match'));}
  if(query==='EFS')assert.deepEqual(links.filter(a=>a.hash.includes('--point-')).map(a=>[a.hash,a.querySelector('strong').textContent]),[['#merged-4--point-11','EFS适用版本与压缩互斥'],['#merged-4--point-12','EFS证书、私钥与备份']]);
 }
 input.value='新建';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 for(const a of e.d.querySelectorAll('#syllabus-windows-selection .note-search-jumps a'))assert.ok(e.d.querySelector(a.hash).id,'every hit has an actual stable anchor');
 e.d.getElementById('clear-search').click();assert.equal(e.d.querySelector('.note-search-jumps'),null);e.dom.window.close();
});
test('display names are searchable and relocated demo text links to its visible location',()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 for(const [chapter,query,id,anchor] of [[2,'EFS加密','merged-4','point-11'],[2,'常规属性与权限','merged-4','point-4'],[2,'文件名与类型','merged-4','point-0'],[3,'设置没有生效','syllabus-word-paragraph-spacing','point-5'],[3,'手机网页','syllabus-word-text-editing','demo-limits']]){
  const e=env(chapter),input=e.d.getElementById('search-input');input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
  const links=[...e.d.querySelectorAll(`#${id} .note-search-jumps a`)];assert.ok(links.some(a=>a.hash===`#${id}--${anchor}`),query);
  const global=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(global.matches.some(f=>f.anchor===`${id}--${anchor}`),query+' on home');
  if(query==='手机网页'){assert.ok(links.every(a=>!a.hash.endsWith('--point-4')));assert.ok(global.matches.every(f=>!f.anchor.endsWith('--point-4')));}
  e.dom.window.close();
 }
});
test('subtopic navigation resolves old anchors, preserves demos and keeps essential limits visible',()=>{
 for(const [chapter,id,label,point] of [[2,'merged-4','EFS加密',11],[2,'syllabus-windows-selection','新建文件夹',3],[3,'y2023q55','字数统计',4]]){
  const e=env(chapter),c=open(e,id),lab=c.querySelector('[data-lab]'),target=e.d.getElementById(`${id}--point-${point}`);
  const local=[...c.querySelectorAll('.note-subtopics a')].find(a=>a.textContent===label),directory=e.d.querySelector(`#drawer a[href="${local.hash}"]`);
  assert.equal(local.hash,'#'+target.id);assert.equal(directory.textContent,label);assert.equal(target.closest('details'),null);
  const input=e.d.getElementById('search-input');input.value='no-match-xyz';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
  e.d.getElementById('open-drawer').click();directory.click();assert.equal(e.w.location.hash,local.hash);assert.equal(e.d.activeElement,target);assert.equal(input.value,'');assert.equal(e.d.getElementById('drawer').hidden,true);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('.simulation-toggle').getAttribute('aria-expanded'),'true');
  e.dom.window.close();
 }
 const w=env(2),selection=w.d.getElementById('syllabus-windows-selection');
 assert.equal(selection.querySelector('.boundary'),null);assert.match(selection.querySelector('.note-demo-limits').textContent,/未.*实测|尚未.*实测/);
 assert.equal(selection.querySelector('.note-demo-limits').closest('details'),null);assert.ok(selection.querySelector('[id$="--point-3"] .note-operation-steps'));
 const e=env(3),c=e.d.getElementById('syllabus-word-text-editing');assert.doesNotMatch(c.querySelector('.boundary').textContent,/选区和键盘/);assert.match(c.querySelector('.note-demo-limits').textContent,/选区和键盘/);assert.equal(c.querySelectorAll('[id$="--point-3"] .note-operation-steps').length,2);
 assert.ok(e.d.querySelectorAll('#y2023q55--point-4 .note-prose-block').length>=4);assert.equal(e.d.querySelector('#y2023q55--point-4').closest('details'),null);
 w.dom.window.close();e.dom.window.close();
});

test('v54 protects every v53 Word paragraph and identity while rendering all appended paragraphs',()=>{
 const expected=[["merged-5",8,"e160db01967cd98f71fe397930a3fa2106f672181f1fe91dedd6d03f0bd79fed"],["syllabus-word-text-editing",9,"e35299ac0d1e0ade90c5e5fdacf96642e6b245873f9059ced49ea0d329b204ce"],["y2022q10",6,"d85b5a7e09a75f3e38e5f0b4901cd00f1c5e54a9abb69083611e3a738fb31874"],["y2023q55",5,"f51afdf89f4ed9e75855dbd63f0cb02eff0b549455959249b3859b7be804884a"],["y2024q7",7,"5474a094bbd27acd7d140530c8336fdaa75b58ddaafd8b69a7e53f9b210e7bc6"],["y2025q48",11,"e174fcf4814efc0ff4b1af08961facba48ed5b160bbc3f6ffb321ae4454eac9c"],["merged-8",7,"8f99995555275d3a93fbe3c21848c018982103cad9fceb92146bcea0abd6d368"],["y2020q41",12,"f2413db50871ae9d66b10b1a5c2bfc6e274a45983354a7651c605719598f1a95"],["merged-7",14,"b5e7f35501b0fdc619382dddfce89f859ed273356019592ef408edfba0046536"],["y2020q43",6,"d45e59e6423a0bcda7076c6830586b3f0707de2b171db40973bd9764696a7995"],["y2020q44",8,"0c9a251cbecb279a786a65fb46ac09dd961d4603597efcccd29dbb23a492d3f8"],["y2020q61",12,"0da377a573e39e80935d82b6444598f6c408f20d37d218c066a970ee3c9d1436"],["y2021q56",12,"dc965afa7f1034a5369f7f1a433f2b4f1fd517b9a8fedebeac7e4c2da3271193"],["y2022q24",5,"b1016fbbe07c53b1d9e1e6f24f0127eed404284eef1a1547049d633853e70a49"],["y2022q70",3,"53ee2b80afbe052c4d1ef149c6d6d53a71c7e396bc8df5f90f16cdee9e223b33"],["y2023q52",13,"f826e8285153c23866c8371239305cbddbc067055e3850320e73197e20d9d044"],["y2024q54",5,"ab383495412bc2b7c0fb628fa76652d908bb7441aa3061c607416aa9f90da055"],["syllabus-word-paragraph-spacing",6,"3d7e70b860398af48128086ec66c43089147d93fa26850cfaacb21852119f637"],["y2024q66",3,"96b035a8a8d262ce9782ed67497e8fd447badd9c2fcb5d5f8ad62eabbf101a7e"],["y2026q47",5,"e0fb26ebf2b8d344e4ecf34b0e6ac8ffc9cf8aa052766b2c8b548b60367bccdc"],["y2020q60",4,"656d8ef6bc6efeea0427bf4393d519785f2324b928a4ac17f302ab3c3a3846c7"],["y2020q62",4,"469edc0864cf4d29f362da5deb423ca749936c2d19892476b8e8efe7a233b881"],["y2020q63",4,"4a6deb1c598b75cd009b56dd8bfb1933460160d35ec2334f8cdfad2fcde9cd55"],["y2022q69",4,"9549e34f7da1d6cc1e729b0311f07c01690064cda73e5bd6f6532e700d5ea79f"],["y2024q8",5,"a2cf73c82e1b2f3ab31c2d69d7a4853c451d96295629b2b48ea6d0062529e3ea"],["merged-9",4,"7262ecbb128bf25ed5a3ba28fea77adc6548358e71d46f613f360f7c874a5bb7"],["y2022q54",3,"343a98ff53ed32905d6be20a4856c27384127473198b6dfefafe0c8b2ee0c691"],["y2023q7",4,"938a57b2791e60282f23d58b50d901a133078e8ffbf611c22778c7e2e03a02e8"],["y2025q47",3,"1ef69b07fdc3ab06b84176020e9c8761b528bd902f4a91a15124e049fc3f80ca"],["y2025q56",3,"941b30cca47d80ca20b165d349214ef8205cf5026735da2b57a634f8f0ebe757"],["y2026q36",4,"47509340cdab3f8f2d7f166605a48b5986c4084c73a380ddcb63b2e2695fe648"],["y2022q71",3,"ce9a6092d07cced15675ed941f21199c0c6f986fb1e29af60aee2548ff3fc4dc"],["merged-6",4,"108442d5f7b4bc34b021e2b305e49e62e879a987ff203df2efef8b4b2ce6720e"],["y2022q55",3,"7aeec1c979ba0738ccb4a79ac39b201a15f01148eedd99e209143956d9051493"],["y2023q56",5,"a11619c909c095b7a3716e09c97184c523c4e7037e6b915d6299c1cfc1653a05"],["y2024q55",5,"f08fdf01047e3f2138ae342f9cadb2f0aead79a925a7f96206ef08d9f7d53068"],["y2025q36",5,"0b825f113e25119723e5435833ca0503105cc5e2c55d5d01d2e180739a03fe7b"],["syllabus-document-coauthor",3,"0618998000c0b7ac850c11c5bcd0ff21b23817ac3e0e641789d8cd88f80cbf85"],["syllabus-office-exchange",5,"27080e2aa2e85b327b1cb412e958224bda325ab24c5e15d65ab8b59890a4ff5a"],["syllabus-word-smartart",2,"1e20447e199555ff11b63528352828efd771456bda5a87b2287a99adefbd271a"],["syllabus-word-screen-clipping",2,"05340ed4df6b878691f447e46b31c51040d2dd59902c61ce752b74462101af06"],["syllabus-word-print-controls",3,"1df1e07f4016122844afe9413b2971c72fa102748d18b4dcc7b7ad684b247b23"]];
 const e=env(3);
 for(const [id,count,digest] of expected){const n=e.w.NOTES.notes.find(n=>n.id===id);assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify([n.id,n.points.slice(0,count),n.sources,n.keys])).digest('hex'),digest,id);
  for(let i=count;i<n.points.length;i++){const point=e.d.getElementById(`${id}--point-${i}`);assert.ok(point);assert.equal(point.closest('details'),null);assert.equal([...point.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),n.points[i]);}
 }e.dom.window.close();
});
test('v54 structure creates a real grid and merge split undo preserve literal contents',()=>{
 const e=env(3),c=open(e,'y2024q8');change(e,c,'scenario','structure');click(c,'structureOpen');change(e,c,'structureDraftRows','2');change(e,c,'structureDraftCols','3');click(c,'structureApply');
 const spans=()=>[...c.querySelectorAll('[data-structure-table] tr')].map(r=>[...r.cells].map(x=>x.colSpan));assert.deepEqual(spans(),[[1,1,1],[1,1,1]]);
 change(e,c,'structureText','甲 <标签> & 内容');click(c,'structureSelect','0,1');change(e,c,'structureText','乙');click(c,'structureSelect','0,0');click(c,'structurePair');click(c,'structureMerge');
 assert.deepEqual(spans(),[[2,1],[1,1,1]]);assert.equal(c.querySelector('[data-field="structureText"]').value,'甲 <标签> & 内容\n乙');assert.equal(c.querySelector('标签'),null);assert.ok(c.querySelector('[data-lab-act="structureColAdd"]').disabled);
 click(c,'structureSplit');assert.deepEqual(spans(),[[1,1,1],[1,1,1]]);click(c,'structureSelect','0,1');assert.equal(c.querySelector('[data-field="structureText"]').value,'');click(c,'structureUndo');assert.deepEqual(spans(),[[2,1],[1,1,1]]);click(c,'structureUndo');assert.deepEqual(spans(),[[1,1,1],[1,1,1]]);assert.equal(c.querySelector('[data-field="structureText"]').value,'甲 <标签> & 内容');e.dom.window.close();
});
test('v54 structural dialogs, row column boundaries and cross scenario undo keep committed data',()=>{
 const e=env(3),c=open(e,'y2024q8');change(e,c,'scenario','structure');click(c,'structureOpen');change(e,c,'structureDraftRows','9');click(c,'structureApply');assert.equal(c.querySelector('[data-structure-table]'),null);assert.ok(c.querySelector('.lab-dialog'));change(e,c,'scenario','convert');assert.equal(c.querySelector('[data-field="scenario"]').value,'structure');click(c,'structureCancel');
 click(c,'structureOpen');click(c,'structureApply');change(e,c,'structureText','第一轮');change(e,c,'scenario','convert');change(e,c,'scenario','structure');change(e,c,'structureText','第二轮');click(c,'structureUndo');assert.equal(c.querySelector('[data-field="structureText"]').value,'第一轮');
 for(let i=0;i<6;i++)click(c,'structureColAdd');assert.match(c.querySelector('[data-structure-size]').textContent,/5 个逻辑列/);assert.ok(c.querySelector('[data-lab-act="structureColAdd"]').disabled);
 for(let i=0;i<6;i++)click(c,'structureColDelete');assert.match(c.querySelector('[data-structure-size]').textContent,/1 个逻辑列/);assert.ok(c.querySelector('[data-lab-act="structureColDelete"]').disabled);assert.match(c.querySelector('[data-structure-table]').textContent,/第一轮/);
 for(let i=0;i<6;i++)click(c,'structureRowDelete');assert.match(c.querySelector('[data-structure-size]').textContent,/1 行/);assert.ok(c.querySelector('[data-lab-act="structureRowDelete"]').disabled);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-structure-table]'),null);e.dom.window.close();
});
test('v54 text table roundtrip preserves literal data and cancellation rejects stale input',()=>{
 const e=env(3),c=open(e,'y2024q8'),raw='姓名\t成绩\n王 <宁> &\t80\n李明\t95';change(e,c,'scenario','convert');change(e,c,'raw',raw);click(c,'convertOpen');change(e,c,'raw','不应写入');change(e,c,'scenario','structure');click(c,'convertCancel');assert.equal(c.querySelector('[data-field="raw"]').value,raw);
 click(c,'convertOpen');click(c,'convertApply');assert.equal(c.querySelectorAll('.lab-paper table tr').length,3);assert.match(c.querySelector('table').textContent,/王 <宁> &/);assert.equal(c.querySelector('宁'),null);
 click(c,'toTextOpen');change(e,c,'textSeparator','comma');click(c,'toTextCancel');assert.ok(c.querySelector('table'));click(c,'toTextOpen');click(c,'toTextApply');assert.equal(c.querySelector('[data-field="raw"]').value,raw);
 change(e,c,'raw','姓名\t成绩\n王宁');click(c,'convertOpen');click(c,'convertApply');assert.ok(c.querySelector('.lab-dialog'));assert.equal(c.querySelector('table'),null);click(c,'convertCancel');assert.equal(c.querySelector('[data-field="raw"]').value,'姓名\t成绩\n王宁');e.dom.window.close();
});
test('v54 formula invalid drafts empty operands and aggregate overflow keep cached field results',()=>{
 const e=env(3),c=open(e,'y2024q8');change(e,c,'scenario','formula');click(c,'formulaOpen');click(c,'formulaApply');
 const result=()=>c.querySelector('[data-lab-act="fieldSelect"]').textContent;assert.equal(result(),'175');click(c,'formulaOpen');change(e,c,'draftFormula','=SUM(BELOW)');change(e,c,'score0','0');click(c,'formulaApply');assert.ok(c.querySelector('.lab-dialog'));assert.equal(result(),'175');click(c,'formulaCancel');
 change(e,c,'score0','');click(c,'fieldSelect');click(c,'formulaUpdate');assert.equal(result(),'175');change(e,c,'score0','1e308');change(e,c,'score1','1e308');click(c,'fieldSelect');click(c,'formulaUpdate');assert.equal(result(),'175');assert.match(c.querySelector('output').textContent,/超出/);
 change(e,c,'score0','90');change(e,c,'score1','95');click(c,'fieldSelect');c.querySelector('[data-lab-act="fieldSelect"]').dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'F9',bubbles:true,cancelable:true}));assert.equal(result(),'185');e.dom.window.close();
});
test('v54 inline picture remains individually selectable before floating group selection and movement',()=>{
 const e=env(3),c=open(e,'y2026q36');change(e,c,'assist',true);click(c,'select','photo');assert.equal(c.querySelector('[data-value="photo"]').getAttribute('aria-pressed'),'true');click(c,'select','shape');assert.equal(c.querySelector('[data-value="photo"]').getAttribute('aria-pressed'),'false');assert.ok(c.querySelector('[data-lab-act="group"]').disabled);
 click(c,'select','photo');click(c,'wrap');click(c,'select','shape');click(c,'group');assert.equal(c.querySelectorAll('.lab-object-group .lab-group-item').length,2);assert.equal(c.querySelectorAll('.lab-group-canvas > .lab-group-item').length,1);
 const m=e.w.NOTE_LABS.registry.y2026q36,s=structuredClone(m.initial);s.wrap='square';s.selected=['photo','shape'];m.action(s,'group');const before=structuredClone(s.objects);c.querySelector('.lab-group-canvas').getBoundingClientRect=()=>({width:500,height:330});m.gesture(s,{kind:'object',dx:25,dy:33},c);
 assert.equal(s.objects[0].x-before[0].x,5);assert.equal(s.objects[1].x-before[1].x,5);assert.equal(s.objects[0].y-before[0].y,10);assert.deepEqual(s.objects[2],before[2]);click(c,'ungroup');assert.equal(c.querySelector('.lab-object-group'),null);e.dom.window.close();
});
test('v54 crop window changes visible image region while target dimensions stay fixed',()=>{
 const e=env(3),c=open(e,'merged-9');change(e,c,'mode','crop');change(e,c,'cropTop','130');assert.equal(c.querySelector('svg').getAttribute('viewBox'),'0 130 600 720');assert.equal(c.querySelector('[data-field="width"]').value,'5');assert.equal(c.querySelector('[data-field="height"]').value,'6');change(e,c,'cropTop','0');assert.equal(c.querySelector('svg').getAttribute('viewBox'),'0 0 600 720');assert.equal(c.querySelector('.lab-image-size').style.overflowX,'auto');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('svg').getAttribute('viewBox'),'0 0 600 850');e.dom.window.close();
});
test('v54 related search hits navigate to separate source paragraphs without remounting active table',()=>{
 const e=env(3),c=open(e,'y2024q8'),lab=c.querySelector('[data-lab]'),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 for(const [q,i] of [['合并单元格',12],['拆分单元格',13],['拆分表格',14],['表格转换为文本',16]]){const hash=`#y2024q8--point-${i}`,input=e.d.getElementById('search-input');input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(e.w.NOTE_SEARCH.search(index,q).find(n=>n.id==='y2024q8').matches.some(m=>m.anchor===hash.slice(1)));const link=c.querySelector(`.note-subtopics a[href="${hash}"]`);assert.ok(link);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="${hash}"]`).click();assert.equal(e.w.location.hash,hash);assert.equal(c.querySelector('[data-lab]'),lab);}
 e.dom.window.close();
});
test('v55 restricted editing preserves exceptions, rejects readonly writes and cancels unapplied settings',()=>{
 const e=env(3),c=open(e,'y2022q71');
 click(c,'pane');change(e,c,'exception',true);click(c,'cancelPane');click(c,'pane');assert.equal(c.querySelector('[data-field="exception"]').checked,false);
 change(e,c,'exception',true);click(c,'protect');assert.equal(c.querySelector('[data-field="cell"]').readOnly,true);assert.equal(c.querySelector('[data-field="body"]').readOnly,false);
 change(e,c,'cell','不应改写');assert.equal(c.querySelector('[data-field="cell"]').value,'898');change(e,c,'body','例外正文 <测试>');assert.equal(c.querySelector('[data-field="body"]').value,'例外正文 <测试>');
 change(e,c,'exception',false);assert.equal(c.querySelector('[data-field="exception"]').checked,true);click(c,'protect');change(e,c,'cell','1200');assert.equal(c.querySelector('[data-field="cell"]').value,'1200');
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="cell"]').value,'898');assert.equal(c.querySelector('[data-field="body"]').value,'本年度销售情况如下。');e.dom.window.close();
});
test('v55 open-password failures and cancellation keep document content unavailable until authentication',()=>{
 const e=env(3),c=open(e,'y2022q71');change(e,c,'mode','open');change(e,c,'body','受保护的示例正文');click(c,'configure');assert.equal(c.querySelector('[data-protection-document]'),null);
 click(c,'open');click(c,'verify');assert.equal(c.querySelector('[data-protection-document]'),null);assert.match(c.querySelector('.lab-output').textContent,/口令不正确/);assert.equal(c.querySelector('[data-field="mode"]').disabled,true);
 click(c,'cancelAuth');assert.equal(c.querySelector('[data-protection-document]'),null);click(c,'open');change(e,c,'attempt','1234');click(c,'verify');assert.equal(c.querySelector('[data-field="body"]').value,'受保护的示例正文');assert.equal(c.querySelector('[data-field="body"]').readOnly,false);
 click(c,'close');click(c,'open');assert.equal(c.querySelector('[data-protection-document]'),null);e.dom.window.close();
});
test('v55 modification-password readonly opening permits a draft and independent copy but refuses original overwrite',()=>{
 const e=env(3),c=open(e,'y2022q71');change(e,c,'mode','modify');click(c,'configure');click(c,'open');click(c,'verify');assert.equal(c.querySelector('[data-protection-document]'),null);
 click(c,'readOnly');assert.equal(c.querySelector('[data-field="body"]').readOnly,false);assert.equal(c.querySelector('[data-field="cell"]').readOnly,false);
 change(e,c,'body','只改副本 <草稿>');change(e,c,'cell','1200');click(c,'saveOriginal');assert.match(c.querySelector('.lab-output').textContent,/拒绝保存回原文件/);assert.match(c.querySelector('[data-protection-original]').textContent,/本年度销售情况如下。/);assert.doesNotMatch(c.querySelector('[data-protection-original]').textContent,/1200/);assert.equal(c.querySelector('[data-lab-act="configure"]').disabled,true);
 click(c,'saveCopy');assert.match(c.querySelector('[data-protection-copy]').textContent,/只改副本 <草稿>/);assert.match(c.querySelector('[data-protection-copy]').textContent,/1200/);change(e,c,'cell','1300');assert.doesNotMatch(c.querySelector('[data-protection-copy]').textContent,/1300/);
 click(c,'close');click(c,'open');change(e,c,'attempt','1234');click(c,'verify');assert.equal(c.querySelector('[data-field="cell"]').value,'898');change(e,c,'body','通过验证后的改动');click(c,'saveOriginal');assert.match(c.querySelector('[data-protection-original]').textContent,/通过验证后的改动/);assert.doesNotMatch(c.querySelector('[data-protection-copy]').textContent,/通过验证后的改动/);e.dom.window.close();
});
test('v55 stopping restricted editing with a password keeps restrictions after failure or cancellation',()=>{
 const e=env(3),c=open(e,'y2022q71');click(c,'pane');change(e,c,'exception',true);change(e,c,'stopPassword',true);click(c,'protect');click(c,'protect');click(c,'verify');assert.equal(c.querySelector('[data-field="cell"]').readOnly,true);
 click(c,'cancelAuth');assert.equal(c.querySelector('[data-field="cell"]').readOnly,true);assert.equal(c.querySelector('[data-field="body"]').readOnly,false);click(c,'protect');change(e,c,'attempt','1234');click(c,'verify');assert.equal(c.querySelector('[data-field="cell"]').readOnly,false);change(e,c,'cell','2026');assert.equal(c.querySelector('[data-field="cell"]').value,'2026');e.dom.window.close();
});
test('v55 printing current page and selection target different content and invalidate old previews',()=>{
 const e=env(3),c=open(e,'syllabus-word-print-controls');change(e,c,'scope','current');click(c,'next');click(c,'preview');assert.match(c.querySelector('.lab-mini-deck').textContent,/第5页/);assert.equal(c.querySelectorAll('.lab-mini-deck > div').length,1);
 change(e,c,'scope','selection');click(c,'preview');assert.equal(c.querySelector('.lab-mini-deck'),null);assert.match(c.querySelector('output').textContent,/没有正文选区/);click(c,'selectText');click(c,'preview');assert.match(c.querySelector('.lab-mini-deck').textContent,/第二段项目说明/);assert.doesNotMatch(c.querySelector('.lab-mini-deck').textContent,/第3页/);
 click(c,'selectText');assert.equal(c.querySelector('.lab-mini-deck'),null);change(e,c,'scope','all');click(c,'preview');assert.equal(c.querySelectorAll('.lab-mini-deck > div').length,8);e.dom.window.close();
});
test('v55 printing collates complete copies and keeps duplex arithmetic within stated limits',()=>{
 const e=env(3),c=open(e,'syllabus-word-print-controls');change(e,c,'range','1-3');click(c,'preview');assert.match(c.querySelector('[data-print-order]').textContent,/1 → 2 → 3 → 1 → 2 → 3/);
 change(e,c,'collate','false');assert.equal(c.querySelector('.lab-mini-deck'),null);click(c,'preview');assert.match(c.querySelector('[data-print-order]').textContent,/1 → 1 → 2 → 2 → 3 → 3/);
 change(e,c,'duplex','true');click(c,'preview');assert.equal(c.querySelector('.lab-mini-deck'),null);assert.match(c.querySelector('output').textContent,/未覆盖/);change(e,c,'collate','true');change(e,c,'markup','false');click(c,'preview');assert.match(c.querySelector('.lab-workspace').textContent,/需要4张纸/);assert.equal(c.querySelector('.lab-mini-deck small'),null);e.dom.window.close();
});
test('v55 printing rejects invalid custom ranges and reset removes prepared selection and output',()=>{
 const e=env(3),c=open(e,'syllabus-word-print-controls');for(const raw of ['','4-2','0','8-9','2,x']){change(e,c,'range',raw);click(c,'preview');assert.equal(c.querySelector('.lab-mini-deck'),null);}
 change(e,c,'range','2,5-7');click(c,'preview');assert.deepEqual([...c.querySelectorAll('.lab-mini-deck b')].map(x=>x.textContent),['第2页','第5页','第6页','第7页']);click(c,'selectText');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('mark'),null);assert.equal(c.querySelector('.lab-mini-deck'),null);assert.equal(c.querySelector('[data-field="scope"]').value,'custom');e.dom.window.close();
});
test('v55 mail merge rule drafts cancel cleanly and empty data follows the literal else branch',()=>{
 const e=env(3),c=open(e,'y2025q36');click(c,'connect');click(c,'name');click(c,'rule');change(e,c,'then','应取消');change(e,c,'common','不能混入');click(c,'cancel');click(c,'preview');assert.doesNotMatch(c.querySelector('.lab-paper').textContent,/应取消|不能混入|女士/);
 click(c,'rule');change(e,c,'then','<女士>');click(c,'apply');assert.match(c.querySelector('.lab-paper').textContent,/王宁<女士>/);assert.equal(c.querySelector('女士'),null);change(e,c,'sourceGender','');assert.match(c.querySelector('.lab-paper').textContent,/王宁先生/);assert.equal(c.querySelector('[data-merge-results]'),null);e.dom.window.close();
});
test('v55 mail merge output snapshots preserve source and main document through independent edits',()=>{
 const e=env(3),c=open(e,'y2025q36');click(c,'connect');click(c,'name');click(c,'rule');click(c,'apply');change(e,c,'recipient1',false);click(c,'preview');click(c,'finish');click(c,'finishApply');assert.equal(c.querySelectorAll('[data-merge-results] textarea').length,2);assert.match(c.querySelector('[data-field="result0"]').value,/王宁女士/);assert.match(c.querySelector('[data-field="result1"]').value,/赵敏女士/);
 change(e,c,'sourceName','王 <新>');assert.match(c.querySelector('.lab-paper').textContent,/王 <新>女士/);assert.match(c.querySelector('[data-field="result0"]').value,/王宁女士/);change(e,c,'result0','仅结果 <草稿>');assert.equal(c.querySelector('[data-field="sourceName"]').value,'王 <新>');assert.equal(c.querySelector('[data-field="common"]').value,'诚邀您参加计算机基础教学交流。');
 click(c,'finish');click(c,'cancel');assert.equal(c.querySelector('[data-field="result0"]').value,'仅结果 <草稿>');click(c,'next');click(c,'finish');change(e,c,'finishScope','current');click(c,'finishApply');assert.equal(c.querySelectorAll('[data-merge-results] textarea').length,1);assert.match(c.querySelector('[data-field="result0"]').value,/赵敏女士/);assert.equal(c.querySelector('[data-field="recipient1"]').checked,false);e.dom.window.close();
});
test('v55 mail merge requires a selected record and example name field without deleting source rows',()=>{
 const e=env(3),c=open(e,'y2025q36');click(c,'connect');click(c,'finish');assert.equal(c.querySelector('.lab-dialog'),null);assert.match(c.querySelector('output').textContent,/尚未插入姓名/);click(c,'name');for(let i=0;i<3;i++)change(e,c,'recipient'+i,false);click(c,'finish');assert.equal(c.querySelector('.lab-dialog'),null);assert.match(c.querySelector('output').textContent,/没有已选收件人/);assert.equal(c.querySelectorAll('input[type="checkbox"]').length,3);
 change(e,c,'recipient2',true);click(c,'finish');click(c,'finishApply');assert.match(c.querySelector('[data-field="result0"]').value,/赵敏/);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-merge-results]'),null);assert.equal(c.querySelector('[data-field="sourceName"]'),null);e.dom.window.close();
});
test('v55 revision display never accepts or rejects a pending replacement',()=>{
 const e=env(3),c=open(e,'y2023q56');click(c,'track');change(e,c,'draft','明显改善');change(e,c,'view','none');assert.match(c.querySelector('.lab-paper').textContent,/明显改善/);assert.equal(c.querySelector('del'),null);assert.match(c.querySelector('output').textContent,/仍有1处/);
 change(e,c,'view','original');assert.match(c.querySelector('.lab-paper').textContent,/可能产生改善/);click(c,'track');change(e,c,'view','all');assert.match(c.querySelector('ins').textContent,/明显改善/);click(c,'reject');assert.equal(c.querySelector('ins'),null);assert.match(c.querySelector('.lab-paper').textContent,/可能产生改善/);
 click(c,'track');change(e,c,'draft','最终改善');change(e,c,'view','none');click(c,'accept');change(e,c,'view','original');assert.match(c.querySelector('.lab-paper').textContent,/最终改善/);assert.match(c.querySelector('output').textContent,/没有待处理/);e.dom.window.close();
});
test('v55 protects v54 semantic links and all other Word cards while fully rendering new prose',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/word-v54-protection.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(JSON.stringify(x)).digest('hex'),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter3.json'),'utf8')),e=env(3);
 for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.equal(hash([n.id,n.points.slice(0,row.count),n.sources,n.keys]),row.prefix,row.id);if(row.unchanged){const historical=projectV61(n);if(n.id==='syllabus-office-exchange'){assert.equal(historical.pointGroups[0].title,'文件格式与跨软件交换');historical.pointGroups[0].title='已有知识';}assert.equal(hash(historical),row.unchanged,row.id);}else for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),n.points[i]);}}
 // v62 adds full v61 note hashes below; only explicitly approved display fields are projected.
 for(const [file,digest] of Object.entries(expected.otherChapters))if(!reviewedChapterFile(file))assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),digest,file);e.dom.window.close();
});
test('v55 protection and print search hits reach distinct canonical paragraphs without losing an open model',()=>{
 const e=env(3),c=open(e,'y2022q71'),lab=c.querySelector('[data-lab]'),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 for(const [q,id,i] of [['解除打开密码','y2022q71',4],['修改密码限制保存','y2022q71',5],['全部、当前页与所选内容','syllabus-word-print-controls',4],['份数、逐份','syllabus-word-print-controls',6]]){
  const hash=`#${id}--point-${i}`,input=e.d.getElementById('search-input');input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id)?.matches.some(m=>m.anchor===hash.slice(1)),q);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="${hash}"]`).click();assert.equal(e.w.location.hash,hash);assert.equal(c.querySelector('[data-lab]'),lab);
 }
 e.dom.window.close();
});
test('v55 revision toolbar commits a complete typed phrase before deciding without requiring blur',()=>{
 const e=env(3),c=open(e,'y2023q56');click(c,'track');const input=c.querySelector('[data-field="draft"]');
 for(const v of ['明','明显','明显改善']){input.value=v;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));}
 assert.equal(c.querySelector('[data-lab-act="accept"]').disabled,false);click(c,'accept');assert.match(c.querySelector('.lab-paper').textContent,/明显改善/);assert.match(c.querySelector('output').textContent,/没有待处理/);
 const again=c.querySelector('[data-field="draft"]');again.value='另一处替换';again.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(c,'track');assert.equal(c.querySelector('[data-field="draft"]').readOnly,true);change(e,c,'draft','不应混入');click(c,'reject');assert.match(c.querySelector('.lab-paper').textContent,/明显改善/);assert.doesNotMatch(c.querySelector('.lab-paper').textContent,/不应混入/);e.dom.window.close();
});


test('v56 preserves every v55 chapter1 semantic paragraph and the entire Word body while applying one named display change',()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'tests/chapter1-word-v55-protection.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(JSON.stringify(x)).digest('hex'),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter1.json'),'utf8')),e=env(1);
 assert.deepEqual(notes.map(n=>n.id).sort(),baseline.chapter1.map(n=>n.id).sort());
 for(const row of baseline.chapter1){const n=notes.find(n=>n.id===row.id);assert.equal(hash([n.id,n.points.slice(0,row.count),n.sources,n.keys]),row.prefix,row.id);for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(el=>el.textContent).join(''),n.points[i]);}}
 const word=v61Chapter(JSON.parse(fs.readFileSync(path.join(root,'content/chapter3.json'),'utf8')),3),n=word.find(n=>n.id===baseline.wordDisplayOnlyChange.id);assert.equal(n.pointGroups[0].title,baseline.wordDisplayOnlyChange.after);n.pointGroups[0].title=baseline.wordDisplayOnlyChange.before;assert.equal(hash(word),baseline.word);e.dom.window.close();
});
test('v56 chapter1 search and directory resolve separate canonical explanations without losing the active character model',()=>{
 const e=env(1),c=open(e,'y2025q2'),lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input'),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));
 change(e,c,'char','中');
 for(const [q,id,i] of [['ASCII范围','y2025q2',0],['大小写码值','y2025q2',1],['输入码解决','y2025q2',7],['哪些编码能够','y2025q2',8],['整数除基取余','y2026q41',1],['小数乘基取整','y2026q41',2],['地址宽度与寻址','y2022q4',3]]){
  const anchor=`${id}--point-${i}`;input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));const found=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(found?.matches.some(m=>m.anchor===anchor),q);const card=e.d.getElementById(id);assert.ok([...card.querySelectorAll('.note-search-jumps a')].some(a=>a.hash==='#'+anchor));e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${anchor}"]`).click();assert.equal(e.w.location.hash,'#'+anchor);assert.equal(e.d.activeElement.id,anchor);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-field="char"]').value,'中');
 }
 e.d.getElementById('clear-search').click();assert.equal(e.d.querySelector('.note-search-jumps'),null);assert.match(lab.querySelector('tbody').textContent,/E4 B8 AD/);e.dom.window.close();
});

test('v57 preserves every Excel historical point and all ten other canonical chapters',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/excel-v56-protection.json'),'utf8')),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter4.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
 assert.deepEqual(notes.map(n=>n.id).sort(),expected.notes.map(n=>n.id).sort());
 for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.equal(hash(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys??null])),row.prefix,row.id);}
 for(const [file,digest] of Object.entries(expected.otherChapters))if(!reviewedChapterFile(file))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);
 const e=env();for(const n of notes)for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal(p.closest('details'),null);const decoded=e.d.createElement('textarea');decoded.innerHTML=n.points[i];assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(el=>el.textContent).join(''),decoded.value);}e.dom.window.close();
});
test('v57 input stores values separately from display and cancels pending edits',()=>{
 const e=env(),c=open(e,'y2024q11'),bar=()=>c.querySelector('[data-input-bar]').textContent,display=()=>c.querySelector('[data-input-display]').textContent;
 change(e,c,'raw','12.857');click(c,'apply');change(e,c,'format','fixed2');assert.equal(display(),'12.86');assert.equal(bar(),'12.857');
 change(e,c,'raw','999');click(c,'cancel');assert.equal(display(),'12.86');assert.equal(c.querySelector('[data-field="raw"]').value,'12.857');
 change(e,c,'raw','=2*3');click(c,'apply');assert.equal(display(),'6.00');assert.equal(bar(),'=2*3');
 change(e,c,'raw',"'001");click(c,'apply');assert.equal(display(),'001');assert.match(c.querySelector('.note-lab tbody').textContent,/001/);
 const parser=e.w.NOTE_LABS.registry.y2024q11.inputRecord;assert.equal(parser('25%').value,'0.25');assert.equal(parser('1E3').value,'1000');assert.equal(parser('0 2/3').type,'数值');e.dom.window.close();
});
test('v57 Enter and Tab confirm in different cells and Escape keeps stored input',()=>{
 const e=env(),c=open(e,'y2024q11'),key=k=>c.querySelector('[data-field="raw"]').dispatchEvent(new e.w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
 change(e,c,'raw','11');key('Enter');assert.match(c.querySelector('.lab-office').textContent,/名称框：A2/);change(e,c,'raw','22');key('Tab');assert.match(c.querySelector('.lab-office').textContent,/名称框：B2/);change(e,c,'raw','33');key('Escape');assert.equal(c.querySelector('[data-field="raw"]').value,'');click(c,'cell','0');assert.equal(c.querySelector('[data-input-bar]').textContent,'11');e.dom.window.close();
});
test('v57 fill distinguishes nine input types, two seeds and Ctrl copy versus series',()=>{
 const e=env(),c=open(e,'y2020q48'),value=i=>c.querySelector(`[data-fill-index="${i}"]`).textContent.trim();
 for(const [kind,want] of [['textnumber','002024000003'],['number','2'],['text','计算机'],['suffix','学生3'],['date','2026-09-18'],['time','10:00'],['two','5'],['preset','星期三'],['custom','三班']]){change(e,c,'kind',kind);click(c,'fill');assert.equal(value(2),want,kind);}
 change(e,c,'kind','number');change(e,c,'modifier','ctrl');click(c,'fill');assert.equal(value(3),'5');change(e,c,'modifier','normal');assert.equal(value(3),'5');click(c,'fill');assert.equal(value(3),'2');
 change(e,c,'kind','two');change(e,c,'modifier','ctrl');click(c,'fill');assert.equal(value(2),'1');assert.equal(value(3),'3');
 change(e,c,'kind','date');change(e,c,'source','2026-02-30');click(c,'fill');assert.equal(value(2),'');assert.match(c.querySelector('output').textContent,/不符/);e.dom.window.close();
});
test('v57 actual Ctrl pointer release and pointer cancellation preserve the correct fill endpoint',()=>{
 const e=env(),c=open(e,'y2020q48');change(e,c,'kind','number');
 const drag=(cancel,ctrl)=>{const h=c.querySelector('[data-lab-drag="fill"]');c.querySelectorAll('[data-fill-index]').forEach((el,i)=>el.getBoundingClientRect=()=>({left:100,right:200,top:100+i*40,bottom:140+i*40}));for(const [type,y] of [['pointerdown',130],['pointermove',250],[cancel?'pointercancel':'pointerup',250]])h.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:180,clientY:y,ctrlKey:ctrl}));};
 drag(false,true);assert.equal(c.querySelector('[data-fill-index="3"]').textContent.trim(),'5');assert.equal(c.querySelector('[data-fill-index="4"]').textContent.trim(),'');change(e,c,'source','7');drag(true,false);assert.equal(c.querySelector('[data-fill-index="3"]').textContent.trim(),'');e.dom.window.close();
});
test('v57 paste formulas, values and formats produce distinct data and formatting',()=>{
 const e=env(),c=open(e,'y2021q49');click(c,'formula');click(c,'fill');click(c,'copy');click(c,'paste');change(e,c,'kind','formats');click(c,'cancel');assert.equal(c.querySelector('[data-paste-target]').style.background,'');click(c,'paste');click(c,'apply');assert.equal(c.querySelector('[data-paste-target]').textContent,'13000000001');assert.notEqual(c.querySelector('[data-paste-target]').style.background,'');
 click(c,'paste');change(e,c,'kind','values');click(c,'apply');assert.equal(c.querySelector('[data-paste-target]').textContent,'1300000****');
 c.querySelector('[data-sim-reset]').click();click(c,'formula');click(c,'fill');click(c,'copy');click(c,'paste');change(e,c,'kind','formulas');click(c,'apply');assert.equal(c.querySelector('[data-paste-target]').textContent,'王宁****');assert.match(c.querySelector('table').textContent,/LEFT\(B2/);e.dom.window.close();
});
test('v57 arithmetic paste checks targets, cancellation and noncommutative direction',()=>{
 const e=env(),c=open(e,'y2022q58'),salary=()=>c.querySelector('[data-row="0"]').textContent;
 change(e,c,'multiplier','2');click(c,'copy');click(c,'all');click(c,'paste');change(e,c,'operation','divide');click(c,'cancel');assert.match(salary(),/10,?000/);click(c,'paste');click(c,'apply');assert.match(salary(),/5,?000/);click(c,'paste');change(e,c,'operation','subtract');click(c,'apply');assert.match(salary(),/4,?998/);
 change(e,c,'multiplier','0');click(c,'copy');click(c,'all');click(c,'paste');change(e,c,'operation','divide');click(c,'apply');assert.match(salary(),/4,?998/);assert.ok(c.querySelector('.lab-dialog'));assert.match(c.querySelector('output').textContent,/除以0/);click(c,'cancel');e.dom.window.close();
});
test('v57 Excel navigation and search identify separate fill and input paragraphs without resetting models',()=>{
 const e=env(),c=open(e,'y2020q48'),lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input'),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8'));change(e,c,'kind','date');click(c,'fill');
 for(const [q,id,i] of [['两个起点与等差','y2020q48',5],['预设与自定义序列','y2020q48',8],['确认、取消与活动单元格','y2024q11',10],['转置与跳过空单元格','y2022q58',7]]){const anchor=`${id}--point-${i}`;input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id)?.matches.some(m=>m.anchor===anchor),q);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${anchor}"]`).click();assert.equal(e.d.activeElement.id,anchor);assert.equal(c.querySelector('[data-lab]'),lab);}
 e.d.getElementById('clear-search').click();assert.match(c.querySelector('[data-fill-index="2"]').textContent,/2026-09-18/);e.dom.window.close();
});

test('v58 arithmetic follows Excel unary percent and left associative power, not JS precedence',()=>{
 const e=env(4),parse=e.w.NOTE_LABS.registry.y2024q11.parseInput;
 // Expected values derived independently from the documented operator table.
 for(const [formula,want] of [['=-2^2','4'],['=0-2^2','-4'],['=2^3^2','64'],['=2^(3^2)','512'],['=200*10%','20'],['=2^-2','0.25'],['=8/4*2','4'],['=(-1)^0.5','#NUM!']])assert.equal(parse(formula).value,want,formula);
 for(const formula of ['=SUM(A1:A3)','=B2*$F$1','=1+2&"月"','=2<3']){const result=parse(formula);assert.equal(result.value,'演示未支持');assert.match(result.detail,/不是Excel错误/);}
 assert.equal(parse('=4/0').value,'#DIV/0!');e.dom.window.close();
});
test('v58 whole formula moves each endpoint horizontally vertically and diagonally',()=>{
 const e=env(4),c=open(e,'merged-10');change(e,c,'mode','whole');const result=()=>c.querySelector('[data-shifted-formula]').textContent;
 assert.equal(result(),'=D7*$F$1+SUM(E$2:F6)');
 for(const [to,want] of [['F4','=D4*$F$1+SUM(E$2:F3)'],['D7','=B7*$F$1+SUM(C$2:D6)'],['B1','=\u0023REF!*$F$1+SUM(A$2:#REF!)']]){click(c,'editRef');change(e,c,'draftTo',to);click(c,'applyRef');assert.equal(result(),want);}
 click(c,'editRef');change(e,c,'draftTemplate','matrix');change(e,c,'draftFrom','G3');change(e,c,'draftTo','H4');click(c,'applyRef');assert.equal(result(),'=SUMIFS($C$2:$C$5,$A$2:$A$5,$F4,$B$2:$B$5,H$2)');e.dom.window.close();
});
test('v58 whole formula cancellation invalid address and reset preserve confirmed state',()=>{
 const e=env(4),c=open(e,'merged-10');change(e,c,'mode','whole');const saved=c.querySelector('[data-shifted-formula]').textContent;
 click(c,'editRef');change(e,c,'draftTo','XFE1');click(c,'applyRef');assert.match(c.textContent,/请输入A1至XFD1048576/);assert.equal(c.querySelector('[data-shifted-formula]').textContent,saved);click(c,'cancelRef');
 click(c,'editRef');change(e,c,'draftTo','G8');click(c,'cancelRef');assert.equal(c.querySelector('[data-shifted-formula]').textContent,saved);
 c.querySelector('.simulation-toggle').click();c.querySelector('.simulation-toggle').click();assert.equal(c.querySelector('[data-shifted-formula]').textContent,saved);
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="mode"]').value,'ref');e.dom.window.close();
});
test('v58 range statistics distinguish zero text logical empty string blank and error',()=>{
 const e=env(4),c=open(e,'y2021q51');change(e,c,'statsMode','range');const values=()=>Object.fromEntries([...c.querySelectorAll('[data-stat-result]')].map(el=>[el.dataset.statResult,el.textContent]));
 assert.deepEqual(values(),{SUM:'10',COUNT:'2',COUNTA:'5',AVERAGE:'5',MAX:'10',MIN:'0'});
 change(e,c,'statKind2','number');assert.deepEqual(values(),{SUM:'30',COUNT:'3',COUNTA:'5',AVERAGE:'10',MAX:'20',MIN:'0'});
 change(e,c,'statKind4','error');assert.deepEqual(values(),{SUM:'#N/A',COUNT:'3',COUNTA:'6',AVERAGE:'#N/A',MAX:'#N/A',MIN:'#N/A'});
 for(let i=0;i<6;i++)change(e,c,'statKind'+i,'blank');assert.deepEqual(values(),{SUM:'0',COUNT:'0',COUNTA:'0',AVERAGE:'#DIV/0!',MAX:'0',MIN:'0'});e.dom.window.close();
});
test('v58 range invalid numeric edit cannot silently become zero',()=>{
 const e=env(4),c=open(e,'y2021q51');change(e,c,'statsMode','range');change(e,c,'statValue0','');assert.equal(c.querySelector('[data-stat-result="SUM"]').textContent,'10');assert.match(c.textContent,/原值保留/);change(e,c,'statKind0','text');change(e,c,'statValue0','<img src=x onerror=alert(1)>');assert.equal(c.querySelectorAll('img[src=x]').length,0);assert.equal(c.querySelector('[data-stat-result="COUNT"]').textContent,'1');e.dom.window.close();
});
test('v58 lookup key price and match mode recompute actual results including failure and zero',()=>{
 const e=env(4),c=open(e,'y2020q57');const value=()=>c.querySelector('[data-fill-index="0"]').textContent.trim();assert.equal(value(),'1628');
 click(c,'editLookup');change(e,c,'draftKey','产品9');click(c,'applyLookup');assert.equal(value(),'#N/A');change(e,c,'exact','false');assert.equal(value(),'670');change(e,c,'exact','true');
 click(c,'editLookup');change(e,c,'draftKey','产品2');change(e,c,'draftPrice','100');click(c,'applyLookup');assert.equal(value(),'100');change(e,c,'task','discount');assert.equal(value(),'100');change(e,c,'quantity0','20');assert.equal(value(),'95');
 click(c,'editLookup');change(e,c,'draftPrice','0');click(c,'applyLookup');assert.equal(value(),'0');change(e,c,'task','lookup');change(e,c,'col','4');assert.equal(value(),'#REF!');e.dom.window.close();
});
test('v58 lookup rejects unmodeled wildcard and invalid price without destroying committed data',()=>{
 const e=env(4),c=open(e,'y2020q57');const value=()=>c.querySelector('[data-fill-index="0"]').textContent.trim();click(c,'editLookup');change(e,c,'draftKey','产品*');click(c,'applyLookup');assert.match(c.textContent,/演示未支持/);assert.equal(value(),'1628');change(e,c,'draftKey','产品2');change(e,c,'draftPrice','');click(c,'applyLookup');assert.match(c.textContent,/有限价格/);assert.equal(value(),'1628');click(c,'cancelLookup');
 click(c,'editLookup');change(e,c,'draftPrice','500');click(c,'cancelLookup');assert.equal(value(),'1628');c.querySelector('[data-sim-reset]').click();assert.equal(value(),'1628');e.dom.window.close();
});

test('v58 preserves v57 points sources keys and every out of scope chapter',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/excel-v57-protection.json'),'utf8')),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter4.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
 assert.deepEqual(notes.map(n=>n.id).sort(),expected.notes.map(n=>n.id).sort());
 for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.equal(hash(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys??null])),row.prefix,row.id);}
 for(const [file,digest] of Object.entries(expected.otherChapters))if(!reviewedChapterFile(file))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);
});

test('v59 conditional ranges include endpoints and top values include tied cutoffs',()=>{
 const e=env(4),c=open(e,'y2020q52'),hits=()=>[...c.querySelectorAll('.lab-highlight input')].map(x=>Number(x.value));
 change(e,c,'rule','between');change(e,c,'threshold','9500');change(e,c,'upper','10000');assert.deepEqual(hits(),[10000,9500]);
 change(e,c,'salary2','10000');assert.deepEqual(hits(),[10000,9500,10000]);change(e,c,'rule','top');change(e,c,'top','2');assert.deepEqual(hits(),[10000,10000,12000]);
 change(e,c,'salary3','');assert.deepEqual(hits(),[10000,10000]);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="salary3"]').value,'12000');e.dom.window.close();
});
test('v59 formula formatting separates seven-day boundary, row lock and application range',()=>{
 const e=env(4),c=open(e,'y2025q52');change(e,c,'mode','date');const hit=()=>[...c.querySelectorAll('tbody tr.lab-row-emphasis')].length;
 assert.equal(hit(),2);change(e,c,'end0','2024-03-08');assert.equal(hit(),1);change(e,c,'lockedRow','true');assert.equal(hit(),0);change(e,c,'end0','2024-03-09');assert.equal(hit(),3);
 change(e,c,'lockedRow','false');change(e,c,'full','false');assert.equal(hit(),0);assert.equal(c.querySelectorAll('td.lab-row-emphasis').length,2);assert.doesNotMatch(c.querySelector('.lab-output').textContent,/历史表排序/);e.dom.window.close();
});
test('v59 validation candidates stage input while cancel and clearing preserve committed values',()=>{
 const e=env(4),c=open(e,'y2021q25');click(c,'open');click(c,'apply');change(e,c,'candidate','女');assert.equal(c.querySelector('tbody td').textContent,'男');click(c,'commit');assert.equal(c.querySelector('tbody td').textContent,'女');
 change(e,c,'draft','无效');click(c,'commit');assert.ok(c.querySelector('.lab-dialog'));assert.equal(c.querySelector('tbody td').textContent,'女');click(c,'discard');assert.equal(c.querySelector('[data-field="draft"]').value,'女');
 click(c,'open');change(e,c,'rule','length');click(c,'cancel');change(e,c,'draft','男');click(c,'commit');assert.equal(c.querySelector('tbody td').textContent,'男');
 click(c,'open');click(c,'clearValidation');change(e,c,'draft','新自由输入');click(c,'commit');assert.equal(c.querySelector('tbody td').textContent,'新自由输入');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('tbody td').textContent,'男');e.dom.window.close();
});
test('v59 two automatic filters intersect without applying an unfinished threshold',()=>{
 const e=env(4),c=open(e,'y2026q51');
 change(e,c,'mode','auto');click(c,'auto');assert.match(c.querySelector('.lab-office').textContent,/赵敏/);change(e,c,'autoThreshold','80');click(c,'autoBoth');assert.match(c.querySelector('.lab-office').textContent,/王宁/);assert.doesNotMatch(c.querySelector('.lab-office').textContent,/赵敏|李明|周林/);
 change(e,c,'autoThreshold','90');assert.match(c.querySelector('.lab-office').textContent,/王宁/);click(c,'autoBoth');assert.doesNotMatch(c.querySelector('.lab-office').textContent,/王宁|赵敏|周林/);
 change(e,c,'autoThreshold','');click(c,'autoBoth');assert.match(c.querySelector('.lab-output').textContent,/有限成绩/);click(c,'clear');for(const name of ['王宁','李明','赵敏','周林'])assert.match(c.querySelector('.lab-office').textContent,new RegExp(name));assert.ok(c.querySelector('[data-lab-act="auto"]'));e.dom.window.close();
});
test('v59 pivot filters the chosen field rather than always the second source column',()=>{
 const e=env(4),c=open(e,'y2024q67'),place=(f,z)=>{click(c,'pick',f);click(c,'place',z);};
 place('分部','row');place('销量','value');place('产品','filter');change(e,c,'filter','产品1');const rows=()=>[...c.querySelectorAll('.lab-pivot-layout tbody tr')].map(tr=>[...tr.cells].map(td=>td.textContent));assert.deepEqual(rows(),[['一部','20'],['二部','30']]);
 change(e,c,'filter','产品2');assert.deepEqual(rows(),[['一部','15'],['二部','30']]);place('月份','filter');assert.equal(c.querySelector('[data-field="filter"]').value,'全部');change(e,c,'filter','2月');assert.deepEqual(rows(),[['一部','8'],['二部','40']]);click(c,'remove','filter:月份');assert.deepEqual(rows(),[['一部','35'],['二部','60']]);e.dom.window.close();
});
test('v59 pivot source edits commit separately from refresh and reject invalid drafts',()=>{
 const e=env(4),c=open(e,'y2024q67');click(c,'pick','销量');click(c,'place','value');const total=()=>c.querySelector('.lab-pivot-layout tbody tr').lastElementChild.textContent;
 assert.equal(total(),'95');click(c,'editSource');change(e,c,'draftSource','30');click(c,'cancelSource');assert.equal(total(),'95');assert.match(c.querySelector('[data-pivot-source]').textContent,/源销量：12/);
 click(c,'editSource');change(e,c,'draftSource','');click(c,'applySource');assert.ok(c.querySelector('.lab-dialog'));assert.equal(total(),'95');change(e,c,'draftSource','30');click(c,'applySource');assert.equal(total(),'95');assert.match(c.querySelector('[data-pivot-source]').textContent,/源销量：30/);click(c,'refresh');assert.equal(total(),'113');click(c,'refresh');assert.equal(total(),'113');
 c.querySelector('.simulation-toggle').click();c.querySelector('.simulation-toggle').click();assert.equal(total(),'113');c.querySelector('[data-sim-reset]').click();click(c,'pick','销量');click(c,'place','value');assert.equal(total(),'95');
 click(c,'place','filter');click(c,'pick','产品');click(c,'place','value');change(e,c,'filter','12');assert.equal(total(),'1');click(c,'editSource');change(e,c,'draftSource','30');click(c,'applySource');click(c,'refresh');assert.equal(c.querySelector('[data-field="filter"]').value,'12');assert.match(c.querySelector('[data-field="filter"]').textContent,/当前无源记录/);assert.equal(total(),'—');change(e,c,'filter','全部');assert.equal(total(),'6');e.dom.window.close();
});
test('v59 keeps all historical Excel identities and protects every out-of-scope note and chapter',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/excel-v58-protection.json'),'utf8')),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter4.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
 assert.deepEqual(notes.map(n=>n.id).sort(),expected.notes.map(n=>n.id).sort());for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.equal(hash(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys??null])),row.prefix,row.id);if(row.unchanged&&n.section!=='4.6'){const old=projectV61(n);if(n.id==='y2020q8')old.related=old.related.slice(0,2);assert.equal(hash(JSON.stringify(old)),row.unchanged,row.id);}}
 for(const [file,digest] of Object.entries(expected.otherChapters))if(!reviewedChapterFile(file))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);
});
test('v59 search distinguishes new subtopics and navigation retains the live analysis state',()=>{
 const e=env(4),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8')),c=open(e,'y2024q67'),lab=c.querySelector('[data-lab]');click(c,'pick','销量');click(c,'place','value');
 const cases=[['多规则与清除规则','y2020q52',7],['字段条件和公式条件','y2020q9',8],['修改源值后为什么','y2024q67',10]];
 for(const [query,id,i] of cases){const anchor=id+'--point-'+i,input=e.d.getElementById('search-input');input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));const hit=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===anchor),query);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${anchor}"]`).click();assert.equal(e.d.activeElement.id,anchor);assert.equal(c.querySelector('[data-lab]'),lab);}
 assert.equal(c.querySelector('.lab-pivot-layout tbody tr').lastElementChild.textContent,'95');
 for(const n of e.w.NOTES.notes.filter(n=>['4.4','4.5'].includes(n.section))){for(let i=0;i<n.points.length;i++){const el=e.d.getElementById(n.id+'--point-'+i);assert.ok(el);assert.equal(el.closest('details'),null);}}
 e.dom.window.close();
});

test('v60 chart selection and row column switching rebuild categories without transposing source',()=>{
 const e=env(),c=open(e,'y2020q59'),src=()=>c.querySelector('[data-chart-source]').textContent,result=()=>c.querySelector('[data-chart-result]'),original=src();
 assert.equal(result().dataset.categories,'4');assert.equal(result().dataset.seriesCount,'3');click(c,'switch');assert.equal(result().dataset.categories,'3');assert.equal(result().dataset.seriesCount,'4');assert.equal(src(),original);
 click(c,'selectData');change(e,c,'draftRows','2');change(e,c,'draftColumns','math');click(c,'cancelData');assert.equal(result().dataset.seriesCount,'4');
 click(c,'selectData');change(e,c,'draftRows','2');change(e,c,'draftColumns','math');click(c,'applyData');assert.equal(result().dataset.categories,'1');assert.equal(result().dataset.seriesCount,'2');assert.equal(src(),original);
 click(c,'switch');assert.equal(result().dataset.categories,'2');assert.equal(result().dataset.seriesCount,'1');change(e,c,'type','line');assert.equal(result().querySelectorAll('polyline').length,1);assert.equal(result().querySelector('rect'),null);assert.match(result().textContent,/一班.*二班/);e.dom.window.close();
});
test('v60 chart edits actually update values and legend while invalid or cancelled drafts preserve them',()=>{
 const e=env(),c=open(e,'y2020q59');change(e,c,'type','line');const points=()=>c.querySelector('[data-chart-result] polyline').getAttribute('points'),original=points();
 click(c,'editSource');change(e,c,'draftValue','95');click(c,'cancelSource');assert.equal(points(),original);
 click(c,'editSource');change(e,c,'draftValue','101');click(c,'applySource');assert.equal(points(),original);assert.ok(c.querySelector('[data-field="draftValue"]'));
 change(e,c,'draftValue','40');change(e,c,'draftName','<甲>');click(c,'applySource');assert.notEqual(points(),original);assert.match(points(),/^55,154 /);assert.equal(c.querySelector('[data-chart-source] th:nth-child(2)').textContent,'<甲>');assert.equal(c.querySelector('.lab-chart-legend').textContent.includes('<甲>'),true);assert.equal(c.querySelector('甲'),null);
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-chart-source] th:nth-child(2)').textContent,'数学');assert.match(c.querySelector('[data-chart-source]').textContent,/80/);e.dom.window.close();
});
test('v60 print width retains vertical pages and repeating header while whole page shrinks further',()=>{
 const e=env(),c=open(e,'y2023q10');click(c,'open');click(c,'tab','sheet');change(e,c,'rowCount','40');change(e,c,'repeatRow',true);click(c,'tab','page');change(e,c,'scaleMode','width');click(c,'apply');click(c,'preview');assert.match(c.textContent,/第 1 \/ 2 页/);
 const widthFactor=Number(c.querySelector('[data-print-factor]').dataset.printFactor);assert.ok(c.querySelector('[data-print-cell="D1"]'));click(c,'next');assert.ok(c.querySelector('[data-print-cell="A1"]'));assert.ok(c.querySelector('[data-print-cell="D41"]'));
 click(c,'open');click(c,'tab','page');change(e,c,'scaleMode','page');click(c,'cancel');assert.equal(Number(c.querySelector('[data-print-factor]').dataset.printFactor),widthFactor);
 click(c,'open');click(c,'tab','page');change(e,c,'scaleMode','page');click(c,'apply');assert.match(c.textContent,/第 1 \/ 1 页/);assert.ok(Number(c.querySelector('[data-print-factor]').dataset.printFactor)<widthFactor);assert.ok(c.querySelector('[data-print-cell="D41"]'));e.dom.window.close();
});
test('v60 print area excludes columns from paper while the worksheet and page settings remain independent',()=>{
 const e=env(),c=open(e,'y2023q10');const source=c.querySelector('[data-print-source]').textContent;
 click(c,'open');click(c,'tab','sheet');change(e,c,'area','first');click(c,'apply');assert.equal(c.querySelector('[data-print-source]').textContent,source);click(c,'preview');assert.match(c.textContent,/第 1 \/ 1 页/);assert.equal(c.querySelector('[data-print-cell="D1"]'),null);assert.ok(c.querySelector('[data-print-cell="B9"]'));
 click(c,'open');click(c,'tab','sheet');change(e,c,'area','all');click(c,'apply');assert.match(c.textContent,/第 1 \/ 2 页/);click(c,'next');assert.ok(c.querySelector('[data-print-cell="D1"]'));click(c,'preview');assert.equal(c.querySelector('[data-print-source]').textContent,source);e.dom.window.close();
});
test('v60 page order and left title affect actual page contents rather than data order',()=>{
 const e=env(),c=open(e,'y2023q10');click(c,'open');click(c,'tab','sheet');change(e,c,'rowCount','40');change(e,c,'repeatRow',true);change(e,c,'repeatCol',true);click(c,'apply');click(c,'preview');click(c,'next');assert.ok(c.querySelector('[data-print-cell="A1"]'));assert.ok(c.querySelector('[data-print-cell="A22"]'));assert.equal(c.querySelector('[data-print-cell="C2"]'),null);
 click(c,'open');click(c,'tab','sheet');change(e,c,'order','across');click(c,'apply');click(c,'next');assert.ok(c.querySelector('[data-print-cell="C2"]'));assert.ok(c.querySelector('[data-print-cell="A2"]'));assert.equal(c.querySelector('[data-print-cell="B2"]'),null);e.dom.window.close();
});
test('v60 print paper margin footer and invalid size retain confirmed layout',()=>{
 const e=env(),c=open(e,'y2023q10');click(c,'open');change(e,c,'margin','10');click(c,'tab','page');change(e,c,'paperSize','A5');change(e,c,'firstPage','7');change(e,c,'footer',true);change(e,c,'scaleMode','page');click(c,'apply');click(c,'preview');assert.equal(c.querySelector('.lab-print-page').getAttribute('viewBox'),'0 0 148 210');assert.equal(c.querySelector('[data-print-footer]').textContent,'7');
 click(c,'open');change(e,c,'margin','99');click(c,'apply');assert.ok(c.querySelector('[data-field="margin"]'));assert.match(c.querySelector('.lab-output').textContent,/10—30/);click(c,'cancel');assert.equal(c.querySelector('[data-print-footer]').textContent,'7');
 c.querySelector('[data-sim-reset]').click();click(c,'preview');assert.equal(c.querySelector('.lab-print-page').getAttribute('viewBox'),'0 0 210 297');assert.equal(c.querySelector('[data-print-footer]'),null);e.dom.window.close();
});
test('v60 sparkline source rows map to destination cells and cancelled ranges never move them',()=>{
 const e=env(),c=open(e,'syllabus-sparkline');click(c,'ranges');change(e,c,'draftSource','two');change(e,c,'draftLocation','G');click(c,'cancelRanges');assert.ok(c.querySelector('[data-spark-location="F2"]'));assert.equal(c.querySelector('[data-spark-location="G2"]'),null);
 click(c,'ranges');change(e,c,'draftSource','two');change(e,c,'draftLocation','G');click(c,'applyRanges');const one=c.querySelector('[data-spark-location="G2"]'),two=c.querySelector('[data-spark-location="G3"]');assert.equal(one.dataset.sparkSource,'B2:E2');assert.equal(two.dataset.sparkSource,'B3:E3');assert.equal(one.querySelector('polyline').getAttribute('points'),two.querySelector('polyline').getAttribute('points'));assert.equal(c.querySelector('[data-spark-location="F2"]'),null);
 change(e,c,'rawOther','100,50,80,40');assert.notEqual(c.querySelector('[data-spark-location="G2"] polyline').getAttribute('points'),c.querySelector('[data-spark-location="G3"] polyline').getAttribute('points'));change(e,c,'mark',true);assert.equal(c.querySelectorAll('[data-spark-location="G3"] circle').length,4);
 c.querySelector('[data-sim-reset]').click();assert.ok(c.querySelector('[data-spark-location="F2"]'));assert.equal(c.querySelector('[data-field="rawOther"]').value,'40,80,50,100');e.dom.window.close();
});
test('v60 preserves v59 identities all old paragraphs and every unmodified note and chapter',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/excel-v59-protection.json'),'utf8')),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter4.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
 assert.deepEqual(notes.map(n=>n.id).sort(),expected.notes.map(n=>n.id).sort());for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.equal(hash(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys??null])),row.prefix,row.id);if(row.unchanged){const old=projectV61(n);if(n.id==='y2020q8'){assert.equal(n.related[2].id,'syllabus-office-exchange');old.related=old.related.slice(0,2);}assert.equal(hash(JSON.stringify(old)),row.unchanged,row.id);}}
 for(const [file,digest] of Object.entries(expected.otherChapters))if(!reviewedChapterFile(file))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);
});
test('v60 search locates new chart and print paragraphs without losing the active chart on return',()=>{
 const e=env(),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8')),c=open(e,'y2020q59'),lab=c.querySelector('[data-lab]');click(c,'switch');change(e,c,'type','line');
 for(const [query,id,i] of [['图表区、绘图区','y2020q59',4],['名称、数值和类别','y2020q59',6],['网格线、行列标题','y2023q10',9],['批量创建时范围','syllabus-sparkline',3]]){const anchor=id+'--point-'+i,input=e.d.getElementById('search-input');input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));const hit=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===anchor),query);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${anchor}"]`).click();assert.equal(e.d.activeElement.id,anchor);assert.equal(c.querySelector('[data-lab]'),lab);}
 assert.equal(c.querySelectorAll('[data-chart-result] polyline').length,4);for(const n of e.w.NOTES.notes.filter(n=>n.section==='4.6'))for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(n.id+'--point-'+i);assert.ok(p);assert.equal(p.closest('details'),null);}e.dom.window.close();
});

// v62 owns authorized presentation changes in Chapters 1–4; historical semantic hashes above remain active.
test('v61 preserves all old Windows points and identities plus 2.3 and ten other chapters',()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/windows-v60-protection.json'),'utf8')),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter2.json'),'utf8')),hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');
 assert.deepEqual(notes.map(n=>n.id).sort(),expected.notes.map(n=>n.id).sort());for(const row of expected.notes){const n=notes.find(n=>n.id===row.id);assert.equal(hash(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys??null])),row.prefix,row.id);if(row.unchanged)assert.equal(hash(JSON.stringify(projectV61(n))),row.unchanged,row.id);if(n.section==='2.3')assert.ok(row.unchanged);}
 for(const [file,digest] of Object.entries(expected.otherFiles))if(!reviewedChapterFile(file))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);
});
test('v61 minimize retains text and restores the preceding maximized state',()=>{
 const e=env(2),c=open(e,'y2020q2');change(e,c,'textA','尚未保存的输入');click(c,'size','A');assert.equal(c.querySelector('[data-window="A"]').dataset.state,'max');assert.equal(c.querySelector('[data-window="A"]').style.width,'100%');click(c,'min','A');assert.equal(c.querySelector('[data-window="A"]'),null);assert.match(c.textContent,/最小化（仍运行）/);click(c,'activate','A');assert.equal(c.querySelector('[data-window="A"]').dataset.state,'max');assert.equal(c.querySelector('[data-field="textA"]').value,'尚未保存的输入');click(c,'size','A');assert.equal(c.querySelector('[data-window="A"]').style.width,'82%');e.dom.window.close();
});
test('v61 close cancel discard and save keep independent window documents',()=>{
 const e=env(2),c=open(e,'y2020q2');change(e,c,'textA','临时内容');click(c,'closeWindow','A');click(c,'cancelClose');assert.equal(c.querySelector('[data-field="textA"]').value,'临时内容');click(c,'closeWindow','A');click(c,'discardClose');assert.equal(c.querySelector('[data-window="A"]'),null);assert.ok(c.querySelector('[data-window="B"]'));click(c,'reopen','A');assert.equal(c.querySelector('[data-field="textA"]').value,'A中的笔记');change(e,c,'textA','保存的内容');click(c,'closeWindow','A');click(c,'saveClose');click(c,'reopen','A');assert.equal(c.querySelector('[data-field="textA"]').value,'保存的内容');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="textA"]').value,'A中的笔记');e.dom.window.close();
});
test('v61 window modal rejects background actions and escaped text stays text',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2020q2,s=structuredClone(m.initial);m.change(s,'textA','<img src=x onerror=alert(1)>');m.action(s,'closeWindow','A');m.action(s,'min','B');m.change(s,'textB','不能提交');assert.equal(s.stateB,'normal');assert.equal(s.textB,'B中的笔记');assert.ok(m.render(s).includes('&lt;img'));m.action(s,'cancelClose');m.action(s,'min','A');m.change(s,'textA','隐藏时不编辑');assert.match(s.textA,/<img/);e.dom.window.close();
});
test('v61 restore changes driver snapshot but not current personal document',()=>{
 const e=env(2),c=open(e,'y2026q33');change(e,c,'personal','还原前刚写完的笔记');click(c,'install');click(c,'restore');change(e,c,'target','2');assert.match(c.querySelector('[data-restore-impact]').textContent,/3.0 回到 1.1/);click(c,'cancelRestore');assert.equal(c.querySelector('[data-current-driver]').textContent,'3.0');click(c,'restore');change(e,c,'target','2');click(c,'applyRestore');assert.equal(c.querySelector('[data-current-driver]').textContent,'1.1');assert.equal(c.querySelector('[data-field="personal"]').value,'还原前刚写完的笔记');e.dom.window.close();
});
test('v61 newly created restore point captures current driver and deleting points never restores',()=>{
 const e=env(2),m=e.w.NOTE_LABS.registry.y2026q33,s=structuredClone(m.initial);m.action(s,'create');assert.equal(s.points.at(-1).driver,'2.0');m.action(s,'install');m.action(s,'restore');m.change(s,'target','3');m.action(s,'delete');m.change(s,'personal','不能后台改');assert.equal(s.points.length,3);assert.equal(s.personal,'今天补写的复习笔记');m.action(s,'applyRestore');assert.equal(s.driver,'2.0');m.action(s,'install');m.action(s,'delete');assert.equal(s.driver,'3.0');assert.equal(s.points.length,0);m.action(s,'restore');assert.equal(s.restore,false);m.action(s,'toggle');m.action(s,'cancel');assert.equal(s.enabled,true);m.action(s,'toggle');m.action(s,'confirm');m.action(s,'create');assert.equal(s.points.length,0);m.action(s,'toggle');m.action(s,'create');assert.equal(s.points[0].driver,'3.0');e.dom.window.close();
});
test('v61 task startup permissions dialog and device mechanisms remain independent',()=>{
 const e=env(2),c=open(e,'y2026q34');click(c,'tab','startup');click(c,'startup');assert.match(c.querySelector('tbody').textContent,/已禁用/);click(c,'tab','process');assert.match(c.querySelector('tbody').textContent,/记事本/);click(c,'end','记事本');assert.doesNotMatch(c.querySelector('tbody').textContent,/记事本/);
 const a=open(e,'y2025q32');change(e,a,'draft',true);click(a,'apply');change(e,a,'draft',false);click(a,'cancel');click(a,'open');assert.equal(a.querySelector('[data-field="draft"]').checked,true);
 const d=open(e,'y2026q8');change(e,d,'mode','disabled');click(d,'properties');assert.match(d.textContent,/禁用/);e.dom.window.close();
});
test('v61 search and chapter navigation preserve the opened window model and exact text',()=>{
 const e=env(2),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'),'utf8')),c=open(e,'y2020q2'),lab=c.querySelector('[data-lab]');change(e,c,'textA','返回后仍在');click(c,'min','A');
 for(const [q,id,i] of [['五类归纳','y2024q6',7],['可移动存储访问','y2026q9',3],['个人文档','y2026q33',5],['步骤记录器','y2025q34',11]]){const input=e.d.getElementById('search-input');input.value=q;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id),anchor=id+'--point-'+i;assert.ok(hit?.matches.some(m=>m.anchor===anchor),q);e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${anchor}"]`).click();assert.equal(e.d.activeElement.id,anchor);assert.equal(c.querySelector('[data-lab]'),lab);}
 e.d.getElementById('clear-search').click();click(c,'activate','A');assert.equal(c.querySelector('[data-field="textA"]').value,'返回后仍在');
 for(const n of e.w.NOTES.notes)for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(n.id+'--point-'+i);assert.ok(p);assert.equal(p.closest('details'),null);const decoded=e.d.createElement('textarea');decoded.innerHTML=n.points[i];assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),decoded.value);}e.dom.window.close();
});

// The prerequisite pairs below are editorial judgments from the v62 audit,
// not copies of the implementation's complete sorting arrays.
test('v62 preserves 135 complete historical note identities and 977 paragraph meanings',()=>{
 const hash=x=>require('node:crypto').createHash('sha256').update(JSON.stringify(x)).digest('hex');
 let count=0,points=0,added=0;
 for(let chapter=1;chapter<=4;chapter++){
  const notes=JSON.parse(fs.readFileSync(path.join(root,`content/chapter${chapter}.json`))),rows=v61Protection.chapters[chapter];
  assert.equal(new Set(notes.map(n=>n.id)).size,notes.length);assert.deepEqual(notes.map(n=>n.id).sort(),rows.map(n=>n.id).sort());
  for(const row of rows){const n=notes.find(n=>n.id===row.id);assert.equal(n.points.length,row.count+row.appendCount,row.id);for(const [field,change] of Object.entries(row.displayChanges))assert.equal(hash(n[field]),change.afterHash,row.id+'/'+field);assert.equal(hash(projectV61(n)),row.hash,row.id);count++;points+=row.count;added+=row.appendCount;}
 }
 assert.equal(count,135);assert.equal(points,977);assert.equal(added,10);
});
test('v62 final body and directory share every card and every stable paragraph exactly once',()=>{
 for(let chapter=1;chapter<=4;chapter++){
  const e=env(chapter),notes=e.w.NOTES.notes,body=[...e.d.querySelectorAll('#notes-root article.note-item')],links=[...e.d.querySelectorAll('#note-list .note-list > li > a')];
  assert.deepEqual(body.map(n=>n.id),links.map(a=>a.hash.slice(1)));assert.equal(body.length,notes.length);assert.equal(new Set(body.map(n=>n.id)).size,notes.length);
  for(const n of notes){const card=e.d.getElementById(n.id),paragraphs=[...card.querySelectorAll('[data-note-point]')];assert.equal(paragraphs.length,n.points.length);assert.deepEqual(paragraphs.map(p=>Number(p.dataset.notePoint)).sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));
   for(const [i,text] of n.points.entries()){const p=e.d.getElementById(n.id+'--point-'+i),decoded=e.d.createElement('textarea');decoded.innerHTML=text;assert.equal(p.closest('article').id,n.id);assert.ok(p.textContent.trim(),n.id+'/'+i);assert.equal([...card.querySelectorAll(`[data-source-field="point-${i}"]`)].map(el=>el.textContent).join(''),decoded.value,n.id+'/'+i);}
  }e.dom.window.close();
 }
});
test('v62 prerequisite judgments hold in actual page order rather than only a recommended list',()=>{
 const chains={
  1:[['y2026q41','y2020q31'],['y2020q31','merged-3'],['merged-3','y2025q2'],['merged-1','y2024q41'],['y2024q41','y2020q23']],
  2:[['y2024q6','y2022q44'],['y2022q44','y2020q2'],['syllabus-windows-paths','syllabus-windows-selection'],['syllabus-windows-selection','y2020q24'],['y2020q24','y2020q3']],
  3:[['syllabus-office-exchange','y2024q7'],['y2024q7','syllabus-word-text-editing'],['merged-5','y2022q10'],['merged-7','y2020q43'],['y2026q47','y2024q66'],['y2023q52','y2021q56']],
  4:[['y2020q8','y2024q11'],['y2024q11','y2020q48'],['y2020q7','y2022q66'],['merged-10','y2021q51'],['y2021q51','y2026q49'],['syllabus-excel-multikey-sort','y2020q58'],['y2020q59','y2026q52'],['y2026q52','y2023q10']]
 };
 const pointPairs={1:[['y2026q41',5,0],['y2026q41',0,6],['y2026q41',6,1],['merged-1',6,0]],2:[['y2020q24',6,0]],3:[['merged-5',8,0],['merged-5',0,2],['y2024q8',5,0],['y2024q8',0,10]],4:[['merged-10',5,0],['merged-10',0,4]]};
 for(let chapter=1;chapter<=4;chapter++){const e=env(chapter),ids=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id);
  for(const [before,after] of chains[chapter])assert.ok(ids.indexOf(before)>=0&&ids.indexOf(before)<ids.indexOf(after),before+' precedes '+after);
  for(const [id,before,after] of pointPairs[chapter]){const ps=[...e.d.getElementById(id).querySelectorAll('[data-note-point]')].map(p=>Number(p.dataset.notePoint));assert.ok(ps.indexOf(before)<ps.indexOf(after),id+': '+before+' precedes '+after);}
  e.dom.window.close();
 }
});
test('v62 local and drawer subtopics follow displayed paragraphs with original index anchors',()=>{
 for(let chapter=1;chapter<=4;chapter++){const e=env(chapter);for(const n of e.w.NOTES.notes){const card=e.d.getElementById(n.id),visible=[...card.querySelectorAll('[data-note-point]')].filter(p=>n.pointPresentation?.[p.dataset.notePoint]?.navigationLabel).map(p=>p.id),local=[...card.querySelectorAll('.note-subtopics a')].map(a=>a.hash.slice(1));
  const li=[...e.d.querySelectorAll('#note-list .note-list > li')].find(li=>li.firstElementChild.hash==='#'+n.id),drawer=[...li.querySelectorAll('.directory-subtopics a')].map(a=>a.hash.slice(1));assert.deepEqual(local,visible,n.id);assert.deepEqual(drawer,visible,n.id);
 }e.dom.window.close();}
});
test('v62 old and new deep links search focus and expanded return preserve four representative live states',()=>{
 const cases=[
  {chapter:1,id:'y2025q2',field:'char',value:'中',query:'按位权展开',anchor:'y2026q41--point-6',check:c=>assert.match(c.querySelector('[data-lab] tbody').textContent,/E4 B8 AD/)},
  {chapter:2,id:'y2020q2',field:'textA',value:'返回后保留',query:'五类归纳',anchor:'y2024q6--point-7',check:c=>assert.equal(c.querySelector('[data-field="textA"]').value,'返回后保留')},
  {chapter:3,id:'y2023q52',query:'首次保存',anchor:'syllabus-office-exchange--point-6',prepare:(e,c)=>{click(c,'modify');change(e,c,'draftSize','22');click(c,'apply');},check:c=>assert.equal(c.querySelector('[data-style-preview]').style.fontSize,'22pt')},
  {chapter:4,id:'y2024q11',field:'raw',value:'=8*7',query:'工作簿是Excel文件',anchor:'y2020q8--point-0',prepare:(e,c)=>click(c,'apply'),check:c=>assert.equal(c.querySelector('[data-input-display]').textContent,'56')}
 ];
 for(const row of cases){const e=env(row.chapter,{url:'https://notes.example/chapter'+row.chapter+'.html#'+row.id+'--point-0'}),c=open(e,row.id),lab=c.querySelector('[data-lab]');if(row.field)change(e,c,row.field,row.value);row.prepare?.(e,c);
  const input=e.d.getElementById('search-input');input.value=row.query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.equal(c.classList.contains('hidden'),true,row.id+' temporarily hidden by query');
  {const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.ok(e.w.NOTE_SEARCH.search(index,row.query).some(hit=>hit.matches.some(m=>m.anchor===row.anchor)),row.query);}
  e.d.getElementById('open-drawer').click();e.d.querySelector(`#drawer a[href="#${row.anchor}"]`)?.click();
  // Some old points have no subtopic label: the card anchor remains the directory entrance.
  if(e.w.location.hash!=='#'+row.anchor){e.d.getElementById('close-drawer').click();e.w.location.hash=row.anchor;e.w.dispatchEvent(new e.w.HashChangeEvent('hashchange'));}
  assert.equal(e.w.location.hash,'#'+row.anchor);assert.equal(e.d.activeElement.id,row.anchor);e.d.getElementById('clear-search').click();assert.equal(c.classList.contains('hidden'),false);assert.equal(c.querySelector('[data-lab]'),lab);row.check(c);
  e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(e.d.activeElement,opener);row.check(c);e.dom.window.close();
 }
});
test('v62 preserves later chapters models references and search records beyond its four chapter scope',()=>{
 const hash=x=>require('node:crypto').createHash('sha256').update(x).digest('hex');for(const [file,digest] of Object.entries(v61Protection.protectedFiles)){if(v70Transferred(file)||v69Transferred(file)||v68Transferred(file)||['content/chapter5.json','src/labs/chapter5/editing.js','src/labs/shared/syllabus.js','src/labs/manifest.json','content/chapter6.json','src/labs/chapter6/network.js','content/chapter7.json','content/chapter8.json','src/labs/chapter8/security.js'].includes(file))continue;assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,file);}
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==11);assert.equal(hash(JSON.stringify(index)),thinkingV69.searchHashes.other);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const id of Object.keys(v61Protection.referenceRows))assert.ok(refs[id],id);for(const id of Object.keys(refs))assert.ok(v61Protection.referenceRows[id]||pptIds.has(id)||networkIds.has(id)||multimediaIds.has(id)||securityIds.has(id)||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),id);for(const [id,row] of Object.entries(v61Protection.referenceRows)){assert.equal(hash(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!pptIds.has(id)&&!networkIds.has(id)&&!multimediaIds.has(id)&&!securityIds.has(id)&&!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count+row.appendCount,id);}
 for(let chapter=5;chapter<=11;chapter++){const e=env(chapter),canonical=JSON.parse(fs.readFileSync(path.join(root,`content/chapter${chapter}.json`))),sections=e.w.NOTES.chapters.find(c=>c.number===chapter).sections,expected=Array.from(sections).flatMap(s=>canonical.filter(n=>n.section===s.id).map(n=>n.id));assert.deepEqual([...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),expected);assert.deepEqual([...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1)),expected);e.dom.window.close();}
});
test('v62 every listed section in the first four chapters has a visible canonical entrance',()=>{
 for(let chapter=1;chapter<=4;chapter++){const e=env(chapter),sections=e.w.NOTES.chapters.find(c=>c.number===chapter).sections;for(const s of sections)assert.ok(e.d.querySelector(`#section-${s.id.replace('.','-')} article`),s.id);if(chapter===4){assert.equal(e.d.getElementById('y2020q8').closest('.section-block').id,'section-4-1');assert.equal(e.d.getElementById('y2024q11').closest('.section-block').id,'section-4-2');}e.dom.window.close();}
});
test('v62 repaired syllabus gaps have distinct searchable paragraph and directory entrances',()=>{
 const e=env(1),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))),cases=[
  ['IBM PC','y2025q21',5,'IBM个人电脑业务的兴起与转型'],
  ['国产计算机涉及','y2026q18',4,'国产处理器、操作系统与应用的层次'],
  ['国产化替代还涉及','y2026q18',5,'国产化迁移与兼容适配'],
  ['常见整机形态','y2020q1',3,'微型计算机的常见整机形态'],
  ['停课通知','y2025q23',8,'从情景理解信息的性质与使用价值']
 ];
 for(const [query,id,i,title] of cases){const anchor=id+'--point-'+i,hit=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===anchor&&m.title===title),query);const input=e.d.getElementById('search-input');input.value=query;input.dispatchEvent(new e.w.Event('input',{bubbles:true}));const card=e.d.getElementById(id);assert.equal(card.classList.contains('hidden'),false);assert.ok([...card.querySelectorAll('.note-search-jumps a')].some(a=>a.hash==='#'+anchor));const link=e.d.querySelector(`#drawer .directory-subtopics a[href="#${anchor}"]`);assert.equal(link.textContent,title);e.d.getElementById('open-drawer').click();link.click();assert.equal(e.d.activeElement.id,anchor);}
 e.dom.window.close();
});
test('v63 search highlight is presentation-only and does not inject markup',async()=>{
 const probe=homeEnv();assert.match(probe.w.NOTE_SEARCH.highlight('剪贴板仍可粘贴','剪贴板'),/<mark>剪贴板<\/mark>/);
 assert.equal(probe.w.NOTE_SEARCH.highlight('<img src=x onerror=alert(1)>','img'),'&lt;<mark>img</mark> src=x onerror=alert(1)&gt;');
 assert.equal(probe.w.NOTE_SEARCH.highlight('AT&T','T'),'A<mark>T</mark>&amp;<mark>T</mark>');
 probe.dom.window.close();
 const e=homeEnv();typeGlobal(e,'剪贴板');await new Promise(setImmediate);
 const mark=e.d.querySelector('#global-results mark');assert.ok(mark);assert.match(mark.textContent,/剪贴板/);
 assert.ok(e.d.querySelector('.search-result small').textContent.includes('第'));
 typeGlobal(e,'<img src=x onerror=alert(1)>');await new Promise(setImmediate);
 assert.equal(e.d.querySelector('#global-results img'),null);e.dom.window.close();
 const ch=env(1),input=ch.d.getElementById('search-input');input.value='位权';input.dispatchEvent(new ch.w.Event('input',{bubbles:true}));
 const jumps=ch.d.querySelector('.note-search-jumps');assert.ok(jumps);assert.ok(jumps.querySelector('mark'));assert.equal(jumps.querySelector('img'),null);
 assert.ok(ch.d.querySelector('[data-sim-expand]').classList.contains('shell-btn'));
 assert.ok(ch.d.querySelector('.note-search-match'));
 ch.dom.window.close();
 const excel=env(4),formula=excel.d.querySelector('.note-formula');
 assert.ok(formula);
 assert.match(formula.textContent,/=|\$|[A-Z]+\(/);
 excel.dom.window.close();
 const word=env(3),chips=word.d.querySelectorAll('#y2024q8 .note-subtopics a');
 assert.ok(chips.length>=20);
 word.dom.window.close();
});

// v64 expectations describe object identities and independently chosen learning prerequisites.
test('v64 preserves every old PowerPoint point identity and its rendered semantic anchor',()=>{
 const e=env(5),notes=e.w.NOTES.notes;
 assert.deepEqual(Array.from(notes,n=>n.id).sort(),[...pptIds].sort());assert.equal(notes.length,22);
 for(const row of pptV63.chapter5){
  const n=notes.find(n=>n.id===row.id);
  assert.equal(digest(JSON.stringify([n.id,n.points.slice(0,row.count),n.sources,n.keys])),row.prefixHash,n.id);
  assert.deepEqual(JSON.parse(JSON.stringify(n.searchAliases||[])),row.searchAliases,n.id);
  for(const link of row.related)assert.ok(n.related?.some(x=>JSON.stringify(x)===JSON.stringify(link)),n.id+' related');
  const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:n.points.length},(_,i)=>i));
  const actual=Array.from(e.d.getElementById(n.id).querySelectorAll('[data-note-point]'),p=>Number(p.dataset.notePoint));assert.deepEqual(actual,order,n.id);
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),n.points[i],p.id);}
 }
 e.dom.window.close();
});
test('v64 default body directory and subtopics share a prerequisite-respecting order',()=>{
 const e=env(5),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);
 // Creation precedes deletion; objects precede arranging; theme/layout vocabulary precedes inheritance.
 for(const [before,after] of [['y2020q10','y2024q12'],['y2024q12','y2020q12'],['y2021q10','y2024q26'],['y2020q53','y2020q11'],['y2020q11','merged-11'],['merged-11','y2023q13'],['y2023q13','syllabus-ppt-output']])assert.ok(body.indexOf(before)<body.indexOf(after),before+' before '+after);
 for(let i=1;i<=6;i++)assert.ok(e.d.querySelector(`#section-5-${i} article`),'5.'+i);
 assert.equal(e.d.getElementById('y2024q46').closest('.section-block').id,'section-5-6');
 for(const n of e.w.NOTES.notes){const a=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(x=>x.hash.slice(1)),a);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(x=>x.hash.slice(1)),a);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));
 assert.ok(order('y2024q26').indexOf(7)<order('y2024q26').indexOf(3),'create before arrange');assert.ok(order('y2020q53').indexOf(5)<order('y2020q53').indexOf(0),'theme meaning before scope command');
 e.dom.window.close();
});
test('v64 formal v63 protection freezes other chapters search and the visual system',()=>{
 for(const [file,hash] of Object.entries(pptV63.protectedFiles)){if(v70Transferred(file)||v69Transferred(file)||v68Transferred(file)||['content/chapter6.json','src/labs/chapter6/network.js','content/chapter7.json','content/chapter8.json','src/labs/chapter8/security.js'].includes(file))continue;assert.equal(digest(fs.readFileSync(path.join(root,file))),hash,file);}
 const app=fs.readFileSync(path.join(root,'notes-app.js'),'utf8'),fix=pptV63.notesApp;assert.equal(app.split(fix.to).length,2);assert.ok(!app.includes(fix.from));assert.equal(digest(app.replace(fix.to,fix.from)),fix.hash);
 const shared=fs.readFileSync(path.join(root,'src/labs/shared/syllabus.js'),'utf8').replace(frontierV67.sharedTextCorrection.after,frontierV67.sharedTextCorrection.before);assert.ok(!shared.includes("'syllabus-ppt-output':"));const anchor="    'syllabus-quantum-basics':";assert.equal(shared.split(anchor).length,2);assert.equal(digest(shared.replace(anchor,pptV63.sharedSyllabusRemovedBlock+anchor)),pptV63.sharedSyllabusHash);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(pptV63.manifest);assert.deepEqual(manifest.chapters[5].ids,base.chapters[5].ids);assert.equal(manifest.chapters[5].models,20);delete manifest.chapters[5];delete base.chapters[5];delete manifest.chapters[6];delete base.chapters[6];delete manifest.chapters[7];delete base.chapters[7];delete manifest.chapters[8];delete base.chapters[8];delete manifest.chapters[9];delete base.chapters[9];delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==5&&r.chapter!==6&&r.chapter!==7&&r.chapter!==8&&r.chapter!==9&&r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except567891011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));
 for(const [id,row] of Object.entries(pptV63.referenceRows)){assert.ok(refs[id],id);assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!pptIds.has(id)&&!networkIds.has(id)&&!multimediaIds.has(id)&&!securityIds.has(id)&&!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}
 for(const id of Object.keys(refs))assert.ok(pptV63.referenceRows[id]||pptIds.has(id)||networkIds.has(id)||multimediaIds.has(id)||securityIds.has(id)||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),'reference belongs to authorized Chapter5/6 card: '+id);
});
test('v64 moving duplicating and changing layout preserve page identity and discard drafts',()=>{
 const e=env(5),c=open(e,'y2024q12'),ids=()=>[...c.querySelectorAll('[data-slide-id]')].map(x=>x.dataset.slideId),active=()=>c.querySelector('[data-active-slide]').dataset.activeSlide;
 assert.deepEqual(ids(),['1','2']);click(c,'up');assert.deepEqual(ids(),['1','2']);click(c,'down');assert.deepEqual(ids(),['2','1']);assert.equal(active(),'1');click(c,'down');assert.deepEqual(ids(),['2','1']);
 click(c,'duplicate');const copy=active();assert.notEqual(copy,'1');change(e,c,'title','副本');click(c,'page',1);assert.equal(c.querySelector('[data-field="title"]').value,'牡丹');
 click(c,'offset');assert.equal(c.querySelector('[data-placeholder="title"]').style.marginLeft,'10px');click(c,'layout');change(e,c,'draftLayout','caption');click(c,'new');assert.equal(ids().length,3);click(c,'cancelLayout');assert.equal(c.querySelector('[data-active-slide]').dataset.layout,'content');assert.equal(c.querySelector('[data-placeholder="title"]').style.marginLeft,'10px');
 click(c,'layout');change(e,c,'draftLayout','caption');click(c,'applyLayout');assert.equal(active(),'1');assert.equal(c.querySelector('[data-active-slide]').dataset.layout,'caption');assert.equal(c.querySelector('[data-placeholder="title"]').style.order,'2');assert.equal(c.querySelector('[data-field="title"]').value,'牡丹');click(c,'offset');click(c,'resetLayout');assert.equal(c.querySelector('[data-placeholder="title"]').style.marginLeft,'0px');assert.match(c.querySelector('[data-field="body"]').value,/花瓣/);
 c.querySelector('[data-sim-reset]').click();assert.deepEqual(ids(),['1','2']);assert.equal(active(),'1');e.dom.window.close();
});
test('v64 grouping moves existing members together and rejects a single-object selection',()=>{
 const e=env(5),c=open(e,'y2024q26'),pos=()=>['[data-art-position]','[data-rectangle-position]'].map(q=>{const el=c.querySelector(q);return [Number(el.dataset.x),Number(el.dataset.y)];});
 assert.deepEqual(pos(),[[80,80],[250,180]]);change(e,c,'selection','art');click(c,'group');assert.equal(c.querySelector('[data-group-boundary]'),null);assert.match(c.querySelector('.lab-output').textContent,/单个对象不能/);click(c,'right');assert.deepEqual(pos(),[[100,80],[250,180]]);
 change(e,c,'selection','both');change(e,c,'angle','45');click(c,'align');assert.deepEqual(pos(),[[100,80],[250,180]]);assert.match(c.querySelector('.lab-output').textContent,/未模拟旋转后/);change(e,c,'angle','0');click(c,'align');assert.deepEqual(pos(),[[100,80],[250,80]]);click(c,'group');assert.ok(c.querySelector('[data-group-boundary]'));change(e,c,'selection','art');click(c,'right');assert.deepEqual(pos(),[[120,80],[270,80]]);click(c,'group');assert.equal(c.querySelector('[data-group-boundary]'),null);change(e,c,'selection','art');click(c,'right');assert.deepEqual(pos(),[[140,80],[270,80]]);
 change(e,c,'text','<img>&');assert.equal(c.querySelector('svg text').textContent,'<img>&');assert.equal(c.querySelector('svg img'),null);change(e,c,'angle','45');assert.match(c.querySelector('[data-art-position]').getAttribute('transform'),/rotate\(45\)/);
 c.querySelector('[data-sim-reset]').click();assert.deepEqual(pos(),[[80,80],[250,180]]);e.dom.window.close();
});
test('v64 art pointer rotation retains modifier snapping and pointer cancellation',()=>{
 const e=env(5),c=open(e,'y2024q26');const pointer=(el,type,x,y,shift=false)=>el.dispatchEvent(new e.w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y,shiftKey:shift}));
 const canvas=c.querySelector('.lab-object-canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:420,height:280});let grip=c.querySelector('[data-lab-drag="rotate-art"]');pointer(grip,'pointerdown',80,10);pointer(grip,'pointermove',180,80,true);pointer(grip,'pointerup',180,80,true);assert.equal(c.querySelector('[data-field="angle"]').value,'90');
 grip=c.querySelector('[data-lab-drag="rotate-art"]');pointer(grip,'pointerdown',80,10);pointer(grip,'pointermove',120,120);pointer(grip,'pointercancel',120,120);assert.equal(c.querySelector('[data-field="angle"]').value,'90');e.dom.window.close();
});
test('v64 output preview calculates handout paper faces without deleting source slides',()=>{
 const e=env(5),c=open(e,'syllabus-ppt-output'),pages=()=>[...c.querySelectorAll('[data-output-page]')],ids=()=>[...c.querySelectorAll('[data-output-slide]')].map(x=>x.dataset.outputSlide);
 assert.equal(pages().length,3);assert.deepEqual(pages().map(p=>p.querySelectorAll('[data-output-slide]').length),[3,3,1]);assert.equal(c.querySelectorAll('[data-handout-lines]').length,7);assert.equal(c.querySelectorAll('[data-speaker-notes]').length,0);
 click(c,'settings');change(e,c,'range','2,4-5');click(c,'apply');assert.equal(pages().length,1);assert.deepEqual(ids(),['2','4','5']);assert.match(c.querySelector('[data-source-count]').textContent,/7张/);
 click(c,'hide');click(c,'settings');change(e,c,'includeHidden',false);click(c,'apply');assert.deepEqual(ids(),['2','5']);assert.match(c.querySelector('[data-source-count]').textContent,/7张/);
 click(c,'settings');change(e,c,'perPage','9');change(e,c,'range','0-9');click(c,'apply');assert.ok(c.querySelector('.lab-dialog'));assert.deepEqual(ids(),['2','5']);assert.match(c.querySelector('.lab-output').textContent,/未更改/);click(c,'cancel');assert.equal(c.querySelector('.lab-dialog'),null);
 c.querySelector('[data-sim-reset]').click();assert.equal(pages().length,3);assert.deepEqual(ids(),['1','2','3','4','5','6','7']);e.dom.window.close();
});
test('v64 notes and outline output distinguish speaker text from slide objects',()=>{
 const e=env(5),c=open(e,'syllabus-ppt-output');click(c,'settings');change(e,c,'mode','notes');change(e,c,'range','2,4-5');click(c,'apply');assert.equal(c.querySelectorAll('[data-output-page]').length,3);assert.deepEqual([...c.querySelectorAll('[data-speaker-notes]')].map(x=>x.textContent),['讲稿提示2','讲稿提示4','讲稿提示5']);
 click(c,'settings');change(e,c,'mode','outline');click(c,'cancel');assert.equal(c.querySelectorAll('[data-speaker-notes]').length,3);
 click(c,'settings');change(e,c,'mode','outline');click(c,'apply');const preview=c.querySelector('[data-outline-output]');assert.match(preview.textContent,/正文要点4/);assert.doesNotMatch(preview.textContent,/讲稿提示|自由文本框：示例标识/);assert.equal(c.querySelectorAll('[data-output-page]').length,0);assert.match(preview.textContent,/不计算大纲实际分页/);e.dom.window.close();
});
test('v64 searches added paragraphs and restores old links without losing the live model',()=>{
 const e=env(5,{url:'https://notes.example/chapter5.html#y2024q46--point-0'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));
 assert.ok(e.d.getElementById('y2024q46--point-0'));assert.equal(e.d.getElementById('y2024q46').closest('.section-block').id,'section-5-6');
 const cases=[['版式规定','y2024q12',6],['宏执行','y2023q45',5],['讲义每页张数','syllabus-ppt-output',4]];
 for(const [q,id,i] of cases){const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`),q);}
 const c=open(e,'y2024q12');click(c,'duplicate');change(e,c,'title','保留的副本');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='讲义每页张数';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.equal(c.classList.contains('hidden'),true);const hit=e.d.getElementById('syllabus-ppt-output');assert.ok(hit.querySelector('.note-search-jumps a[href="#syllabus-ppt-output--point-4"]'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-field="title"]').value,'保留的副本');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-field="title"]').value,'保留的副本');e.dom.window.close();
});
test('v64 macro-capable show readout never equates file extension with permission to execute',()=>{
 const e=env(5),c=open(e,'y2023q45');c.querySelector('[data-sim-choice="3"]').click();assert.match(c.textContent,/宏执行仍受安全设置控制/);assert.doesNotMatch(c.textContent,/直接放映并允许宏/);e.dom.window.close();
});

test('v65 preserves 26 old identities and semantic point anchors with one documented URL correction',()=>{
 const e=env(6),notes=JSON.parse(fs.readFileSync(path.join(root,'content/chapter6.json')));
 assert.deepEqual(notes.map(n=>n.id).sort(),networkV64.chapter6.map(n=>n.id).sort());
 for(const row of networkV64.chapter6){const n=notes.find(n=>n.id===row.id);assert.deepEqual(n.sources,row.sources);assert.deepEqual(n.keys||null,row.keys);assert.deepEqual(n.searchAliases||[],row.searchAliases);
  for(const link of row.related)assert.ok(n.related?.some(x=>JSON.stringify(x)===JSON.stringify(link)),n.id+' related');
  row.pointHashes.forEach((hash,i)=>{if(n.id==='y2020q36'&&i===1){assert.equal(n.points[i],'绝对URL包含方案，不一定含域名；例如HTTP(S)的主机也可以写成IP，file地址可指向本地文件。相对地址需要基准URL，通常依据当前文档位置解析。');}else assert.equal(digest(n.points[i]),hash,n.id+' point '+i);});
  const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:n.points.length},(_,i)=>i));
  assert.deepEqual([...e.d.querySelectorAll(`#${n.id} [data-note-point]`)].map(el=>Number(el.dataset.notePoint)),order);
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`),tmp=e.d.createElement('div');tmp.innerHTML=n.points[i];assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),tmp.textContent);}
 }e.dom.window.close();
});
test('v65 default content directory and subtopics follow prerequisites rather than exam years',()=>{
 const e=env(6),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);assert.equal(new Set(body).size,26);
 // Independently chosen pedagogical dependencies: object/function before type, address before naming, language structure before individual tags, retrieval task before metrics.
 for(const [a,b] of [['y2026q13','y2020q15'],['y2021q15','y2025q13'],['y2025q13','merged-13'],['y2023q17','y2021q28'],['y2023q47','y2021q28'],['y2021q28','y2026q14'],['y2026q14','y2023q16'],['y2020q16','y2022q16'],['y2024q28','y2024q17'],['y2024q17','y2026q28']])assert.ok(body.indexOf(a)<body.indexOf(b),`${a} before ${b}`);
 for(const n of e.w.NOTES.notes){const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));
 assert.ok(order('y2023q16').indexOf(4)<order('y2023q16').indexOf(0),'HTTP before TLS explanation');assert.ok(order('y2026q28').indexOf(2)<order('y2026q28').indexOf(0),'retrieval strategy before measurement');
 for(let i=1;i<=5;i++)assert.ok(e.d.querySelector(`#section-6-${i} article`));e.dom.window.close();
});
test('v65 freezes other ten chapters labs shared UX and non-network search records at formal v64',()=>{
 for(const [file,hash] of Object.entries(networkV64.protectedFiles))if(!v70Transferred(file)&&!v69Transferred(file)&&!v68Transferred(file)&&!['content/chapter7.json','content/chapter8.json','src/labs/chapter8/security.js'].includes(file))assert.equal(digest(fs.readFileSync(path.join(root,file))),hash,file);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(networkV64.manifest);delete manifest.chapters[6];delete base.chapters[6];delete manifest.chapters[7];delete base.chapters[7];delete manifest.chapters[8];delete base.chapters[8];delete manifest.chapters[9];delete base.chapters[9];delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==6&&r.chapter!==7&&r.chapter!==8&&r.chapter!==9&&r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except67891011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row] of Object.entries(networkV64.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!networkIds.has(id)&&!multimediaIds.has(id)&&!securityIds.has(id)&&!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(networkV64.referenceRows[id]||networkIds.has(id)||multimediaIds.has(id)||securityIds.has(id)||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),id);
});
test('v65 topology failure changes reachability and scope selection does not repair a broken link',()=>{
 const e=env(6),c=open(e,'y2020q15'),route=id=>c.querySelector(`[data-route="${id}"]`).textContent;
 assert.equal(route('A-B'),'A → S → B');click(c,'link','A-S');assert.equal(route('A-B'),'不可达');assert.equal(route('B-D'),'B → S → D');change(e,c,'scope','WAN');assert.equal(route('A-B'),'不可达');assert.match(c.querySelector('.lab-output').textContent,/WAN/);
 click(c,'center');assert.equal(route('B-D'),'不可达');click(c,'center');assert.equal(route('B-D'),'B → S → D');c.querySelector('[data-sim-reset]').click();assert.equal(route('A-B'),'A → S → B');
 change(e,c,'topology','mesh');assert.equal(route('A-B'),'A → B');click(c,'link','A-B');assert.equal(route('A-B'),'A → C → B');click(c,'link','A-C');assert.equal(route('A-B'),'不可达');assert.equal(route('B-D'),'B → D');assert.equal(c.querySelector('[data-link="A-B"]').dataset.connected,'false');change(e,c,'topology','star');assert.equal(route('A-B'),'A → S → B');e.dom.window.close();
});
test('v65 SMTP submission relay and POP3 retrieval modify distinct stores and preserve copies conditionally',()=>{
 const e=env(6),c=open(e,'y2022q15'),ids=store=>[...c.querySelectorAll(`[data-mail-store="${store}"] [data-mail-id]`)].map(x=>x.dataset.mailId);
 change(e,c,'service','SMTP');change(e,c,'subject','实训通知');click(c,'send');assert.deepEqual(ids('queue'),['1']);assert.deepEqual(ids('server'),['0']);assert.deepEqual(ids('local'),[]);
 change(e,c,'subject','取消这份草稿');click(c,'cancel');assert.deepEqual(ids('queue'),['1']);assert.doesNotMatch(c.querySelector('[data-mail-store="queue"]').textContent,/取消这份草稿/);click(c,'relay');assert.deepEqual(ids('queue'),[]);assert.deepEqual(ids('server'),['0','1']);assert.deepEqual(ids('local'),[]);
 change(e,c,'service','POP3');click(c,'send');assert.deepEqual(ids('local'),['0']);assert.deepEqual(ids('server'),['0','1']);click(c,'send');assert.deepEqual(ids('local'),['0']);change(e,c,'keep',false);click(c,'send');assert.deepEqual(ids('server'),['1']);click(c,'send');assert.deepEqual(ids('local'),['0','1']);assert.deepEqual(ids('server'),[]);click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/邮箱为空/);e.dom.window.close();
});
test('v65 service failure and unsupported cases retain committed data and escape user text',()=>{
 const e=env(6),c=open(e,'y2022q15');change(e,c,'connected',false);click(c,'send');assert.doesNotMatch(c.querySelector('tbody').textContent,/影像资料.zip影像资料.zip/);assert.match(c.querySelector('.lab-output').textContent,/没有转移/);change(e,c,'connected',true);click(c,'send');click(c,'send');assert.match(c.querySelector('.lab-output').textContent,/未新增/);change(e,c,'file','照片.jpg');click(c,'send');assert.match(c.querySelector('tbody').textContent,/影像资料.zip.*照片.jpg/);
 change(e,c,'service','SMTP');change(e,c,'subject','<img src=x onerror=alert(1)>');click(c,'send');assert.equal(c.querySelector('[data-mail-store="queue"] img'),null);assert.match(c.querySelector('[data-mail-store="queue"]').textContent,/<img src=x/);change(e,c,'connected',false);click(c,'relay');assert.equal(c.querySelectorAll('[data-mail-store="queue"] [data-mail-id]').length,1);
 change(e,c,'service','Telnet');change(e,c,'connected',true);click(c,'send');const result=c.querySelector('[data-remote-output]').textContent;change(e,c,'command','unsupported');click(c,'send');assert.equal(c.querySelector('[data-remote-output]').textContent,result);assert.match(c.querySelector('.lab-output').textContent,/不能据此/);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="service"]').value,'FTP');assert.match(c.querySelector('tbody').textContent,/空/);e.dom.window.close();
});
test('v65 retained DNS IPv4 and HTTPS models preserve cache prefix and identity boundaries',()=>{
 const e=env(6),c=open(e,'y2021q28');click(c,'query');assert.match(c.querySelector('.lab-tape').textContent,/192.0.2.10.*192.0.2.11/);click(c,'change');click(c,'query');assert.match(c.querySelector('.lab-tape').textContent,/192.0.2.10/);click(c,'tick');click(c,'query');assert.match(c.querySelector('.lab-tape').textContent,/192.0.2.99/);
 const ip=open(e,'y2023q17');change(e,ip,'ip','192.168.10.70');change(e,ip,'prefix','26');assert.match(ip.querySelector('.lab-registers').textContent,/255.255.255.192.*192.168.10.64/);change(e,ip,'ip','300.1.1.1');assert.equal(ip.querySelector('.lab-ip-bits'),null);
 const https=open(e,'y2023q16');change(e,https,'cert','invalid');click(https,'send');assert.match(https.querySelector('.lab-browser-page').textContent,/未发送/);change(e,https,'cert','valid');click(https,'send');assert.match(https.querySelector('.lab-code').textContent,/不能直接读出/);change(e,https,'scheme','http');click(https,'send');assert.match(https.querySelector('.lab-code').textContent,/姓名=王宁/);e.dom.window.close();
});
test('v65 retained HTML models distinguish document title metadata paragraph and line break',()=>{
 const e=env(6),title=open(e,'y2022q16');change(e,title,'title','标签用标题');change(e,title,'heading','正文用标题');assert.match(title.querySelector('.lab-tabs').textContent,/标签用标题/);assert.equal(title.querySelector('.lab-browser-page h2').textContent,'正文用标题');
 const meta=open(e,'y2021q37');change(e,meta,'description','只作描述');assert.doesNotMatch(meta.querySelector('.lab-browser-page').textContent,/只作描述/);click(meta,'view','meta');assert.match(meta.querySelector('.lab-browser-page').textContent,/只作描述/);
 const para=open(e,'y2026q38');change(e,para,'mode','omit');assert.equal(para.querySelectorAll('.lab-browser-page p').length,2);change(e,para,'mode','br');assert.equal(para.querySelectorAll('.lab-browser-page p').length,1);assert.equal(para.querySelectorAll('.lab-browser-page br').length,1);
 const code=e.d.querySelector('#y2020q16--point-8 pre').textContent;assert.ok(code.startsWith('<!doctype html>'));const page=new JSDOM(code);assert.equal(page.window.document.title,'课程笔记');assert.equal(page.window.document.querySelector('h1').textContent,'网络入门');assert.equal(page.window.document.querySelector('a').getAttribute('href'),'intro.html');page.window.close();e.dom.window.close();
});
test('v65 retrieval model recomputes both denominators and demonstrates non-universal precision tradeoff',()=>{
 const e=env(6),c=open(e,'y2026q28'),body=()=>c.querySelector('.note-lab tbody').textContent;
 click(c,'preset','exact');assert.match(body(),/5\/8.*62.5%.*5\/5.*100.0%/);click(c,'toggle',5);assert.match(body(),/6\/8.*75.0%.*6\/6.*100.0%/);click(c,'toggle',8);assert.match(body(),/6\/8.*75.0%.*6\/7.*85.7%/);click(c,'preset','none');assert.match(body(),/未定义/);
 change(e,c,'mode','boolean');assert.match(c.querySelector('.note-lab tbody tr').textContent,/检出/);change(e,c,'expression','parentheses');assert.match(c.querySelector('.note-lab tbody tr').textContent,/未检出/);change(e,c,'mode','near');change(e,c,'gap','0');const rows=()=>[...c.querySelectorAll('.note-lab tbody tr')].map(x=>x.textContent);assert.match(rows()[1],/✓ 匹配/);change(e,c,'ordered','true');assert.match(rows()[1],/不匹配/);e.dom.window.close();
});
test('v65 search added subtopics old deep links and expand-return retain live model state',()=>{
 const e=env(6,{url:'https://notes.example/chapter6.html#y2020q36--point-1'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));
 assert.match(e.d.getElementById('y2020q36--point-1').textContent,/绝对URL包含方案/);
 for(const [query,id,i] of [['星型','y2020q15',5],['FTTR','y2024q48',6],['商标','y2025q38',4],['保留服务器副本','y2024q16',5]]){const hit=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(hit,query);if(query!=='星型')assert.ok(hit.matches.some(m=>m.anchor===`${id}--point-${i}`),query);}
 const c=open(e,'y2020q15');click(c,'link','A-S');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='商标';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.equal(c.classList.contains('hidden'),true);assert.ok(e.d.querySelector('#y2025q38 .note-search-jumps a[href="#y2025q38--point-4"]'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-route="A-B"]').textContent,'不可达');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-route="A-B"]').textContent,'不可达');e.dom.window.close();
});
test('v65 model registration and narrow-layout structure use existing scroll containers without a new shell',()=>{
 const e=env(6),manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[6];assert.equal(manifest.models,15);assert.equal(new Set(manifest.ids).size,15);for(const id of manifest.ids)assert.ok(e.w.NOTE_SIMULATIONS.demos[id]?.kind==='lab',id);
 const t=open(e,'y2020q15'),svg=t.querySelector('svg');assert.equal(svg.style.width,'100%');assert.ok(svg.hasAttribute('viewBox'));assert.ok(t.querySelector('.note-lab table').closest('.lab-table-scroll'));const mail=open(e,'y2022q15');change(e,mail,'service','SMTP');assert.ok(mail.querySelector('.note-lab table').closest('.lab-table-scroll'));assert.equal(mail.querySelectorAll('style').length,0);
 assert.ok(e.d.getElementById('y2020q15').querySelector('.note-comparison[tabindex="0"]'));e.dom.window.close();
});

test('v66 preserves all ten old identities and all 45 semantic point anchors',()=>{
 const e=env(7),notes=e.w.NOTES.notes;assert.equal(notes.length,11);assert.equal(new Set(notes.map(n=>n.id)).size,11);
 for(const row of multimediaV65.chapter7){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.deepEqual(JSON.parse(JSON.stringify(n.sources)),row.sources);assert.deepEqual(JSON.parse(JSON.stringify(n.keys??null)),row.keys);assert.deepEqual(Array.from(n.points.slice(0,row.count),digest),row.pointHashes);
  assert.deepEqual(JSON.parse(JSON.stringify((n.related||[]).slice(0,row.related.length))),row.related);assert.deepEqual(JSON.parse(JSON.stringify((n.searchAliases||[]).slice(0,row.searchAliases.length))),row.searchAliases);
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),n.points[i]);}
  if(n.id!=='syllabus-media-edit-export')assert.equal(n.section,row.section);
 }
 assert.equal(e.d.getElementById('syllabus-media-edit-export--point-0').closest('.section-block').id,'section-7-2');assert.match(e.d.getElementById('syllabus-media-edit-export--point-0').textContent,/Audacity/);e.dom.window.close();
});
test('v66 teaching dependencies hold in the same body directory and subtopic order',()=>{
 const e=env(7),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);
 // Pedagogical relationships, chosen from meaning, not a duplicate of the implementation array.
 for(const [a,b] of [['y2026q4','y2023q19'],['y2023q19','y2020q27'],['y2020q27','merged-14'],['y2024q32','y2020q38'],['y2020q38','y2023q18'],['y2023q18','merged-14'],['syllabus-media-edit-export','syllabus-image-editing'],['syllabus-image-editing','y2024q43']])assert.ok(body.indexOf(a)<body.indexOf(b),`${a} before ${b}`);
 for(const n of e.w.NOTES.notes){const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));assert.ok(order('y2020q27').indexOf(7)<order('y2020q27').indexOf(1),'pixel meaning before data size');assert.ok(order('y2024q32').indexOf(8)<order('y2024q32').indexOf(1),'stored width condition before multiplying');assert.ok(order('syllabus-media-edit-export').indexOf(3)<order('syllabus-media-edit-export').indexOf(0),'system before software example');
 for(let i=1;i<=3;i++)assert.ok(e.d.querySelector(`#section-7-${i} article`));e.dom.window.close();
});
test('v66 freezes other ten chapters existing models references and v63 visual behavior',()=>{
 for(const [file,hash] of Object.entries(multimediaV65.protectedFiles))if(!v70Transferred(file)&&!v69Transferred(file)&&!v68Transferred(file)&&!['content/chapter8.json','src/labs/chapter8/security.js'].includes(file))assert.equal(digest(fs.readFileSync(path.join(root,file))),hash,file);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(multimediaV65.manifest);assert.deepEqual(manifest.chapters[7].ids.slice(0,base.chapters[7].ids.length),base.chapters[7].ids);delete manifest.chapters[7];delete base.chapters[7];delete manifest.chapters[8];delete base.chapters[8];delete manifest.chapters[9];delete base.chapters[9];delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==7&&r.chapter!==8&&r.chapter!==9&&r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except7891011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row] of Object.entries(multimediaV65.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!multimediaIds.has(id)&&!securityIds.has(id)&&!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(multimediaV65.referenceRows[id]||multimediaIds.has(id)||securityIds.has(id)||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),id);
});
test('v66 independently computed image quantities distinguish pixel count alpha and PPI',()=>{
 const e=env(7),c=open(e,'y2020q27'),metric=()=>c.querySelector('[data-image-size]');assert.equal(metric().dataset.bytes,'1440000');assert.equal(metric().dataset.bits,'11520000');assert.match(c.querySelector('.note-lab table').textContent,/1.440000 MB；1.373291 MiB/);
 change(e,c,'ppi','150');assert.equal(metric().dataset.bytes,'1440000');assert.match(c.querySelector('.note-lab table').textContent,/13.547 × 10.160 cm/);
 change(e,c,'mode','rgba');assert.equal(metric().dataset.bytes,'1920000');assert.match(c.querySelector('.note-lab table').textContent,/16777216.*256级Alpha/);change(e,c,'width','1600');assert.equal(metric().dataset.bytes,'3840000');
 c.querySelector('[data-sim-reset]').click();assert.equal(metric().dataset.bytes,'1440000');assert.equal(c.querySelector('[data-field="ppi"]').value,'300');e.dom.window.close();
});
test('v66 image calculator rejects invalid input and counts sub-byte and maximum boundaries',()=>{
 const e=env(7),c=open(e,'y2020q27');for(const v of ['0','-1','','1.5','16385']){change(e,c,'width',v);assert.equal(c.querySelector('[data-image-size]'),null);assert.match(c.querySelector('.lab-output').textContent,/整数/);}
 change(e,c,'width','1');change(e,c,'height','1');change(e,c,'mode','mono');const m=c.querySelector('[data-image-size]');assert.equal(m.dataset.bits,'1');assert.equal(m.dataset.bytes,'0.125');assert.equal(m.dataset.minimumBytes,'1');assert.match(c.querySelector('.lab-output').textContent,/至少需1 B/);
 change(e,c,'ppi','0');assert.equal(c.querySelector('[data-image-size]'),null);change(e,c,'ppi','300');change(e,c,'width','16384');change(e,c,'height','16384');change(e,c,'mode','rgba');assert.equal(c.querySelector('[data-image-size]').dataset.bytes,'1073741824');assert.match(c.querySelector('.note-lab table').textContent,/1024.000000 MiB/);e.dom.window.close();
});
test('v66 image resampling changes pixels while canvas growth preserves their coordinates',()=>{
 const e=env(7),c=open(e,'syllabus-image-editing'),area=role=>c.querySelector(`[data-image-${role}]`),pixel=(role,xy)=>area(role).querySelector(`[data-pixel="${xy}"]`).dataset.color;
 assert.equal(area('committed').dataset.colored,'16');change(e,c,'width','16');change(e,c,'height','12');click(c,'preview');assert.equal(area('preview').dataset.colored,'64');assert.equal(pixel('preview','2,1'),'transparent');assert.equal(pixel('preview','4,2'),'#b64637');assert.equal(area('committed').dataset.width,'8');click(c,'cancel');assert.equal(area('preview'),null);
 change(e,c,'operation','canvas');change(e,c,'width','16');change(e,c,'height','12');click(c,'preview');assert.equal(area('preview').dataset.colored,'16');assert.equal(pixel('preview','2,1'),'#b64637');assert.equal(pixel('preview','15,11'),'transparent');click(c,'apply');assert.equal(area('committed').dataset.width,'16');assert.equal(area('preview'),null);e.dom.window.close();
});
test('v66 image draft invalidation cancellation repeated crops and reset protect committed state',()=>{
 const e=env(7),c=open(e,'syllabus-image-editing'),width=()=>c.querySelector('[data-image-committed]').dataset.width,colored=()=>c.querySelector('[data-image-committed]').dataset.colored;
 click(c,'apply');assert.equal(width(),'8');click(c,'preview');change(e,c,'width','0');click(c,'apply');assert.equal(width(),'8');assert.equal(c.querySelector('[data-image-preview]'),null);click(c,'preview');assert.match(c.querySelector('.lab-output').textContent,/无效/);click(c,'cancel');assert.equal(width(),'8');
 change(e,c,'operation','canvas');change(e,c,'width','4');change(e,c,'height','3');click(c,'preview');click(c,'apply');assert.equal(colored(),'4');change(e,c,'width','8');change(e,c,'height','6');click(c,'preview');click(c,'apply');assert.equal(colored(),'4','growing canvas cannot restore cropped pixels');
 c.querySelector('[data-sim-reset]').click();assert.equal(width(),'8');assert.equal(colored(),'16');assert.equal(c.querySelector('[data-image-preview]'),null);e.dom.window.close();
});
test('v66 retained media models preserve scaling PCM compression frames and buffer semantics',()=>{
 const e=env(7),vector=open(e,'y2023q19');change(e,vector,'zoom','2');assert.match(vector.querySelector('svg path').getAttribute('transform'),/scale\(2\)/);
 const pcm=open(e,'y2024q32');change(e,pcm,'mode','pcm');change(e,pcm,'rate','4');change(e,pcm,'depth','8');change(e,pcm,'channels','2');change(e,pcm,'duration','3');assert.match(pcm.querySelector('.ext-metrics').textContent,/64 bit\/s.*24 B/);
 const rle=open(e,'merged-14');change(e,rle,'raw','30,31');change(e,rle,'mode','reduce');assert.match(rle.querySelector('.note-lab tbody').textContent,/否，编码前已丢失/);change(e,rle,'mode','lossless');assert.doesNotMatch(rle.querySelector('.note-lab tbody').textContent,/否，/);
 const video=open(e,'y2020q38');change(e,video,'fps','60');assert.match(video.querySelector('.note-lab tbody').textContent,/120 帧.*27,648,000 B/);
 const stream=open(e,'y2023q18');change(e,stream,'rate','0');change(e,stream,'position','12');click(stream,'play');click(stream,'tick');assert.match(stream.querySelector('.lab-output').textContent,/等待下载/);assert.match(stream.querySelector('.note-lab tbody').textContent,/播放到12.0/);e.dom.window.close();
});
test('v66 search old links and demo expansion retain state after the section relocation',()=>{
 const e=env(7,{url:'https://notes.example/chapter7.html#syllabus-media-edit-export--point-2'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.match(e.d.getElementById('syllabus-media-edit-export--point-2').textContent,/工程文件改成.mp4/);
 for(const [query,id,i] of [['画布大小','syllabus-image-editing',4],['PPI','y2020q27',10],['驱动帮助','syllabus-media-edit-export',4]]){const hit=e.w.NOTE_SEARCH.search(index,query).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`&&m.title),query);}
 const c=open(e,'syllabus-image-editing');click(c,'preview');click(c,'apply');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='码率';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(c.classList.contains('hidden'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-image-committed]').dataset.width,'12');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-image-committed]').dataset.width,'12');e.dom.window.close();
});
test('v66 registration and narrow structure reuse existing controls tables and responsive SVG',()=>{
 const e=env(7),m=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[7];assert.equal(m.models,8);assert.equal(new Set(m.ids).size,8);for(const id of m.ids)assert.equal(e.w.NOTE_SIMULATIONS.demos[id]?.kind,'lab',id);
 const calc=open(e,'y2020q27');assert.ok(calc.querySelector('.note-lab table').closest('.lab-table-scroll'));const edit=open(e,'syllabus-image-editing');click(edit,'preview');for(const svg of edit.querySelectorAll('svg')){assert.equal(svg.style.width,'100%');assert.ok(svg.hasAttribute('viewBox'));assert.ok(svg.getAttribute('aria-label'));}assert.equal(edit.querySelectorAll('style').length,0);assert.ok(edit.querySelector('.note-comparison[tabindex="0"]'));e.dom.window.close();
});

test('v67 retains eleven old identities and all 46 semantic anchors with two documented legal corrections',()=>{
 const e=env(8),notes=e.w.NOTES.notes;assert.equal(notes.length,12);assert.equal(new Set(notes.map(n=>n.id)).size,12);
 for(const row of securityV66.chapter8){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.equal(n.section,row.section);assert.deepEqual(JSON.parse(JSON.stringify(n.sources)),row.sources);assert.deepEqual(JSON.parse(JSON.stringify(n.keys)),row.keys);
  assert.deepEqual(JSON.parse(JSON.stringify((n.related||[]).slice(0,row.related.length))),row.related);assert.deepEqual(JSON.parse(JSON.stringify((n.searchAliases||[]).slice(0,row.searchAliases.length))),row.searchAliases);
  for(let i=0;i<row.count;i++){const correction=securityV66.pointCorrections[n.id]?.[i];if(correction)assert.equal(n.points[i],correction.after);else assert.equal(digest(n.points[i]),row.pointHashes[i]);}
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`);assert.ok(p);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),n.points[i]);}
 }
 assert.equal(e.d.getElementById('syllabus-windows-security').closest('.section-block').id,'section-8-4');assert.equal(e.w.NOTES.notes.find(n=>n.id==='y2020q20').points[3].includes('不得不合理地损害'),true);e.dom.window.close();
});
test('v67 objectives precede mechanisms and body directory subtopics share the teaching order',()=>{
 const e=env(8),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);
 // Independently chosen dependencies: target before control, identity before public keys,
 // cryptography before VPN, general filtering before the Windows implementation.
 for(const [a,b]of [['y2026q16','y2025q30'],['y2025q30','merged-15'],['merged-15','y2021q18'],['merged-15','y2023q39'],['y2026q16','y2024q49'],['y2020q28','syllabus-windows-security'],['merged-16','syllabus-windows-security'],['y2020q20','y2026q30']])assert.ok(body.indexOf(a)<body.indexOf(b),`${a} before ${b}`);
 for(let i=1;i<=5;i++)assert.ok(e.d.querySelector(`#section-8-${i} article`));
 for(const n of e.w.NOTES.notes){const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));assert.deepEqual([...e.d.querySelectorAll(`#${n.id} [data-note-point]`)].map(p=>Number(p.dataset.notePoint)),order);const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));assert.ok(order('merged-15').indexOf(9)<order('merged-15').indexOf(1),'plaintext before public key direction');assert.ok(order('y2020q28').indexOf(5)<order('y2020q28').indexOf(6),'malware parent concept before worm/Trojan');e.dom.window.close();
});
test('v67 formal v66 protection freezes other ten chapters labs search references and the v63 shell',()=>{
 for(const [file,expected]of Object.entries(securityV66.protectedFiles)){
  if(v70Transferred(file)||v69Transferred(file)||v68Transferred(file))continue;
  const fix=securityV66.modelTextCorrection;let bytes=fs.readFileSync(path.join(root,file));
  if(file===fix.file){let text=bytes.toString();assert.equal(text.split(fix.after).length,2);assert.ok(!text.includes(fix.before));bytes=text.replace(fix.after,fix.before);}
  assert.equal(digest(bytes),expected,file);
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(securityV66.manifest);assert.deepEqual(manifest.chapters[8].ids.slice(0,base.chapters[8].ids.length),base.chapters[8].ids);delete manifest.chapters[8];delete base.chapters[8];delete manifest.chapters[9];delete base.chapters[9];delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==8&&r.chapter!==9&&r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except891011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row]of Object.entries(securityV66.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!securityIds.has(id)&&!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(securityV66.referenceRows[id]||securityIds.has(id)||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),id);
});
test('v67 standard user credentials gate elevation and permission alone does not commit a clock change',()=>{
 const e=env(8),c=open(e,'syllabus-windows-security'),clock=()=>c.querySelector('[data-security-clock]').textContent;assert.equal(clock(),'09:00');click(c,'request');assert.ok(c.querySelector('[data-uac-prompt]'));assert.equal(c.querySelector('[data-security-editor]'),null);
 click(c,'approve');assert.equal(clock(),'09:00');assert.match(c.querySelector('.lab-output').textContent,/验证失败/);change(e,c,'credential','valid');click(c,'approve');assert.equal(c.querySelector('[data-security-editor]').dataset.privilege,'elevated');assert.equal(clock(),'09:00');
 change(e,c,'draft','10:30');assert.equal(clock(),'09:00');click(c,'save');assert.equal(clock(),'10:30');assert.equal(c.querySelector('[data-field="account"]').value,'standard');assert.equal(c.querySelector('[data-security-editor]'),null);click(c,'request');assert.ok(c.querySelector('[data-uac-prompt]'));assert.equal(c.querySelector('[data-field="credential"]').value,'invalid');e.dom.window.close();
});
test('v67 administrator confirmation cancellation invalid drafts and reset preserve committed state',()=>{
 const e=env(8),c=open(e,'syllabus-windows-security'),clock=()=>c.querySelector('[data-security-clock]').textContent;change(e,c,'account','admin');click(c,'request');assert.equal(c.querySelector('[data-field="credential"]'),null);click(c,'deny');assert.equal(clock(),'09:00');
 click(c,'request');click(c,'approve');for(const value of ['','24:00','12:60','9:00','00:00<script>']){change(e,c,'draft',value);click(c,'save');assert.equal(clock(),'09:00');assert.match(c.querySelector('.lab-output').textContent,/无效草稿/);}
 change(e,c,'draft','23:59');click(c,'cancel');assert.equal(clock(),'09:00');click(c,'request');click(c,'approve');change(e,c,'draft','00:00');click(c,'save');assert.equal(clock(),'00:00');c.querySelector('[data-sim-reset]').click();assert.equal(clock(),'09:00');assert.equal(c.querySelector('[data-field="account"]').value,'standard');assert.equal(c.querySelector('[data-uac-prompt]'),null);e.dom.window.close();
});
test('v67 ordinary editing is separate from elevation and safely renders user text',()=>{
 const e=env(8),c=open(e,'syllabus-windows-security');change(e,c,'operation','memo');click(c,'request');assert.equal(c.querySelector('[data-uac-prompt]'),null);assert.equal(c.querySelector('[data-security-editor]').dataset.privilege,'ordinary');const literal='<img src=x onerror="window.intruded=true"> &lt;script&gt;';change(e,c,'draft',literal);click(c,'save');assert.equal(c.querySelector('[data-security-note]').textContent,literal);assert.equal(c.querySelector('[data-security-note] img'),null);assert.equal(e.w.intruded,undefined);assert.equal(c.querySelector('[data-security-clock]').textContent,'09:00');
 click(c,'request');change(e,c,'draft','');click(c,'save');assert.equal(c.querySelector('[data-security-note]').textContent,'');e.dom.window.close();
});
test('v67 stale authorization unsupported inputs and repeated actions cannot commit a different task',()=>{
 const e=env(8),r=e.w.NOTE_LABS.registry['syllabus-windows-security'],s=structuredClone(r.initial);r.action(s,'save');assert.equal(s.clock,'09:00');r.action(s,'approve');assert.equal(s.stage,'idle');
 r.action(s,'request');r.change(s,'credential','valid');r.action(s,'approve');r.change(s,'draft','12:00');r.change(s,'account','admin');r.action(s,'save');assert.equal(s.clock,'09:00');assert.equal(s.pending,null);
 r.action(s,'request');r.change(s,'operation','memo');r.action(s,'approve');assert.equal(s.stage,'idle');r.change(s,'account','<svg>');assert.equal(s.account,'admin');r.change(s,'operation','unsupported');assert.equal(s.operation,'memo');
 r.action(s,'request');r.change(s,'draft','x'.repeat(2001));r.action(s,'save');assert.equal(s.memo,r.initial.memo);r.action(s,'cancel');assert.equal(s.pending,null);r.change(s,'account','standard');r.change(s,'operation','clock');r.action(s,'request');r.change(s,'credential','anything');r.action(s,'approve');assert.equal(s.stage,'prompt');assert.equal(s.clock,'09:00');e.dom.window.close();
});
test('v67 cryptographic size boundaries count UTF8 bytes and malformed ciphertext is not plaintext',async()=>{
 const e=env(8),r=e.w.NOTE_LABS.registry['merged-15'],s=structuredClone(r.initial);await r.action(s,'keys');s.text='a'.repeat(190);await r.action(s,'encrypt');await r.action(s,'decrypt');assert.equal(s.clear,s.text);const previous=s.cipher;
 s.text='a'.repeat(191);await r.action(s,'encrypt');assert.match(s.message,/190/);assert.equal(s.cipher,previous);s.text='汉'.repeat(63)+'a';await r.action(s,'encrypt');await r.action(s,'decrypt');assert.equal(s.clear,s.text);s.text='汉'.repeat(64);await r.action(s,'encrypt');assert.match(s.message,/190/);
 for(const text of ['','xy','00','<svg>']){s.cipher=text;await r.action(s,'decrypt');assert.equal(s.decrypted,false);assert.equal(s.clear,'');assert.match(s.message,/256字节/);}
 s.text='x'.repeat(20001);await r.action(s,'sign');assert.equal(s.signature,'');assert.match(s.message,/输入长度/);e.dom.window.close();
});
test('v67 crypto reset cannot be overwritten by an old asynchronous key generation',async()=>{
 const e=env(8),r=e.w.NOTE_LABS.registry['merged-15'],original=r.action;let completion;r.action=(...args)=>(completion=original(...args));const c=open(e,'merged-15');click(c,'keys');assert.ok(completion?.then);c.querySelector('[data-sim-reset]').click();await completion;await Promise.resolve();assert.match(c.querySelector('.ext-key').textContent,/尚未生成/);assert.equal(c.querySelector('[data-lab-act="sign"]').disabled,true);
 change(e,c,'text','<img src=x> &lt;b&gt;');assert.equal(c.querySelector('textarea[data-field="text"]').value,'<img src=x> &lt;b&gt;');assert.equal(c.querySelector('.note-lab img'),null);e.dom.window.close();
});
test('v67 firewall invalid packets rule limits and defaults preserve the policy state',()=>{
 const e=env(8),r=e.w.NOTE_LABS.registry['merged-16'],s=structuredClone(r.initial);const initial=JSON.stringify(s.rules);
 for(const [source,port]of [['256.1.1.1','80'],['1.2.3','80'],['1.2.3.4','0'],['1.2.3.4','65536'],['<img>','443']]){s.source=source;s.port=port;r.action(s,'send');assert.equal(s.last,null);assert.match(s.error,/有效IPv4/);assert.equal(JSON.stringify(s.rules),initial);}
 s.draftSource='10.20.0.0/33';r.action(s,'add');assert.equal(JSON.stringify(s.rules),initial);s.draftSource='*';s.draftPort='*';for(let i=0;i<10;i++)r.action(s,'add');assert.equal(s.rules.length,12);assert.match(s.error,/最多12/);
 s.rules=[];s.source='192.0.2.1';s.port='443';s.fallback='allow';r.action(s,'send');assert.equal(s.last.action,'allow');s.fallback='deny';r.action(s,'send');assert.equal(s.last.action,'deny');e.dom.window.close();
});
test('v67 retained network and phishing models change outcomes and reset with accurate timing',()=>{
 const e=env(8),net=open(e,'y2022q39');click(net,'attack');assert.equal(net.querySelectorAll('.lab-network .danger').length,2);click(net,'segment');assert.equal(net.querySelectorAll('.lab-network .danger').length,1);click(net,'fail');assert.match(net.querySelectorAll('.lab-output')[1].textContent,/不可达/);click(net,'redundant');assert.match(net.querySelectorAll('.lab-output')[1].textContent,/服务恢复可达/);assert.doesNotMatch(net.querySelectorAll('.lab-output')[1].textContent,/事先/);net.querySelector('[data-sim-reset]').click();assert.equal(net.querySelectorAll('.lab-network .danger').length,0);
 const phish=open(e,'y2021q18');click(phish,'inspect');assert.match(phish.querySelector('.lab-url').textContent,/claim-benefit.test/);click(phish,'verify');assert.match(phish.querySelector('.lab-browser-page').textContent,/没有该补贴/);change(e,phish,'message','1');assert.equal(phish.querySelector('.lab-browser-page'),null);click(phish,'verify');assert.match(phish.querySelector('.lab-browser-page').textContent,/公告内容与消息一致/);e.dom.window.close();
});
test('v67 search deep links expansion and narrow structure preserve real model state',()=>{
 const e=env(8,{url:'https://notes.example/chapter8.html#merged-15--point-2'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.match(e.d.getElementById('merged-15--point-2').textContent,/甲的私钥生成签名/);
 for(const [q,id,i]of [['自主可控','y2025q30',6],['蠕虫','y2020q28',6],['标准账户','syllabus-windows-security',4],['显式标识','y2026q30',3]]){const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`&&m.title),q);}
 const c=open(e,'syllabus-windows-security');click(c,'request');change(e,c,'credential','valid');click(c,'approve');change(e,c,'draft','11:22');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='数字签名';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(c.classList.contains('hidden'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-field="draft"]').value,'11:22');assert.equal(c.querySelector('[data-security-clock]').textContent,'09:00');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);click(c,'cancel');assert.equal(c.querySelector('[data-security-clock]').textContent,'09:00');
 assert.ok(c.querySelector('.note-lab table').closest('.lab-table-scroll'));assert.equal(c.querySelectorAll('style').length,0);assert.equal(c.querySelector('input[type="password"]'),null);const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[8];assert.equal(manifest.models,5);assert.equal(new Set(manifest.ids).size,5);for(const id of manifest.ids)assert.equal(e.w.NOTE_SIMULATIONS.demos[id]?.kind,'lab',id);e.dom.window.close();
});

test('v68 preserves eleven identities and every original semantic paragraph without source drift',()=>{
 const e=env(9),notes=e.w.NOTES.notes;assert.equal(notes.length,11);assert.equal(new Set(notes.map(n=>n.id)).size,11);
 for(const row of frontierV67.chapter9){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.equal(n.section,row.section);assert.deepEqual(JSON.parse(JSON.stringify(n.sources)),row.sources);assert.deepEqual(n.keys?JSON.parse(JSON.stringify(n.keys)):null,row.keys);assert.deepEqual(JSON.parse(JSON.stringify((n.related||[]).slice(0,row.related.length))),row.related);assert.deepEqual(JSON.parse(JSON.stringify((n.searchAliases||[]).slice(0,row.searchAliases.length))),row.searchAliases);
  for(let i=0;i<row.count;i++)assert.equal(digest(n.points[i]),row.pointHashes[i],`${n.id} point ${i}`);
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`),tmp=e.d.createElement('div');tmp.innerHTML=n.points[i];assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),tmp.textContent);}
 }e.dom.window.close();
});
test('v68 body directory and subtopics establish concepts before mechanisms in all eight sections',()=>{
 const e=env(9),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);
 for(let i=1;i<=8;i++)assert.ok(e.d.querySelector(`#section-9-${i} article`));
 for(const [a,b]of [['y2025q18','y2025q40'],['y2020q30','y2025q20'],['syllabus-quantum-basics','y2024q20']])assert.ok(body.indexOf(a)<body.indexOf(b));
 for(const n of e.w.NOTES.notes){const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));assert.deepEqual([...e.d.querySelectorAll(`#${n.id} [data-note-point]`)].map(p=>Number(p.dataset.notePoint)),order);const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 // Manual prerequisites: cloud meaning before service choice; HPC before speedup;
 // samples before command delivery; qubit representation before measurement; metaverse before privacy.
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));
 for(const [id,a,b]of [['y2026q39',2,0],['y2026q39',7,9],['merged-19',4,8],['y2025q18',4,0],['merged-17',4,5],['y2020q30',4,6],['syllabus-quantum-basics',2,3],['y2024q20',3,0]])assert.ok(order(id).indexOf(a)<order(id).indexOf(b),id);
 assert.equal(e.d.querySelector('#merged-19--point-10 a').hash,'#syllabus-mobile-communication');e.dom.window.close();
});
test('v68 formal v67 protection freezes other ten chapters all old models search and shared UX',()=>{
 for(const [file,expected]of Object.entries(frontierV67.protectedFiles))if(!v70Transferred(file)&&!v69Transferred(file))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 const fix=frontierV67.sharedTextCorrection,shared=fs.readFileSync(path.join(root,fix.file),'utf8');assert.equal(shared.split(fix.after).length,2);assert.ok(!shared.includes(fix.before));assert.equal(digest(shared.replace(fix.after,fix.before)),fix.hash);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==9&&r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except91011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row]of Object.entries(frontierV67.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!frontierIds.has(id)&&!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(frontierV67.referenceRows[id]||frontierIds.has(id)||databaseIds.has(id)||thinkingIds.has(id),id);
 const legacy=JSON.parse(fs.readFileSync(path.join(root,'content/legacy-demos.json'))),removed=['y2026q39','merged-19','y2025q24'];assert.deepEqual(Object.keys(legacy),Object.keys(frontierV67.legacyRows).filter(id=>!removed.includes(id)));for(const [id,v]of Object.entries(legacy))assert.equal(digest(JSON.stringify(v)),frontierV67.legacyRows[id],id);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(frontierV67.manifest);assert.deepEqual(manifest.chapters[9].ids.slice(0,2),base.chapters[9].ids);delete manifest.chapters[9];delete base.chapters[9];delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
});
test('v68 HPC separately allocates resources and snapshots a hand-computed 40-second task',()=>{
 const e=env(9),c=open(e,'y2026q39'),result=()=>c.querySelector('[data-hpc-result]');
 click(c,'start');assert.equal(result().dataset.seconds,'100');assert.equal(result().dataset.nodes,'1');click(c,'allocate');assert.equal(c.querySelector('[data-hpc-allocation]').dataset.nodes,'1');click(c,'cancel');assert.equal(result(),null);
 click(c,'allocate');click(c,'start');assert.equal(result().dataset.seconds,'40');assert.equal(result().dataset.speedup,'2.5');assert.equal(result().dataset.elapsed,'0');click(c,'step');assert.equal(result().dataset.elapsed,'10');assert.equal(result().querySelector('progress').value,0);click(c,'step');click(c,'step');assert.equal(result().querySelector('progress').value,0.5);
 change(e,c,'serial','100');change(e,c,'nodes','16');assert.equal(result().dataset.seconds,'40');assert.equal(c.querySelector('[data-hpc-allocation]').dataset.nodes,'4');click(c,'step');assert.match(result().textContent,/已完成/);click(c,'cancel');assert.equal(result().dataset.seconds,'40');e.dom.window.close();
});
test('v68 HPC shows non-linear speedup communication cost and no parallel work at 100 percent serial',()=>{
 const e=env(9),c=open(e,'y2026q39'),result=()=>c.querySelector('[data-hpc-result]');click(c,'allocate');change(e,c,'overhead','2');click(c,'start');assert.equal(result().dataset.seconds,'46');click(c,'cancel');change(e,c,'nodes','16');click(c,'allocate');click(c,'start');assert.equal(result().dataset.seconds,'55','20 serial + 5 parallel + 30 coordination');click(c,'cancel');
 change(e,c,'overhead','0');change(e,c,'serial','100');click(c,'start');assert.equal(result().dataset.seconds,'100');assert.ok(c.querySelector('[data-hpc-no-parallel]'));assert.equal(result().querySelector('progress'),null);for(let i=0;i<10;i++)click(c,'step');assert.match(result().textContent,/已完成/);assert.ok(c.querySelector('[data-hpc-no-parallel]'));
 change(e,c,'serial','0');change(e,c,'time','1');click(c,'start');assert.equal(result().dataset.seconds,'0.0625');click(c,'step');assert.equal(result().dataset.elapsed,'0.0625');assert.equal(result().querySelector('progress').value,1);e.dom.window.close();
});
test('v68 HPC rejects invalid drafts preserves allocation and requires resources after release',()=>{
 const e=env(9),c=open(e,'y2026q39');for(const n of ['','0','-1','1.5','17']){change(e,c,'nodes',n);click(c,'allocate');assert.equal(c.querySelector('[data-hpc-allocation]').dataset.nodes,'1');}
 for(const [f,v]of [['time',''],['time','0'],['time','3601'],['serial','101'],['serial','-1'],['overhead','31']]){change(e,c,f,v);click(c,'start');assert.equal(c.querySelector('[data-hpc-result]'),null);change(e,c,f,{time:'100',serial:'20',overhead:'0'}[f]);}
 click(c,'release');click(c,'start');assert.equal(c.querySelector('[data-hpc-result]'),null);change(e,c,'nodes','4');click(c,'allocate');click(c,'start');click(c,'release');assert.equal(c.querySelector('[data-hpc-allocation]').dataset.nodes,'4');change(e,c,'supply','cloud');assert.equal(c.querySelector('[data-hpc-result]').dataset.seconds,'40');
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-hpc-result]'),null);assert.equal(c.querySelector('[data-hpc-allocation]').dataset.nodes,'1');assert.equal(c.querySelector('[data-field="supply"]').value,'local');e.dom.window.close();
});
test('v68 IoT sampling uploading deciding and executing change four distinct states',()=>{
 const e=env(9),c=open(e,'merged-19'),text=x=>c.querySelector('[data-iot-'+x+']').textContent,fan=()=>c.querySelector('[data-iot-fan]').dataset.on;
 click(c,'decide');assert.match(text('command'),/无/);click(c,'sample');assert.match(text('sample'),/32℃/);assert.match(text('received'),/尚无/);assert.equal(fan(),'false');click(c,'upload');assert.match(text('received'),/32℃/);click(c,'decide');assert.match(text('command'),/开风扇/);assert.equal(fan(),'false');click(c,'execute');assert.equal(fan(),'true');assert.match(text('command'),/无/);
 change(e,c,'temperature','30');assert.match(text('sample'),/32℃/);click(c,'sample');assert.match(text('sample'),/30℃/);assert.match(text('received'),/32℃/);click(c,'upload');click(c,'decide');assert.match(text('command'),/关风扇/);assert.equal(fan(),'true');click(c,'execute');assert.equal(fan(),'false','strict > boundary, equal is off');e.dom.window.close();
});
test('v68 IoT failed network preserves cache and local control works only on its declared path',()=>{
 const e=env(9),c=open(e,'merged-19'),fan=()=>c.querySelector('[data-iot-fan]').dataset.on;click(c,'sample');click(c,'upload');change(e,c,'temperature','20');click(c,'sample');click(c,'network');click(c,'upload');assert.match(c.querySelector('[data-iot-received]').textContent,/32℃/);click(c,'decide');assert.match(c.querySelector('[data-iot-command]').textContent,/32℃/);click(c,'execute');assert.equal(fan(),'false');assert.match(c.querySelector('.lab-output').textContent,/未送达/);
 click(c,'network');assert.equal(fan(),'false');assert.match(c.querySelector('[data-iot-received]').textContent,/32℃/);click(c,'execute');assert.equal(fan(),'true','cached sample command does not silently use 20-degree draft');
 click(c,'network');change(e,c,'mode','local');click(c,'decide');assert.match(c.querySelector('[data-iot-command]').textContent,/20℃/);click(c,'execute');assert.equal(fan(),'false');e.dom.window.close();
});
test('v68 IoT invalid input stale commands cancellation and reset preserve confirmed actuator state',()=>{
 const e=env(9),c=open(e,'merged-19');click(c,'upload');assert.match(c.querySelector('.lab-output').textContent,/尚无/);click(c,'sample');click(c,'upload');click(c,'decide');change(e,c,'threshold','40');click(c,'execute');assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'false');assert.match(c.querySelector('[data-iot-command]').textContent,/无/);
 for(const v of ['','101','-51']){change(e,c,'temperature',v);click(c,'sample');assert.match(c.querySelector('[data-iot-sample]').textContent,/32℃/);}
 change(e,c,'threshold','');click(c,'decide');assert.match(c.querySelector('[data-iot-command]').textContent,/无/);change(e,c,'threshold','30');click(c,'decide');click(c,'cancel');click(c,'execute');assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'false');click(c,'decide');click(c,'execute');assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'true');c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'false');assert.match(c.querySelector('[data-iot-sample]').textContent,/尚无/);assert.equal(c.querySelector('[data-field="temperature"]').value,'32');e.dom.window.close();
});
test('v68 blockchain still exposes mutation and quantum comparison explicitly requires fresh preparation',()=>{
 const e=env(9),c=open(e,'merged-17');change(e,c,'block0','<img src=x onerror=alert(1)>');assert.equal(c.querySelector('.note-lab img'),null);click(c,'verify');assert.match(c.querySelector('.lab-output').textContent,/不一致区块/);click(c,'rehash');change(e,c,'mode','permissioned');click(c,'verify');assert.match(c.querySelector('.lab-output').textContent,/2/);c.querySelector('[data-sim-reset]').click();click(c,'verify');assert.match(c.querySelector('.lab-output').textContent,/一致；这不替代网络共识/);
 const q=open(e,'syllabus-quantum-basics');click(q,'scenario',2);assert.match(q.querySelector('.note-lab table').textContent,/每次重新制备等幅叠加态/);assert.match(q.querySelector('.note-lab table').textContent,/50%/);assert.match(q.querySelector('.core-caption').textContent,/独立情境对照/);q.querySelector('[data-sim-reset]').click();assert.match(q.querySelector('.note-lab table').textContent,/确定的二值状态/);e.dom.window.close();
});
test('v68 search returns distinct contextual additions while old deep links retain their meaning',()=>{
 const e=env(9,{url:'https://notes.example/chapter9.html#merged-18--point-3'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.match(e.d.getElementById('merged-18--point-3').textContent,/AR把数字信息叠加到现实环境/);
 for(const [q,id,i]of [['空间对准','merged-18',7],['高性能计算HPC','y2026q39',7],['任务依赖','y2026q39',8],['自然语言生成','y2025q20',4],['重新制备','syllabus-quantum-basics',3],['共享数字空间','y2024q20',3]]){const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`&&m.title),q);}
 const cloud=e.w.NOTE_SEARCH.search(index,'并行').find(n=>n.id==='y2026q39');assert.ok(new Set(cloud.matches.map(m=>m.title)).size>1);e.dom.window.close();
});
test('v68 expanded return search clearing and structural narrow layout preserve live model state',()=>{
 const e=env(9),c=open(e,'merged-19');click(c,'sample');click(c,'upload');click(c,'decide');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='量子';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(c.classList.contains('hidden'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.match(c.querySelector('[data-iot-command]').textContent,/开风扇/);assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'false');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();assert.ok(c.querySelector('dialog').open);c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);click(c,'execute');assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'true');
 const hpc=open(e,'y2026q39');click(hpc,'allocate');click(hpc,'start');for(const card of [c,hpc]){assert.equal(card.querySelectorAll('style').length,0);for(const table of card.querySelectorAll('.note-lab table'))assert.ok(table.closest('.lab-table-scroll'));}
 const m=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[9];assert.equal(m.models,4);assert.equal(new Set(m.ids).size,4);for(const id of m.ids)assert.equal(e.w.NOTE_SIMULATIONS.demos[id]?.kind,'lab',id);e.dom.window.close();
});
test('v68 uploading a local sample does not silently cancel a local-controller command',()=>{
 const e=env(9),c=open(e,'merged-19');change(e,c,'mode','local');click(c,'sample');click(c,'decide');click(c,'upload');assert.match(c.querySelector('[data-iot-command]').textContent,/开风扇/);assert.match(c.querySelector('.lab-output').textContent,/本次上传未生成新命令/);assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'false');click(c,'execute');assert.equal(c.querySelector('[data-iot-fan]').dataset.on,'true');e.dom.window.close();
});

test('v69 preserves twelve identities sixty-one historical point meanings and exactly two sourced corrections',()=>{
 const e=env(10),notes=e.w.NOTES.notes;assert.equal(notes.length,12);assert.equal(new Set(notes.map(n=>n.id)).size,12);
 for(const row of databaseV68.chapter10){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.equal(n.section,row.section);assert.deepEqual(JSON.parse(JSON.stringify(n.sources)),row.sources);assert.deepEqual(JSON.parse(JSON.stringify(n.keys||null)),row.keys);assert.deepEqual(JSON.parse(JSON.stringify((n.related||[]).slice(0,row.related.length))),row.related);assert.deepEqual(JSON.parse(JSON.stringify((n.searchAliases||[]).slice(0,row.searchAliases.length))),row.searchAliases);
  for(let i=0;i<row.count;i++){const fix=databaseV68.pointCorrections.find(x=>x.id===n.id&&x.index===i);if(fix){assert.equal(digest(fix.before),row.pointHashes[i]);assert.equal(n.points[i],fix.after);}else assert.equal(digest(n.points[i]),row.pointHashes[i],`${n.id} point ${i}`);}
  for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`),tmp=e.d.createElement('div');tmp.innerHTML=n.points[i];assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),tmp.textContent);}
 }assert.equal(databaseV68.pointCorrections.length,2);e.dom.window.close();
});
test('v69 actual body directory and subtopics put relational foundations before operations and design before NoSQL',()=>{
 const e=env(10),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);assert.equal(body.length,12);assert.equal(new Set(body).size,12);
 // Human prerequisite judgments: tuple/attribute before projection; relation operations before SQL analogy;
 // table definition before inserting; ER business modeling before design implementation; relational design before NoSQL comparison.
 for(const [a,b]of [['y2023q14','merged-20'],['merged-20','merged-21'],['y2024q47','y2025q12'],['y2025q12','y2023q15'],['y2020q13','y2025q42'],['y2020q14','y2025q11'],['y2025q11','y2026q12']])assert.ok(body.indexOf(a)<body.indexOf(b),a+' before '+b);
 for(let i=1;i<=3;i++)assert.ok(e.d.querySelector(`#section-10-${i} article`));
 for(const n of e.w.NOTES.notes){const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));assert.deepEqual([...e.d.querySelectorAll(`#${n.id} [data-note-point]`)].map(p=>Number(p.dataset.notePoint)),order);const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));
 for(const [id,a,b]of [['y2023q14',8,0],['y2023q14',0,1],['y2023q14',5,12],['y2024q47',4,0],['y2020q14',4,0],['y2025q11',1,3],['y2025q11',3,2],['y2026q12',9,5]])assert.ok(order(id).indexOf(a)<order(id).indexOf(b),id);
 e.dom.window.close();
});
test('v69 formal v68 protection freezes Chapters1-9 and11 old search manifest and v63 UX outside one scoped NoSQL scene',()=>{
 for(const [file,expected]of Object.entries(databaseV68.protectedFiles))if(!v70Transferred(file))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 const fix=databaseV68.sharedScene,shared=fs.readFileSync(path.join(root,fix.file),'utf8');assert.equal(shared.split(fix.after).length,2);assert.equal(digest(shared.replace(fix.after,fix.before)),fix.hash);
 const update=fs.readFileSync(path.join(root,'src/labs/chapter10/update.js'),'utf8'),u=databaseV68.updateDescription;assert.equal(digest(update.replace(u.after,u.before)),u.hash,'UPDATE logic retained');
 const db=fs.readFileSync(path.join(root,'src/labs/chapter10/database.js'),'utf8'),start=db.indexOf("register(['y2020q14']"),end=db.indexOf('\n})();',start);assert.equal(digest(db.slice(start,end)),databaseV68.retainedERHash);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==10&&r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.except1011);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row]of Object.entries(databaseV68.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!databaseIds.has(id)&&!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(databaseV68.referenceRows[id]||databaseIds.has(id)||thinkingIds.has(id),id);
 const legacy=JSON.parse(fs.readFileSync(path.join(root,'content/legacy-demos.json')));assert.deepEqual(Object.keys(legacy),Object.keys(databaseV68.legacyRows).filter(id=>id!=='y2025q24'));for(const [id,v]of Object.entries(legacy))assert.equal(digest(JSON.stringify(v)),databaseV68.legacyRows[id],id);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(databaseV68.manifest);delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
});
test('v69 SELECT executes snapshots and cancellation cannot silently replace confirmed rows',()=>{
 const e=env(10),c=open(e,'merged-21'),result=()=>c.querySelector('[data-select-result]');click(c,'run');assert.equal(result().dataset.count,'2');assert.deepEqual([...result().querySelectorAll('tbody tr')].map(x=>x.textContent),['赵敏92','王宁88']);
 change(e,c,'min','90');assert.equal(result().dataset.count,'2');assert.ok(c.querySelector('[data-select-dirty]'));assert.match(result().querySelector('pre').textContent,/>= 80/);click(c,'run');assert.equal(result().dataset.count,'1');assert.equal(result().querySelector('tbody').textContent,'赵敏92');
 change(e,c,'min','0');change(e,c,'order','ASC');click(c,'run');assert.equal(result().dataset.count,'4');assert.deepEqual([...result().querySelectorAll('tbody tr')].map(x=>x.textContent),['周林58','李明76','王宁88','赵敏92']);
 change(e,c,'sex','女');click(c,'cancelDraft');assert.equal(c.querySelector('[data-field="sex"]').value,'全部');assert.equal(result().dataset.count,'4');change(e,c,'min','100');click(c,'run');assert.equal(result().dataset.count,'0');assert.equal(result().querySelectorAll('th').length,2);assert.match(result().textContent,/列结构仍在/);e.dom.window.close();
});
test('v69 SELECT rejects empty nonfinite and out-of-range drafts without treating them as zero',()=>{
 const e=env(10),c=open(e,'merged-21');click(c,'run');const confirmed=c.querySelector('[data-select-result]').textContent;
 for(const v of ['','1e309','1000000001','0.1234567']){change(e,c,'min',v);click(c,'run');assert.equal(c.querySelector('[data-select-result]').dataset.count,'2');assert.match(c.querySelector('.lab-output').textContent,/有效阈值/);assert.match(c.querySelector('[data-select-result] pre').textContent,/>= 80/);}
 click(c,'cancelDraft');assert.equal(c.querySelector('[data-field="min"]').value,'80');assert.equal(c.querySelector('[data-select-result]').textContent,confirmed);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-select-result]'),null);assert.equal(c.querySelector('[data-field="order"]').value,'DESC');e.dom.window.close();
});
test('v69 relation domain writes are real and row column highlighting remains observable',()=>{
 const e=env(10),c=open(e,'y2023q14'),rows=()=>[...c.querySelectorAll('[data-key-students] tbody tr')];click(c,'column',2);assert.equal(c.querySelectorAll('[data-key-students] .lab-selected').length,3);assert.ok(rows().every(r=>r.children[2].querySelector('.lab-selected')));
 click(c,'row',0);assert.equal(c.querySelectorAll('[data-key-students] .lab-selected').length,4);change(e,c,'value','未说明');click(c,'writeGender');assert.equal(rows()[0].children[2].textContent,'未说明');change(e,c,'value','300');click(c,'writeGender');assert.equal(rows()[0].children[2].textContent,'未说明');assert.match(c.querySelectorAll('.lab-output')[1].textContent,/拒绝/);
 change(e,c,'value','男');click(c,'cancelDraft');assert.equal(c.querySelector('[data-field="value"]').value,'未说明');assert.equal(rows()[0].children[2].textContent,'未说明');c.querySelector('[data-sim-reset]').click();assert.equal(rows()[0].children[2].textContent,'女');assert.equal(rows().length,3);e.dom.window.close();
});
test('v69 keys enforce distinct primary domain and foreign-key rules with an explicit restrict policy',()=>{
 const e=env(10),c=open(e,'y2023q14'),students=()=>[...c.querySelectorAll('[data-key-students] tbody tr')],parents=()=>[...c.querySelectorAll('[data-key-parents] tbody tr')].map(r=>r.textContent);
 click(c,'deleteParent');assert.deepEqual(parents(),['A','B','C']);assert.equal(students().length,3);change(e,c,'classId','Z');click(c,'addStudent');assert.equal(students().length,3);change(e,c,'classId','A');click(c,'addStudent');assert.equal(students().length,4);assert.equal(students().at(-1).children[3].textContent,'A');click(c,'addStudent');assert.equal(students().length,4);
 change(e,c,'id','05');change(e,c,'classId','');click(c,'addStudent');assert.equal(students().length,5);assert.equal(students().at(-1).children[3].textContent,'NULL');change(e,c,'id','');click(c,'addStudent');assert.equal(students().length,5);
 click(c,'detach');assert.equal(students().filter(r=>r.children[3].textContent==='NULL').length,4);click(c,'deleteParent');assert.deepEqual(parents(),['B','C']);assert.equal(students().length,5);change(e,c,'id','06');change(e,c,'classId','A');click(c,'addStudent');assert.equal(students().length,5,'deleted parent cannot be referenced');click(c,'deleteParent');assert.deepEqual(parents(),['B','C']);
 c.querySelector('[data-sim-reset]').click();assert.deepEqual(parents(),['A','B','C']);assert.equal(students().length,3);e.dom.window.close();
});
test('v69 key sandbox escapes user names and limits rows without changing already committed data',()=>{
 const e=env(10),c=open(e,'y2023q14');change(e,c,'name','<b>甲</b>');click(c,'addStudent');assert.equal(c.querySelector('[data-key-students] tbody b'),null);assert.match(c.querySelector('[data-key-students]').textContent,/<b>甲<\/b>/);
 for(let id=5;id<=12;id++){change(e,c,'id',String(id));click(c,'addStudent');}assert.equal(c.querySelectorAll('[data-key-students] tbody tr').length,12);change(e,c,'id','13');click(c,'addStudent');assert.equal(c.querySelectorAll('[data-key-students] tbody tr').length,12);assert.match(c.querySelectorAll('.lab-output')[1].textContent,/最多12/);e.dom.window.close();
});
test('v69 relation operations use only participating input and retain all matching combinations and set semantics',()=>{
 const e=env(10),c=open(e,'merged-20'),math=e.w.NOTE_LABS.dataMath;change(e,c,'mode','project');change(e,c,'right','');assert.match(c.querySelector('.note-lab').textContent,/运算结果 · 2个元组/);change(e,c,'mode','select');change(e,c,'filter','Z');assert.match(c.querySelector('.note-lab').textContent,/结果为空关系/);change(e,c,'mode','join');assert.match(c.querySelector('.lab-output').textContent,/参与本次运算/);
 const x=math.relation({left:'01,甲,A\n01,乙,A\n01,甲,A',right:'01,A,88\n01,A,90\n01,B,70',mode:'join'});assert.equal(x.rows.length,4);assert.deepEqual(Array.from(x.rows,r=>Array.from(r)),[['01','甲','A','88'],['01','甲','A','90'],['01','乙','A','88'],['01','乙','A','90']]);
 change(e,c,'left','01,<b>甲</b>,A');change(e,c,'right','01,A,80');assert.equal(c.querySelector('.note-lab tbody b'),null);assert.match(c.querySelector('.note-lab').textContent,/<b>甲<\/b>/);c.querySelector('[data-sim-reset]').click();assert.match(c.querySelector('.note-lab').textContent,/运算结果 · 2个元组/);e.dom.window.close();
});
test('v69 SQL state transitions reject invalid records preserve empty schema and reset the editor as well as data',()=>{
 const e=env(10),c=open(e,'y2024q36'),first=()=>c.querySelector('.note-lab table'),run=sql=>{change(e,c,'sql',sql);click(c,'execute');};
 run('UPDATE students SET score = 60 WHERE id = 2;');assert.match(first().textContent,/李明60/);run('UPDATE students SET score = 70;');assert.equal([...first().querySelectorAll('tbody tr')].filter(r=>r.children[2].textContent==='70').length,4);
 run("INSERT INTO students (id,name,score) VALUES (5,'陈晨',75);");assert.equal(first().querySelectorAll('tbody tr').length,5);run("INSERT INTO students (id,name,score) VALUES (5,'重复',90);");assert.equal(first().querySelectorAll('tbody tr').length,5);assert.doesNotMatch(first().textContent,/重复/);run("INSERT INTO students (id,name,score) VALUES (1000000001,'超范围',75);");assert.equal(first().querySelectorAll('tbody tr').length,5);
 run("INSERT INTO students (id,name,score) VALUES (6,'缺值');");assert.match(c.querySelector('.lab-output').textContent,/本例不支持/);assert.equal(first().querySelectorAll('tbody tr').length,5);run('ALTER TABLE students ADD COLUMN note TEXT;');assert.equal(first().querySelectorAll('th').length,4);assert.ok([...first().querySelectorAll('tbody tr')].every(r=>r.children[3].textContent==='NULL'));run('ALTER TABLE students ADD COLUMN note TEXT;');assert.match(c.querySelector('.lab-output').textContent,/已经存在/);
 run('DELETE FROM students WHERE id = 99;');assert.equal(first().querySelectorAll('tbody tr').length,5);run('DELETE FROM students;');assert.equal(first().querySelectorAll('tbody tr').length,0);assert.equal(first().querySelectorAll('th').length,4);run('DROP TABLE students;');assert.equal(first(),null);run('SELECT * FROM students;');assert.match(c.querySelector('.lab-output').textContent,/已被DROP/);click(c,'reset');assert.equal(first().querySelectorAll('tbody tr').length,4);assert.equal(first().querySelectorAll('th').length,3);assert.equal(c.querySelector('[data-field="example"]').value,'delete');assert.equal(c.querySelector('[data-field="sql"]').value,'DELETE FROM students WHERE score < 60;');e.dom.window.close();
});
test('v69 retained ER model and NoSQL comparison distinguish cardinality and data models without claiming a new engine',()=>{
 const e=env(10),er=open(e,'y2020q14');assert.equal(er.querySelectorAll('svg line').length,4);change(e,er,'mode','one-one');assert.equal(er.querySelectorAll('svg line').length,2);change(e,er,'mode','many-many');assert.equal(er.querySelectorAll('svg line').length,6);er.querySelector('[data-sim-reset]').click();assert.equal(er.querySelectorAll('svg line').length,4);
 const no=open(e,'y2026q12');no.querySelector('[data-sim-choice="1"]').click();assert.match(no.querySelector('.document-store').textContent,/key: session:01/);assert.match(no.querySelector('.simulation-body').textContent,/静态结构对照/);no.querySelector('[data-sim-choice="3"]').click();assert.match(no.querySelector('.simulation-body').textContent,/取决于具体产品、配置与负载/);e.dom.window.close();
});
test('v69 search anchors expanded return and structural narrow tables retain committed sandbox state',()=>{
 const e=env(10,{url:'https://notes.example/chapter10.html#y2025q11--point-2'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.match(e.d.getElementById('y2025q11--point-2').textContent,/物理结构设计/);
 for(const [q,id,i]of [['实体完整性','y2023q14',11],['CREATE TABLE students','y2024q47',4],['人工管理阶段','y2020q13',4],['Not Only SQL','y2026q12',9]]){const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`&&m.title),q);}
 const c=open(e,'merged-21');click(c,'run');change(e,c,'min','90');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='NoSQL';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(c.classList.contains('hidden'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-select-result]').dataset.count,'2');assert.equal(c.querySelector('[data-field="min"]').value,'90');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);click(c,'cancelDraft');assert.equal(c.querySelector('[data-field="min"]').value,'80');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[10];assert.equal(manifest.models,6);for(const id of manifest.ids){const card=e.d.getElementById(id);if(card.querySelector('.simulation-toggle').getAttribute('aria-expanded')==='false')card.querySelector('.simulation-toggle').click();assert.equal(e.w.NOTE_SIMULATIONS.demos[id]?.kind,'lab');for(const t of card.querySelectorAll('.note-lab table'))assert.ok(t.closest('.lab-table-scroll'));assert.equal(card.querySelectorAll('style').length,0);}e.dom.window.close();
});

test('v70 preserves eleven historical identities and all fifty-three point meanings',()=>{
 const e=env(11),notes=e.w.NOTES.notes;assert.equal(notes.length,12);assert.equal(new Set(notes.map(n=>n.id)).size,12);
 assert.equal(thinkingV69.chapter11.reduce((sum,n)=>sum+n.count,0),53);
 for(const row of thinkingV69.chapter11){const n=notes.find(n=>n.id===row.id);assert.ok(n);assert.equal(n.section,row.section);assert.deepEqual(JSON.parse(JSON.stringify(n.sources)),row.sources);assert.deepEqual(JSON.parse(JSON.stringify(n.keys||null)),row.keys);assert.deepEqual(JSON.parse(JSON.stringify((n.related||[]).slice(0,row.related.length))),row.related);assert.deepEqual(JSON.parse(JSON.stringify((n.searchAliases||[]).slice(0,row.searchAliases.length))),row.searchAliases);
  for(let i=0;i<row.count;i++)assert.equal(digest(n.points[i]),row.pointHashes[i],`${n.id} point ${i}`);
 }
 for(const n of notes)for(let i=0;i<n.points.length;i++){const p=e.d.getElementById(`${n.id}--point-${i}`),tmp=e.d.createElement('div');tmp.innerHTML=n.points[i];assert.ok(p);assert.equal(p.closest('details'),null);assert.equal([...p.querySelectorAll(`[data-source-field="point-${i}"]`)].map(x=>x.textContent).join(''),tmp.textContent);}
 const added=notes.filter(n=>!thinkingV69.chapter11.some(row=>row.id===n.id));assert.deepEqual(Array.from(added,n=>n.id),['syllabus-algorithm-strategies']);assert.equal(added[0].origin,'syllabus');assert.equal(added[0].sources.length,0);assert.equal(added[0].keys.length,0);e.dom.window.close();
});
test('v70 actual body directory and subtopics establish algorithm and control prerequisites',()=>{
 const e=env(11),body=[...e.d.querySelectorAll('#notes-root article')].map(n=>n.id),toc=[...e.d.querySelectorAll('#note-list .note-list > li > a')].map(a=>a.hash.slice(1));assert.deepEqual(toc,body);assert.equal(new Set(body).size,12);
 // Human judgments: define algorithm before evaluation; control structures before tracing;
 // accumulation before post-test comparison; an algorithm-strategy entry before sorting specialization.
 for(const [a,b]of [['y2025q4','y2026q42'],['y2026q6','y2022q33'],['y2022q33','y2021q3'],['y2026q5','y2022q43'],['y2022q43','y2021q33'],['y2021q33','y2023q69'],['syllabus-algorithm-strategies','y2024q69']])assert.ok(body.indexOf(a)<body.indexOf(b),a+' before '+b);
 for(let i=1;i<=5;i++)assert.ok(e.d.querySelector(`#section-11-${i} article`));
 for(const n of e.w.NOTES.notes){const order=Array.from(e.w.NOTE_PRESENTATION.pointOrder(n));assert.deepEqual([...order].sort((a,b)=>a-b),Array.from(n.points,(_,i)=>i));assert.deepEqual([...e.d.querySelectorAll(`#${n.id} [data-note-point]`)].map(p=>Number(p.dataset.notePoint)),order);const sub=Array.from(e.w.NOTE_PRESENTATION.subtopics(n),x=>x.anchor);assert.deepEqual([...e.d.querySelectorAll(`#${n.id} .note-subtopics a`)].map(a=>a.hash.slice(1)),sub);assert.deepEqual([...e.d.querySelectorAll(`#drawer .directory-subtopics a[href^="#${n.id}--point-"]`)].map(a=>a.hash.slice(1)),sub);}
 const order=id=>Array.from(e.w.NOTE_PRESENTATION.pointOrder(e.w.NOTES.notes.find(n=>n.id===id)));
 for(const [id,a,b]of [['y2025q4',7,4],['y2026q42',4,5],['y2026q6',5,4],['y2022q33',5,3],['y2026q5',3,5],['y2025q24',0,4],['y2025q24',4,3],['syllabus-algorithm-strategies',4,5]])assert.ok(order(id).indexOf(a)<order(id).indexOf(b),id);e.dom.window.close();
});
test('v70 formal v69 protection freezes Chapters1-10 search all shared UX and other model registrations',()=>{
 for(const [file,expected]of Object.entries(thinkingV69.protectedFiles))assert.equal(digest(fs.readFileSync(path.join(root,file))),expected,file);
 const index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json'))).filter(r=>r.chapter!==11);assert.equal(digest(JSON.stringify(index)),thinkingV69.searchHashes.other);
 const refs=JSON.parse(fs.readFileSync(path.join(root,'content/references.json')));for(const [id,row]of Object.entries(thinkingV69.referenceRows)){assert.equal(digest(JSON.stringify(refs[id].slice(0,row.count))),row.hash,id);if(!thinkingIds.has(id))assert.equal(refs[id].length,row.count,id);}for(const id of Object.keys(refs))assert.ok(thinkingV69.referenceRows[id]||thinkingIds.has(id),id);
 const legacy=JSON.parse(fs.readFileSync(path.join(root,'content/legacy-demos.json')));assert.deepEqual(Object.keys(legacy),Object.keys(thinkingV69.legacyRows).filter(id=>id!=='y2025q24'));for(const [id,v]of Object.entries(legacy))assert.equal(digest(JSON.stringify(v)),thinkingV69.legacyRows[id],id);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))),base=structuredClone(thinkingV69.manifest);assert.deepEqual(manifest.chapters[11].ids.slice(0,8),base.chapters[11].ids);assert.deepEqual(manifest.chapters[11].files.slice(0,1),base.chapters[11].files);delete manifest.chapters[11];delete base.chapters[11];assert.deepEqual(manifest,base);
});
test('v70 cache builds real prefix data and repeated queries reuse confirmed storage',()=>{
 const e=env(11),c=open(e,'y2022q33'),cost=()=>[...c.querySelectorAll('[data-cache-costs] td')].map(x=>Number(x.textContent)),out=()=>c.querySelector('.lab-output').textContent;
 assert.ok(c.querySelector('[data-lab-act="cached"]').disabled);click(c,'scan');assert.match(out(),/结果7/);assert.deepEqual(cost(),[0,2,0,0]);click(c,'build');assert.deepEqual(cost(),[3,2,0,4]);assert.match(c.querySelectorAll('.note-lab table')[1].textContent,/前缀和03810/);
 click(c,'cached');assert.match(out(),/10−3=7/);click(c,'cached');assert.deepEqual(cost(),[3,2,2,4]);change(e,c,'left','1');change(e,c,'right','3');click(c,'cached');assert.match(out(),/10−0=10/);assert.deepEqual(cost(),[3,2,3,4]);
 change(e,c,'raw','9,9');click(c,'cached');assert.match(out(),/10−0=10/);click(c,'loadData');assert.deepEqual(cost(),[0,0,0,0]);assert.ok(c.querySelector('[data-lab-act="cached"]').disabled);click(c,'build');click(c,'cached');assert.match(out(),/18−0=18/);assert.deepEqual(cost(),[2,0,1,3]);e.dom.window.close();
});
test('v70 cache rejects invalid data and ranges preserves prior results and resets actual and estimated state',()=>{
 const e=env(11),c=open(e,'y2022q33'),cost=()=>c.querySelector('[data-cache-costs]').textContent;click(c,'build');click(c,'cached');const saved=cost();
 for(const raw of ['','1,2.5','1000','1,NaN,2','<img src=x onerror=1>',Array(31).fill(1).join(',')]){change(e,c,'raw',raw);click(c,'loadData');assert.equal(cost(),saved);assert.equal(c.querySelector('.note-lab img'),null);assert.match(c.querySelector('.lab-output').textContent,/载入被拒绝/);}
 for(const [l,r]of [['','3'],['0','3'],['2','4'],['3','2'],['1.5','2']]){change(e,c,'left',l);change(e,c,'right',r);click(c,'scan');assert.equal(cost(),saved);assert.match(c.querySelector('.lab-output').textContent,/查询被拒绝/);}
 change(e,c,'raw','-999,0,999');click(c,'loadData');click(c,'build');click(c,'cached');assert.match(c.querySelector('.lab-output').textContent,/0−0=0/);change(e,c,'n','10');change(e,c,'q','1');const widths=[...c.querySelectorAll('.lab-bar i')].map(x=>parseFloat(x.style.width));assert.ok(widths.every(x=>x<=100));assert.equal(Math.max(...widths),100);
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="raw"]').value,'3,5,2');assert.ok(c.querySelector('[data-prefix-empty]'));assert.deepEqual([...c.querySelectorAll('[data-cache-costs] td')].map(x=>x.textContent),['0','0','0','0']);e.dom.window.close();
});
test('v70 pre-test accumulation handles zero rounds invalid drafts termination and reset',()=>{
 const e=env(11),c=open(e,'y2022q43'),out=()=>c.querySelector('.lab-output').textContent;change(e,c,'n','0');assert.match(out(),/S=0.*i=1/);assert.ok(c.querySelector('[data-lab-act="run"]').disabled);assert.equal(c.querySelectorAll('.lab-tape span').length,0);
 change(e,c,'n','1');click(c,'step');assert.match(out(),/S=1.*i=2/);click(c,'step');assert.equal(c.querySelectorAll('.lab-tape span').length,1);change(e,c,'n','30');click(c,'run');assert.match(out(),/S=465.*i=31/);
 for(const v of ['','-1','31','1.5']){change(e,c,'n',v);assert.match(out(),/整数/);assert.ok(c.querySelector('[data-lab-act="run"]').disabled);assert.match(c.querySelector('.lab-registers').textContent,/S = 465/);}
 c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('[data-field="n"]').value,'10');assert.match(c.querySelector('.lab-registers').textContent,/S = 0/);click(c,'run');assert.match(out(),/S=55.*i=11/);e.dom.window.close();
});
test('v70 post-test flow executes before checking the limit and traces strict versus inclusive boundaries',()=>{
 const e=env(11),c=open(e,'y2021q33'),out=()=>c.querySelector('.lab-output').textContent;for(let i=0;i<3;i++)click(c,'step');assert.match(out(),/S=12，k=10.*已结束/);assert.equal(c.querySelectorAll('.note-lab tbody tr').length,3);click(c,'step');assert.equal(c.querySelectorAll('.note-lab tbody tr').length,3);
 change(e,c,'inclusive','true');for(let i=0;i<4;i++)click(c,'step');assert.match(out(),/S=22，k=13.*已结束/);change(e,c,'limit','1');click(c,'step');assert.match(out(),/S=1，k=4.*已结束/);
 for(const v of ['','0','32','2.5']){change(e,c,'limit',v);assert.match(out(),/整数边界/);assert.equal(c.querySelectorAll('.note-lab tbody tr').length,1);assert.ok(c.querySelector('[data-lab-act="step"]').disabled);}
 c.querySelector('[data-sim-reset]').click();for(let i=0;i<3;i++)click(c,'step');assert.match(out(),/S=12，k=10/);e.dom.window.close();
});
test('v70 three-number pseudocode uses independent comparisons and never coerces blank to zero',()=>{
 const e=env(11),c=open(e,'y2026q42'),out=()=>c.querySelector('.lab-output').textContent;change(e,c,'c','9');assert.match(out(),/输出 9/);change(e,c,'a','-3');change(e,c,'b','-8');change(e,c,'c','-5');assert.match(out(),/输出 -3/);change(e,c,'c','');assert.match(out(),/非空有限数值/);change(e,c,'c','-3');assert.match(out(),/输出 -3/);
 change(e,c,'mode','ambiguous');assert.match(out(),/无法推出唯一结果/);c.querySelector('[data-sim-reset]').click();assert.match(out(),/输出 8/);e.dom.window.close();
});
test('v70 two objects keep independent instance fields while methods read only confirmed values',()=>{
 const e=env(11),c=open(e,'y2025q24'),scores=()=>[...c.querySelectorAll('[data-object-states] tbody tr')].map(r=>Number(r.children[2].textContent)),out=()=>c.querySelector('.lab-output').textContent;
 assert.deepEqual(scores(),[]);click(c,'create','A');click(c,'create','B');assert.deepEqual(scores(),[59,80]);click(c,'create','A');assert.deepEqual(scores(),[59,80]);click(c,'select','A');change(e,c,'draft','60');click(c,'check');assert.match(out(),/成绩59.*假/);assert.deepEqual(scores(),[59,80]);click(c,'apply');assert.deepEqual(scores(),[60,80]);click(c,'check');assert.match(out(),/成绩60.*真/);
 change(e,c,'draft','77');click(c,'select','B');assert.deepEqual(scores(),[60,80]);assert.equal(c.querySelector('[data-field="draft"]').value,'80');change(e,c,'draft','0');click(c,'apply');assert.deepEqual(scores(),[60,0]);click(c,'check');assert.match(out(),/假/);e.dom.window.close();
});
test('v70 object methods reject invalid scores cancel drafts and reset both instances',()=>{
 const e=env(11),c=open(e,'y2025q24'),scores=()=>[...c.querySelectorAll('[data-object-states] tbody tr')].map(r=>r.children[2].textContent);click(c,'create','A');click(c,'create','B');click(c,'select','A');
 for(const v of ['','-1','101','1e309','<img src=x>']){change(e,c,'draft',v);click(c,'apply');assert.deepEqual(scores(),['59','80']);assert.match(c.querySelector('.lab-output').textContent,/拒绝/);assert.equal(c.querySelector('.note-lab img'),null);}
 change(e,c,'draft','100');click(c,'cancel');assert.equal(c.querySelector('[data-field="draft"]').value,'59');assert.deepEqual(scores(),['59','80']);change(e,c,'draft','100');click(c,'apply');assert.deepEqual(scores(),['100','80']);c.querySelector('[data-sim-reset]').click();assert.deepEqual(scores(),[]);assert.equal(c.querySelector('[data-field="draft"]'),null);e.dom.window.close();
});
test('v70 linear and binary search trace independent hand-worked five and three comparison paths',()=>{
 const e=env(11),c=open(e,'syllabus-algorithm-strategies'),r=()=>c.querySelector('[data-search-result]');click(c,'start');assert.equal(r().dataset.comparisons,'0');click(c,'run');assert.equal(r().dataset.found,'5');assert.equal(r().dataset.comparisons,'3');assert.deepEqual([...c.querySelectorAll('.note-lab tbody tr')].map(x=>x.children[4].textContent),['12','23','16']);click(c,'step');assert.equal(r().dataset.comparisons,'3');
 change(e,c,'mode','linear');click(c,'start');click(c,'run');assert.equal(r().dataset.found,'5');assert.equal(r().dataset.comparisons,'5');change(e,c,'mode','binary');change(e,c,'target','13');click(c,'start');click(c,'run');assert.equal(r().dataset.found,'');assert.equal(r().dataset.done,'true');assert.equal(r().dataset.comparisons,'3');e.dom.window.close();
});
test('v70 search handles empty singleton duplicates endpoint hits and unsorted binary rejection',()=>{
 const e=env(11),c=open(e,'syllabus-algorithm-strategies'),r=()=>c.querySelector('[data-search-result]');
 for(const [raw,target,found,count]of [['','0','',0],['-999','-999','1',1],['999','-999','',1],['1,1,1','1','2',1],['-999,0,999','-999','1',2],['-999,0,999','999','3',2]]){change(e,c,'raw',raw);change(e,c,'target',target);click(c,'start');click(c,'run');assert.equal(r().dataset.done,'true');assert.equal(r().dataset.found,found);assert.equal(r().dataset.comparisons,String(count));}
 change(e,c,'raw','2,1');change(e,c,'target','1');click(c,'start');assert.match(c.querySelector('.lab-output').textContent,/尚未按非降序/);assert.equal(r().dataset.found,'3','last confirmed result is retained');change(e,c,'mode','linear');click(c,'start');click(c,'run');assert.equal(r().dataset.found,'2');assert.equal(r().dataset.comparisons,'2');e.dom.window.close();
});
test('v70 search drafts cannot alter live execution invalid input is escaped and cancellation restores the snapshot',()=>{
 const e=env(11),c=open(e,'syllabus-algorithm-strategies'),r=()=>c.querySelector('[data-search-result]');click(c,'start');click(c,'step');assert.equal(r().dataset.comparisons,'1');change(e,c,'target','');click(c,'start');assert.equal(r().dataset.comparisons,'1');assert.ok(c.querySelector('[data-lab-act="run"]').disabled);click(c,'cancel');assert.equal(c.querySelector('[data-field="target"]').value,'16');click(c,'run');assert.equal(r().dataset.comparisons,'3');
 for(const raw of ['1,1.5','1000','1,NaN,2',Array(17).fill(0).join(','),'<img src=x onerror=1>']){change(e,c,'raw',raw);click(c,'start');assert.equal(r().dataset.comparisons,'3');assert.equal(r().dataset.found,'5');assert.equal(c.querySelector('.note-lab img'),null);assert.match(c.querySelector('.lab-output').textContent,/不开始/);}
 click(c,'cancel');assert.equal(c.querySelector('[data-field="raw"]').value,'2,5,8,12,16,23,38');c.querySelector('[data-sim-reset]').click();assert.equal(r(),null);assert.equal(c.querySelector('[data-field="target"]').value,'16');e.dom.window.close();
});
test('v70 retained queue GCD and counting models terminate on their declared input domains',()=>{
 const e=env(11),q=open(e,'y2021q3');click(q,'overtake');assert.equal(q.querySelectorAll('.lab-bridge span').length,0);for(const side of ['b','a','a','b','b','a','b','a'])click(q,'release',side);assert.equal([...q.querySelectorAll('.lab-bridge span')].map(x=>x.textContent).join(''),'EABFGCHD');assert.ok([...q.querySelectorAll('[data-lab-act="release"]')].every(x=>x.disabled));click(q,'release','a');assert.equal(q.querySelectorAll('.lab-bridge span').length,8);q.querySelector('[data-sim-reset]').click();assert.equal(q.querySelectorAll('.lab-bridge span').length,0);
 const g=open(e,'y2026q6');for(const [a,b,answer,rounds]of [['48','18',6,3],['6','3',3,1],['3','6',3,2],['1','1',1,1]]){change(e,g,'a',a);change(e,g,'b',b);click(g,'start');for(let i=0;i<rounds;i++)click(g,'step');assert.match(g.querySelector('.lab-output').textContent,new RegExp('最大公约数：'+answer));assert.ok(g.querySelector('[data-lab-act="step"]').disabled);}change(e,g,'a','0');click(g,'start');assert.match(g.querySelector('.lab-output').textContent,/不能输入0/);g.querySelector('[data-sim-reset]').click();assert.equal(g.querySelector('[data-field="a"]').value,'48');
 const c=open(e,'y2023q69');change(e,c,'raw','59,60,58');click(c,'load');for(let i=0;i<3;i++)click(c,'step');assert.match(c.querySelector('.lab-output').textContent,/3\/3 人，不及格 2 人/);click(c,'step');assert.equal(c.querySelectorAll('.note-lab tbody tr').length,3);change(e,c,'raw','');click(c,'load');assert.match(c.querySelector('.lab-output').textContent,/1—60/);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelectorAll('.note-lab tbody tr').length,0);e.dom.window.close();
});
test('v70 retained bubble trace separates one pass from a full stable sort and enforces its minimum',()=>{
 const e=env(11),c=open(e,'y2024q69'),values=()=>[...c.querySelectorAll('.ext-sort-array b')].map(x=>Number(x.textContent));click(c,'load');click(c,'pass');assert.deepEqual(values(),[5,2,8,7,3,9]);assert.match(c.querySelector('.lab-output').textContent,/一趟结束不代表/);click(c,'all');assert.deepEqual(values(),[2,3,5,7,8,9]);assert.ok(c.querySelector('[data-lab-act="step"]').disabled);
 change(e,c,'raw','2,2,1');click(c,'load');click(c,'all');assert.deepEqual(values(),[1,2,2]);assert.deepEqual([...c.querySelectorAll('.ext-sort-array small')].map(x=>x.textContent),['原位置3','原位置1','原位置2']);change(e,c,'raw','1');click(c,'load');assert.equal(c.querySelector('.ext-sort-array'),null);assert.match(c.querySelector('.lab-output').textContent,/2—12/);change(e,c,'raw','2,1');click(c,'load');click(c,'pass');assert.deepEqual(values(),[1,2]);c.querySelector('[data-sim-reset]').click();assert.equal(c.querySelector('.ext-sort-array'),null);e.dom.window.close();
});
test('v70 search deep links expanded return and live object drafts preserve identity and focus',()=>{
 const e=env(11,{url:'https://notes.example/chapter11.html#y2021q33--point-1'}),index=JSON.parse(fs.readFileSync(path.join(root,'generated/search-index.json')));assert.match(e.d.getElementById('y2021q33--point-1').textContent,/12/);
 for(const [q,id,i]of [['分解','y2025q4',7],['两个判断','y2026q42',5],['统计口径','y2022q33',5],['实例属性','y2025q24',5],['偶数长度','syllabus-algorithm-strategies',5]]){const hit=e.w.NOTE_SEARCH.search(index,q).find(n=>n.id===id);assert.ok(hit?.matches.some(m=>m.anchor===`${id}--point-${i}`&&m.title),q);}
 const c=open(e,'y2025q24');click(c,'create','A');change(e,c,'draft','90');const lab=c.querySelector('[data-lab]'),input=e.d.getElementById('search-input');input.value='二分查找';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));assert.ok(c.classList.contains('hidden'));e.d.getElementById('clear-search').click();assert.equal(c.querySelector('[data-lab]'),lab);assert.equal(c.querySelector('[data-field="draft"]').value,'90');
 e.w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};e.w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new e.w.Event('close'));};const opener=c.querySelector('[data-sim-expand]');opener.click();c.querySelector('[data-demo-close]').click();assert.equal(e.d.activeElement,opener);assert.equal(c.querySelector('[data-lab]'),lab);click(c,'cancel');assert.equal(c.querySelector('[data-field="draft"]').value,'59');
 e.d.getElementById('open-drawer').click();e.d.querySelector('#drawer a[href="#y2025q24--point-5"]').click();assert.equal(e.w.location.hash,'#y2025q24--point-5');assert.equal(e.d.activeElement.id,'y2025q24--point-5');assert.equal(c.querySelector('[data-lab]'),lab);e.dom.window.close();
});
test('v70 all ten registered models use shared controls and local table scrolling without claiming browser layout',()=>{
 const e=env(11),m=JSON.parse(fs.readFileSync(path.join(root,'src/labs/manifest.json'))).chapters[11];assert.equal(m.models,10);assert.equal(new Set(m.ids).size,10);
 for(const id of m.ids){const c=open(e,id);assert.equal(e.w.NOTE_SIMULATIONS.demos[id]?.kind,'lab',id);assert.equal(c.querySelectorAll('style').length,0);for(const t of c.querySelectorAll('.note-lab table'))assert.ok(t.closest('.lab-table-scroll'),id);assert.ok(c.querySelector('[data-sim-reset]'));assert.ok(c.querySelector('[data-sim-expand]'));}
 const c=e.d.getElementById('y2022q33');change(e,c,'raw',Array(30).fill(999).join(','));click(c,'loadData');click(c,'build');for(const t of c.querySelectorAll('.note-lab table'))assert.ok(t.closest('.lab-table-scroll'));e.dom.window.close();
});
