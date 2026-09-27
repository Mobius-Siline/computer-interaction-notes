/* Derived navigation/search: content remains the only source of truth. */
const text = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,key)=>key[0]==='#'?String.fromCodePoint(parseInt(key.slice(key[1]==='x'?2:1),key[1]==='x'?16:10)):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[key.toLowerCase()]).replace(/\s+/g,' ').trim();
const presentation = require('../notes-presentation.js');
module.exports = function discovery(notes, chapters, topics, demos={}, references={}) {
  const byId=new Map(notes.map(n=>[n.id,n])), topicIds=new Set();
  for(const note of notes) {
    presentation.validate(note);
    const ids=(note.related || []).map(link=>link.id);
    if(ids.length>3 || new Set(ids).size!==ids.length || ids.includes(note.id))throw Error(`Invalid related notes: ${note.id}`);
    for(const link of note.related || []) if(!byId.has(link.id)||!link.reason?.trim()||!link.label?.trim())throw Error(`Invalid related link: ${note.id}`);
    if(note.pointGroups) {
      const indices=note.pointGroups.flatMap(group=>group.indices);
      if(note.pointGroups.length<2||note.pointGroups.some(g=>!g.title||!g.indices.length)||indices.length!==note.points.length||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=note.points.length))throw Error(`Invalid point groups: ${note.id}`);
    }
  }
  const comparisons=topics.map(topic=>{
    if(!/^[a-z0-9-]+$/.test(topic.id)||topicIds.has(topic.id)||!topic.title||!topic.rows.length)throw Error(`Invalid comparison: ${topic.id}`);
    topicIds.add(topic.id);
    return {...topic, rows:topic.rows.map(row=>{
      if(row.cells.length!==topic.headers.length||!row.noteIds.length||row.noteIds.some(id=>!byId.has(id)))throw Error(`Invalid comparison row: ${topic.id}`);
      return {...row,notes:row.noteIds.map(id=>{const n=byId.get(id);return {id,title:n.title,chapter:n.chapter};})};
    })};
  });
  const navigation=Object.fromEntries(notes.map(note=>[note.id,{
    related:(note.related||[]).map(link=>({...link,chapter:byId.get(link.id).chapter})),
    topics:topics.filter(t=>t.rows.some(r=>r.noteIds.includes(note.id))).map(t=>({id:t.id,title:t.title}))
  }]));
  const learningText=(note,field)=>text(presentation.parts(note,field).filter(part=>part.role!=='demo').map(part=>part.text).join(''));
  const demoText=note=>text([...note.points.map((_,i)=>'point-'+i),'boundary','trigger'].flatMap(field=>presentation.parts(note,field).filter(part=>part.role==='demo').map(part=>part.text)).join(' '));
  const groupTitle=(note,i)=>(note.pointGroups||[]).find(group=>group.indices.includes(i))?.title||'';
  const index=notes.map(note=>({id:note.id,kind:'note',chapter:note.chapter,chapterTitle:chapters.find(c=>c.number===note.chapter).title,title:note.title,aliases:note.searchAliases||[],fields:[
    {anchor:`${note.id}--conclusion`,title:'核心结论',text:text(note.conclusion)},
    ...note.points.map((p,i)=>({anchor:`${note.id}--point-${i}`,title:presentation.pointMeta(note,i).title||groupTitle(note,i)||'相关内容',aliases:[presentation.pointMeta(note,i).navigationLabel||'',groupTitle(note,i)].filter(Boolean),text:learningText(note,'point-'+i)})),
    ...(learningText(note,'boundary')?[{anchor:`${note.id}--boundary`,title:'易错边界',text:learningText(note,'boundary')}]:[]),
    ...(demoText(note)?[{anchor:`${note.id}--demo-limits`,title:'本演示的范围与限制',text:demoText(note)}]:[]),
    ...(note.workedExamples||[]).map((example,i)=>({anchor:`${note.id}--worked-${i}`,title:`真题怎么判断 · ${example.year}年第${example.q}题`,text:[`${example.year} 第${example.q}题`,example.questionSummary,...example.reasoning,example.pitfall,example.transfer,example.historicalVersionNote||'',example.sourceStatus].map(text).join(' ')})),
    ...(note.comparison?[{anchor:`${note.id}--comparison`,title:note.comparison.caption||'知识点对照',text:[note.comparison.caption,...note.comparison.headers,...note.comparison.rows.flat()].map(text).join(' ')}]:[]),
    {anchor:`${note.id}--sources`,title:'来源与核验记录',text:learningText(note,'trigger')+' '+note.sources.map(s=>`${s.year} 第${s.q}题`).join(' ')+' '+(references[note.id]||[]).map(row=>text(row[0])).join(' ')},
    ...(demos[note.id]?[{anchor:`${note.id}--demo`,title:demos[note.id].title,text:demos[note.id].task}]:[])
  ]}));
  index.push(...topics.map(t=>({id:t.id,kind:'comparison',title:t.title,aliases:t.tags||[],fields:[{anchor:`compare-${t.id}`,text:[t.intro,...t.rows.flatMap(r=>r.cells)].join(' ')}]})));
  return {comparisons,navigation,index};
};
