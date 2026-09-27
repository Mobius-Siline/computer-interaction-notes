/* Chapter 10: database. Maintained source; edit this domain directly. */
/* Source provenance: note-labs.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
const keyInitial=()=>({row:-1,col:-1,value:'女',id:'04',name:'陈晨',classId:'A',parent:'A',classes:['A','B','C'],rows:[['01','王宁','女','A'],['02','李明','男','B'],['03','赵敏','女','A']],message:'点行或列辨认对象，再尝试写入。所有操作只影响本页教学数据。'});
const genderDomain=['男','女','未说明'];
register(['y2023q14'],'在关系表中分清元组、属性、域和约束','选中一行改性别，新增学生，再观察主键与外键检查是否允许状态改变。',keyInitial(),s=>
    `<section data-key-students><h4>学生表 · ${s.rows.length}行</h4>${table(['学号（主键）','姓名','性别','班级号（外键）'].map((v,i)=>btn(v,'column',i)),s.rows.map((r,i)=>r.map((v,j)=>`<button class="${s.row===i||s.col===j?'lab-selected':''}" data-lab-act="row" data-value="${i}">${v===null?'NULL':esc(v)}</button>`)))}</section>`+
    output(s.col>=0?`选中的是属性列；${s.col===2?'性别域是{男,女,未说明}，不只包括表中当前出现的值。':s.col===0?'主键用于唯一标识行。':s.col===3?'外键检查引用，不要求本列各行值互不相同。':'属性名与每行的属性值不同。'}`:s.row>=0?`选中了第${s.row+1}个元组（一整行）。`:'关系中的行称元组，列对应属性。')+
    `<div class="lab-controls">${select('value','性别草稿：用于写入选中行或新增学生',s.value,[['女','女'],['男','男'],['未说明','未说明'],['300','300（不在本例域中）']])}${btn('写入选中行的性别','writeGender')}${btn('取消输入草稿','cancelDraft')}</div>`+
    `<h4>新增一行：先检查值，再提交</h4><div class="lab-controls">${field('id','新学号（1—12位字母、数字、下划线或短横线）',s.id)}${field('name','新姓名（1—20字）',s.name)}${select('classId','新学生班级号',s.classId,[['A','A'],['B','B'],['C','C'],['Z','Z（初态不存在）'],['','NULL（尚未分班）']])}${btn('提交新增学生','addStudent')}</div>`+
    `<section data-key-parents><h4>班级表 · ${s.classes.length}行</h4>${table(['班级号（主键）'],s.classes.map(v=>[esc(v)]))}</section><div class="lab-controls">${select('parent','待删除班级',s.parent,[['A','A'],['B','B'],['C','C']])}${btn('删除班级','deleteParent')}${btn('将引用该班级的学生暂设为NULL','detach')}</div>`+
    output(esc(s.message))+coach('浏览器内教学沙箱，不连接数据库。此例学号唯一且非空，性别必须属于给定域，班级号是允许NULL的单列外键；非空值须引用现有班级。本例明确采用“仍被引用则阻止删除”策略，不自动级联。最多12名学生；这些输入范围是网页演示限制。'),
    (s,a,v)=>{
      if(a==='row'){const i=Number(v);if(Number.isInteger(i)&&s.rows[i]){s.row=i;s.col=-1;s.value=s.rows[i][2];}return;}
      if(a==='column'){const i=Number(v);if(Number.isInteger(i)&&i>=0&&i<4){s.col=i;s.row=-1;}return;}
      if(a==='cancelDraft'){Object.assign(s,{id:'04',name:'陈晨',classId:'A',value:s.rows[s.row]?.[2]||'女',message:'输入草稿已取消，已保存的两张表未改变。'});return;}
      if(a==='writeGender'){if(!s.rows[s.row]){s.message='请先选中学生表的一行。';return;}if(!genderDomain.includes(s.value)){s.message='拒绝写入：300不属于本例性别域；原行保持。';return;}s.rows[s.row][2]=s.value;s.message='性别值已写入选中行；主键、班级引用和行数未变。';return;}
      if(a==='addStudent'){
        const id=String(s.id).trim(),name=String(s.name).trim();
        if(!/^[A-Za-z0-9_-]{1,12}$/.test(id)||!name||name.length>20){s.message='拒绝新增：学号须非空且符合本例字符范围，姓名须为1—20字。';return;}
        if(s.rows.some(r=>r[0]===id)){s.message='拒绝新增：主键学号重复，原数据保持。';return;}
        if(!genderDomain.includes(s.value)){s.message='拒绝新增：性别值不属于给定域。';return;}
        if(s.classId!==''&&!s.classes.includes(s.classId)){s.message='拒绝新增：外键引用的班级不存在。';return;}
        if(s.rows.length>=12){s.message='本演示最多12名学生，请重置后继续；不是数据库行数限制。';return;}
        s.rows.push([id,name,s.value,s.classId===''?null:s.classId]);s.row=s.rows.length-1;s.col=-1;s.message='新增1行，主键、域和外键检查均满足；重复提交同一学号将被拒绝。';return;
      }
      if(a==='deleteParent'){
        if(!s.classes.includes(s.parent)){s.message='该班级已不存在，本次影响0行。';return;}
        if(s.rows.some(r=>r[3]===s.parent)){s.message='阻止删除：学生仍引用该班级。本例不自动级联删除学生。';return;}
        s.classes=s.classes.filter(x=>x!==s.parent);s.message='班级行已删除；学生行未删除。';return;
      }
      if(a==='detach'){let n=0;s.rows.forEach(r=>{if(r[3]===s.parent){r[3]=null;n++;}});s.message=`已将${n}名学生的班级号设为NULL；此例外键允许NULL，学生行仍在。`;}
    });
register(['y2020q14'],'从两个方向判断联系基数','切换业务规则，观察一对一、一对多和多对多的连接。',{mode:'one-many'},s=>{
    const pairs={'one-one':[[0,0],[1,1]],'one-many':[[0,0],[0,1],[0,2],[1,3]],'many-many':[[0,0],[0,1],[0,2],[1,1],[1,2],[1,3]]};const labels=s.mode==='many-many'?['出版社','书店']:s.mode==='one-one'?['人','身份证']:['班级','学生'];
    return `<div class="lab-controls">${select('mode','业务规则',s.mode,[['one-one','每人一个证号，每证号对应一人'],['one-many','一班多名学生，每生属于一班'],['many-many','多家出版社向多家书店供书']])}</div><svg class="lab-cardinality" viewBox="0 0 500 280" role="img" aria-label="实体联系图">${pairs[s.mode].map(([a,b])=>`<line x1="150" y1="${70+a*140}" x2="350" y2="${35+b*70}" stroke="#6d9981" stroke-width="2"/>`).join('')}${[0,1].map(i=>`<rect x="10" y="${45+i*140}" width="140" height="50" rx="8" fill="#e1eee0"/><text x="80" y="${76+i*140}" text-anchor="middle">${labels[0]} ${i+1}</text>`).join('')}${Array.from({length:s.mode==='one-one'?2:4},(_,i)=>`<rect x="350" y="${10+i*70}" width="140" height="50" rx="8" fill="#e9e8d7"/><text x="420" y="${41+i*70}" text-anchor="middle">${labels[1]} ${i+1}</text>`).join('')}</svg>${output({'one-one':'两边每个实例都只对应一个，属于一对一。','one-many':'班级能连多个学生，但每个学生只连一个班级，属于一对多。','many-many':'任一方向都可能对应多个实例，属于多对多。'}[s.mode])}`;
  },(s,a,v)=>{s.mode=v;});
})();

/* Source provenance: note-labs-audit.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui,clusteredChart,daysBetween}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
const studentRows=[['01','王宁','女',88],['02','李明','男',76],['03','赵敏','女',92],['04','周林','男',58]];
const selectDefaults={min:'80',sex:'全部',order:'DESC',fields:'姓名,成绩'};
function selectParams(s){const min=String(s.min).trim();if(!/^-?\d+(?:\.\d{1,6})?$/.test(min)||!Number.isFinite(Number(min))||Math.abs(Number(min))>1e9)throw Error('请输入有效阈值：本演示支持−10亿至10亿、最多6位小数；空输入不当作0。');if(!['全部','女','男'].includes(s.sex)||!['ASC','DESC'].includes(s.order)||!['姓名,成绩','学号,姓名,性别,成绩'].includes(s.fields))throw Error('请选择本演示提供的条件和字段。');return {min,sex:s.sex,order:s.order,fields:s.fields};}
const selectSQL=p=>`SELECT ${p.fields} FROM 学生 WHERE 成绩 >= ${Number(p.min)}${p.sex==='全部'?'':` AND 性别 = '${p.sex}'`} ORDER BY 成绩 ${p.order};`;
const selectDraft=s=>JSON.stringify([String(s.min),s.sex,s.order,s.fields]);
register(['merged-21'],'改查询条件，再运行SQL','区分输入草稿和已执行结果；只有执行查询后才重新计算结果集。',{...selectDefaults,result:null,executed:null,message:'等待执行。'},s=>{
 let sql;try{sql=selectSQL(selectParams(s));}catch{sql='草稿尚不完整：请先填写有效阈值和条件。';}
 const dirty=s.executed&&selectDraft(s)!==selectDraft(s.executed);
 return controls(field('min','最低成绩（查询阈值）',s.min,'number')+select('sex','性别条件',s.sex,[['全部','全部'],['女','女'],['男','男']])+select('order','成绩排序',s.order,[['DESC','降序'],['ASC','升序']])+select('fields','返回字段',s.fields,[['姓名,成绩','姓名、成绩'],['学号,姓名,性别,成绩','全部四列']]))+`<h4>当前输入草稿</h4><pre class="lab-code">${esc(sql)}</pre>`+controls(btn('执行查询','run')+btn('取消草稿','cancelDraft'))+`<h4>原学生表（查询不修改数据）</h4>`+table(['学号','姓名','性别','成绩'],studentRows)+(s.result?`<section data-select-result data-count="${s.result.rows.length}"><h4>已执行结果 · ${s.result.rows.length}行</h4><pre class="lab-code">${esc(s.result.sql)}</pre>${table(s.result.head,s.result.rows)}${dirty?'<p data-select-dirty>输入已修改，尚未执行；这里仍显示上次查询结果。</p>':''}${s.result.rows.length?'':'<p>没有满足条件的行；结果列结构仍在。</p>'}</section>`:'')+output(esc(s.message))+coach('这是浏览器内教学沙箱，不连接真实数据库。只演示给定字段、比较和排序；其他合法SQL不在本模型输入范围。取消草稿恢复上次执行参数，保留其结果；重置恢复固定初态。');
},(s,a)=>{
 if(a==='cancelDraft'){Object.assign(s,s.executed||selectDefaults);s.message=s.executed?'草稿已取消，已执行结果保持。':'草稿已取消，恢复初始条件，尚未执行。';return;}
 if(a==='run'){try{const p=selectParams(s),rows=studentRows.filter(r=>r[3]>=Number(p.min)&&(p.sex==='全部'||r[2]===p.sex)).sort((a,b)=>(a[3]-b[3])*(p.order==='ASC'?1:-1));s.executed={...p};s.result={head:p.fields.split(','),rows:p.fields.startsWith('学号')?rows:rows.map(r=>[r[1],r[3]]),sql:selectSQL(p)};s.message=`本次查询返回${rows.length}行；原表未修改。`;}catch(e){s.message=e.message+' 已执行结果保持。';}}
},(s,k,v)=>{if(Object.hasOwn(selectDefaults,k)){s[k]=v;s.message='条件草稿已修改，请执行查询或取消。';}});

})();

/* Source provenance: note-labs-data.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,esc}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
const area=(k,l,v)=>`<label>${l}<textarea data-field="${k}" rows="4">${esc(v)}</textarea></label>`;
const unique=rows=>rows.filter((r,i)=>rows.findIndex(x=>JSON.stringify(x)===JSON.stringify(r))===i);
function parseRelation(raw,n){const lines=String(raw).trim().split('\n');if(lines.length>12||!raw.trim())return null;const rows=lines.map(line=>line.split(/[,，]/).map(v=>v.trim()));if(rows.some(r=>r.length!==n||r.some(v=>!v||v.length>30)))return null;return unique(rows);}
function relation(s){const a=parseRelation(s.left,3),b=parseRelation(s.right,3);if(!a||(s.mode==='join'&&!b)||!['join','select','project'].includes(s.mode))return null;let rows,head;
   if(s.mode==='join'){head=['学号','姓名','班级','成绩'];rows=a.flatMap(x=>b.filter(y=>x[0]===y[0]&&x[2]===y[1]).map(y=>[...x,y[2]]));}
   if(s.mode==='select'){head=['学号','姓名','班级'];rows=a.filter(r=>r[2]===s.filter);}
   if(s.mode==='project'){head=s.columns==='class'?['班级']:['姓名','班级'];rows=unique(a.map(r=>s.columns==='class'?[r[2]]:[r[1],r[2]]));}
   return {a,b,head,rows};
 }
register(['merged-20'],'编辑两个关系，再做选择、投影与自然连接','同名属性要全部匹配，投影后实际去重；改学号或班级即可观察结果。',{
   left:'01,王宁,A\n02,李明,B\n03,赵敏,A',right:'01,A,88\n02,B,76\n01,B,91\n04,A,92',mode:'join',filter:'A',columns:'class'
 },s=>{const x=relation(s);return controls(area('left','关系S：每行 学号,姓名,班级',s.left)+area('right','关系T：每行 学号,班级,成绩',s.right)+select('mode','关系运算',s.mode,[['join','自然连接：S ⋈ T'],['select','选择：只筛选S中的行'],['project','投影：只取S中的列']])+(s.mode==='select'?field('filter','保留哪个班级',s.filter):'')+(s.mode==='project'?select('columns','保留哪些属性',s.columns,[['class','班级'],['name-class','姓名、班级']]):''))+
   (x?`<section class="ext-dataset"><h4>关系S · ${x.a.length}个元组</h4>${table(['学号','姓名','班级'],x.a.map(r=>r.map(esc)))}</section>${x.b?`<section class="ext-dataset"><h4>关系T · ${x.b.length}个元组</h4>${table(['学号','班级','成绩'],x.b.map(r=>r.map(esc)))}</section>`:'<p>当前单表运算只使用S，T的输入不参与本次计算。</p>'}<section class="ext-dataset"><h4>运算结果 · ${x.rows.length}个元组</h4>${table(x.head,x.rows.map(r=>r.map(esc)))}${x.rows.length?'':'<p>结果为空关系，属性结构仍在。</p>'}</section>`+output(s.mode==='join'?'共同属性是“学号”和“班级”，本例要求两者同时相等；同名列只保留一次。学号01、班级B不会误接到学号01、班级A。':s.mode==='project'?'关系代数投影会消除相同结果元组；投影班级时，多名同班学生只产生一个班级值。':'选择只筛选行，不减少属性列。'):output('参与本次运算的关系填写1—12行，每行3个非空字段，用逗号分隔；每个字段不超过30字。'))+coach('此处按关系代数的集合语义处理，完全相同的输入元组也去重；SQL普通SELECT通常保留重复结果，要用DISTINCT才去重。模型中的自然连接匹配全部同名属性，不是只看第一个同名字段。');},()=>{});
const initialDB=()=>({exists:true,columns:['id','name','score'],rows:[{id:1,name:'王宁',score:88},{id:2,name:'李明',score:56},{id:3,name:'赵敏',score:92},{id:4,name:'周林',score:null}]});
const queries={delete:'DELETE FROM students WHERE score < 60;',deleteAll:'DELETE FROM students;',update:'UPDATE students SET score = 60 WHERE id = 2;',insert:"INSERT INTO students (id, name, score) VALUES (5, '陈晨', 75);",alter:'ALTER TABLE students ADD COLUMN remark TEXT;',drop:'DROP TABLE students;',query:'SELECT * FROM students;'};
const display=v=>v===null?'<i>NULL</i>':esc(String(v));
const numeric=raw=>{const n=Number(raw);if((String(raw).split('.')[1]?.length||0)>6)throw Error('本例最多支持6位小数，超出精度范围不执行。');if(!Number.isFinite(n)||Math.abs(n)>1000000000)throw Error('本例数值须在−10亿到10亿之间，超出范围不执行。');return n;};
function predicate(clause,db){if(!clause)return ()=>true;let m=clause.trim().match(/^(id|score)\s+IS\s+(NOT\s+)?NULL$/i);if(m){const k=m[1].toLowerCase();return r=>m[2]?r[k]!==null:r[k]===null;}
   m=clause.trim().match(/^(id|score)\s*(<=|>=|<>|!=|=|<|>)\s*(-?\d+(?:\.\d+)?)$/i);if(!m||!db.columns.includes(m[1].toLowerCase()))throw Error('WHERE只支持id或score的单个数值比较，以及IS NULL / IS NOT NULL。');const k=m[1].toLowerCase(),v=numeric(m[3]);return r=>r[k]!==null&&({'=':r[k]===v,'<>':r[k]!==v,'!=':r[k]!==v,'<':r[k]<v,'>':r[k]>v,'<=':r[k]<=v,'>=':r[k]>=v}[m[2]]);
 }
function sqlExecute(db,raw){const sql=String(raw).trim().replace(/;\s*$/,'').trim();if(!db.exists)throw Error('students表已被DROP删除，后续命令不能再访问它；可用“恢复样例”或重置演示重新开始。');let m;
   if((m=sql.match(/^SELECT\s+\*\s+FROM\s+students(?:\s+WHERE\s+(.+))?$/i))){const hit=predicate(m[1],db);return {message:'查询完成；原表没有改动。',result:db.rows.filter(hit).map(r=>({...r})),changed:false};}
   if((m=sql.match(/^DELETE\s+FROM\s+students(?:\s+WHERE\s+(.+))?$/i))){const hit=predicate(m[1],db),n=db.rows.filter(hit).length;db.rows=db.rows.filter(r=>!hit(r));return {message:`DELETE删除了${n}行；表、字段和约束仍保留。`,changed:true};}
   if((m=sql.match(/^UPDATE\s+students\s+SET\s+score\s*=\s*(NULL|-?\d+(?:\.\d+)?)(?:\s+WHERE\s+(.+))?$/i))){const value=m[1].toUpperCase()==='NULL'?null:numeric(m[1]),hit=predicate(m[2],db);let n=0;db.rows.forEach(r=>{if(hit(r)){r.score=value;n++;}});return {message:`UPDATE匹配${n}行，只改score字段；行数与表结构保持。`,changed:true};}
   if((m=sql.match(/^INSERT\s+INTO\s+students\s*\(\s*id\s*,\s*name\s*,\s*score\s*\)\s*VALUES\s*\(\s*(\d+)\s*,\s*'((?:[^']|'')*)'\s*,\s*(NULL|-?\d+(?:\.\d+)?)\s*\)$/i))){const id=Number(m[1]);if(!Number.isSafeInteger(id)||id>1000000000||db.rows.some(r=>r.id===id))throw Error('插入失败：id须为0至10亿的不重复整数，本例把id声明为主键。');const row=Object.fromEntries(db.columns.map(k=>[k,null]));Object.assign(row,{id,name:m[2].replace(/''/g,"'"),score:m[3].toUpperCase()==='NULL'?null:numeric(m[3])});db.rows.push(row);return {message:'INSERT新增1行，原有记录保留。未提供的新字段取本例默认值NULL。',changed:true};}
   if((m=sql.match(/^ALTER\s+TABLE\s+students\s+ADD(?:\s+COLUMN)?\s+([a-z][a-z0-9_]*)\s+TEXT$/i))){const key=m[1].toLowerCase();if(!/^(remark|note|tag|extra_[a-z0-9_]+)$/.test(key))throw Error('本例新增列名支持remark、note、tag或extra_开头的名称；不支持其他或引用标识符。');if(db.columns.includes(key))throw Error('字段已经存在，不能重复添加。');if(db.columns.length>=7)throw Error('本例最多7列，请恢复样例后继续。');db.columns.push(key);db.rows.forEach(r=>r[key]=null);return {message:`ALTER TABLE新增${key}列，既有行仍在，新列值为NULL。`,changed:true};}
   if(/^DROP\s+TABLE\s+students$/i.test(sql)){db.exists=false;db.columns=[];db.rows=[];return {message:'DROP删除了students表对象；表结构和数据均已不存在。',changed:true};}
   throw Error('本例不支持这条语句。请参考上方语句形式：单条SELECT *、DELETE、UPDATE score、指定三列的INSERT、ADD TEXT列或DROP；不支持多语句、JOIN和事务语法。');
 }
register(['y2024q36'],'连续执行SQL：删行、改值、增列和删表各改哪层','每条命令都作用于上一次的结果；删表以后不会因点击其他命令自动恢复。',{
   db:initialDB(),sql:queries.delete,example:'delete',history:[],undo:[],result:null,message:'students包含4行，其中一行score为NULL。id是本例主键。'
 },s=>controls(select('example','载入语句示例',s.example,Object.entries({delete:'有条件删除',deleteAll:'删除全部行',update:'更新字段值',insert:'新增记录',alter:'新增字段',drop:'删除表对象',query:'查询当前表'})))+
   `<section class="ext-database"><h4>SQL编辑区 · 本地示例</h4>${area('sql','单条SQL（可直接修改）',s.sql)}${controls(btn('执行当前语句','execute'))}<h4>当前students表</h4>${s.db.exists?table(s.db.columns,s.db.rows.map(r=>s.db.columns.map(k=>display(r[k])))):'<p>表不存在。DROP已删除表对象。</p>'}${s.db.exists?`<p>表存在 · ${s.db.rows.length}行 · ${s.db.columns.length}列</p>`:''}${s.result?`<h4>本次查询结果</h4>${table(s.db.columns,s.result.map(r=>s.db.columns.map(k=>display(r[k]))))}`:''}</section>`+
   controls(btn('学习辅助：撤销上次数据变更','undo','',s.undo.length?'':'disabled')+btn('学习辅助：恢复样例','reset'))+output(esc(s.message))+`<ol class="ext-step-log">${s.history.slice(-5).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`+coach('这是浏览器内教学沙箱，不连接数据库，各卡数据独立。本卡score允许小数，正文CREATE TABLE的整数成绩例不与本卡共享表定义。ADD COLUMN … TEXT采用PostgreSQL兼容写法，其他DBMS的列关键字与类型可能不同。数值限±10亿且最多6位小数，id限0至10亿整数。新增列名限remark、note、tag或extra_开头。WHERE支持id/score的单个比较与IS NULL；NULL不满足普通大小比较。撤销与恢复样例是学习辅助，不是真实SQL命令，也不表示数据库一定能撤销已提交的DROP。'),
 (s,a)=>{if(a==='reset'){s.db=initialDB();s.sql=queries.delete;s.example='delete';s.result=null;s.undo=[];s.history=[];s.message='数据和SQL编辑区已恢复为固定初态4行。';return;}if(a==='undo'&&s.undo.length){s.db=s.undo.pop();s.result=null;s.message='已恢复本卡片上一次变更前的完整状态。';return;}if(a==='execute'){const before=structuredClone(s.db);try{const r=sqlExecute(s.db,s.sql);if(r.changed)s.undo.push(before);s.result=r.result||null;s.message=r.message;s.history.push(s.sql.trim()+' → '+r.message);}catch(e){s.db=before;s.result=null;s.message=e.message;}}},(s,k,v)=>{s[k]=v;if(k==='example')s.sql=queries[v];s.result=null;});
Object.assign(window.NOTE_LABS.dataMath ||= {}, {unique,parseRelation,relation,initialDB,predicate,sqlExecute});
})();
