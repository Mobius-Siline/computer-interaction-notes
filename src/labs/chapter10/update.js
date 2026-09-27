/* Preview matched rows, then apply UPDATE to this persistent local table. */
(() => {
  'use strict';
  const {register,ui}=window.NOTE_LABS;
  const {field,select,btn,table,output,esc}=ui;
  const matches=s=>s.rows.map((row,i)=>!s.where||row.id===s.id?i:-1).filter(i=>i>=0);
  register(['y2023q15'],'修改条件，先看命中行再执行UPDATE','浏览器内教学沙箱，不连接数据库。选择修改值和WHERE条件，连续操作同一张示例表。',{
    rows:[{id:'01',name:'王宁',score:88},{id:'02',name:'李明',score:56},{id:'03',name:'赵敏',score:92}],id:'02',score:'60',where:true,preview:null,last:[],message:'先预览范围，确认哪些行会被修改。'
  },s=>`<div class="lab-controls">${select('where','更新范围',String(s.where),[['true','WHERE：指定学号'],['false','不写WHERE：全表']])}${field('id','目标学号',s.id,'text',s.where?'maxlength="8"':'disabled')}${field('score','新的成绩',s.score,'number','min="0" max="100"')}${btn('预览命中行','preview')}${btn('执行UPDATE','run','',s.preview===null?'disabled':'')}</div><pre class="lab-code">${esc(`UPDATE students SET score = ${s.score}${s.where?` WHERE id = '${s.id.replaceAll("'", "''")}'`:''};`)}</pre>`+
    table(['学号','姓名','成绩'],s.rows.map((row,i)=>[esc(row.id),esc(row.name),`<span class="${s.preview?.includes(i)?'lab-highlight':s.last.includes(i)?'lab-selected':''}">${row.score}</span>`]))+output(esc(s.message)),
  (s,a)=>{
    if(a==='preview'){if(!s.score.trim()||!Number.isFinite(Number(s.score))||Number(s.score)<0||Number(s.score)>100){s.preview=null;s.message='本表成绩域是0—100的数值，请检查新成绩。';return;}s.preview=matches(s);s.last=[];s.message=`命中${s.preview.length}行，${s.where?'只修改学号相等的记录':'没有WHERE，本表所有记录都会更新'}；尚未执行。`;}
    if(a==='run'&&s.preview!==null){const before=s.preview.map(i=>`${s.rows[i].id}：${s.rows[i].score}→${Number(s.score)}`);for(const i of s.preview)s.rows[i].score=Number(s.score);s.last=[...s.preview];s.preview=null;s.message=before.length?'已修改 '+before.join('；')+'。其他记录保留。':'命中0行，表中没有数据被修改。';}
  },(s,k,v)=>{s[k]=k==='where'?v==='true':String(v);s.preview=null;s.last=[];s.message='条件或新值已改变，请重新预览范围。';});
})();
