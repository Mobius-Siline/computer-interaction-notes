/* Chapter 4: excel. Maintained source; edit this domain directly. */
/* Source provenance: note-labs.js:2. Preserve this closure. */
(() => {
'use strict';
const {daysBetween}=window.NOTE_LABS;
const {register,registry,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
const salaryRows=[10000,9500,3500,12000];
const salarySheet=(s,mode)=>table(['行','姓名',mode==='comments'?'证件编号（示意）':'基本工资'],s.values.map((v,i)=>[i+3,['王宁','李明','赵敏','周林'][i],`<button data-lab-drag="range" data-row="${i}" data-lab-act="cell" data-value="${i}" class="lab-cell ${i>=Math.min(s.start,s.end)&&i<=Math.max(s.start,s.end)?'lab-selected':''}">${mode==='comments'?['ID-001','ID-002','ID-003','ID-004'][i]:money(v)}${s.comments?.[i]?'<i class="lab-comment-corner"></i>':''}</button>`]));
register(['y2022q58'],'复制倍率，框选工资，再选择性粘贴','从第一格拖到最后一格选择区域；倍率和粘贴运算都会影响真实结果。',{values:salaryRows,start:-1,end:-1,multiplier:1.15,copied:null,paste:false,operation:'multiply',message:'先复制倍率单元格。'},s=>
    office('Excel','开始',btn('复制','copy')+btn('选择性粘贴…','paste'),`${field('multiplier','M1 倍率（初始选中）',s.multiplier,'number','step="0.01"')}${salarySheet(s)}${s.paste?dialog('选择性粘贴',select('operation','运算',s.operation,[['multiply','乘'],['add','加'],['subtract','减'],['divide','除'],['none','无（普通覆盖）']])+`<p>已复制：${s.copied??'空'}；目标：${s.start<0?'未选中':`J${Math.min(s.start,s.end)+3}:J${Math.max(s.start,s.end)+3}`}</p>`,btn('确定','apply')+btn('取消','cancel')):''}`)+`<div class="lab-controls">${btn('键盘辅助：选择 J3:J6','all')}</div>${output(s.message)}`,
    (s,a,v)=>{if(a==='copy'){s.copied=s.start<0?s.multiplier:s.values[s.start];s.message=`已复制 ${s.copied}，现在选中目标工资。`;}if(a==='cell')s.start=s.end=Number(v);if(a==='all'){s.start=0;s.end=3;}if(a==='paste')s.paste=true;if(a==='cancel')s.paste=false;if(a==='apply'){if(s.copied===null||s.start<0){s.message='需要先复制倍率并选择目标区域。';return;}if(s.operation==='divide'&&s.copied===0){s.message='本例不执行除以0：请取消后复制非零常数。';return;}s.values=s.values.map((x,i)=>i>=Math.min(s.start,s.end)&&i<=Math.max(s.start,s.end)?Math.round((s.operation==='multiply'?x*s.copied:s.operation==='add'?x+s.copied:s.operation==='subtract'?x-s.copied:s.operation==='divide'?x/s.copied:s.copied)*100)/100:x);s.paste=false;s.message='所选单元格的数值已改变；未选中的单元格保持原值。';}},(s,k,v)=>{s[k]=k==='multiplier'?number(v,0,100):v;if(k==='multiplier')s.start=s.end=-1;});
register(['y2022q59'],'工龄究竟是取整，还是只改显示','改变日期，看INT、ROUND和显示格式得出的区别。',{start:'2020-09-01',end:'2022-05-07'},s=>{
    const days=daysBetween(s.start,s.end),years=days/365;const valid=Number.isFinite(days)&&days>=0;
    return `<div class="lab-controls">${field('start','入职日期',s.start,'date')}${field('end','计算基准日',s.end,'date')}</div>${valid?office('Excel','公式',`<code>=INT((基准日-入职日)/365)</code>`,table(['方法','显示值','实际数值'],[['INT向下取整',Math.floor(years),Math.floor(years)],['ROUND四舍五入',Math.round(years),Math.round(years)],['原值只显示0位小数',Math.round(years),years.toFixed(6)]]))+output(`${days}天 ÷ 365 = ${years.toFixed(6)}。满365天才增加一个整年。`):output('请选择合法日期，且入职日期不得晚于基准日。')}${coach('为了可重复观察，这里手动指定基准日；实际公式TODAY()读取当天日期。')}`;
  },()=>{});
register(['y2022q61'],'复制说明，不覆盖证件编号','创建批注后选择多格，用选择性粘贴只复制批注。',{values:salaryRows,comments:['请核对原始证件','','',''],start:0,end:0,clipboard:null,paste:false,kind:'comments',message:'第一格已有批注，其他格没有。'},s=>
    office('Excel','开始 / 审阅',btn('复制','copy')+btn('选择性粘贴…','paste'),`${salarySheet(s,'comments')}${s.start>=0?`<aside class="lab-comment">批注：${esc(s.comments[s.start]||'无')}</aside>`:''}${s.paste?dialog('选择性粘贴',select('kind','粘贴',s.kind,[['comments','批注'],['format','格式']]),btn('确定','apply')+btn('取消','cancel')):''}`)+`<div class="lab-controls">${btn('键盘辅助：选择后3格','all')}</div>${output(s.message)}`,
    (s,a,v)=>{if(a==='cell')s.start=s.end=Number(v);if(a==='copy'){s.clipboard=s.comments[s.start];s.message='已复制所选单元格，接下来选择目标区域。';}if(a==='all'){s.start=1;s.end=3;}if(a==='paste')s.paste=true;if(a==='cancel')s.paste=false;if(a==='apply'){if(s.clipboard===null){s.message='请先复制带有批注的单元格。';return;}if(s.kind==='comments')s.comments=s.comments.map((x,i)=>i>=Math.min(s.start,s.end)&&i<=Math.max(s.start,s.end)?s.clipboard:x);s.message=s.kind==='comments'?'批注已复制；原始编号没有改变。':'仅复制格式，批注没有复制。';s.paste=false;}});
register(['y2022q66'],'为什么第4行看不见','分别制造行高过小、隐藏与筛选，再用对应命令恢复。',{cause:'short',fixed:false},s=>
    `<div class="lab-controls">${select('cause','模拟原因',s.cause,[['short','行高过小'],['hidden','行被隐藏'],['filter','筛选排除']])}</div>`+office('Excel','开始 / 数据',btn('自动调整行高','autofit')+btn('取消隐藏行','unhide')+btn('清除筛选','clear'),`<div class="lab-rows">${[3,4,5,6].map(n=>`<div ${n===4&&!s.fixed?(s.cause==='short'?'style="height:5px;overflow:hidden"':'hidden'):''}><b>${n}</b><span>产品${n-2}</span><span>${n*120}</span></div>`).join('')}</div>`)+output(s.fixed?'第4行已恢复。':`第4行因${{short:'行高过小',hidden:'隐藏',filter:'筛选'}[s.cause]}不可见。${s.message||''}`),
    (s,a)=>{if(a==={short:'autofit',hidden:'unhide',filter:'clear'}[s.cause])s.fixed=true;s.message=s.fixed?'':'所选命令不解决当前原因。';},(s,k,v)=>{s[k]=v;s.fixed=false;s.message='';});
const pivotData=[['产品1','一部','1月',12],['产品1','二部','1月',20],['产品1','一部','2月',8],['产品2','一部','1月',15],['产品2','二部','2月',30],['产品1','二部','2月',10]];
const gradeData=[['王宁','一班','2023/03/01',82,78,90],['李明','二班','2023/03/05',76,80,88],['赵敏','一班','2024/03/02',91,86,89],['王宁','一班','2023/03/12',88,81,92]].map(r=>[...r,r[3]+r[4]+r[5]]);
const pivotFields=s=>s.scenario==='grades'?['姓名','班级','日期','成绩','数学','外语','总分']:['产品','分部','月份','销量'];
const pivotLabel=name=>name==='成绩'?'成绩（计算机）':name;
register(['y2024q67'],'拖动多个字段，建立交叉汇总报表','行、列决定分组；多个成绩字段可并排留在值区域，结果从原始记录计算。',{
    zones:{row:[],column:[],value:[],filter:[]},scenario:'sales',monthly:false,filter:'全部',filterLabel:'',aggregate:'sum',picked:'产品',sourceValue:12,cachedValue:12,draftSource:'12',editingSource:false,message:'将产品拖到行，月份拖到列，销量拖到值。'
  },s=>{
    const grades=s.scenario==='grades',fields=pivotFields(s),data=grades?gradeData:pivotData.map((r,i)=>i===0?[...r.slice(0,3),s.cachedValue]:r);
    const source=grades?gradeData:pivotData.map((r,i)=>i===0?[...r.slice(0,3),s.sourceValue]:r),filterField=s.zones.filter[0],filterIndex=fields.indexOf(filterField);
    const zones=[['row','行'],['column','列'],['value','值'],['filter','筛选器']];
    const rows=data.filter(r=>!filterField||s.filter==='全部'||String(r[filterIndex])===s.filter).map(r=>r.map((v,i)=>grades&&s.monthly&&i===2?v.slice(0,7):v));
    const index=name=>fields.indexOf(name),groupKey=(r,zone)=>s.zones[zone].map(name=>r[index(name)]).join(' / ');
    const rnames=s.zones.row.length?[...new Set(rows.map(r=>groupKey(r,'row')))]:['总计'];
    const cnames=s.zones.column.length?[...new Set(rows.map(r=>groupKey(r,'column')))]:['总计'];
    const valueColumns=cnames.flatMap(name=>s.zones.value.map(metric=>({name,metric})));
    const aggregate=(set,metric)=>{const values=set.map(r=>r[index(metric)]),nums=values.filter(v=>typeof v==='number'&&Number.isFinite(v));if(!set.length)return '—';if(s.aggregate==='count')return values.filter(v=>v!==''&&v!=null).length;const sum=nums.reduce((a,b)=>a+b,0);return s.aggregate==='average'?(nums.length?money(sum/nums.length):'#DIV/0!'):money(sum);};
    const columnsFor=set=>valueColumns.map(({name,metric})=>aggregate(set.filter(r=>!s.zones.column.length||groupKey(r,'column')===name),metric));
    const resultRows=[];
    if(s.zones.row.length>1){
      const outer=s.zones.row[0];
      for(const name of [...new Set(rows.map(r=>r[index(outer)]))]){
        const group=rows.filter(r=>r[index(outer)]===name);resultRows.push([`<b>${esc(name)} 小计</b>`,...columnsFor(group)]);
        for(const rn of rnames.filter(rn=>group.some(r=>groupKey(r,'row')===rn)))resultRows.push([`<span style="padding-left:1.5em">${esc(rn.split(' / ').slice(1).join(' / '))}</span>`,...columnsFor(group.filter(r=>groupKey(r,'row')===rn))]);
      }
      resultRows.push(['<b>总计</b>',...columnsFor(rows)]);
    }else for(const rn of rnames)resultRows.push([esc(rn),...columnsFor(rows.filter(r=>!s.zones.row.length||groupKey(r,'row')===rn))]);
    const result=s.zones.value.length?table(['行标签',...valueColumns.map(({name,metric})=>esc(name)+(s.zones.value.length>1?' · '+pivotLabel(metric):''))],resultRows):'<p class="lab-empty">把字段放入值区域；数值可求和，文字可计数。</p>';
    const filterValues=[...new Set(data.map(r=>String(r[filterIndex])))],filterOptions=[['全部','全部'],...filterValues.map(v=>[v,v])];
    if(filterField&&s.filter!=='全部'&&!filterValues.includes(s.filter))filterOptions.push([s.filter,s.filter+'（当前无源记录）']);
    const filter=filterField?select('filter',s.filterLabel||filterField+'筛选',s.filter,filterOptions)+field('filterLabel','筛选字段显示名称',s.filterLabel||filterField+'筛选'):'';
    return `<div class="lab-controls">${select('scenario','源数据场景',s.scenario,[['sales','产品销量'],['grades','班级成绩：多个值字段']])}</div>`+
      (!grades?`<div class="lab-controls">${btn('修改第一条源销量','editSource','',s.editingSource?'disabled':'')}${btn('刷新透视表','refresh','',s.editingSource?'disabled':'')}</div><p data-pivot-source>源销量：${s.sourceValue}；报表已读取：${s.cachedValue}</p>${s.editingSource?dialog('修改源数据',field('draftSource','第一条销量（0—1000000）',s.draftSource,'number'),btn('确认源值','applySource')+btn('取消','cancelSource')):''}`:'')+
      office('Excel','数据透视表分析',select('aggregate','值汇总方式',s.aggregate,[['sum','求和'],['average','平均值'],['count','计数']])+(grades?btn(s.monthly?'取消日期组合':'日期 → 按年、月组合','group'):''),
        `<div class="lab-pivot-layout"><div>${filter}${result}</div><aside class="lab-fields"><b>数据透视表字段</b><div class="lab-field-bank">${fields.map(f=>`<button data-lab-drag="field" data-key="${f}" data-lab-act="pick" data-value="${f}" aria-pressed="${s.picked===f}">${pivotLabel(f)} <span>⠿</span></button>`).join('')}</div><div class="lab-drop-zones">${zones.map(([key,label])=>`<section data-lab-drop="${key}"><b>${label}</b>${s.zones[key].map(f=>btn(`${pivotLabel(f)} ×`,'remove',key+':'+f)).join('')||'<small>拖到这里</small>'}</section>`).join('')}</div></aside></div>`)+
      `<details class="lab-assist"><summary>键盘操作 / 查看源数据</summary><p>先选字段，再指定放入区域。多个字段可并排汇总；文字字段默认计数。本例统一切换全部值字段的汇总方式。</p>${zones.map(([key,label])=>btn(`放入${label}`,'place',key)).join('')}${table(fields.map(pivotLabel),source)}</details>`+output(s.message)+coach('本例每个字段只放一个区域，仅演示一个报表筛选字段，统一切换全部值字段的汇总方式；Excel还支持同字段多次放入值区域并分别设置。产品场景可修改第一条源销量，再手动刷新；未模拟自动刷新选项。');
  },(s,a,v)=>{
    if(a==='editSource'&&s.scenario==='sales'){s.editingSource=true;s.draftSource=String(s.sourceValue);}
    if(a==='cancelSource'){s.editingSource=false;s.draftSource=String(s.sourceValue);s.message='已取消源值草稿，源数据和报表均保留。';}
    if(a==='applySource'&&s.editingSource){const n=Number(s.draftSource);if(String(s.draftSource).trim()===''||!Number.isFinite(n)||n<0||n>1000000){s.message='请输入本演示支持的0—1000000有限数值；尚未修改源数据。';return;}s.sourceValue=n;s.editingSource=false;s.message='源数据已修改，报表仍显示上次读取的结果；请刷新。';}
    if(a==='refresh'&&!s.editingSource){s.cachedValue=s.sourceValue;s.message='已重新读取源数据，字段布局保留。';}
    if(a==='pick')s.picked=v;
    if(a==='remove'){const [zone,f]=v.split(':');s.zones[zone]=s.zones[zone].filter(x=>x!==f);if(zone==='filter')s.filter='全部';}
    if(a==='place')placeField(s,s.picked,v);
    if(a==='group'){s.monthly=!s.monthly;s.message=s.monthly?'日期按年、月合并；不同年份的3月保持分开。':'恢复逐日显示。';}
  },(s,k,v)=>{
    s[k]=v;
    if(k==='scenario'){s.editingSource=false;s.draftSource=String(s.sourceValue);s.zones={row:[],column:[],value:[],filter:[]};s.filter='全部';s.filterLabel='';s.monthly=false;s.picked=v==='grades'?'姓名':'产品';s.message='已更换源数据，请重新放置字段。';}
  });
function placeField(s,field,zone){
    const fields=pivotFields(s),metrics=fields.slice(3),previousFilter=s.zones.filter[0];
    if(!fields.includes(field)||!Object.hasOwn(s.zones,zone))return;
    if(zone==='value'&&!metrics.includes(field))s.aggregate='count';
    for(const key of Object.keys(s.zones))s.zones[key]=s.zones[key].filter(f=>f!==field);
    if(zone==='filter')s.zones.filter=[];
    s.zones[zone].push(field);if(s.zones.filter[0]!==previousFilter){s.filter='全部';s.filterLabel='';}
    s.message=`${pivotLabel(field)}已放入${{row:'行',column:'列',value:'值',filter:'筛选器'}[zone]}区域，报表已重新计算。`;
  }
const products=[['产品1','BKC-001',2322],['产品2','BKC-002',1628],['产品3','BKC-003',3120],['产品4','BKC-004',670]];
register(['y2020q57'],'精确查价，再比较数量折扣','拖动填充柄；切换数量折扣，观察19件与20件的不同结果。',{
    locked:true,exact:true,col:3,filled:0,selected:0,task:'lookup',quantities:[19,20,21,20],lookupKey:'产品2',prices:[2322,1628,3120,670],editLookup:false,draftKey:'产品2',draftPrice:'1628',lookupMessage:''
  },s=>{
    const names=[s.lookupKey,'产品4','产品1','产品3'],source=products.map((r,i)=>[r[0],r[1],s.prices[i]]);
    const formula=i=>`${s.task==='discount'?`=IF(F${i+3}>=20,0.95,1)*`:'='}VLOOKUP(D${i+3},产品信息!${s.locked?'$A$2:$C$5':`A${i+2}:C${i+5}`},${s.col},${s.exact?'FALSE':'TRUE'})`;
    const rows=names.map((name,i)=>{
      const pool=s.locked?source:source.slice(i);
      const row=s.exact?pool.find(r=>r[0]===name):pool.filter(r=>r[0]<=name).at(-1);
      const result=s.col>3?'#REF!':!row?'#N/A':s.task==='discount'?money(row[2]*(s.quantities[i]>=20?.95:1)):row[s.col-1];
      return [i+3,esc(name),...(s.task==='discount'?[field('quantity'+i,'第'+(i+3)+'行数量',s.quantities[i],'number','min="1" step="1"'),s.quantities[i]>=20?'0.95':'1']:[]),`<div class="lab-lookup-cell" data-fill-index="${i}">${i<=s.filled?esc(result):'—'}${i===0?'<button data-lab-drag="fill" class="lab-fill-handle" aria-label="向下拖动填充柄"></button>':''}</div>`];
    });
    return `<div class="lab-controls">${select('task','任务',s.task,[['lookup','查找单价'],['discount','数量达到20件享95折']])}</div>`+
      office('Excel','公式',`<code class="lab-formula">${esc(formula(s.selected))}</code>`,table(['行','D 产品名称',...(s.task==='discount'?['F 数量','IF折扣系数']:[]),'G '+(s.task==='discount'?'折后单价':'查找结果')],rows))+
      `<div class="lab-controls">${select('locked','查找区域',String(s.locked),[['true','绝对引用（固定）'],['false','相对引用（漂移）']])}${select('exact','匹配方式',String(s.exact),[['true','FALSE 精确匹配'],['false','TRUE 近似匹配']])}${s.task==='lookup'?select('col','返回第几列',s.col,[[1,'1 产品名'],[2,'2 编号'],[3,'3 单价'],[4,'4 超出区域列数']]):''}${btn('键盘辅助：向下填充','fill')}</div>`+
      `<details class="lab-assist"><summary>产品信息源表</summary>${table(['A 产品名','B 编号','C 单价'],source)}</details>`+
      btn('修改查找键与源价格…','editLookup')+(s.editLookup?dialog('查找数据',field('draftKey','D3查找键',s.draftKey,'text','maxlength="30"')+field('draftPrice','源表产品2单价',s.draftPrice,'number','min="0" max="1000000" step="0.01"')+'<p>确定后源表与结果一起更新；取消保留已确认数据。</p>',btn('确定','applyLookup')+btn('取消','cancelLookup')):'')+output(esc(s.lookupMessage))+coach('只模拟这张升序产品表与字面产品名；含通配符的合法Excel查找键尚未模拟。价格为有限非负数；网页不读取真实工作簿。')+
      output(s.task==='discount'?'IF先判断数量是否≥20，再把查回的单价乘折扣系数。本列是折后单价；销售额还要再乘数量。':!s.exact?'本例首列已升序排列。TRUE近似匹配可能用另一产品替代；按产品查价应使用FALSE。':'填充时查找值的行号逐行变化，源区域应固定；找不到返回#N/A。');
  },(s,a)=>{
    if(a==='fill')s.filled=3;
    if(a==='editLookup'){s.editLookup=true;s.draftKey=s.lookupKey;s.draftPrice=String(s.prices[1]);s.lookupMessage='';}
    if(a==='cancelLookup'){s.editLookup=false;s.lookupMessage='已取消，查找键与源价格未改变。';}
    if(a==='applyLookup'){
      if(!s.draftKey.trim()||/[~*?]/.test(s.draftKey)||s.draftKey.length>30){s.lookupMessage='演示未支持空键或通配符；请使用字面产品名，例如产品2或产品9。';return;}
      const price=Number(s.draftPrice);if(s.draftPrice.trim()===''||!Number.isFinite(price)||price<0||price>1000000){s.lookupMessage='请输入0—1000000的有限价格；原价格保留。';return;}
      s.lookupKey=s.draftKey;s.prices[1]=price;s.editLookup=false;s.lookupMessage='已更新源表；第3行按新键查找，已填充行也重新计算。';
    }
  },(s,k,v)=>{
    if(k==='draftKey'||k==='draftPrice'){s[k]=v;return;}
    if(k.startsWith('quantity'))s.quantities[Number(k.slice(8))]=Math.round(number(v,1,10000));
    else if(k==='task'){s.task=v;if(v==='discount')s.col=3;}
    else s[k]=k==='col'?Number(v):v==='true';
  });
register(['y2020q52'],'改数据，观察条件格式重新判断','比较数值规则与重复编号；修改一个编号后，两处高亮会一起变化。',{
    values:salaryRows,ids:['A01','A02','A01','A04'],rule:'average',threshold:9000,upper:12000,top:2
  },s=>{
    const nums=s.values.filter(v=>v!==''&&Number.isFinite(Number(v))).map(Number);
    const avg=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:NaN;
    const duplicate=s.rule==='duplicate',ranked=[...nums].sort((a,b)=>b-a),cutoff=ranked[Math.min(s.top,ranked.length)-1];
    const rows=s.values.map((v,i)=>{
      const value=duplicate?s.ids[i]:v;
      const hit=duplicate?value!==''&&s.ids.filter(x=>x.toLocaleLowerCase()===value.toLocaleLowerCase()).length>1:v!==''&&(s.rule==='average'?Number(v)>avg:s.rule==='between'?Number(v)>=s.threshold&&Number(v)<=s.upper:s.rule==='top'?Number(v)>=cutoff:Number(v)<s.threshold);
      return [['王宁','李明','赵敏','周林'][i],`<div class="${hit?'lab-highlight':''}">${field((duplicate?'id':'salary')+i,duplicate?'编号':'工资',value,duplicate?'text':'number')}</div>`];
    });
    return office('Excel','开始 · 条件格式',select('rule','规则',s.rule,[['average','高于平均值'],['below','小于…'],['between','介于…（含两端）'],['top','前N项'],['duplicate','重复值：编号']])+(['below','between'].includes(s.rule)?field('threshold',s.rule==='below'?'阈值':'下限',s.threshold,'number'):'')+(s.rule==='between'?field('upper','上限',s.upper,'number'):'')+(s.rule==='top'?field('top','前几项',s.top,'number','min="1" max="4"') :''),table(['姓名',duplicate?'编号':'工资'],rows))+
      output(duplicate?'重复编号的每一次出现都着色，原始记录不删除；空白不参与本例判重。':`当前平均值 ${Number.isFinite(avg)?money(avg):'无数值'}（空白不参与平均）。${s.rule==='between'&&s.threshold>s.upper?'下限大于上限，本演示没有符合项；请修正上下限。':s.rule==='top'?'按数值排名，并列边界一并着色。':''}改变数据后重新判断。`);
  },()=>{},(s,k,v)=>{if(k.startsWith('salary'))s.values[Number(k.slice(6))]=v===''?'':number(v,0,1000000);else if(k.startsWith('id'))s.ids[Number(k.slice(2))]=v;else s[k]=k==='top'?Math.round(number(v,1,4)):['threshold','upper'].includes(k)?number(v,0,1000000):v;});
register(['y2024q57'],'在Excel中直接用通配符清理部门名称','编辑查找内容与替换文字，观察所选列实际被替换的结果。',{values:['销售部-01','财务部-02','综合部-03'],find:'-*',replacement:'',pane:false,message:'仅处理部门列，订单编号不会改动。'},s=>
    office('Excel','开始',btn('查找和选择 → 替换','open'),`${table(['订单编号','部门'],s.values.map((v,i)=>['DD-00'+(i+1),esc(v)]))}${s.pane?dialog('查找和替换',field('find','查找内容',s.find)+field('replacement','替换为',s.replacement),btn('全部替换','replace')+btn('关闭','close')):''}`)+output(s.message)+coach('Excel直接识别*、?、~，这里没有“使用通配符”复选框。试试把-*改为-0?，或用~*查找真正的星号。'),
    (s,a)=>{if(a==='open')s.pane=true;if(a==='close')s.pane=false;if(a==='replace'){if(!s.find){s.message='本卡片请提供非空查找表达式。';return;}let pattern='';for(let i=0;i<s.find.length;i++){const ch=s.find[i];if(ch==='~'&&i+1<s.find.length)pattern+=s.find[++i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');else pattern+=ch==='*'?'.*':ch==='?'?'.':ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}const rx=new RegExp(pattern,'g');let count=0;s.values=s.values.map(v=>v.replace(rx,match=>{if(!match)return match;count++;return s.replacement;}));s.message=`已替换${count}处；订单编号列保持不变。`;}});
registry.y2024q67.dropField=placeField;
Object.assign(window.NOTE_LABS,{placeField});
})();

/* Source provenance: note-labs-2021.js:2. Preserve this closure. */
(() => {
'use strict';
const {clusteredChart}=window.NOTE_LABS;
const {register,registry,ui} = window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money} = ui;
register(['y2021q9'],'外部链接与多表汇总是两种关系','改变源单元格，切换公式模式，观察引用对象和结果。',{mode:'external',jan:80,feb:100,mar:120,external:260,cached:260,path:true},s=>{
    const expr=s.mode==='external'?"='[工资.xlsx]明细'!$B$2":'=SUM(一月:三月!B2)';
    return `<div class="lab-controls">${select('mode','引用范围',s.mode,[['external','另一工作簿的一个单元格'],['3d','本工作簿的多张表']])}</div>`+office('Excel','公式',`<code>${esc(expr)}</code>`,s.mode==='external'?`${field('external','源：工资.xlsx / 明细 / B2',s.external,'number')}${table(['本簿结果'],[[money(s.cached)]])}`:`<div class="lab-controls">${field('jan','一月!B2',s.jan,'number')}${field('feb','二月!B2',s.feb,'number')}${field('mar','三月!B2',s.mar,'number')}</div>${table(['三维汇总'],[[money(Number(s.jan)+Number(s.feb)+Number(s.mar))]])}`)+`<div class="lab-controls">${s.mode==='external'?btn(s.path?'模拟源路径失效':'恢复源路径','path'):''}</div>${output(s.mode==='external'?(s.path?'':'源路径失效，保留上次取得的值，无法更新。')+'[工作簿]、工作表、!、单元格地址共同定位来源；$只负责复制时锁定行列。':'一月:三月是工作表区间，包含其中的二月；不是单个工作簿文件名。')}`;
  },(s,a)=>{if(a==='path'){s.path=!s.path;if(s.path)s.cached=s.external;}},(s,k,v)=>{s[k]=v;if(k==='external'&&s.path)s.cached=v;});
register(['y2021q25'],'给单元格设规则，再亲自输入','设置序列或文本长度，比较停止与警告的实际后果。',{pane:false,rule:'list',warning:'stop',enabled:false,value:'男',draft:'男',error:false,appliedRule:'list',appliedWarning:'stop',message:'未应用数据验证。'},s=>
    office('Excel','数据',btn('数据验证','open','',s.pane||s.error?'disabled':''),`${table(['B2 当前值','输入新值'],[[esc(s.value),field('draft','B2编辑',s.draft,'text',s.pane||s.error?'disabled':'')]])}${s.enabled&&!s.pane&&!s.error&&s.appliedRule==='list'?select('candidate','下拉候选（选择后提交）','',[['','请选择'],['男','男'],['女','女']])+'<p>输入提示：请选择男或女；也可键入后提交。</p>':''}${btn('提交输入','commit','',s.pane||s.error?'disabled':'')}${s.pane?dialog('数据验证',select('rule','允许',s.rule,[['list','序列：男,女'],['length','文本长度等于18']])+select('warning','出错警告',s.warning,[['stop','停止'],['warning','警告']])+'<p>本例忽略空值；编号按文本保存。仅模拟序列/长度及停止/警告，不模拟全部验证条件。</p>',btn('确定','apply')+btn('取消','cancel')+btn('清除验证并确定','clearValidation')):''}${s.error?dialog('输入不符合验证规则',`<p>${s.appliedRule==='list'?'只允许序列中的值：男、女。':'需要18个字符；当前'+s.draft.length+'个。'}</p>`,btn('重试','retry')+(s.appliedWarning==='warning'?btn('仍然保留输入','keep'):'')+btn('取消输入','discard')):''}`)+output(s.message),
    (s,a)=>{if(a==='open'){s.pane=true;s.rule=s.appliedRule;s.warning=s.appliedWarning;}if(a==='cancel')s.pane=false;if(a==='clearValidation'&&s.pane){s.enabled=false;s.pane=false;s.error=false;s.message='验证已解除，当前值未删除。';}if(a==='apply'){s.appliedRule=s.rule;s.appliedWarning=s.warning;s.enabled=true;s.pane=false;s.message='规则已应用；已有值不会被自动删除。';}if(a==='commit'&&!s.pane&&!s.error){const valid=!s.enabled||s.draft===''||(s.appliedRule==='list'?['男','女'].includes(s.draft):s.draft.length===18);s.error=!valid;if(valid){s.value=s.draft;s.message='输入已保留。';}else s.message='新输入尚未写入单元格，请处理出错警告。';}if(a==='retry')s.error=false;if(a==='keep'&&s.appliedWarning==='warning'){s.value=s.draft;s.error=false;s.message='已选择继续，警告规则允许保留不合法输入。';}if(a==='discard'){s.draft=s.value;s.error=false;s.message='取消了本次输入，原值保留。';}},(s,k,v)=>{if(k==='candidate'){if(v&&!s.pane&&!s.error)s.draft=v;}else s[k]=v;});
function parseCSV(text,delimiter=',') {
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=ch;}
    if(quoted)throw new Error('文本限定符双引号没有闭合。');if(cell!==''||row.length){row.push(cell);rows.push(row);}return rows;
  }
const excelDigits=v=>{const digits=v.replace(/^0+/,'')||'0';return digits.length>15?digits.slice(0,15)+'0'.repeat(digits.length-15):digits;};
const csvText='职工号,姓名,档案编号\n0012,"王,宁",001234567890123456\n0013,李明,002345678901234567';
register(['y2021q47'],'导入向导：先分列，再把长编号设为文本','原样显示CSV，再逐页检查分隔符与列类型。',{step:0,delimiter:',',textColumns:true,imported:false,message:'示例编号是虚构文本，不对应真实身份。'},s=>{
    const rows=parseCSV(csvText,s.delimiter);const type=s.textColumns?'文本':'常规';
    return office('Excel','数据',btn('自文本','start','',s.step?'disabled':''),s.imported?table(rows[0],rows.slice(1).map(r=>r.map((v,i)=>i!==1&&!s.textColumns?(i===0?String(Number(v)):excelDigits(v)):esc(v)))):s.step?dialog(`文本导入向导 · 第${s.step}步`,s.step===1?'<p>选择分隔符号；文件为UTF-8示例文本。</p><pre class="lab-code">'+esc(csvText)+'</pre>':s.step===2?select('delimiter','分隔符',s.delimiter,[[',','逗号'],[';','分号'],['\t','制表符']])+table(rows[0],rows.slice(1)):select('textColumns','职工号与档案编号列',String(s.textColumns),[['true','文本'],['false','常规']])+`<p>当前类型：${type}。文本可保留前导0和长编号。</p>`,(s.step>1?btn('上一步','back'):'')+btn(s.step===3?'完成':'下一步',s.step===3?'finish':'next')+btn('取消','cancel')):'<p class="lab-empty">工作表尚未导入数据。</p>')+output(s.message);
  },(s,a)=>{
    if(a==='start'){
      if(s.step)return;
      s.previousImport={imported:s.imported,delimiter:s.delimiter,textColumns:s.textColumns};
      s.step=1;s.imported=false;return;
    }
    if(!s.step)return;
    if(a==='next'&&s.step<3)s.step++;
    if(a==='back'&&s.step>1)s.step--;
    if(a==='cancel'){
      Object.assign(s,s.previousImport);s.previousImport=null;s.step=0;
      s.message=s.imported?'已取消本次导入，原表数据保留。':'已取消导入。';return;
    }
    if(a==='finish'&&s.step===3){
      if(s.delimiter!==','){s.message='预览仍是一列：应先选择与源文件一致的逗号分隔符。';return;}
      s.imported=true;s.step=0;s.previousImport=null;
      s.message=s.textColumns?'文本列保留了前导0和全部字符；带引号的“王,宁”仍是一格。':'常规数值推断丢掉前导0，超过15位的数字不可靠；应从源文件重新以文本导入。';
    }
  },(s,k,v)=>{s[k]=k==='textColumns'?v==='true':v;});
const phoneData=['13000000001','13000000002','13000000003'];
register(['y2021q49'],'辅助列脱敏，粘贴值后切断公式依赖','创建公式、向下填充、复制结果，再选择性粘贴为值。',{values:phoneData,names:['王宁','李明','赵敏'],pastedFormulas:false,formatted:false,formula:false,filled:0,copied:null,pane:false,kind:'values',message:'D列为虚构号码，F列尚无公式。'},s=>{
    const masks=s.values.map(v=>v.slice(0,7)+'****');return office('Excel','开始',btn('复制辅助列','copy')+btn('选择性粘贴…','paste'),`${table(['行','B 姓名','D 联系电话','F 辅助列'],s.values.map((v,i)=>[i+2,esc(s.names[i]),`<span data-paste-target style="${s.formatted?'background:#fff0be;font-weight:bold':''}">${esc(v)}</span>`+(s.pastedFormulas?`<small>=LEFT(B${i+2},7)&amp;"****"</small>`:''),`<div class="lab-lookup-cell" data-fill-index="${i}"><span style="background:#fff0be;font-weight:bold">${s.formula&&i<=s.filled?esc(masks[i]):''}</span>${s.formula&&i===0?'<button data-lab-drag="fill" class="lab-fill-handle" aria-label="向下拖动填充柄"></button>':''}</div>`]))}${s.pane?dialog('粘贴到D2:D4',select('kind','粘贴',s.kind,[['values','值'],['formulas','公式'],['formats','格式']]),btn('确定','apply')+btn('取消','cancel')):''}`)+`<div class="lab-controls">${btn('在F2输入 =LEFT(D2,7)&"****"','formula')}${btn('键盘辅助：填充辅助列','fill')}${btn('尝试直接在D2输入引用D2的公式','circular')}</div>${output(s.message)}`;
  },(s,a)=>{if(a==='formula')s.formula=true;if(a==='fill'&&s.formula)s.filled=2;if(a==='copy'){if(s.filled<2){s.message='请先建立并填充辅助列。';return;}s.copied=s.values.map(v=>v.slice(0,7)+'****');s.message='已复制辅助列计算结果。';}if(a==='paste')s.pane=true;if(a==='cancel')s.pane=false;if(a==='circular')s.message='产生循环引用：D2中的公式又依赖D2本身，不能这样覆盖源值。';if(a==='apply'){if(!s.copied){s.message='没有复制结果。';return;}if(s.kind==='values'){s.values=[...s.copied];s.pastedFormulas=false;s.message='D列已变成独立的脱敏文本，不再保存原号码或辅助列公式。';}else if(s.kind==='formats'){s.formatted=true;s.message='只粘贴辅助列的黄色填充和粗体；D列原号码及公式状态不变。';}else{s.pastedFormulas=true;s.values=s.names.map(n=>n.slice(0,7)+'****');s.message='F列公式移到D列，相对引用从D移到B，错误地读取姓名列。公式实际已粘贴；要保留号码脱敏结果，请重置后粘贴值。';}s.pane=false;}});
register(['y2021q50'],'把嵌套公式拆成三层看','修改示例第17位，逐层查看MID、MOD和IF的计算值。',{digit:1,layer:0},s=>{
    const code='0000002000010100'+s.digit+'X',odd=Number(s.digit)%2;return `<div class="lab-controls">${select('digit','虚构编号的第17位',String(s.digit),Array.from({length:10},(_,i)=>[String(i),String(i)]))}${btn('查看下一层','next')}</div>`+office('Excel','公式','<code>=IF(MOD(MID(C2,17,1),2)=1,"男","女")</code>',`<div class="lab-code-digits">${[...code].map((v,i)=>`<span class="${i===16?'lab-highlight':''}"><small>${i+1}</small>${v}</span>`).join('')}</div>${table(['计算层','输出'],[['MID(C2,17,1)',s.layer>=1?esc(String(s.digit)):'待展开'],['MOD(第17位,2)',s.layer>=2?odd:'待展开'],['IF(余数=1,"男","女")',s.layer>=3?(odd?'男':'女'):'待展开']])}`)+coach('只演示题设编码规则；000000开头是无效示例，不能用本卡核验证件。');
  },s=>{s.layer=Math.min(3,s.layer+1);},(s,k,v)=>{s.digit=Number(v);s.layer=0;});
// Only typed cells in this example are accepted, never arbitrary formula execution.
function rangeStats(cells){
  const nums=cells.filter(c=>c.kind==='number').map(c=>Number(c.value));
  const error=cells.find(c=>c.kind==='error'),sum=nums.reduce((a,b)=>a+b,0);
  return {SUM:error?'#N/A':sum,COUNT:nums.length,COUNTA:cells.filter(c=>c.kind!=='blank').length,AVERAGE:error?'#N/A':nums.length?sum/nums.length:'#DIV/0!',MAX:error?'#N/A':nums.length?Math.max(...nums):0,MIN:error?'#N/A':nums.length?Math.min(...nums):0};
}
function statsView(s){
  const values=rangeStats(s.statCells),types=[['number','数值'],['text','文本数字'],['logical','TRUE'],['blank','真正空白'],['empty','公式空字符串'],['error','#N/A错误']];
  return office('Excel','公式','<code>范围参数：A1:A6</code>',table(['地址','保存类型','内容'],s.statCells.map((c,i)=>['A'+(i+1),select('statKind'+i,'A'+(i+1)+'类型',c.kind,types),['number','text'].includes(c.kind)?field('statValue'+i,'A'+(i+1)+'值',c.value,c.kind==='number'?'number':'text'):esc({logical:'TRUE',blank:'（空单元格）',empty:'=""',error:'#N/A'}[c.kind])]))+table(['公式','实际结果'],Object.entries(values).map(([key,value])=>['='+key+'(A1:A6)',`<span data-stat-result="${key}">${typeof value==='number'?Number(value.toPrecision(12)):value}</span>`])))+output(esc(s.statMessage||'改变类型会改变参与统计的格数；真正空白、空字符串和数值0分别观察。'))+coach('这是区域参数的有限模型：文本数字、TRUE、空白、空字符串与#N/A；不模拟直接参数转换或任意输入公式。错误传播与忽略规则按各函数分别处理。');
}
const people=[['市场部','女',28],['市场部','男',32],['后勤部','女',40],['市场部','女',24],['后勤部','男',30]];
register(['y2021q51'],'让同一张名单回答三个统计问题','改部门、年龄和条件，命中的行与计数、平均值一起变化。',{people,department:'市场部',sex:'女',statsMode:'conditions',statCells:[{kind:'number',value:'10'},{kind:'number',value:'0'},{kind:'text',value:'20'},{kind:'logical',value:''},{kind:'blank',value:''},{kind:'empty',value:''}],statMessage:''},s=>{
    const mode=`<div class="lab-controls">${select('statsMode','统计场景',s.statsMode,[['conditions','条件计数与平均'],['range','数据类型与基础统计']])}</div>`;if(s.statsMode==='range')return mode+statsView(s);
    const match=s.people.filter(r=>r[0]===s.department),both=match.filter(r=>r[1]===s.sex),ages=match.map(r=>r[2]).filter(v=>v!==''&&Number.isFinite(Number(v)));const avg=ages.length?money(ages.reduce((n,v)=>n+Number(v),0)/ages.length):'#DIV/0!';
    return mode+`<div class="lab-controls">${select('department','部门条件',s.department,[['市场部','市场部'],['后勤部','后勤部'],['研发部','研发部（无记录）']])}${select('sex','第二条件',s.sex,[['女','女'],['男','男']])}</div>`+office('Excel','公式',`<code>COUNTIF / COUNTIFS / AVERAGEIF</code>`,table(['部门 E','性别 F','年龄 G'],s.people.map((r,i)=>[select('dept'+i,`第${i+2}行部门`,r[0],[['市场部','市场部'],['后勤部','后勤部']]),`<span class="${r[0]===s.department&&r[1]===s.sex?'lab-highlight':''}">${r[1]}</span>`,field('age'+i,`第${i+2}行年龄`,r[2],'number','min="16" max="80"')]))+table(['公式','结果'],[[`COUNTIF(E2:E6,"${s.department}")`,match.length],[`COUNTIFS(E2:E6,"${s.department}",F2:F6,"${s.sex}")`,both.length],[`AVERAGEIF(E2:E6,"${s.department}",G2:G6)`,avg]]))+output('第二项要求部门和性别同时符合；平均值忽略空白年龄，不把空白当0。');
  },()=>{},(s,k,v)=>{
    if(k.startsWith('statKind')){const c=s.statCells[Number(k.slice(8))];c.kind=v;if(v==='number'&&(!c.value.trim()||!Number.isFinite(Number(c.value))))c.value='0';s.statMessage='已更改保存类型，统计重新计算。';return;}
    if(k.startsWith('statValue')){const c=s.statCells[Number(k.slice(9))];if(c.kind==='number'&&(!v.trim()||!Number.isFinite(Number(v)))){s.statMessage='数值模式须输入有限数；原值保留。要模拟空白，请改保存类型。';return;}c.value=v;s.statMessage='源数据已更新，统计重新计算。';return;}
    if(k.startsWith('dept'))s.people[Number(k.slice(4))][0]=v;else if(k.startsWith('age'))s.people[Number(k.slice(3))][2]=v===''?'':number(v,16,80);else s[k]=v;});
register(['y2021q52'],'同样的数据，选错系列就回答不了问题','选择两系列比较、单系列或比例，观察图的意义改变。',{mode:'both',women:6},s=>{
    const total=[12,14,8],women=[Number(s.women),4,2],ratio=total.map((v,i)=>Math.round(women[i]/v*100));const series=s.mode==='ratio'?[{name:'女职工比例（%）',values:ratio,color:'#b35385'}]:[{name:'女职工人数',values:women,color:'#b35385'},...(s.mode==='both'?[{name:'总人数',values:total,color:'#527eaa'}]:[])];return `<div class="lab-controls">${select('mode','图表数据',s.mode,[['both','总人数与女职工人数'],['women','只选女职工人数'],['ratio','先计算女职工比例']])}${field('women','市场部女职工人数',s.women,'range','min="0" max="12"')}</div>`+office('Excel','插入 · 簇状柱形图','',clusteredChart(['市场部','财务部','后勤部'],series))+output(s.mode==='both'?'两组柱并排，不把子集与总数叠加。':s.mode==='women'?'这里只有女职工数量，无法直接看出各部门总人数。':'比例的分母是各部门总人数；此时纵向量纲为百分比。');
  },()=>{});
register(['y2021q58'],'把利润目标交给求解器，反推销量','设置三个字段，计算后选择保留或取消结果。',{cost:100,price:120,quantity:1000,target:100000,setCell:'J2',changeCell:'I2',pane:false,candidate:null,previous:1000,message:'先看J2公式，再打开单变量求解。'},s=>
    office('Excel','数据',btn('模拟分析 → 单变量求解','open'),`${table(['G2 进价','H2 售价','I2 销量','J2 利润'],[[field('cost','进价',s.cost,'number',s.pane||s.candidate!==null?'disabled':''),field('price','售价',s.price,'number',s.pane||s.candidate!==null?'disabled':''),field('quantity','销量',s.quantity,'number',s.pane||s.candidate!==null?'disabled':''),money((s.price-s.cost)*s.quantity)]])}<code>J2 =(H2-G2)*I2</code>${s.pane?dialog('单变量求解',select('setCell','目标单元格',s.setCell,[['J2','J2（利润公式）'],['I2','I2（销量数值）']])+field('target','目标值',s.target,'number')+select('changeCell','可变单元格',s.changeCell,[['I2','I2（销量）'],['G2','G2（进价）'],['J2','J2（公式本身）']]),btn('确定','solve')+btn('取消','cancel')):''}${s.candidate!==null?dialog('单变量求解状态',`<p>找到输入：${money(s.candidate)}，公式目标：${money(s.target)}</p>`,btn('确定并保留结果','keep')+btn('取消并恢复','discard')):''}`)+output(s.message),
    (s,a)=>{if(a==='open'){if(s.candidate!==null){s.message='请先保留或取消当前求解结果。';return;}s.pane=true;}if(a==='cancel')s.pane=false;if(a==='solve'){if(s.setCell!=='J2'||s.changeCell==='J2'){s.message='目标格必须含公式，可变格应是公式依赖的输入，不能设为公式本身。';return;}const divisor=s.changeCell==='I2'?s.price-s.cost:Number(s.quantity);if(divisor===0){if((s.price-s.cost)*s.quantity===Number(s.target)){s.message='当前公式已等于目标值，无需改变输入；满足条件的解不唯一。';s.pane=false;}else s.message='当前可变输入无法改变利润到指定目标，请检查价格差或销量。';return;}const result=s.changeCell==='I2'?Number(s.target)/divisor:Number(s.price)-Number(s.target)/divisor;if(!Number.isFinite(result)){s.message='请输入有限数值。';return;}s.previous=s.changeCell==='I2'?s.quantity:s.cost;s.candidate=result;s.pane=false;s.message=`求得${s.changeCell==='I2'?'销量':'进价'}，不是自动证明其符合现实限制。`;if(s.changeCell==='I2')s.quantity=result;else s.cost=result;}if(a==='keep'){s.candidate=null;s.message='已保留结果；如销量必须为整数，应按目标条件取整后代回检查。';}if(a==='discard'){if(s.changeCell==='I2')s.quantity=s.previous;else s.cost=s.previous;s.candidate=null;s.message='已恢复求解前的输入。';}});
window.NOTE_LABS.parseCSV=parseCSV;
})();

/* Source provenance: note-labs-audit.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui,clusteredChart,daysBetween}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
const sales=[['北斗科技','一季度',120],['北斗导航','二季度',80],['南方科技','一季度',90],['北斗科技','二季度',150]];
register(['y2026q50'],'文字包含条件与交叉条件如何求和','改公司名、季度和金额，观察SUMIF和SUMIFS各自选中了哪些行。',{mode:'single',keyword:'北斗',company:'北斗科技',quarter:'一季度',values:[120,80,90,150]},s=>{
 const hit=r=>s.mode==='single'?r[0].includes(s.keyword):r[0]===s.company&&r[1]===s.quarter;
 const formula=s.mode==='single'?`=SUMIF(A2:A5,"*${s.keyword.replace(/[~*?]/g,c=>'~'+c).replace(/"/g,'""')}*",C2:C5)`:`=SUMIFS(C2:C5,A2:A5,"${s.company}",B2:B5,"${s.quarter}")`;
 return controls(select('mode','求和任务',s.mode,[['single','公司名包含文字'],['multi','指定公司且指定季度']])+(s.mode==='single'?field('keyword','包含文字',s.keyword):select('company','公司',s.company,[...new Set(sales.map(r=>r[0]))].map(v=>[v,v]))+select('quarter','季度',s.quarter,[['一季度','一季度'],['二季度','二季度']])))+office('Excel','公式',`<code>${esc(formula)}</code>`,table(['A 公司','B 季度','C 金额'],sales.map((r,i)=>[`<span class="${hit(r)?'lab-highlight':''}">${r[0]}</span>`,r[1],field('value'+i,'第'+(i+2)+'行金额',s.values[i],'number')]))+output(`实际求和：${money(sales.reduce((sum,r,i)=>sum+(hit(r)?Number(s.values[i]):0),0))}`));
},()=>{},(s,k,v)=>{if(k.startsWith('value'))s.values[Number(k.slice(5))]=Number(v);else s[k]=v;});
const refTemplates={tax:'=B2*$F$1',range:'=B4*$F$1+SUM(C$2:D3)',matrix:'=SUMIFS($C$2:$C$5,$A$2:$A$5,$F3,$B$2:$B$5,G$2)'};
function cellPosition(text){
 const m=String(text).trim().toUpperCase().match(/^([A-Z]{1,3})([1-9]\d{0,6})$/);if(!m)return null;
 const col=[...m[1]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0),row=Number(m[2]);return col<=16384&&row<=1048576?{col,row}:null;
}
function shiftedTemplate(template,from,to){
 const a=cellPosition(from),b=cellPosition(to);if(!a||!b)return null;
 const dx=b.col-a.col,dy=b.row-a.row,parts=[];
 const formula=refTemplates[template].replace(/(\$?)([A-Z]{1,3})(\$?)([1-9]\d*)/g,(full,lc,letters,lr,digits)=>{
  let col=[...letters].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)+(lc?0:dx),row=Number(digits)+(lr?0:dy),result='#REF!';
  if(col>=1&&col<=16384&&row>=1&&row<=1048576){let name='';while(col){col--;name=String.fromCharCode(65+col%26)+name;col=Math.floor(col/26);}result=lc+name+lr+row;}
  parts.push([full,result]);return result;
 });return {dx,dy,formula,parts};
}
function wholeRefView(s){
 const result=shiftedTemplate(s.template,s.from,s.to);
 return office('Excel','复制公式',btn('设置源格与目标格…','editRef'),`<p>源格 ${esc(s.from)} → 目标格 ${esc(s.to)}；列位移 ${result.dx}，行位移 ${result.dy}</p><p>原公式</p><pre class="lab-code" data-original-formula>${esc(refTemplates[s.template])}</pre><p>复制后的完整公式</p><pre class="lab-code" data-shifted-formula>${esc(result.formula)}</pre>${table(['每个原引用','各自调整后'],result.parts.map(row=>row.map(esc)))}${s.refPane?dialog('设置复制位置',select('draftTemplate','公式练习',s.draftTemplate,[['range','范围两端与混合引用'],['tax','固定税率'],['matrix','二维条件汇总']])+field('draftFrom','原公式所在格',s.draftFrom)+field('draftTo','复制目标格',s.draftTo),btn('确定','applyRef')+btn('取消','cancelRef')):''}`)+output(esc(s.refMessage||'先计算目标减来源的行列位移，再对每段引用单独应用。'))+coach('只变换三条给定公式中的同表A1引用，不计算这些公式的值，也不模拟剪切、结构插删、名称或外部引用。改变源格不改变题给公式文字；请按当前显示的位置推导。');
}
register(['merged-10'],'复制公式，查看地址与排名怎样变化','在复制方向和锁定方式之间切换；相同分数也参与实际排名。',{mode:'ref',style:'mixed',dx:1,dy:1,order:'0',scores:[88,76,88,92],locked:true,template:'range',from:'D4',to:'F7',refPane:false,draftTemplate:'range',draftFrom:'D4',draftTo:'F7',refMessage:''},s=>{
 const origin={relative:'B2',absolute:'$B$2',mixed:'$B2',row:'B$2'},lockCol=['absolute','mixed'].includes(s.style),lockRow=['absolute','row'].includes(s.style);
 const col=2+(lockCol?0:Number(s.dx)),row=2+(lockRow?0:Number(s.dy));
 const columnName=n=>{let text='';while(n>0){n--;text=String.fromCharCode(65+n%26)+text;n=Math.floor(n/26);}return text;};
 const valid=s.dx!==''&&s.dy!==''&&Number.isInteger(Number(s.dx))&&Number.isInteger(Number(s.dy)),address=!valid?'请输入整数位移':col<1||row<1||col>16384||row>1048576?'#REF!':`${lockCol?'$':''}${columnName(col)}${lockRow?'$':''}${row}`;
 return controls(select('mode','场景',s.mode,[['ref','复制引用'],['whole','整条公式与目标位置'],['rank','RANK.EQ排名']]))+(s.mode==='whole'?wholeRefView(s):s.mode==='ref'?controls(select('style','引用形式',s.style,Object.entries(origin))+field('dx','向右复制列数',s.dx,'number','step="1"')+field('dy','向下复制行数',s.dy,'number','step="1"'))+office('Excel','公式','',table(['原公式','复制后公式'],[[`=${origin[s.style]}`,`=${address}`]])):controls(select('locked','比较范围',String(s.locked),[['true','固定$B$2:$B$5'],['false','相对B2:B5']])+select('order','排名方向',s.order,[['0','0：降序'],['1','1：升序']]))+office('Excel','公式','',table(['行','分数 B','公式','名次'],s.scores.map((v,i)=>{const pool=(s.locked?s.scores:s.scores.slice(i)).filter(x=>x!==''&&Number.isFinite(Number(x))).map(Number),rank=v===''?'空白':1+pool.filter(x=>s.order==='0'?x>Number(v):x<Number(v)).length;return[i+2,field('score'+i,'第'+(i+2)+'行分数',v,'number'),`=RANK.EQ(B${i+2},${s.locked?'$B$2:$B$5':`B${i+2}:B${i+5}`},${s.order})`,rank];}))))+(s.mode==='whole'?'':output(s.mode==='ref'?'$锁住它后面的行号或列标，复制方向决定未锁住部分的变化。':'88并列时获得相同名次，后续名次跳号；范围漂移会改变比较对象。仅向下填充时，B$2:B$5也可固定比较行。'));
},(s,a)=>{
 if(a==='editRef'){s.refPane=true;s.draftFrom=s.from;s.draftTo=s.to;s.draftTemplate=s.template;s.refMessage='';}
 if(a==='cancelRef'){s.refPane=false;s.refMessage='已取消，原公式与目标位置保留。';}
 if(a==='applyRef'){if(!cellPosition(s.draftFrom)||!cellPosition(s.draftTo)){s.refMessage='请输入A1至XFD1048576内的单格地址；已确认结果未改变。';return;}s.from=s.draftFrom.trim().toUpperCase();s.to=s.draftTo.trim().toUpperCase();s.template=s.draftTemplate;s.refPane=false;s.refMessage='已确认位置并逐项变换引用。';}
},(s,k,v)=>{if(k.startsWith('score'))s.scores[Number(k.slice(5))]=v===''?'':Number(v);else s[k]=k==='locked'?v==='true':v;});
const chartSource=[['一班',80,75,90],['二班',72,85,78],['三班',90,80,88],['四班',82,92,84]];
function chartFromSelection(s){
 const rows=s.data.slice(0,Number(s.rows)),indices=s.columns==='math'?[1]:[1,2,3],names=[s.mathName,'英语','计算机'],colors=['#527eaa','#bc7750','#558777','#9b6694'];
 return {labels:s.swapped?indices.map(i=>names[i-1]):rows.map(r=>r[0]),series:s.swapped?rows.map((r,i)=>({name:r[0],values:indices.map(j=>r[j]),color:colors[i]})):indices.map(i=>({name:names[i-1],values:rows.map(r=>r[i]),color:colors[i-1]}))};
}
function selectedLineChart(labels,series){
 const x=i=>55+i*370/Math.max(1,labels.length-1),y=v=>220-v*1.65;
 return `<svg class="lab-data-chart" viewBox="0 0 480 270" role="img" aria-label="折线图"><path d="M40 40V220H455" fill="none" stroke="#687482"/>${[0,50,100].map(v=>`<text x="35" y="${y(v)}" text-anchor="end">${v}</text>`).join('')}${series.map(row=>`<polyline data-chart-series="${esc(row.name)}" points="${row.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${row.color}" stroke-width="2"/>${row.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${row.color}"/><text x="${x(i)}" y="${y(v)-8}" text-anchor="middle">${v}</text>`).join('')}`).join('')}${labels.map((v,i)=>`<text x="${x(i)}" y="245" text-anchor="middle">${esc(v)}</text>`).join('')}</svg><div class="lab-chart-legend">${series.map(row=>`<span><i style="background:${row.color}"></i>${esc(row.name)}</span>`).join('')}</div>`;
}
register(['y2020q59'],'选择数据、换图型，再核对类别和系列','保留源表，对比改变选择范围、切换行列和修改源值的不同结果。',{
 swapped:false,type:'column',data:chartSource,mathName:'数学',rows:'4',columns:'all',pane:false,draftRows:'4',draftColumns:'all',sourcePane:false,draftValue:'80',draftName:'数学',message:''
},s=>{
 const {labels,series}=chartFromSelection(s),busy=s.pane||s.sourcePane;
 return office('Excel','图表工具 · 设计',btn('选择数据…','selectData','',busy?'disabled':'')+btn('切换行/列','switch','',busy?'disabled':'')+btn('修改源数据…','editSource','',busy?'disabled':'')+select('type','图表类型',s.type,[['column','簇状柱形图'],['line','折线图']]),
  `${s.pane?dialog('选择数据 · 本例提供两个范围',select('draftRows','类别行范围',s.draftRows,[['4','A2:A5 · 四个班'],['2','A2:A3 · 前两个班']])+select('draftColumns','数值列范围',s.draftColumns,[['all','B:D · 三科'],['math','B · 数学列']])+'<p>改变选用范围，不删除源表记录；切换状态下仍使用同一块源数据。</p>',btn('确定','applyData')+btn('取消','cancelData')):''}
  ${s.sourcePane?dialog('编辑源单元格',field('draftName','B1系列名称',s.draftName,'text','maxlength="8"')+field('draftValue','B2一班成绩',s.draftValue,'number','min="0" max="100"'),btn('确认源数据','applySource')+btn('取消','cancelSource')):''}
  <div data-chart-result data-categories="${labels.length}" data-series-count="${series.length}" ${busy?'inert':''}>${s.type==='column'?clusteredChart(labels,series):selectedLineChart(labels,series)}</div>
  <div data-chart-source>${table(['班级',esc(s.mathName),'英语','计算机'],s.data.map(row=>row.map(esc)))}</div>`)+output(`横轴是${s.swapped?'课程':'班级'}；图例是${series.map(x=>esc(x.name)).join('、')}。${labels.length}个类别，${series.length}个系列。`)+output(esc(s.message||'切换行列只重解释选中数据；原表不被转置。'))+coach('本例只演示给定区域、一个源值/名称和二维柱形/折线，不模拟任意系列公式、图表移动或全部格式。分数限定0—100；四个班不是时间顺序，折线外形不能解释成时间趋势。');
},(s,a)=>{
 if(a==='switch'&&!s.pane&&!s.sourcePane)s.swapped=!s.swapped;
 if(a==='selectData'){s.pane=true;s.draftRows=s.rows;s.draftColumns=s.columns;}
 if(a==='applyData'){if(!['2','4'].includes(s.draftRows)||!['all','math'].includes(s.draftColumns))return;s.rows=s.draftRows;s.columns=s.draftColumns;s.pane=false;s.message='图中类别与系列已按范围重建；源表所有记录保留。';}
 if(a==='cancelData'){s.pane=false;s.message='已取消选区修改，已确认的图表保持。';}
 if(a==='editSource'){s.sourcePane=true;s.draftValue=String(s.data[0][1]);s.draftName=s.mathName;}
 if(a==='applySource'){const v=Number(s.draftValue),name=s.draftName.trim();if(!s.draftValue.trim()||!Number.isFinite(v)||v<0||v>100||!name||name.length>8){s.message='本例须输入0—100的数值及1—8字名称；原数据保留。';return;}s.data[0][1]=v;s.mathName=name;s.sourcePane=false;s.message='源格已确认；所选图表读取新值，图例读取系列名称。';}
 if(a==='cancelSource'){s.sourcePane=false;s.message='源数据草稿已取消，源格和图形保持。';}
},(s,k,v)=>{if(k==='type'&&(s.pane||s.sourcePane))return;s[k]=v;});
const filterRows=[['王宁','女',88],['李明','男',76],['赵敏','女',58],['周林','男',92]];
const scholarshipRows=[
 ['王宁',92,94,90,93,91],['李明',99,98,97,96,74],['赵敏',88,89,90,91,92],['周林',87,88,86,89,85],
 ['陈晨',84,85,86,83,82],['刘悦',80,81,82,83,84],['孙宁',78,79,80,81,82],['吴林',76,77,78,79,80]
];
const scholarshipTotal=row=>row.slice(1).reduce((a,b)=>a+b,0);
const scholarshipTop=rows=>{const totals=rows.map(scholarshipTotal).sort((a,b)=>b-a),cut=totals[Math.max(0,Math.ceil(rows.length*.25)-1)];return rows.filter(r=>scholarshipTotal(r)>=cut);};
const scholarshipTable=rows=>table(['姓名','课程1','课程2','课程3','课程4','课程5','总分'],rows.map(r=>[...r,scholarshipTotal(r)]));
function renderScholarship(s){
 const rows=s.top?scholarshipTop(scholarshipRows):scholarshipRows;
 return office('Excel','数据',btn('总分 ▾ → 数字筛选 → 前10项…','rankOpen')+btn('复制可见记录到奖学金表','rankCopy','',s.top?'':'disabled')+btn('清除源表筛选','rankClear'),
   (s.rankPane?dialog('前10个自动筛选','<p>显示：前／25／百分比</p><p>按总分排名人数比例筛选，不是总分乘以25%。</p>',btn('确定','rankApply')+btn('取消','rankCancel')):'')+
   '<h4>原始成绩表 · 8条示例记录</h4>'+scholarshipTable(rows)+
   (s.copy?'<h4>奖学金表 · 已复制的前25%记录</h4>'+controls(btn('高级…','subjectsOpen')+btn('清除奖学金表条件','subjectsClear'))+
     (s.subjectsPane?dialog('高级筛选 · 五科门槛', '<p>列表区域为已复制的奖学金表；五科条件放在同一行。</p>'+table(['课程1','课程2','课程3','课程4','课程5'],[['&gt;=75','&gt;=75','&gt;=75','&gt;=75','&gt;=75']]),btn('确定','subjectsApply')+btn('取消','subjectsCancel')):'')+
     scholarshipTable(s.filtered?s.copy.filter(r=>r.slice(1).every(v=>v>=75)):s.copy):''))+output(s.message||'先筛总分前25%，再筛五科均不低于75分。课程名称和数据为缩小后的示例。');
}
function actScholarship(s,a){
 if(a==='rankOpen')s.rankPane=true;
 if(a==='rankCancel')s.rankPane=false;
 if(a==='rankApply'){s.top=true;s.rankPane=false;s.message='8人取总分最高2人；如边界分数并列，会全部保留。先复制可见记录。';}
 if(a==='rankCopy'&&s.top){s.copy=structuredClone(scholarshipTop(scholarshipRows));s.filtered=false;s.subjectsPane=false;s.message='已复制前25%的2人；其中一人课程5为74分，尚不满足奖学金的全部条件。';}
 if(a==='rankClear'){s.top=false;s.message='源表8条记录恢复；奖学金表中的已复制记录保持不变。';}
 if(a==='subjectsOpen'&&s.copy)s.subjectsPane=true;
 if(a==='subjectsCancel')s.subjectsPane=false;
 if(a==='subjectsApply'&&s.copy){s.filtered=true;s.subjectsPane=false;s.message='两层条件取交集：先满足总分排名，再要求五科均≥75。高级筛选仅隐藏未达标记录。';}
 if(a==='subjectsClear'){s.filtered=false;s.message='奖学金表恢复已复制的前25%记录；不会变回源表全部8人。';}
}
register(['y2020q9','y2026q51'],'设置条件区，再观察高级筛选和清除','条件同一行是AND、不同行是OR；输出可留在原处或复制到旁表。',{scenario:'logic',scholarship:{top:false,copy:null,filtered:false,rankPane:false,subjectsPane:false},mode:'advanced',autoEnabled:true,autoThreshold:80,logic:'and',destination:'inplace',threshold:80,filtered:false,copy:null,applied:{logic:'and',threshold:80}},s=>{
 const scenario=controls(select('scenario','真题场景',s.scenario,[['logic','条件区AND / OR'],['scholarship','奖学金：前25%再筛五科']]));
 if(s.scenario==='scholarship')return scenario+renderScholarship(s.scholarship);
 const hit=r=>s.logic==='and'?r[1]==='女'&&r[2]>=Number(s.threshold):r[1]==='女'||r[2]>=Number(s.threshold);
 const active=r=>s.applied.logic==='and'?r[1]==='女'&&r[2]>=Number(s.applied.threshold):r[1]==='女'||r[2]>=Number(s.applied.threshold);const shown=s.filtered?filterRows.filter(active):filterRows;
 return scenario+controls(select('mode','筛选方式',s.mode,[['advanced','高级筛选'],['auto','自动筛选']]))+office('Excel','数据',(s.mode==='advanced'?btn('高级…','open'):btn(s.autoEnabled?'筛选：开':'筛选：关','toggleAuto'))+btn('清除','clear'),`${s.pane?dialog('高级筛选',select('logic','条件行关系',s.logic,[['and','同一行：女 且 成绩达标'],['or','不同行：女 或 成绩达标']])+field('threshold','最低成绩',s.threshold,'number')+select('destination','方式',s.destination,[['inplace','在原有区域显示'],['copy','复制到其他位置']])+table(['性别','成绩'],s.logic==='and'?[['女','>='+s.threshold]]:[['女',''],['','>='+s.threshold]]),btn('确定','apply')+btn('取消','cancel')):''}${s.mode==='auto'&&s.autoEnabled?controls(btn('性别筛选：女','auto')+field('autoThreshold','追加成绩下限',s.autoThreshold,'number')+btn('性别女且成绩达标','autoBoth')):''}${table(['姓名',`性别${s.mode==='auto'&&s.autoEnabled?' ▾':''}`,'成绩'],shown)}${s.copy?'<h4>复制出的结果</h4>'+table(['姓名','性别','成绩'],s.copy):''}`)+output(s.message||'未隐藏任何原始记录。');
},(s,a)=>{if(s.scenario==='scholarship'){actScholarship(s.scholarship,a);return;}if(a==='open')s.pane=true;if(a==='cancel')s.pane=false;if(a==='apply'){if(String(s.threshold).trim()===''||!Number.isFinite(Number(s.threshold))){s.message='请输入有限成绩下限，尚未应用条件。';return;}const hit=r=>s.logic==='and'?r[1]==='女'&&r[2]>=Number(s.threshold):r[1]==='女'||r[2]>=Number(s.threshold);if(s.destination==='inplace'){s.filtered=true;s.applied={logic:s.logic,threshold:s.threshold};}else s.copy=filterRows.filter(hit);s.pane=false;s.message=s.destination==='inplace'?'原位置仅显示匹配记录；清除可恢复。':'旁表是独立结果副本；源记录保持显示。';}if(a==='clear'){s.filtered=false;s.message='原区域已恢复全部记录；已复制的结果副本不被自动删除。';}if(a==='toggleAuto'){s.autoEnabled=!s.autoEnabled;if(!s.autoEnabled)s.filtered=false;s.message=s.autoEnabled?'已显示筛选下拉入口。':'已关闭自动筛选，全部记录恢复，下拉入口移除。';}if(a==='autoBoth'&&s.autoEnabled){if(String(s.autoThreshold).trim()===''||!Number.isFinite(Number(s.autoThreshold))){s.message='请输入有限成绩下限，保留当前筛选。';return;}s.applied={logic:'and',threshold:Number(s.autoThreshold)};s.filtered=true;s.message='两列条件取交集：性别为女且成绩达到下限。';}if(a==='auto'&&s.autoEnabled){s.logic='and';s.threshold=0;s.applied={logic:'and',threshold:0};s.filtered=true;s.message='自动筛选只显示性别为女的记录，清除后下拉入口仍在。';}},(s,k,v)=>{s[k]=v;if(k==='mode'){s.filtered=false;s.pane=false;}});
register(['y2025q52'],'跨表按编号查找，再给整行设置条件格式','调换历史记录的顺序，或修改当前编号，验证查找依赖键而不是行号。',{
 mode:'lookup',ids:['A01','A02','A03'],old:[['A02',85],['A03',95],['A01',90]],values:[110,80,95],starts:['2024-03-01','2024-03-02','2024-03-03'],ends:['2024-03-10','2024-03-07','2024-03-12'],lockedRow:false,full:true
},s=>{
 const lookup=id=>s.old.find(r=>r[0].toLowerCase()===id.toLowerCase())?.[1];
 const hit=i=>{const j=s.lockedRow?0:i,old=lookup(s.ids[j]);return s.mode==='lookup'?old!==undefined&&s.values[j]>old:daysBetween(s.starts[j],s.ends[j])>7;};
 const formula=s.mode==='lookup'?`=$D${s.lockedRow?'$':''}3>VLOOKUP($A${s.lockedRow?'$':''}3,'2023'!$A$2:$C$4,3,0)`:`=$C${s.lockedRow?'$':''}3-$B${s.lockedRow?'$':''}3>7`;
 const rows=s.ids.map((id,i)=>`<tr class="${s.full&&hit(i)?'lab-row-emphasis':''}"><td>${field('id'+i,'第'+(i+3)+'行编号',id)}</td><td>${s.mode==='lookup'?'景区':field('start'+i,'开始日期',s.starts[i],'date')}</td>${s.mode==='lookup'?'<td>示例记录</td>':''}<td class="${!s.full&&hit(i)?'lab-row-emphasis':''}">${s.mode==='lookup'?field('value'+i,'当前值',s.values[i],'number'):field('end'+i,'完成日期',s.ends[i],'date')}</td></tr>`).join('');
 return controls(select('mode','判断任务',s.mode,[['lookup','超过历史年度值'],['date','日期相差超过7天']])+select('lockedRow','引用行',String(s.lockedRow),[['false','随行变化'],['true','错误地锁在首行']])+select('full','应用范围',String(s.full),[['true','完整数据行'],['false','仅判断数值列']]))+
  office('Excel','开始 · 条件格式',`<code>${esc(formula)}</code>`,`<div class="lab-table-scroll"><table><thead><tr><th>A 编号</th><th>B ${s.mode==='lookup'?'项目':'开始日期'}</th>${s.mode==='lookup'?'<th>C 说明</th>':''}<th>${s.mode==='lookup'?'D 当前值':'C 完成日期'}</th></tr></thead><tbody>${rows}</tbody></table></div>`)+
  (s.mode==='lookup'?controls(btn('调换历史表顺序','reorder'))+table(['2023表 A 编号','B 名称','C 历史值'],s.old.map(r=>[r[0],'景区',r[1]]))+table(['当前编号','实际查回的历史值'],s.ids.map(id=>[esc(id),lookup(id)??'#N/A'])):'')+
  output(s.mode==='lookup'?'精确匹配按编号定位；历史表排序不改变查回值。找不到编号时返回#N/A，本规则不着色。严格大于才符合，相等不符合。':'按每行两个合法日期相减；相差超过7天才着色，恰好7天不着色。锁死行号会使所有行跟随第一行；本例不模拟Excel全部日期系统。');
},(s,a)=>{if(a==='reorder')s.old.reverse();},(s,k,v)=>{
 if(k.startsWith('value'))s.values[Number(k.slice(5))]=Number(v);
 else if(k.startsWith('id'))s.ids[Number(k.slice(2))]=v;
 else if(k.startsWith('start'))s.starts[Number(k.slice(5))]=v;
 else if(k.startsWith('end'))s.ends[Number(k.slice(3))]=v;
 else s[k]=['full','lockedRow'].includes(k)?v==='true':v;
});
register(['y2025q50'],'从日期取月份，再真正向下填充','在E3输入公式，拖动右下角填充柄，逐行读取B列日期。',{dates:['2024-03-15','2024-06-20','2024-11-08'],filled:0,formula:'=MONTH(B3)&"月"'},s=>
 controls(field('formula','E3公式',s.formula)+btn('键盘辅助：向下填充','fill'))+office('Excel','公式','<span>选中E3，将填充柄向下拖</span>',table(['行','B 日期','E 月份'],s.dates.map((v,i)=>{const valid=/^=MONTH\(B3\)&"月"$/i.test(s.formula.trim()),month=v?Number(v.slice(5,7))+'月':'日期为空';return[i+3,field('date'+i,'第'+(i+3)+'行日期',v,'date'),`<div class="lab-lookup-cell" data-fill-index="${i}">${i<=s.filled?(valid?month:'请检查公式'):'—'}<small>${i<=s.filled?esc(s.formula.replace(/B3/gi,'B'+(i+3))):''}</small>${i===0?'<button class="lab-fill-handle" data-lab-drag="fill" aria-label="向下拖动月份填充柄"></button>':''}</div>`];})))+output('MONTH返回1—12的数值，&"月"把它连接成文本。B3是相对引用，下拉后变为B4、B5。'),
 (s,a)=>{if(a==='fill')s.filled=2;},(s,k,v)=>{if(k.startsWith('date'))s.dates[Number(k.slice(4))]=v;else{s.formula=v;s.filled=0;}});
register(['y2025q51'],'表格排序后，折线图跟着数据顺序改变','按客流量升降序排列完整记录，对照横轴与折线的位置。',{order:'original'},s=>{
 const data=[['景区A',3261],['景区B',2311],['景区C',3261]],rows=s.order==='original'?data:[...data].sort((a,b)=>(a[1]-b[1])*(s.order==='asc'?1:-1));
 const points=rows.map((r,i)=>`${70+i*150},${220-r[1]/4000*160}`).join(' ');
 return office('Excel','数据',btn('客流量升序','sort','asc')+btn('客流量降序','sort','desc')+btn('恢复示例顺序','sort','original'),table(['A 景区','D 客流量'],rows)+`<svg class="lab-data-chart" viewBox="0 0 460 270" aria-label="客流量折线图"><polyline points="${points}" fill="none" stroke="#527eaa" stroke-width="3"/>${rows.map((r,i)=>`<circle cx="${70+i*150}" cy="${220-r[1]/4000*160}" r="5" fill="#527eaa"/><text x="${70+i*150}" y="245" text-anchor="middle">${r[0]}</text><text x="${70+i*150}" y="${205-r[1]/4000*160}" text-anchor="middle">${r[1]}</text>`).join('')}</svg>`)+output('排序改变完整记录顺序，图表横轴随源区域同步更新；套用颜色本身不会改变数值顺序。');
},(s,a,v)=>{s.order=v;});
const launchData=[['2021',55,115,.964],['2022',64,182,.969],['2023',67,221,.985]];
function launchChart(s){
 const legend=s.legend==='none'?'':`<p class="study-chart-legend">蓝色：发射次数<br>橙色：成功率</p>`;
 const svg=`<svg class="lab-data-chart" viewBox="0 0 500 340" role="img" aria-label="发射次数与成功率组合图">
  ${s.showTitle?`<text x="250" y="25" text-anchor="middle" data-chart-title>${esc(s.title)}</text>`:''}
  <text x="30" y="55">次数</text>${s.secondaryApplied?'<text x="415" y="55">成功率%</text>':''}
  <path d="M60 65V270H405${s.secondaryApplied?'V65':''}" fill="none" stroke="#74877f"/>
  ${[0,20,40,60,80].map(v=>`<text x="50" y="${275-v*2.5}" text-anchor="end">${v}</text>`).join('')}
  ${s.secondaryApplied?[0,25,50,75,100].map(v=>`<text x="412" y="${275-v*2}">${v}%</text>`).join(''):''}
  ${launchData.map((r,i)=>`<rect x="${85+i*110}" y="${270-r[1]*2.5}" width="42" height="${r[1]*2.5}" fill="#527eaa"/><text x="${111+i*110}" y="293" text-anchor="middle">${r[0]}</text>`).join('')}
  ${s.combo?`<polyline points="${launchData.map((r,i)=>`${111+i*110},${270-r[3]*(s.secondaryApplied?200:2.5)}`).join(' ')}" stroke="#be704e" fill="none" stroke-width="3"/>`:launchData.map((r,i)=>`<rect x="${130+i*110}" y="${270-r[3]*2.5}" width="24" height="${r[3]*2.5}" fill="#be704e"/>`).join('')}
  ${s.axes?`<text x="250" y="326" text-anchor="middle" data-axis-title="horizontal">${esc(s.xTitle)}</text><text transform="translate(16 170) rotate(-90)" text-anchor="middle" data-axis-title="vertical">${esc(s.yTitle)}</text>`:''}
 </svg>`;
 return `<div class="lab-table-scroll" tabindex="0" aria-label="组合图，可横向滚动"><div data-chart-legend="${s.legend}" style="min-width:420px;display:grid;grid-template-columns:${s.legend==='right'?'minmax(0,1fr) 100px':'minmax(0,1fr)'};align-items:center">${svg}${legend}</div></div>`;
}
register(['y2026q52'],'按住Ctrl加选，再建立双轴组合图','先选A:B，再按住Ctrl点击D；设置组合图后补齐标题、轴标题与图例。',{
 cols:[],ctrl:false,created:false,combo:false,secondary:false,secondaryApplied:false,axes:false,elements:false,showTitle:true,title:'图表标题',xTitle:'年份',yTitle:'发射次数',legend:'bottom'
},s=>{
 const commands=s.created?btn('更改图表类型 → 组合','combo')+btn('添加图表元素…','elements'):btn('插入图表','insert');
 const elements=s.elements?dialog('添加图表元素',`<label><input type="checkbox" data-field="showTitle" ${s.showTitle?'checked':''}>图表标题</label>`+field('title','标题文字',s.title)+`<label><input type="checkbox" data-field="axes" ${s.axes?'checked':''}>坐标轴标题</label>`+field('xTitle','主要横坐标轴标题',s.xTitle)+field('yTitle','主要纵坐标轴标题',s.yTitle)+select('legend','图例位置',s.legend,[['bottom','底部'],['right','右侧'],['none','无']]),btn('关闭','elementsClose')):'';
 return controls(`<label><input type="checkbox" data-field="ctrl" ${s.ctrl?'checked':''}>触屏辅助：保持Ctrl</label>`)+office('Excel',s.created?'图表工具 · 设计':'插入',commands,
  table([btn('A 年份','ab'),btn('B 发射次数','ab'),'C 新增卫星数',btn('D 成功率','d')],launchData.map(r=>r.map((v,i)=>`<span class="${s.cols.includes(i)?'lab-selected':''}">${i===3?(v*100).toFixed(1)+'%':v}</span>`)))+
  (s.pane?dialog('更改图表类型 · 组合','<p>发射次数：簇状柱形图；成功率：折线图</p>'+`<label><input type="checkbox" data-field="secondary" ${s.secondary?'checked':''}>成功率使用次坐标轴</label>`,btn('确定','apply')+btn('取消','cancel')):'')+elements+(s.created?launchChart(s):''))+output(s.message||'本卡使用3条示例记录缩小原区域；选择A:B后加选D，跳过C。');
},(s,a)=>{
 if(a==='ab')s.cols=[0,1];
 if(a==='d')s.cols=s.ctrl||s._ctrl?[...new Set([...s.cols,3])]:[3];
 if(a==='insert'){if(![0,1,3].every(i=>s.cols.includes(i))){s.message='当前选择缺少年份、次数或成功率；按住Ctrl加选D列。';return;}s.created=true;s.message='已插入图表；进入图表工具设计设置组合类型。';}
 if(a==='combo'){s.secondary=s.secondaryApplied;s.pane=true;s.elements=false;}
 if(a==='cancel'){s.secondary=s.secondaryApplied;s.pane=false;s.message='取消了本次设置，原图表保留。';}
 if(a==='apply'){s.combo=true;s.secondaryApplied=s.secondary;s.pane=false;s.message=s.secondary?'成功率用右侧百分比轴，次数用左侧数量轴。':'两个量纲共用次数轴，0—1的成功率被压在底部；应把成功率设为次轴。';}
 if(a==='elements'){s.elements=!s.elements;s.pane=false;}
 if(a==='elementsClose')s.elements=false;
});
})();

/* Source provenance: note-labs-study.js:95. Preserve this closure. */
(() => {
'use strict';
const {register,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,esc,money}=ui;
const controls=body=>`<div class="lab-controls">${body}</div>`;
const clone=value=>structuredClone(value);
const uniqueRows=(rows,indexes)=>{const seen=new Set();return rows.filter(row=>{const key=JSON.stringify(indexes.map(i=>row[i]));if(seen.has(key))return false;seen.add(key);return true;});};
const uniqueSource=[['一班'],['二班'],['一班'],['三班'],['二班']];
register(['y2020q49'],'先确定判重范围，再比较筛选与删除','删除会改动原记录；高级筛选可保留源数据，显示或复制唯一列表。',{
    rows:[['20260018','王宁','13000000001'],['20260018','王宁','13000000002'],['20260019','李悦','13000000003']],
    scenario:'delete',unique:{pane:false,destination:'inplace',only:true,filtered:false,copy:null,message:'示例列表A1:A6包含“班级”标题及5条记录。'},selected:false,pane:false,keys:[true,false,false],draft:[true,false,false],before:null,message:'先点一个数据单元格，确定要处理的数据区域。'
  },s=>{
    const mode=controls(select('scenario','真题任务',s.scenario,[['delete','按指定列删除重复项'],['unique','高级筛选不重复记录']]));
    if(s.scenario==='unique'){
      const u=s.unique;
      return mode+office('Excel','数据',btn('高级…','uniqueOpen')+btn('清除','uniqueClear'),
        (u.pane?dialog('高级筛选', '<p>列表区域：$A$1:$A$6（含“班级”标题）</p>'+select('destination','方式',u.destination,[['inplace','在原有区域显示'],['copy','复制到其他位置']])+`<label><input type="checkbox" data-field="only" ${u.only?'checked':''}>选择不重复的记录</label>`,btn('确定','uniqueApply')+btn('取消','uniqueCancel')):'')+
        table(['班级'],u.filtered?uniqueRows(uniqueSource,[0]):uniqueSource)+(u.copy?'<h4>复制出的唯一列表</h4>'+table(['班级'],u.copy):''))+output(u.message)+coach('本例只选择班级一列，因此按班级判重；选择多列时按完整列组合判断。清除筛选恢复隐藏行，已复制的列表仍保留。');
    }
    return mode+office('Excel','数据',btn('删除重复项','open'),table(['学号','姓名','虚构示例号码'],s.rows.map(r=>r.map((v,i)=>i===0?btn(esc(v),'select','',`class="${s.selected?'lab-selected':''}"`):esc(v))))+
    (s.pane?dialog('删除重复项','<p>根据勾选列的组合判断重复；删除时移除整行，保留首次出现的记录。</p>'+['学号','姓名','电话'].map((name,i)=>`<label><input type="checkbox" data-field="key${i}" ${s.draft[i]?'checked':''}>${name}</label>`).join(''),btn('确定','apply')+btn('取消','cancel')):''))+
    controls(btn('撤销本次删除','undo','',s.before?'':'disabled'))+output(s.message)+coach('两条同学号记录的电话不同：只按学号会判重；同时按学号和电话，两条都保留。');},
    (s,a)=>{
      if(s.scenario==='unique'){
        const u=s.unique;
        if(a==='uniqueOpen')u.pane=true;
        if(a==='uniqueCancel')u.pane=false;
        if(a==='uniqueClear'){u.filtered=false;u.message='原区域5条记录全部恢复，源数据从未删除；已复制的列表保持不变。';}
        if(a==='uniqueApply'){const rows=u.only?uniqueRows(uniqueSource,[0]):uniqueSource;if(u.destination==='copy')u.copy=clone(rows);else u.filtered=u.only;u.pane=false;u.message=`${u.destination==='copy'?'已复制到旁表':'原区域显示'}${rows.length}条记录；源数据仍有5条。`;}
        return;
      }
      if(a==='select'){s.selected=true;s.message='已识别连续区域 A1:C'+(s.rows.length+1)+'，包括三列完整记录。';}
      if(a==='open'){if(!s.selected){s.message='先选中数据区域中的单元格。';return;}s.draft=[...s.keys];s.pane=true;}
      if(a==='cancel')s.pane=false;
      if(a==='apply'){
        const indexes=s.draft.flatMap((v,i)=>v?[i]:[]);if(!indexes.length){s.message='至少选择一列作为判重依据。';return;}
        const before=clone(s.rows);s.rows=uniqueRows(s.rows,indexes);
        s.before=before;s.keys=[...s.draft];s.pane=false;s.message=`移除 ${before.length-s.rows.length} 条重复记录，保留 ${s.rows.length} 条。判重列：${indexes.map(i=>['学号','姓名','电话'][i]).join('＋')}。`;
      }
      if(a==='undo'&&s.before){s.rows=clone(s.before);s.before=null;s.message='已恢复删除前的所有记录。';}
    },(s,k,v)=>{if(k==='scenario')s.scenario=v;else if(s.scenario==='unique')s.unique[k]=v;else if(k.startsWith('key'))s.draft[Number(k.slice(3))]=v;});
const wageDefaults={rows:[['讲师',5000],['教授',9000],['讲师',7000],['教授',11000]],sorted:false,applied:false,level:3,pane:false,selection:'none',chart:false,aggregate:'average',draftAggregate:'average',message:'先按职称排序，再汇总基本工资。'};
const wageAggregate=(rows,method)=>method==='count'?rows.length:rows.reduce((sum,r)=>sum+r[1],0)/(method==='average'?rows.length:1);
const wageSummary=s=>[...new Set(s.rows.map(r=>r[0]))].sort().map(title=>[title,wageAggregate(s.rows.filter(r=>r[0]===title),s.aggregate)]);
function renderWages(s){
    const rows=s.sorted?[...s.rows].sort((a,b)=>a[0].localeCompare(b[0])):s.rows;
    const summary=wageSummary(s),total=['总计',wageAggregate(s.rows,s.aggregate)];
    const shown=!s.applied?rows:s.level===1?[total]:s.level===2?[...summary,...[total]]:[...summary.flatMap(group=>[...rows.filter(r=>r[0]===group[0]),[group[0]+' 小计',group[1]]]),total];
    const chartRows=s.selection==='whole'?[...summary,total]:summary;
    const sum=chartRows.reduce((n,r)=>n+r[1],0),colors=['#9278a7','#729b83','#d5a163'];let angle=0;
    const slices=chartRows.map((r,i)=>{const start=angle;angle+=sum?r[1]/sum*360:0;return `${colors[i]} ${start}deg ${angle}deg`;});
    return office('Excel','数据',btn('按职称排序','wageSort','',s.applied?'disabled':'')+btn('分类汇总…','wageOpen'),
      (s.pane?dialog('分类汇总','<p>分类字段：职称；汇总项：基本工资</p>'+select('draftAggregate','汇总方式',s.draftAggregate,[['average','平均值'],['sum','求和'],['count','计数']]),btn('确定','wageApply')+btn('取消','wageCancel')+btn('全部删除汇总','wageRemove','',s.applied?'':'disabled')):'')+
      (s.applied?controls([1,2,3].map(n=>btn(String(n),'wageLevel',n,`aria-label="工资大纲层级${n}"`)).join('')):'')+table(['职称','基本工资'+(s.applied?' · '+{average:'平均值',sum:'求和',count:'计数'}[s.aggregate]:'')],shown.map(r=>[r[0],money(r[1])])))+
      controls(btn('仅选职称与平均工资（不含总计）','wageSelect','summary')+btn('选择整张汇总表（含总计）','wageSelect','whole')+btn('插入饼图','wageChart'))+
      (s.chart?`<figure><div role="img" aria-label="所选汇总数值占比" style="width:180px;height:180px;border-radius:50%;background:${sum?'conic-gradient('+slices.join(',')+')':'#ddd'}"></div><figcaption>${chartRows.map((r,i)=>`<span style="color:${colors[i]}">${r[0]} ${money(r[1])}（${sum?(r[1]/sum*100).toFixed(1):'0'}%）</span>`).join('　')}</figcaption></figure>`:'')+
      output(s.message)+coach('此题按要求用各职称平均工资作一组饼图，扇区并不代表各职称工资总额。明细与总计不应混入类别。');
  }
function actWages(s,a,v){
    if(a==='wageSort'&&!s.applied){s.sorted=true;s.message='同职称已排在一起。';}
    if(a==='wageOpen'){s.pane=true;s.draftAggregate=s.aggregate;}
    if(a==='wageCancel')s.pane=false;
    if(a==='wageApply'){if(!s.sorted){s.message='本题先按职称排序，再进行分类汇总。';return;}s.aggregate=s.draftAggregate;s.applied=true;s.level=3;s.pane=false;s.chart=false;s.message='已按职称汇总；点大纲层级2隐藏明细。';}
    if(a==='wageRemove'){s.applied=false;s.pane=false;s.chart=false;}
    if(a==='wageLevel'){s.level=Number(v);s.chart=false;}
    if(a==='wageSelect'){s.selection=v;s.chart=false;s.message=v==='summary'?'已选职称和汇总数值两列，排除总计。':'当前选区含总计；插入图表可观察多出的总计扇区。';}
    if(a==='wageChart'){
      if(!s.applied||s.level!==2||s.selection==='none'){s.message='先完成分类汇总，折叠到层级2，再选择图表数据。';return;}
      s.chart=true;s.message=s.aggregate!=='average'?'当前汇总方式不是原题要求的平均值。':s.selection==='whole'?'总计混入后多出一个扇区，不符合只比较各职称平均工资的要求。':'图表只有各职称平均工资；未包括明细与总计。';
    }
  }
const grades=[['一班',80,70,90],['二班',90,60,80],['一班',100,90,70],['二班',70,80,90]];
const defaults={aggregate:'average',class:false,math:true,english:true,computer:true};
register(['y2020q58'],'相邻记录分组，再汇总三门课','先看未排序的小计，再移除汇总并按班级排序，对照分组结果。',{
    scenario:'grades',wage:wageDefaults,sorted:false,pane:false,applied:null,draft:defaults,level:3,message:'先排序可使同班记录连续。也可以直接汇总，观察相邻分组产生的多个同名小计。'
  },s=>{
    const scenario=controls(select('scenario','真题场景',s.scenario,[['grades','班级多科成绩汇总'],['wages','职称平均工资与饼图']]));
    if(s.scenario==='wages')return scenario+renderWages(s.wage);
    const source=s.sorted?[...grades].sort((a,b)=>a[0].localeCompare(b[0])):grades;
    let display=source;
    if(s.applied){
      const groups=[];for(const row of source){if(!groups.length||groups.at(-1)[0][0]!==row[0])groups.push([]);groups.at(-1).push(row);}
      const agg=rows=>[1,2,3].map((col,i)=>!s.applied[['math','english','computer'][i]]?'':s.applied.aggregate==='count'?rows.length:money(rows.reduce((sum,r)=>sum+r[col],0)/(s.applied.aggregate==='average'?rows.length:1)));
      const label=(text,rows)=>text+(s.applied.class?` · 班级计数 ${rows.filter(r=>r[0]!=='').length}`:'');
      display=groups.flatMap(rows=>[...(s.level===3?rows:[]),...(s.level>=2?[[label(rows[0][0]+' 小计',rows),...agg(rows)]]:[])]);
      display.push([label('总计',source),...agg(source)]);
    }
    return scenario+office('Excel','数据',btn('按班级排序','sort','',s.applied?'disabled':'')+btn('分类汇总…','open'),
      (s.pane?dialog('分类汇总','<p>分类字段：班级</p>'+select('aggregate','汇总方式',s.draft.aggregate,[['average','平均值'],['sum','求和'],['count','计数']])+['class','math','english','computer'].map((k,i)=>`<label><input type="checkbox" data-field="${k}" ${s.draft[k]?'checked':''} ${k==='class'&&s.draft.aggregate!=='count'?'disabled':''}>${['班级（非空文本计数）','数学','英语','计算机'][i]}</label>`).join(''),btn('确定','apply')+btn('取消','cancel')+btn('全部删除汇总','remove','',s.applied?'':'disabled')):'')+
      (s.applied?controls([1,2,3].map(n=>btn(String(n),'level',n,`aria-label="大纲层级${n}"`)).join('')):'')+table(['班级','数学','英语','计算机'],display))+output(s.message);
  },(s,a,v)=>{
    if(s.scenario==='wages'){actWages(s.wage,a,v);return;}
    if(a==='sort'&&!s.applied){s.sorted=true;s.message='同班记录已连续排列，可以重新建立分类汇总。';}
    if(a==='open'){s.draft=clone(s.applied||defaults);s.pane=true;}
    if(a==='cancel')s.pane=false;
    if(a==='apply'){
      if(!['class','math','english','computer'].some(k=>s.draft[k])){s.message='至少选择一个汇总列。';return;}
      s.applied=clone(s.draft);s.pane=false;s.level=3;
      s.message=s.sorted?'每班一个小计；层级1显示总计，2显示小计，3显示明细。总平均由全部原始记录计算。':'未排序时按相邻记录分组，出现多个同名小计。可在分类汇总中全部删除汇总，排序后重做。';
    }
    if(a==='remove'){s.applied=null;s.pane=false;s.message='已移除小计与大纲，原始数据完整保留。';}
    if(a==='level')s.level=Number(v);
  },(s,k,v)=>{if(k==='scenario')s.scenario=v;else if(s.scenario==='wages')s.wage[k]=v;else{s.draft[k]=v;if(k==='aggregate'&&v!=='count')s.draft.class=false;}});
register(['y2026q49'],'区分文本、空白和0，再看实际平均值','转换所选源单元格，或在E列写VALUE公式；三种数据不会按同一种方式统计。',{
    mode:'average',team:'示例一组',rows:[['示例一组','18',true],['示例二组','14',false],['示例一组','25',false],['示例一组','15',true],['示例二组','11',false]],selected:0,method:'error',valueRows:[],formats:{},message:'选一行再转换。清空单元格代表空白，输入0代表数值零。'
  },s=>{
    const eligible=s.rows.filter(r=>!r[2]&&r[1].trim()!==''&&Number.isFinite(Number(r[1]))),matched=eligible.filter(r=>r[0]===s.team);
    const result=s.mode==='sum'?eligible.reduce((sum,r)=>sum+Number(r[1]),0):matched.length?matched.reduce((sum,r)=>sum+Number(r[1]),0)/matched.length:'#DIV/0!';
    const valueResult=r=>r[1]===''?'0':r[1].trim()!==''&&Number.isFinite(Number(r[1]))?money(Number(r[1])):'#VALUE!';
    return controls(select('mode','计算任务',s.mode,[['average','按团队求平均'],['sum','求销售额总和']])+select('team','H5 条件',s.team,[['示例一组','示例一组'],['示例二组','示例二组'],['不存在的组','不存在的组']])+select('method','处理方式',s.method,[['error','单元格错误提示'],['columns','数据→分列'],['value','另列VALUE公式'],['format','只改为数值格式'],['multiply','选择性粘贴：乘1']]))+
      office('Excel',s.method==='columns'?'数据':'公式',s.method==='columns'?btn('分列 → 常规 → 完成','convert'):s.method==='value'?btn('在所选行E列输入VALUE公式','convert'):s.method==='format'?btn('数字格式 → 数值','convert'):s.method==='multiply'?btn('复制数值1 → 选择性粘贴 → 乘','convert'):'',
        table(['行','C 团队','D 销售额','类型','E VALUE公式结果'],s.rows.map((r,i)=>[btn(String(i+3),'select',i,`aria-pressed="${s.selected===i}"`),esc(r[0]),field('amount'+i,'第'+(i+3)+'行金额',r[1]),(r[1]===''?'空白':r[2]?'文本':'数值')+(s.formats[i]?'（显示格式：数值）':''),s.valueRows.includes(i)?`${valueResult(r)}<small>=VALUE(D${i+3})</small>`:'—']))+
        (s.method==='error'?btn('⚠ 所选单元格 → 转换为数字','convert'):'')+`<code>${s.mode==='sum'?'=SUM(D3:D7)':'=AVERAGEIF(C3:C7,H5,D3:D7)'}</code>`+output(`结果：${typeof result==='number'?money(result):result}。空白与文本不进入平均分母；数值0会进入。`))+output(s.message);
  },(s,a,v)=>{
    if(a==='select')s.selected=Number(v);
    if(a==='convert'){
      const row=s.rows[s.selected];
      if(s.method==='format'){s.formats[s.selected]='数值';s.message='已设置数值显示格式；存储类型保持不变，原求和和平均值不变。';return;}
      if(s.method==='value'){if(!s.valueRows.includes(s.selected))s.valueRows.push(s.selected);s.message='E列保存VALUE公式，源D列不变；改动D列后E列跟着重算，D列原平均值仍按源数据类型计算。';return;}
      if(row[1].trim()===''||!Number.isFinite(Number(row[1]))){s.message='当前单元格为空白或不是可转换的数字文本；未改动源值。';return;}
      row[1]=String(Number(row[1]));row[2]=false;s.message='D列所选源格已成为数值，求和与平均值重新计算。';
    }
  },(s,k,v)=>{if(k.startsWith('amount')){const row=s.rows[Number(k.slice(6))];row[1]=v;if(v!==''&&(v.trim()===''||!Number.isFinite(Number(v))))row[2]=true;}else s[k]=v;});
})();

/* Source provenance: note-labs-study.js:352. Preserve this closure. */
(() => {
'use strict';
const {register,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,esc,money}=ui;
const controls=body=>`<div class="lab-controls">${body}</div>`;
const clone=value=>structuredClone(value);
register(['y2023q11'],'在两个工作簿之间移动或复制整张表','打开目标工作簿，设置建立副本，再分别切回源和目标检查。',{
    books:[{name:'成绩汇总.xlsx',open:true,sheets:[{id:'source',name:'总表',rows:[['王宁','86'],['李悦','91']],memo:'成绩汇总源表'},{id:'blank',name:'Sheet1',rows:[],memo:'源工作簿的另一张可见表'}]},{name:'归档.xlsx',open:false,sheets:[{id:'archive',name:'Sheet1',rows:[],memo:'归档工作簿原有工作表'}]}],
    book:0,sheet:'source',pane:false,filePane:false,fileChoice:'1',fromBook:0,fromSheet:'source',target:'1',before:'end',copy:false,serial:1,message:'归档.xlsx尚未打开，因此还不能选为跨工作簿目标。'
  },s=>{
    const book=s.books[s.book],sheet=book.sheets.find(x=>x.id===s.sheet)||book.sheets[0],blocked=s.pane||s.filePane;
    const destination=s.target==='new'?{sheets:[]}:s.books[Number(s.target)],targets=[['new','（新工作簿）'],...s.books.flatMap((b,i)=>b.open?[[String(i),b.name]]:[])];
    const content=`<div ${blocked?'inert':''}><h4>${esc(book.name)} / ${esc(sheet.name)}</h4>${sheet.rows.length?table(['姓名','成绩'],sheet.rows.map((r,i)=>[esc(r[0]),field('score'+i,r[0]+'成绩',r[1],'number')])):field('memo','当前表内容',sheet.memo)}<div class="lab-tabs" aria-label="工作表标签">${book.sheets.map(x=>btn(esc(x.name),'sheet',x.id,`aria-pressed="${x.id===sheet.id}"`)).join('')}</div></div>`;
    return controls(`<b>打开的工作簿</b>${s.books.flatMap((b,i)=>b.open?[btn(esc(b.name),'book',i,`aria-pressed="${s.book===i}" ${blocked?'disabled':''}`)]:[]).join('')}`)+
      office('Excel',s.filePane?'文件':'开始',btn('文件 → 打开…','file','',blocked?'disabled':'')+btn('格式 → 移动或复制工作表…','open','',blocked?'disabled':''),content+
        (s.filePane?dialog('打开工作簿',select('fileChoice','示例文件',s.fileChoice,s.books.map((b,i)=>[String(i),b.name])),btn('打开','fileOpen')+btn('取消','fileCancel')):'')+
        (s.pane?dialog('移动或复制',`<p>当前表：${esc(s.books[s.fromBook].sheets.find(x=>x.id===s.fromSheet)?.name||'')}</p>`+select('target','工作簿',s.target,targets)+select('before','下列选定工作表之前',s.before,[...destination.sheets.map(x=>[x.id,x.name]),['end','移至最后']])+`<label><input type="checkbox" data-field="copy" ${s.copy?'checked':''}>建立副本</label>`,btn('确定','apply')+btn('取消','cancel')):''))+
      output(s.message)+coach('上方工作簿按钮用于切换示例窗口。复制后两边可分别修改；移动后源标签消失。取消窗口不会改变任何工作表。');
  },(s,a,v)=>{
    if(a==='book'&&!s.pane&&!s.filePane&&s.books[Number(v)]?.open){s.book=Number(v);s.sheet=s.books[s.book].sheets[0].id;}
    if(a==='sheet'&&!s.pane&&!s.filePane)s.sheet=v;
    if(a==='file'){s.filePane=true;s.fileChoice=String(s.books.findIndex(x=>!x.open));if(s.fileChoice==='-1')s.fileChoice='1';}
    if(a==='fileCancel')s.filePane=false;
    if(a==='fileOpen'){const n=Number(s.fileChoice);s.books[n].open=true;s.book=n;s.sheet=s.books[n].sheets[0].id;s.filePane=false;s.message='已打开'+s.books[n].name+'；从上方切回源工作簿后操作总表。';}
    if(a==='open'){
      s.fromBook=s.book;s.fromSheet=s.sheet;s.target=String(s.books.findIndex((b,i)=>b.open&&i!==s.book));if(s.target==='-1')s.target=String(s.book);
      s.before='end';s.copy=false;s.pane=true;
    }
    if(a==='cancel')s.pane=false;
    if(a==='apply'){
      if(s.target==='new'&&!s.copy&&s.books[s.fromBook].sheets.length===1){s.message='源工作簿需保留可见工作表，本例请选择建立副本。';return;}
      if(s.target==='new'){s.books.push({name:'工作簿'+s.serial+++'.xlsx',open:true,sheets:[]});s.target=String(s.books.length-1);}
      const from=s.books[s.fromBook],to=s.books[Number(s.target)],index=from.sheets.findIndex(x=>x.id===s.fromSheet),source=from.sheets[index];
      if(!to?.open||!source){s.message='请选择已打开的目标工作簿。';return;}
      if(!s.copy&&from!==to&&from.sheets.length===1){s.message='源工作簿必须保留至少一张可见工作表；请先新建另一张表或选择建立副本。';return;}
      if(!s.copy&&from===to&&s.before===source.id){s.pane=false;s.message='目标位置就是原表之前，顺序保持不变。';return;}
      let item;
      if(s.copy){item=clone(source);item.id='copy-'+s.serial++;}else item=from.sheets.splice(index,1)[0];
      const existing=new Set(to.sheets.map(x=>x.name));let name=item.name,n=2;while(existing.has(name))name=item.name+' ('+(n++)+')';item.name=name;
      const pos=s.before==='end'?to.sheets.length:to.sheets.findIndex(x=>x.id===s.before);to.sheets.splice(pos<0?to.sheets.length:pos,0,item);
      s.book=Number(s.target);s.sheet=item.id;s.pane=false;
      s.message=s.copy?'已复制整张表，源表仍保留。分别修改两边的成绩，可验证两份数据独立。':'已移动整张表，源工作簿的原标签已移除，目标工作簿保留完整数据。';
    }
  },(s,k,v)=>{
    if(k.startsWith('score')){if(s.pane||s.filePane)return;const sheet=s.books[s.book].sheets.find(x=>x.id===s.sheet);sheet.rows[Number(k.slice(5))][1]=v;}
    else if(k==='memo'){if(!s.pane&&!s.filePane)s.books[s.book].sheets.find(x=>x.id===s.sheet).memo=v;}
    else{s[k]=v;if(k==='target')s.before='end';}
  });
const freezeRows=Array.from({length:40},(_,i)=>i===0?['订单号','日期','经办人','部门','数量','金额']:i===1?['筛选条件','全部','全部','全部','全部','全部']:[String(i-1).padStart(3,'0'),'2024/03/'+String((i-2)%28+1).padStart(2,'0'),['王宁','李悦','张琳'][(i-2)%3],['一部','二部'][(i-2)%2],String((i-2)%8+1),String(120+(i-2)*15)]);
register(['y2024q58'],'冻结后亲手滚动，观察哪几行列留在原处','点A3或C3，再冻结窗格；上下、左右滚动这张工作表。',{
    selected:{row:3,col:1},frozen:{rows:0,cols:0},menu:false,message:'当前选中A3。冻结窗格固定活动格上方的行、左侧的列。'
  },s=>{
    const name=String.fromCharCode(64+s.selected.col)+s.selected.row;
    const cellStyle=(row,col)=>{
      const top=row<=s.frozen.rows,left=col<=s.frozen.cols;
      return `${top||left?'position:sticky;':''}${top?'top:'+(32+(row-1)*38)+'px;':''}${left?'left:'+(48+(col-1)*108)+'px;':''}z-index:${top&&left?4:top||left?3:1};${top||left?'background:#f6edf8;':''}${row===s.frozen.rows?'border-bottom:2px solid #945ba0;':''}${col===s.frozen.cols?'border-right:2px solid #945ba0;':''}`;
    };
    return office('Excel','视图',btn('冻结窗格 ▾','menu')+(s.menu?(s.frozen.rows||s.frozen.cols?btn('取消冻结窗格','unfreeze'):btn('冻结窗格','freeze'))+btn('冻结首行','firstRow')+btn('冻结首列','firstCol')+btn('关闭菜单','close'):''),
      `<p>活动单元格：<b>${name}</b>　已冻结：前${s.frozen.rows}行 / 前${s.frozen.cols}列</p><div class="lab-freeze-scroll" tabindex="0" aria-label="可真实上下左右滚动的工作表"><table class="lab-freeze-grid"><colgroup><col style="width:48px">${'<col style="width:108px">'.repeat(6)}</colgroup><thead><tr><th style="left:0;z-index:7"></th>${['A','B','C','D','E','F'].map((c,i)=>`<th style="${i<s.frozen.cols?'left:'+(48+i*108)+'px;z-index:6;':''}">${c}</th>`).join('')}</tr></thead><tbody>${freezeRows.map((row,i)=>`<tr><th scope="row" style="left:0;${i<s.frozen.rows?'top:'+(32+i*38)+'px;z-index:5;':''}">${i+1}</th>${row.map((text,j)=>`<td style="${cellStyle(i+1,j+1)}">${btn(esc(text),'cell',`${i+1}:${j+1}`,`aria-label="${String.fromCharCode(65+j)}${i+1} ${esc(text)}" aria-pressed="${s.selected.row===i+1&&s.selected.col===j+1}"`)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)+
      controls(btn('定位A3','locate','3:1')+btn('定位C3','locate','3:3'))+output(s.message)+coach('直接在表格内滑动。紫色边界区分冻结部分；下方定位按钮是学习辅助。取消冻结后，数据行列会一起滚动，行号和列标仍是工作表外框。');
  },(s,a,v)=>{
    if(a==='cell'||a==='locate'){const [row,col]=v.split(':').map(Number);s.selected={row,col};s.message='当前活动格为'+String.fromCharCode(64+col)+row+'，尚未改变既有冻结设置。';}
    if(a==='menu')s.menu=!s.menu;if(a==='close')s.menu=false;
    if(['freeze','firstRow','firstCol','unfreeze'].includes(a)){
      s.frozen=a==='freeze'?{rows:s.selected.row-1,cols:s.selected.col-1}:a==='firstRow'?{rows:1,cols:0}:a==='firstCol'?{rows:0,cols:1}:{rows:0,cols:0};s.menu=false;
      s.message=a==='unfreeze'?'已取消冻结，请再次上下、左右滚动验证。':`已冻结前${s.frozen.rows}行和前${s.frozen.cols}列；现在在表格里滚动查看。`;
    }
  });
const printRows=[['编号','项目','负责人','金额'],...Array.from({length:40},(_,i)=>[String(i+1).padStart(3,'0'),['设备维护','资料印刷','实验耗材','系统升级'][i%4],['王宁','李悦'][i%2],String(680+i*125)])];
const printWidths=[55,65,60,50],rowHeight=12;
const printDefaults={horizontal:false,vertical:false,orientation:'portrait',scaleMode:'percent',percent:100,rowCount:'8',area:'all',repeatRow:false,repeatCol:false,order:'down',paperSize:'A4',margin:20,firstPage:1,footer:false};
function printLayout(settings){
 const short=settings.paperSize==='A5'?148:210,long=settings.paperSize==='A5'?210:297;
 const width=settings.orientation==='portrait'?short:long,height=settings.orientation==='portrait'?long:short,margin=Number(settings.margin),usableWidth=width-margin*2,usableHeight=height-margin*2;
 const sourceRows=Array.from({length:Number(settings.rowCount)+1},(_,i)=>i),sourceCols=settings.area==='first'?[0,1]:[0,1,2,3],totalWidth=sourceCols.reduce((n,i)=>n+printWidths[i],0);
 const factor=settings.scaleMode==='percent'?settings.percent/100:Math.min(1,usableWidth/totalWidth,settings.scaleMode==='page'?usableHeight/(sourceRows.length*rowHeight):1);
 const columns=[];let group=[],size=0;
 sourceCols.forEach(i=>{const v=printWidths[i]*factor;if(group.length&&size+v>usableWidth+.001){columns.push(group);group=settings.repeatCol?[0]:[];size=settings.repeatCol?printWidths[0]*factor:0;}group.push(i);size+=v;});columns.push(group);
 const rowsPerPage=Math.max(1,Math.floor(usableHeight/(rowHeight*factor))),rowGroups=[];
 let cursor=0;while(cursor<sourceRows.length){const repeat=settings.repeatRow&&cursor>0?[0]:[],take=Math.max(1,rowsPerPage-repeat.length);rowGroups.push([...repeat,...sourceRows.slice(cursor,cursor+take)]);cursor+=take;}
 const pages=settings.order==='down'?columns.flatMap(cols=>rowGroups.map(rows=>({rows,cols}))):rowGroups.flatMap(rows=>columns.map(cols=>({rows,cols})));
 return {width,height,margin,usableWidth,usableHeight,factor,pages};
}
function printPage(s){
 const layout=printLayout(s.applied),page=layout.pages[Math.min(s.page,layout.pages.length-1)],width=page.cols.reduce((sum,c)=>sum+printWidths[c]*layout.factor,0),height=page.rows.length*rowHeight*layout.factor;
 const x=layout.margin+(s.applied.horizontal?(layout.usableWidth-width)/2:0),y=layout.margin+(s.applied.vertical?(layout.usableHeight-height)/2:0);
 let grid='';page.rows.forEach((r,ri)=>{let left=x;page.cols.forEach(c=>{const cw=printWidths[c]*layout.factor,rh=rowHeight*layout.factor;grid+=`<rect x="${left}" y="${y+ri*rh}" width="${cw}" height="${rh}" fill="${r===0?'#f1e8f8':'white'}" stroke="#776c80" stroke-width=".35"/><text data-print-cell="${String.fromCharCode(65+c)}${r+1}" x="${left+2*layout.factor}" y="${y+ri*rh+7.8*layout.factor}" font-size="${4.7*layout.factor}" fill="#332a3b">${esc(printRows[r][c])}</text>`;left+=cw;});});
 return `<div class="lab-print-scroll" tabindex="0" aria-label="打印预览，可放大后滚动"><svg class="lab-print-page ${s.zoom?'zoomed':''}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" data-print-factor="${layout.factor}" aria-label="${s.applied.orientation==='portrait'?'纵向':'横向'}纸张，第${s.page+1}页，共${layout.pages.length}页"><rect x=".5" y=".5" width="${layout.width-1}" height="${layout.height-1}" fill="white" stroke="#b5a9bf"/><rect x="${layout.margin}" y="${layout.margin}" width="${layout.usableWidth}" height="${layout.usableHeight}" fill="none" stroke="#bba4c5" stroke-dasharray="2 2" stroke-width=".4"/>${grid}${s.applied.footer?`<text data-print-footer x="${layout.width/2}" y="${layout.height-8}" text-anchor="middle" font-size="5">${Number(s.applied.firstPage)+s.page}</text>`:''}</svg></div><p>第 ${s.page+1} / ${layout.pages.length} 页 · ${s.applied.paperSize} ${s.applied.orientation==='portrait'?'纵向':'横向'} · 实际缩放 ${Math.round(layout.factor*100)}%</p>`;
}
register(['y2023q10'],'从打印范围到跨页标题，逐页核对输出','先用8行观察横向分页，再用40行比较一页宽与整表一页。',{
 applied:printDefaults,draft:printDefaults,pane:false,tab:'margins',preview:false,page:0,zoom:false,message:'工作表数据位置固定。页面设置只影响纸张输出。'
},s=>{
 const layout=printLayout(s.applied);
 return office('Excel',s.preview?'文件 · 打印':'页面布局',btn('页面设置 ↘','open','',s.pane?'disabled':'')+btn(s.preview?'返回工作表':'文件 → 打印预览','preview','',s.pane?'disabled':''),
  `<div ${s.pane?'inert':''}>${s.preview?printPage(s):`<div data-print-source>${table(printRows[0],printRows.slice(1,Number(s.applied.rowCount)+1))}</div>`}</div>`+
  (s.pane?dialog('页面设置',`<div class="lab-tabs">${btn('页面','tab','page',`aria-pressed="${s.tab==='page'}"`)}${btn('页边距','tab','margins',`aria-pressed="${s.tab==='margins'}"`)}${btn('工作表','tab','sheet',`aria-pressed="${s.tab==='sheet'}"`)}</div>`+
   (s.tab==='margins'?field('margin','四边页边距（mm）',s.draft.margin,'number','min="10" max="30"')+`<label><input type="checkbox" data-field="horizontal" ${s.draft.horizontal?'checked':''}>水平居中</label><label><input type="checkbox" data-field="vertical" ${s.draft.vertical?'checked':''}>垂直居中</label>`:
   s.tab==='page'?select('orientation','方向',s.draft.orientation,[['portrait','纵向'],['landscape','横向']])+select('paperSize','纸张大小',s.draft.paperSize,[['A4','A4'],['A5','A5']])+select('scaleMode','缩放',s.draft.scaleMode,[['percent','缩放比例'],['width','调整为1页宽，高度自动'],['page','调整为1页宽、1页高']])+(s.draft.scaleMode==='percent'?field('percent','缩放比例（%）',s.draft.percent,'number','min="50" max="150" step="10"'):'')+field('firstPage','起始页码',s.draft.firstPage,'number','min="1" max="99"')+`<label><input type="checkbox" data-field="footer" ${s.draft.footer?'checked':''}>页脚插入页码（本例合并展示）</label>`:
   select('rowCount','示例记录规模',s.draft.rowCount,[['8','8行明细'],['40','40行明细']])+select('area','打印区域',s.draft.area,[['all','全部A:D（清除范围限制）'],['first','只打印A:B']])+`<label><input type="checkbox" data-field="repeatRow" ${s.draft.repeatRow?'checked':''}>顶端标题行 $1:$1</label><label><input type="checkbox" data-field="repeatCol" ${s.draft.repeatCol?'checked':''}>左端标题列 $A:$A</label>`+select('order','打印顺序',s.draft.order,[['down','先向下，再向右'],['across','先向右，再向下']])),btn('确定','apply')+btn('取消','cancel')):''))+
  (s.preview?controls(btn('上一页','previous','',s.page===0||s.pane?'disabled':'')+btn('下一页','next','',s.page>=layout.pages.length-1||s.pane?'disabled':'')+btn(s.zoom?'适合屏幕':'放大预览','zoom','',s.pane?'disabled':'')):'')+output(s.message)+coach('本例用固定尺寸和已设置边框的示例表计算分页；8/40行切换是学习控制，页脚开关在真实Excel的“页眉/页脚”页。未模拟打印机、任意区域、多打印区域、手动分页或全部纸型。边框不是默认打印网格线；确认不会实际打印文件。');
},(s,a,v)=>{
 if(a==='open'){s.draft=clone(s.applied);s.pane=true;s.tab='margins';}
 if(a==='tab')s.tab=v;
 if(a==='cancel'){s.pane=false;s.message='已取消本次设置，打印范围、纸张和已确认分页保持原值。';}
 if(a==='apply'){
  if(s.draft.scaleMode==='percent'&&(!Number.isFinite(Number(s.draft.percent))||Number(s.draft.percent)<50||Number(s.draft.percent)>150)){s.message='本例缩放比例可输入50—150。';return;}
  if(!Number.isFinite(Number(s.draft.margin))||Number(s.draft.margin)<10||Number(s.draft.margin)>30||!Number.isInteger(Number(s.draft.firstPage))||Number(s.draft.firstPage)<1||Number(s.draft.firstPage)>99){s.message='本例页边距须为10—30 mm，起始页码为1—99整数。原设置未改变。';return;}
  const proposed=printLayout(s.draft);if(proposed.pages.some(p=>p.cols.reduce((sum,c)=>sum+printWidths[c]*proposed.factor,0)>proposed.usableWidth+.001)){s.message='本例纸宽无法容纳完整单元格与重复标题列；请减小比例、边距或改为一页宽。原设置未改变。';return;}
  s.applied=clone(s.draft);s.applied.percent=Number(s.applied.percent);s.pane=false;s.page=0;s.message='已应用纸张与输出设置；请逐页核对重复标题和缺失列，返回工作表可见未打印的数据仍在。';
 }
 if(a==='preview'&&!s.pane){s.preview=!s.preview;s.page=0;}
 if(a==='previous')s.page=Math.max(0,s.page-1);if(a==='next')s.page=Math.min(printLayout(s.applied).pages.length-1,s.page+1);if(a==='zoom')s.zoom=!s.zoom;
 if(['apply','cancel','preview','previous','next','zoom'].includes(a)&&!s.pane)s.revealResult=true;
},(s,k,v)=>{s.draft[k]=v;});
window.NOTE_LABS.registry.y2023q10.afterRender=(s,root)=>{
    if(!s.revealResult)return;
    s.revealResult=false;
    const target=root.querySelector(s.preview?'.lab-print-scroll':'.lab-office');
    if(!target)return;
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    target.scrollIntoView?.({block:'nearest',inline:'nearest'});
  };
})();

/* Source provenance: note-labs-study.js:476. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui}=window.NOTE_LABS;
const {btn,field,select,office,dialog,table,output,coach,esc,money}=ui;
const controls=body=>`<div class="lab-controls">${body}</div>`;
const clone=value=>structuredClone(value);
const series=[20,26,24,34,35,41];
function leastSquares(values){
    const n=values.length,xMean=(n+1)/2,yMean=values.reduce((a,b)=>a+b,0)/n;
    let numerator=0,denominator=0;
    values.forEach((y,i)=>{numerator+=(i+1-xMean)*(y-yMean);denominator+=(i+1-xMean)**2;});
    const slope=numerator/denominator,intercept=yMean-slope*xMean;
    return {slope,intercept,predict:x=>slope*x+intercept};
  }
register(['y2024q68'],'沿同一条趋势线，向未来延长几个周期','改变预测期数，观察末端月份与预测值一起变化；已有数据点不移动。',{
    values:series,applied:null,pane:false,draft:0,message:'蓝点是1—6月的原始观测；横轴固定为1—9月，每格代表一个月。'
  },s=>{
    const fit=leastSquares(s.values),forward=s.applied??0,endMonth=6+forward;
    const x=month=>40+(month-1)*40,y=value=>238-value*3.6;
    const plot=`<svg viewBox="0 0 400 276" style="width:100%;height:auto;display:block;background:white" role="img" aria-label="1至9月坐标图，实测数据位于1至6月${s.applied===null?'':`，线性趋势线延伸到第${endMonth}月`}">
      ${[0,20,40,60].map(value=>`<line x1="40" y1="${y(value)}" x2="360" y2="${y(value)}" stroke="#e5dfe9"/><text x="32" y="${y(value)+5}" text-anchor="end" font-size="24" fill="#605965">${value}</text>`).join('')}
      <line x1="40" y1="238" x2="360" y2="238" stroke="#918698"/>
      ${Array.from({length:9},(_,i)=>`<text x="${x(i+1)}" y="263" text-anchor="middle" font-size="24" fill="#605965">${i+1}</text>`).join('')}
      <polyline points="${s.values.map((value,i)=>`${x(i+1)},${y(value)}`).join(' ')}" fill="none" stroke="#5490aa" stroke-width="2"/>
      ${s.values.map((value,i)=>`<circle cx="${x(i+1)}" cy="${y(value)}" r="5" fill="#39798f"/>`).join('')}
      ${s.applied===null?'':`<line data-trend-line x1="${x(1)}" y1="${y(fit.predict(1))}" x2="${x(endMonth)}" y2="${y(fit.predict(endMonth))}" stroke="#a05a94" stroke-width="3" stroke-dasharray="8 5"/><circle cx="${x(endMonth)}" cy="${y(fit.predict(endMonth))}" r="5" fill="#a05a94"/>`}
    </svg>`;
    return office('Excel','图表工具 · 设计',btn('添加图表元素 → 趋势线','open'),
      `${s.pane?dialog('设置趋势线格式','<p>趋势线类型：线性</p>'+select('draft','预测 · 向前（周期）',s.draft,[[0,'0'],[1,'1'],[3,'3']]),''):''}${plot}<p style="text-align:center;margin:0">月份（1格＝1个月）</p>`)+
      (s.pane?controls('<span>学习控制：参数暂存</span>'+btn('应用参数','apply')+btn('取消本次修改','cancel')):'')+
      output(s.message)+
      (s.applied===null?'':output(`拟合公式：y = ${fit.slope.toFixed(4)}x + ${fit.intercept.toFixed(4)}。第${endMonth}月的趋势值为 ${money(fit.predict(endMonth))}；该值来自原始6点的最小二乘拟合。`))+
      coach('蓝色折线连接实测点；紫色虚线表示拟合趋势。向前预测只延长既有趋势线，不改变原始观测值，也不重新改变斜率。参数暂存及应用按钮是卡片的学习控制；真实Excel格式窗格按修改即时更新。');
  },(s,a)=>{
    if(a==='open'){s.draft=s.applied??0;s.pane=true;}
    if(a==='apply'){if(![0,1,3].includes(Number(s.draft)))return;s.applied=Number(s.draft);s.pane=false;s.message=s.applied?`向前${s.applied}个周期：从第6月延伸到第${6+s.applied}月。原有点与坐标尺度保持不变。`:'已添加线性趋势线，终点为第6月，没有预测未来月份。';}
    if(a==='cancel'){s.draft=s.applied??0;s.pane=false;s.message='未应用的参数已丢弃，图表保持上一次应用后的状态。';}
  },(s,k,v)=>{if(k==='draft')s.draft=Number(v);});
registry.y2024q68.leastSquares=leastSquares;
function tableGrid(s){
    const busy=s.pane||s.filterPane||s.convertPane;
    const rows=s.rows.map((row,i)=>{
      const hidden=i>0&&s.filter!=='all'&&String(row[0])!==s.filter;
      return `<tr ${hidden?'hidden':''}>${row.map((value,j)=>{
        const isHead=s.styled&&i===0,tag=isHead?'th':'td';
        const color=isHead?'#e7d1e6':s.styled&&i<s.styledRows?(i%2?'#faf0f7':'#fff'):'#fff';
        return `<${tag} style="border:1px solid #d9cddb;padding:10px;background:${color};word-break:break-word">${s.created&&i===0&&j===0?btn(esc(value)+' ▾','filter','',`aria-label="筛选${esc(value)}" ${busy?'disabled':''}`):esc(value)||'&nbsp;'}</${tag}>`;
      }).join('')}</tr>`;
    }).join('');
    return `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;table-layout:fixed"><thead><tr><th scope="col">A</th><th scope="col">B</th></tr></thead><tbody>${rows}<tr>${['a','b'].map((key,j)=>`<td style="border:1px solid #d9cddb;padding:6px;vertical-align:top">${field('new'+key,String.fromCharCode(65+j)+(s.rows.length+1),s['new'+key],'text',`style="min-width:0;width:100%;box-sizing:border-box;font-size:16px" ${busy?'disabled':''}`)}</td>`).join('')}</tr></tbody></table></div>`;
  }
register(['y2024q59'],'从普通区域创建表，再观察新增行与表头','切换“表包含标题”，再在紧邻的下一行输入数据；转换为区域后比较功能与外观。',{
    rows:[['姓名','成绩'],['王宁','80'],['李悦','95']],created:false,styled:false,styledRows:0,hasHeader:true,draftHeader:true,pane:false,filterPane:false,filter:'all',draftFilter:'all',convertPane:false,newa:'',newb:'',message:'当前 A1:B3 是普通单元格区域。第一行已有“姓名、成绩”。'
  },s=>office('Excel',s.created?'表格工具 · 设计':'开始',s.created?btn('转换为区域','convert'):btn('套用表格格式','open'),
    `${s.pane?dialog('套用表格式','<p>表数据的来源：=$A$1:$B$'+s.rows.length+'</p>'+`<label><input type="checkbox" data-field="draftHeader" ${s.draftHeader?'checked':''}>表包含标题</label>`,btn('确定','apply')+btn('取消','cancel')):''}
    ${s.filterPane?dialog('筛选 '+esc(s.rows[0][0]),select('draftFilter','显示项目',s.draftFilter,[['all','全选'],...[...new Set(s.rows.slice(1).map(row=>String(row[0])))].map(value=>[value,value||'（空白）'])]),btn('确定','filterApply')+btn('取消','filterCancel')):''}
    ${s.convertPane?dialog('Microsoft Excel','<p>是否将表转换为普通区域？</p>',btn('是','convertApply')+btn('否','convertCancel')):''}
    ${tableGrid(s)}`)+
    controls(btn('模拟键盘：Enter（确认新增行）','append')+`<span>${s.created?'表1 范围：A1:B'+s.rows.length:s.styled?'已转换为普通区域，原有样式保留':'普通区域'}</span>`)+output(s.message)+
    coach('新增行的输入格就是表格正下方的工作表单元格，按Enter确认。表对象会自动扩展；普通区域没有表对象的自动扩展功能。'),
    (s,a)=>{
      if(a==='open'){s.draftHeader=true;s.pane=true;}
      if(a==='cancel'){s.pane=false;s.message='取消创建，原数据与格式未改变。';}
      if(a==='apply'){
        if(!s.draftHeader)s.rows.unshift(['列1','列2']);
        s.created=true;s.styled=true;s.styledRows=s.rows.length;s.hasHeader=s.draftHeader;s.pane=false;s.filter='all';
        s.message=s.hasHeader?'第一行“姓名、成绩”成为表头，2条数据记录保留。':'Excel在原数据上方加入“列1、列2”表头；原“姓名、成绩”仍作为一条数据记录。';
      }
      if(a==='append'){
        if(s.pane||s.filterPane||s.convertPane)return;
        if(!s.newa&&!s.newb){s.message='先在表格正下方输入至少一个值，再按Enter确认。';return;}
        s.rows.push([s.newa,s.newb]);s.newa='';s.newb='';
        if(s.created){s.styledRows=s.rows.length;s.message='新记录已经加入表1，表范围扩展到 A1:B'+s.rows.length+'，新增行应用表样式。';}
        else s.message='新数据已写入下一行；没有表对象可自动扩展，原有区域格式保留。';
      }
      if(a==='filter'&&s.created){s.draftFilter=s.filter;s.filterPane=true;}
      if(a==='filterApply'){s.filter=s.draftFilter;s.filterPane=false;s.message=s.filter==='all'?'显示全部记录。':'仅显示所选项目；原始数据没有删除。';}
      if(a==='filterCancel')s.filterPane=false;
      if(a==='convert'&&s.created)s.convertPane=true;
      if(a==='convertCancel')s.convertPane=false;
      if(a==='convertApply'){s.created=false;s.convertPane=false;s.message='已转换为普通区域。表头颜色、条纹与现有数据保留；筛选箭头及表格工具消失。';}
    },(s,k,v)=>{s[k]=v;});
registry.y2024q59.keydown=(s,e)=>{if(e.key==='Enter'&&e.target?.matches('[data-field="newa"],[data-field="newb"]')){e.preventDefault();registry.y2024q59.action(s,'append');return true;}return false;};
register(['y2023q60'],'限定成绩区域，只替换真正的空单元格','从 B2 拖到 B6 选择范围，再把查找内容留空；含一个空格的单元格不会被误当成空白。',{
    values:['88','',' ','95',''],start:-1,end:-1,pane:false,find:'',replacement:'缺考',previous:null,message:'B3与B6没有内容；B4含一个空格。选中单元格后，可在卡片下方查看其内容。'
  },s=>{
    const first=Math.min(s.start,s.end),last=Math.max(s.start,s.end),range=s.start<0?'未选中':first===last?'B'+(first+2):'B'+(first+2)+':B'+(last+2);
    const cells=table(['行','A 姓名','B 成绩'],s.values.map((value,i)=>[i+2,['王宁','李悦','赵敏','周林','陈晨'][i],`<button type="button" ${s.pane?'disabled':'data-lab-drag="range"'} data-row="${i}" data-lab-act="cell" data-value="${i}" class="lab-cell ${s.start>=0&&i>=first&&i<=last?'lab-selected':''}" style="width:100%;min-height:44px;touch-action:none;white-space:pre-wrap" aria-label="B${i+2}">${esc(value)||'&nbsp;'}</button>`]));
    const detail=s.start<0?'':s.values[s.start]===''?'真正空白（无内容）':s.values[s.start]===' '?'一个空格（文本）':'内容：'+esc(s.values[s.start]);
    return office('Excel','开始',btn('查找和选择 → 替换','open'),
      `<p>选区：${range}</p>${s.pane?dialog('查找和替换',field('find','查找内容',s.find)+field('replacement','替换为',s.replacement)+'<label><input type="checkbox" checked disabled>单元格匹配</label><p>搜索范围：'+range+'</p>',btn('全部替换','apply')+btn('关闭','cancel')):''}${cells}`)+
      controls(btn('触屏辅助：选中 B2:B6','all')+btn('撤销本次替换','undo','',s.previous?'':'disabled'))+
      output(s.message)+(detail?output(`选中起点 B${s.start+2}：${detail}。`):'')+
      coach('辅助选区按钮与撤销按钮属于本卡片。真正的空白没有字符；空格是字符。这里演示选区内的完整单元格匹配，不包含通配符、格式查找或公式。');
  },(s,a,v)=>{
    if(a==='cell'&&!s.pane){s.start=s.end=Number(v);s.message='已选中 B'+(s.start+2)+'。可从该格拖到末格扩展选区。';}
    if(a==='all'&&!s.pane){s.start=0;s.end=4;s.message='已选中 B2:B6，姓名列不参与替换。';}
    if(a==='open'){
      if(s.start<0||s.start===s.end){s.message='先选择多格区域。本例要求选中成绩区域，避免在整个工作表中替换。';return;}
      s.pane=true;
    }
    if(a==='cancel'){s.pane=false;s.message='替换窗口已关闭；尚未执行的输入不改变表格。已经执行的替换需用撤销恢复。';}
    if(a==='apply'){
      if(!s.pane)return;
      const first=Math.min(s.start,s.end),last=Math.max(s.start,s.end);let count=0;
      const before=clone(s.values);
      s.values=s.values.map((value,i)=>{if(i>=first&&i<=last&&value===s.find){count++;return s.replacement;}return value;});
      if(count)s.previous=before;
      s.message=`在成绩选区内替换了 ${count} 处。`+(s.find===''?'空格单元格不符合“无内容”，保持原样。':'仅完整内容相同的单元格被替换。');
    }
    if(a==='undo'&&s.previous){s.values=clone(s.previous);s.previous=null;s.message='已恢复上一次替换前的单元格内容。';}
  },(s,k,v)=>{s[k]=v;});
})();

/* Source provenance: note-labs-study.js:597. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui}=window.NOTE_LABS;
const {btn,field,select,office,dialog,output,esc}=ui;
const controls=html=>`<div class="lab-controls">${html}</div>`;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const clone=x=>structuredClone(x);
const simpleTable=(headers,rows)=>`<div style="overflow:auto;max-width:100%;background:white" tabindex="0" aria-label="工作表，可横向滚动"><table style="width:100%;min-width:0;table-layout:fixed;border-collapse:collapse">${headers[0]==='行'?`<colgroup><col style="width:42px">${headers.slice(1).map(()=>'<col>').join('')}</colgroup>`:''}<thead><tr>${headers.map(h=>`<th scope="col" style="padding:9px 6px">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td style="padding:9px 6px;overflow-wrap:anywhere">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function extract(s){
    const text=String(s.text),rawCount=String(s.count).trim(),rawStart=String(s.start).trim();
    const count=Number(rawCount),start=Number(rawStart);
    // The exposed fields represent numeric function arguments; missing arguments are not silently supplied.
    if(rawCount===''||(s.fn==='MID'&&rawStart===''))return{pending:true,value:'',indices:[]};
    if(!Number.isFinite(count)||count<0||(s.fn==='MID'&&(!Number.isFinite(start)||start<1)))return{error:true,value:'#VALUE!',indices:[]};
    const n=Math.floor(count),from=s.fn==='MID'?Math.floor(start)-1:s.fn==='RIGHT'?Math.max(0,text.length-n):0;
    return{value:text.slice(from,from+n),indices:Array.from({length:text.length},(_,i)=>i).filter(i=>i>=from&&i<from+n)};
  }
register(['y2020q56'],'改动参数，观察真正被提取的字符','从1开始数位置；函数结果和下方字符尺同步变化。',
    {text:'20210103',fn:'MID',start:'7',count:'2'},s=>{
      const result=extract(s),formula=`=${s.fn}(A2,${s.fn==='MID'?s.start+',':''}${s.count})`;
      return controls(field('text','A2 源文本',s.text,'text','maxlength="48"')+select('fn','提取函数',s.fn,[['MID','MID：从指定位置取'],['LEFT','LEFT：从左端取'],['RIGHT','RIGHT：从右端取']])+(s.fn==='MID'?field('start','起始位置 start_num',s.start,'number','step="1"'):'')+field('count','字符数量 num_chars',s.count,'number','step="1"'))+
        office('Excel','公式',`<code class="lab-formula">${esc(formula)}</code>`,simpleTable(['A 源文本','B 提取结果'],[[esc(s.text),`<strong data-extract-result style="font-size:20px;color:${result.error?'#ad345f':'#5d4678'}">${result.pending?'待输入':result.value===''?'&nbsp;':esc(result.value)}</strong>`]]))+
        `<div style="margin-top:14px"><b>字符位置尺</b><div aria-label="源文本字符及位置" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:9px">${s.text.split('').map((ch,i)=>`<span data-character-index="${i+1}" style="display:grid;min-width:30px;padding:4px 3px;text-align:center;border-radius:5px;background:${result.indices.includes(i)?'#ead6f0':'#f2eff5'};border:1px solid ${result.indices.includes(i)?'#9d6ba8':'transparent'}"><small>${i+1}</small><b style="font-size:18px">${ch===' '?'␠':esc(ch)}</b></span>`).join('')||'<span>源文本为空</span>'}</div></div>`+
        output(result.pending?'补齐参数后计算；起点和数量可以试填0或负数，观察边界。':result.error?'#VALUE!：MID起点必须至少为1；MID、LEFT、RIGHT的字符数量不能为负。':result.value===''?'结果为空字符串 ""，没有取到字符。它不是数值0。':`结果为文本“${esc(result.value)}”，共取出 ${result.value.length} 个字符。${/^0\d/.test(result.value)?'前导0仍然保留。':''}`);
    },()=>{},(s,k,v)=>{s[k]=String(v);});
registry.y2020q56.extract=extract;
const dateSerial=(Date.UTC(2026,8,5)-Date.UTC(1899,11,30))/86400000+14.5/24;
const dateText=s=>s.format==='general'?String(Math.round((s.negative?-1:dateSerial)*100000)/100000):s.negative?'':s.format==='short'?'2026/9/5':'2026/9/5 14:30';
const neededWidth=s=>Math.ceil(dateText(s).length*s.font*.62+20);
const displayDate=(s,width=s.width)=>s.negative&&s.format!=='general'||neededWidth(s)>width?'#'.repeat(Math.max(3,Math.floor((width-20)/(s.font*.62)))):dateText(s);
function resizePreview(s,g,root){
    if(g.kind!=='column')return;
    const width=clamp(Math.round(s.width+g.dx),70,300),grid=root.querySelector('[data-width-grid]');
    if(!grid)return;
    grid.style.gridTemplateColumns=`42px ${width}px 62px`;
    grid.style.width=(width+104)+'px';
    root.querySelector('[data-hash-date]').textContent=displayDate(s,width);
    const boundary=root.querySelector('[data-lab-drag="column"]');
    boundary?.setAttribute('aria-valuenow',String(width));
    const readout=root.querySelector('[data-width-readout]');if(readout)readout.textContent=width+' px';
  }
register(['y2020q7'],'拉宽列边界，找回被井号遮住的日期','拖动B列标题右边界；也可减小字号、改短日期，比较显示和原值。',
    {width:130,font:16,format:'full',negative:false,message:'B2中的日期时间过长，当前列宽显示为井号。'},s=>
      office('Excel','开始',select('font','字号',s.font,[[16,'16'],[14,'14'],[12,'12']])+select('format','数字格式',s.format,[['full','日期和时间'],['short','短日期'],['general','常规']])+btn('格式 → 自动调整列宽','autofit'),
        `<p style="margin:0 0 10px"><b>名称框：B2</b>　<span>fx ${s.negative?'-1':'2026/9/5 14:30'}</span></p><div style="max-width:100%;overflow:auto;padding-right:2px" tabindex="0" aria-label="工作表，可横向滚动"><div data-width-grid role="table" aria-label="日期显示工作表" style="display:grid;grid-template-columns:42px ${s.width}px 62px;width:${s.width+104}px;border:1px solid #bcccbc;background:white;font-size:16px"><div style="padding:9px;background:#eef3ef"></div><div role="columnheader" style="position:relative;padding:9px;text-align:center;background:#e7f0e9;border-inline:1px solid #bcccbc">B${btn('','boundary','',`data-lab-drag="column" role="slider" aria-label="B列右边界：拖动或按左右方向键调整列宽" aria-valuemin="70" aria-valuemax="300" aria-valuenow="${s.width}" tabindex="0" style="position:absolute;right:-12px;top:0;z-index:2;height:100%;width:24px;min-height:40px;padding:0;border:0;border-radius:0;background:linear-gradient(to right,transparent 10px,#549669 10px,#549669 13px,transparent 13px);cursor:col-resize;touch-action:none"`)}</div><div role="columnheader" style="padding:9px;text-align:center;background:#eef3ef">C</div><div role="rowheader" style="padding:12px 9px;background:#eef3ef">2</div><div role="cell" data-hash-date style="overflow:hidden;white-space:nowrap;padding:12px 9px;text-align:right;border:2px solid #428563;font:${s.font}px/1.6 ui-monospace,monospace">${esc(displayDate(s))}</div><div role="cell" style="padding:12px 9px">备注</div></div></div>`)+
      controls(btn(s.negative?'恢复正常日期':'模拟负日期结果','negative'))+
      output(`${s.message} 当前列宽 <b data-width-readout>${s.width} px</b>。底层值：<code>${s.negative?-1:dateSerial}</code>。${s.negative&&s.format!=='general'?'负日期在本例1900日期系统中无法显示；加宽列也不能修复。':'改变列宽、字号或显示格式都不会改动底层数值。'}`),
      (s,a)=>{if(a==='autofit'){s.width=clamp(neededWidth(s),70,300);s.message=s.negative&&s.format!=='general'?'已自动调整宽度，但负日期仍无法显示。':'列宽已适应当前文字和字号。';}if(a==='negative'){s.negative=!s.negative;s.message=s.negative?'现在把底层计算结果改为−1，以观察另一种井号原因。':'恢复原来的正日期时间值。';}},
      (s,k,v)=>{s[k]=k==='font'?Number(v):v;s.message=k==='font'?'只调整字号，日期时间仍是同一值。':'只调整显示格式，底层值不变。';});
registry.y2020q7.preview=resizePreview;
registry.y2020q7.gesture=(s,g)=>{if(g.kind==='column'){s.width=clamp(Math.round(s.width+g.dx),70,300);s.message='已按拖动距离改变B列宽度。';}};
registry.y2020q7.keydown=(s,e)=>{if(!e.target.closest('[data-lab-drag="column"]')||!['ArrowLeft','ArrowRight'].includes(e.key))return false;e.preventDefault();s.width=clamp(s.width+(e.key==='ArrowRight'?10:-10),70,300);s.message='已用方向键调整列宽。';return true;};
registry.y2020q7.displayDate=displayDate;
const fillKinds=[['textnumber','文本型编号'],['number','单个数值'],['text','普通文本'],['suffix','文本＋末尾数字'],['date','日期'],['time','时间'],['two','两个数值起点'],['preset','预设星期'],['custom','自定义班级列表']];
const fillSamples={textnumber:'002024000001',number:'2',text:'计算机',suffix:'学生1',date:'2026-09-16',time:'08:00',two:'1',preset:'星期一',custom:'一班'};
const weekList=['星期一','星期二','星期三','星期四','星期五','星期六','星期日'],classList=['一班','二班','三班','四班'];
const fillMode=(s,ctrl=false)=>{const base=s.kind==='number'||s.kind==='text'?'copy':'series';return (ctrl||s.modifier==='ctrl')&&s.kind!=='text'?(base==='copy'?'series':'copy'):base;};
function fillValid(s){
  if(['number','two'].includes(s.kind))return s.source.trim()!==''&&Number.isFinite(Number(s.source))&&(s.kind!=='two'||s.second.trim()!==''&&Number.isFinite(Number(s.second)));
  if(s.kind==='date')return /^\d{4}-\d{2}-\d{2}$/.test(s.source)&&Number.isFinite(Date.parse(s.source))&&new Date(s.source+'T00:00:00Z').toISOString().slice(0,10)===s.source;
  if(s.kind==='time')return /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(s.source);
  if(s.kind==='preset')return weekList.includes(s.source);if(s.kind==='custom')return classList.includes(s.source);return !!s.source;
}
function fillValue(s,index){
    if(index>s.filled&&!(s.kind==='two'&&index===1))return'';
    if(index===0)return s.source;
    if(s.kind==='two'&&index===1)return s.second;
    if(s.mode==='copy')return s.kind==='two'&&index%2?s.second:s.source;
    if(s.kind==='number'||s.kind==='two')return String(Number((Number(s.source)+index*(s.kind==='two'?Number(s.second)-Number(s.source):1)).toPrecision(12)));
    if(s.kind==='date'){if(!fillValid(s))return s.source;const d=new Date(s.source+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+index);return d.toISOString().slice(0,10);}
    if(s.kind==='time'){if(!fillValid(s))return s.source;const [h,m]=s.source.split(':').map(Number);return String((h+index)%24).padStart(2,'0')+':'+String(m).padStart(2,'0');}
    if(s.kind==='preset'||s.kind==='custom'){const list=s.kind==='preset'?weekList:classList;return list[(list.indexOf(s.source)+index)%list.length];}
    if(s.kind==='text')return s.source;
    const match=s.source.match(/^(.*?)(\d+)$/);
    return match?match[1]+String(BigInt(match[2])+BigInt(index)).padStart(match[2].length,'0'):s.source;
  }
function finishFill(s,end,ctrl=false){
  if(!fillValid(s)){s.filled=0;s.message='起始内容与所选类型不符，请先修正。日期用YYYY-MM-DD，时间用HH:MM，预设/自定义值需在所示列表内。';return;}
  s.filled=clamp(Number(end),s.kind==='two'?1:0,5);s.mode=fillMode(s,ctrl);s.message='已按终点填充；'+(s.mode==='copy'?'复制起始内容或两格模式。':'按所选类型续接序列。');
}
register(['y2020q48'],'同一填充柄，不同起点产生不同结果','拖到哪一行就填到哪一行；比较普通拖动、Ctrl和填充后的选项。',
    {source:'002024000001',second:'3',kind:'textnumber',modifier:'normal',filled:0,mode:'series',end:'4',message:'A2已按文本保存。拖动填充柄到A3—A7中的任意一行。'},s=>{
      const rows=Array.from({length:6},(_,i)=>[i+2,`<div class="lab-lookup-cell" data-fill-index="${i}" style="position:relative;min-height:38px;padding:8px 6px;border:${i<=Math.max(s.filled,s.kind==='two'?1:0)?'2px solid #388b62':'1px solid transparent'};font:16px/1.5 ui-monospace,monospace;overflow-wrap:anywhere">${esc(fillValue(s,i))||'&nbsp;'}${i===(s.kind==='two'?1:0)?'<button type="button" data-lab-drag="fill" class="lab-fill-handle" aria-label="拖动填充柄到目标行" style="width:28px;height:28px;border-width:8px"></button>':''}</div>`]);
      return controls(select('kind','起始数据类型',s.kind,fillKinds)+field('source','A2起始内容',s.source,'text','maxlength="30"')+(s.kind==='two'?field('second','A3第二个起点',s.second,'text','maxlength="20"'):'')+select('modifier','拖动方式（触屏也可选）',s.modifier,[['normal','普通拖动'],['ctrl','模拟按住Ctrl']]))+
        office('Excel','开始','<span>先核对输入类型，再拖动右下角填充柄</span>',simpleTable(['行','A 数据'],rows)+(s.filled>0?`<div style="padding:12px 0">${select('mode','本次填充后的选项',s.mode,[['copy','复制单元格'],['series','填充序列']])}</div>`:''))+
        `<details class="lab-assist"><summary>键盘辅助操作</summary>${select('end','填充到',s.end,[[1,'A3'],[2,'A4'],[3,'A5'],[4,'A6'],[5,'A7']])}${btn('执行向下填充','fill')}</details>`+
        output(`${esc(s.message)}${s.filled>0?` 实际区域：A2:A${s.filled+2}。`:' 下方尚未填充。'}`)+
        window.NOTE_LABS.ui.coach('教学模型已明确指定输入类型，日期按天、时间按小时；预设星期一至星期日，自定义列表已设为一班至四班。支持鼠标松手时Ctrl和触屏替代选项。右键菜单、双击借邻列确定终点、日期月末及格式填充未模拟；现实规则见正文，不把网页结果当作原生Excel2016实测。');
    },(s,a)=>{if(a==='fill')finishFill(s,s.end);},
    (s,k,v)=>{
      s[k]=String(v);
      if(k==='kind'){s.source=fillSamples[v];s.second='3';s.modifier='normal';}
      if(['kind','source','second'].includes(k)){s.filled=0;s.mode=fillMode(s);s.message='起始内容已改变，请重新填充。';}
      if(k==='modifier')s.message='拖动方式只影响下一次填充，当前数据不变。';
      if(k==='mode')s.message='已将当前填充区域改为'+(v==='series'?'序列。':'复制。');
    });
registry.y2020q48.gesture=(s,g)=>{if(g.kind==='fill'&&g.end!==undefined)finishFill(s,g.end,g.ctrlKey);};
registry.y2020q48.fillValue=fillValue;
const initialCells=[{value:.128,format:'percent',fill:true},{value:.25,format:'percent',fill:true},{value:.42,format:'percent',fill:true}];
const cellText=c=>c.value===null?'':c.format==='percent'?(Math.round(c.value*1000)/10)+'%':String(c.value);
register(['y2024q10'],'看清除保留了什么，看删除移动了什么','选中B列单元格，再分别清除内容、格式，或删除并上移；撤销后可以重新比较。',
    {cells:initialCells,selected:0,menu:false,pane:false,history:[],message:'当前选中B2。显示12.8%，底层值是0.128，填充色和数字格式独立保存。'},s=>{
      const c=s.cells[s.selected];
      const rows=s.cells.map((cell,i)=>[i+2,['甲','乙','丙'][i],btn(esc(cellText(cell))||'&nbsp;','cell',i,`aria-label="选择B${i+2}，${cellText(cell)||'空白'}" aria-pressed="${s.selected===i}" style="width:100%;min-height:44px;border:2px solid ${s.selected===i?'#388b62':'transparent'};border-radius:0;background:${cell.fill?'#f3dce8':'#fff'};font-size:16px;text-align:right"`)]);
      return office('Excel','开始',btn('清除 ▾','menu','',s.pane?'disabled':'')+btn('删除 → 删除单元格…','deleteDialog','',s.pane?'disabled':''),
        `<p style="font-size:16px;margin:0 0 10px"><b>名称框：B${s.selected+2}</b>　<span>fx ${c.value===null?'（空白）':c.value}</span></p>${s.menu?dialog('清除',btn('清除内容','clear','contents')+btn('清除格式','clear','formats')+btn('全部清除','clear','all'),btn('关闭','close')):''}${s.pane?dialog('删除',`<p>选中区域：B${s.selected+2}</p><p><label><input type="radio" checked name="${s.uid||'clear'}-direction">下方单元格上移</label></p>`,btn('确定','delete')+btn('取消','cancel')):''}<fieldset ${s.pane?'disabled':''} style="border:0;padding:0;margin:0;min-width:0">${simpleTable(['行','A 标识','B 比例'],rows)}</fieldset>`)+
        controls(btn('模拟键盘：Delete','clear','contents',s.pane?'disabled':'')+btn('撤销上一步','undo','',s.history.length&&!s.pane?'':'disabled'))+
        output(`${s.message} 当前B${s.selected+2}：${c.value===null?'内容为空':'底层值 '+c.value}；${c.format==='percent'?'百分比格式':'常规格式'}；${c.fill?'有填充色':'无填充色'}。`);
    },(s,a,v)=>{
      if(a==='cell'){s.selected=Number(v);s.message='已选中B'+(s.selected+2)+'。';}
      if(a==='menu'){s.menu=!s.menu;s.pane=false;}
      if(a==='close')s.menu=false;
      if(a==='deleteDialog'){s.pane=true;s.menu=false;}
      if(a==='cancel'){s.pane=false;s.message='已取消删除，原单元格完整保留。';}
      if(a==='clear'&&!s.pane){
        s.history.push(clone(s.cells));const c=s.cells[s.selected];
        if(v==='contents'||v==='all')c.value=null;
        if(v==='formats'||v==='all'){c.format='general';c.fill=false;}
        s.menu=false;s.message={contents:'内容已清空，原有格式与填充设置保留。',formats:'已移除数字格式和填充色，底层数值没有改变。',all:'内容和格式都已清除，周围单元格位置保持不变。'}[v];
      }
      if(a==='delete'&&s.pane){s.history.push(clone(s.cells));s.cells.splice(s.selected,1);s.cells.push({value:null,format:'general',fill:false});s.pane=false;s.message='仅B列下方单元格连同内容和格式上移；A列标识及行号保持原位。';}
      if(a==='undo'&&s.history.length){s.cells=s.history.pop();s.menu=false;s.pane=false;s.message='已撤销上一步，恢复当时的内容、格式及单元格位置。';}
    });
registry.y2024q10.keydown=(s,e)=>{if(e.key!=='Delete'||e.target.closest('input,textarea,select'))return false;e.preventDefault();registry.y2024q10.action(s,'clear','contents');return true;};
})();

/* Source provenance: note-labs-study.js:700. Preserve this closure. */
(() => {
'use strict';
const {register, registry, ui} = window.NOTE_LABS;
const {btn, field, select, table, coach, output, office, dialog, esc} = ui;
const copy = value => structuredClone(value);
const courses = ['计算机','英语','高数'];
const sourceRows = [
    [['王宁','86'],['李明','91'],['张琳','74']],
    [['张琳','82'],['王宁','79'],['李明','84']],
    [['李明','88'],['张琳','76'],['王宁','92']]
  ];
const presets={
    both:{name:'姓名和科目都匹配',range:'A1:B4',top:true,left:true},
    left:{name:'只匹配姓名',range:'A2:B4',top:false,left:true},
    top:{name:'只匹配科目',range:'B1:B4',top:true,left:false},
    position:{name:'只按位置相加',range:'B2:B4',top:false,left:false}
  };
const sourceAddress=(id,config)=>`${courses[id]}!${presets[config.preset].range.replace(/([A-Z])(\d)/g,'$$$1$$$2')}`;
function sourceTable(s,id,editing=false,config=null){
    const firstCol=config&&!config.left?1:0;
    const header=['',...['A','B'].slice(firstCol)];
    const rows=[];
    if(!config||config.top)rows.push(['1',...['姓名',courses[id]].slice(firstCol)]);
    s.sources[id].forEach((row,i)=>rows.push([String(i+2),...(firstCol===0?[esc(row[0])]:[]),editing
      ?`<input data-field="score-${id}-${i}" aria-label="${esc(courses[id]+' '+row[0]+' 成绩')}" type="number" min="0" max="100" step="1" value="${esc(row[1])}" style="width:100%;min-width:3.8em;box-sizing:border-box">`
      :esc(row[1])]));
    return table(header,rows);
  }
function consolidate(s,config){
    const rowKeys=[],colKeys=[],totals=new Map();
    const addKey=(list,key)=>{if(!list.includes(key))list.push(key);};
    config.refs.forEach(id=>s.sources[id].forEach((row,i)=>{
      const rowKey=config.left?row[0]:String(i),colKey=config.top?courses[id]:'0';
      addKey(rowKeys,rowKey);addKey(colKeys,colKey);
      const key=JSON.stringify([rowKey,colKey]);
      if(!totals.has(key))totals.set(key,0);
      const raw=String(row[1]).trim(),n=Number(raw);
      if(raw!==''&&Number.isFinite(n))totals.set(key,totals.get(key)+n);
    }));
    const grid=[];
    if(config.top)grid.push([...(config.left?['']:[]),...colKeys]);
    rowKeys.forEach(row=>grid.push([...(config.left?[row]:[]),...colKeys.map(col=>String(totals.get(JSON.stringify([row,col]))??0))]));
    return {grid,rows:rowKeys,cols:colKeys,top:config.top,left:config.left,preset:config.preset,refs:[...config.refs]};
  }
function resultTable(result){
    if(!result)return table(['','A','B','C','D'],[['1','','','',''],['2','','','',''],['3','','','',''],['4','','','','']]);
    const width=Math.max(...result.grid.map(row=>row.length));
    return table(['',...Array.from({length:width},(_,i)=>String.fromCharCode(65+i))],result.grid.map((row,i)=>[String(i+1),...row.map(esc)]));
  }
register(['y2023q57'],'把三门课程按姓名和科目汇总','看看三张源表的姓名顺序，选择一种示例配置，再逐个添加引用并比较实际汇总值。',{
    sources:sourceRows,sheet:'result',pane:false,preset:'both',
    applied:{refs:[],top:true,left:true,preset:'both'},draft:null,reference:0,selectedReference:0,
    result:null,message:'示例包含 3 门课程。源表的姓名顺序不同；结果从汇总表 A1 开始。'
  },s=>{
    const config=s.draft,pre=presets[s.preset];
    const helper=`<div class="lab-coach"><b>准备本次示例</b><p>本卡片预先配好源范围和标签位置。真实 Excel 中需自己核对这两项；改变复选框不会自动改写引用范围。</p><label>比较方式<select data-field="preset" ${s.pane?'disabled':''}>${Object.entries(presets).map(([key,p])=>`<option value="${key}" ${key===s.preset?'selected':''}>${p.name} · ${p.range}</option>`).join('')}</select></label><p>本次每个源区域：<strong>${pre.range}</strong>；首行${pre.top?'勾选':'不勾选'}，最左列${pre.left?'勾选':'不勾选'}。先切换下方工作表查看或修改源成绩，再打开合并计算。</p>${s.result?`<p>当前汇总表保留上次结果：${presets[s.result.preset].name} · ${presets[s.result.preset].range}。新配置只有“确定”后才替换结果。</p>`:''}</div>`;
    const tabs=`<div class="lab-controls" role="group" aria-label="工作表">${btn('汇总','sheet','result',`${s.sheet==='result'?'aria-pressed="true"':''} ${s.pane?'disabled':''}`)}${courses.map((name,i)=>btn(name,'sheet',String(i),`${s.sheet===String(i)?'aria-pressed="true"':''} ${s.pane?'disabled':''}`)).join('')}</div>`;
    const body=s.sheet==='result'?resultTable(s.result):sourceTable(s,Number(s.sheet),true);
    const pane=s.pane?dialog('合并计算',
      `<p>函数：<strong>求和</strong></p>${select('reference','引用位置',s.reference,courses.map((_,i)=>[i,sourceAddress(i,config)]))}<div class="lab-controls">${btn('添加','add-reference')}</div><label>所有引用位置<select data-field="selectedReference" size="3" aria-label="所有引用位置" style="width:100%;max-width:100%">${config.refs.map(id=>`<option value="${id}" ${Number(s.selectedReference)===id?'selected':''}>${esc(sourceAddress(id,config))}</option>`).join('')}</select></label><div class="lab-controls">${btn('删除','remove-reference','',config.refs.length?'':'disabled')}</div><fieldset><legend>标签位置（按本次示例预设）</legend><label><input type="checkbox" disabled ${config.top?'checked':''}> 首行</label><label><input type="checkbox" disabled ${config.left?'checked':''}> 最左列</label></fieldset><p>当前引用的源区域预览：${esc(sourceAddress(Number(s.reference),config))}</p>${sourceTable(s,Number(s.reference),false,config)}<p>未创建指向源数据的链接；确定时生成本次汇总值。</p>`,
      btn('确定','apply')+btn('取消','cancel')):'';
    return helper+office('Excel','数据',btn('合并计算','open','',s.pane?'disabled':''),body+tabs+pane)+output(esc(s.message));
  },(s,a,v)=>{
    if(a==='sheet'&&!s.pane){s.sheet=v;return;}
    if(a==='open'){
      s.sheet='result';s.draft={refs:[...s.applied.refs],top:presets[s.preset].top,left:presets[s.preset].left,preset:s.preset};s.pane=true;
      s.selectedReference=s.draft.refs[0]??0;
      s.message=`本次使用 ${presets[s.preset].range}。逐个添加源区域；引用列表和预设尚未应用。`;
    }
    if(a==='add-reference'&&s.pane){
      const id=Number(s.reference);
      if(!s.draft.refs.includes(id)){s.draft.refs.push(id);s.selectedReference=id;s.message=`已添加 ${sourceAddress(id,s.draft)}，当前 ${s.draft.refs.length} 个引用。`;}
      else s.message='该源区域已经在引用列表中。';
    }
    if(a==='remove-reference'&&s.pane){
      s.draft.refs=s.draft.refs.filter(id=>id!==Number(s.selectedReference));s.selectedReference=s.draft.refs[0]??0;
      s.message='已从待应用列表移除引用，现有汇总值仍保留。';
    }
    if(a==='cancel'){s.pane=false;s.draft=null;s.message='已取消本次设置；原有汇总值和已应用的引用列表保持不变。';}
    if(a==='apply'&&s.pane){
      if(!s.draft.refs.length){s.message='请先添加至少一个引用区域。';return;}
      if(s.draft.refs.some(id=>s.sources[id].some(row=>row[1].trim()!==''&&!Number.isFinite(Number(row[1]))))){s.message='示例成绩需为数值或空白，请先返回源工作表检查。';return;}
      s.applied=copy(s.draft);s.result=consolidate(s,s.applied);s.pane=false;s.draft=null;
      s.message=s.applied.top&&s.applied.left
        ?`已按姓名和课程标签汇总 ${s.applied.refs.length} 个区域。姓名顺序不同仍能匹配；不同课程各占一列。`
        :s.applied.left
          ?'只按最左列匹配姓名：A2:B4 不含课程标题，同一人的各科成绩相加到一列。'
          :s.applied.top
            ?'只按首行匹配科目：B1:B4 不含姓名，各科成绩仍按原来的行位置排列。姓名顺序不同，同行不一定是同一人。'
            :'B2:B4 只有数值：各表同一行位置相加。源表姓名顺序不同，这些合计不能作为个人总分。';
    }
  },(s,k,v)=>{
    const m=k.match(/^score-(\d)-(\d)$/);
    if(m&&!s.pane){s.sources[Number(m[1])][Number(m[2])][1]=String(v);s.message='源成绩已修改；未创建源链接，汇总表仍保留上次计算值。重新合并才会更新。';return;}
    if(k==='reference'||k==='selectedReference')s[k]=Number(v);
    if(k==='preset'&&!s.pane&&presets[v]){s.preset=v;s.message=`已准备 ${presets[v].name}，每个源范围为 ${presets[v].range}。打开合并计算并确定后才会更新汇总表。`;}
  });
registry.y2023q57.consolidate=consolidate;
const centerInitial={mode:'general',draft:'general',pane:false,range:false,active:0,title:'2026 年成绩分析',message:'标题位于 A1，其余三格为空。先选中完整标题区域 A1:D1。'};
function centerSheet(s){
    const selected=s.range?'A1:D1':s.mode==='merge'?'A1':`${String.fromCharCode(65+s.active)}1`;
    const value=s.range||s.mode==='merge'||s.active===0?s.title:'';
    const cellStyle='height:56px;padding:0;position:relative;width:25%';
    const nativeButton=(index,text='')=>`<button type="button" data-lab-act="cell" data-value="${index}" aria-label="${String.fromCharCode(65+index)}1 ${index===0?esc(s.title):'空白'}" ${s.pane?'disabled':''} style="width:100%;height:56px;min-height:56px;display:block;padding:5px;background:transparent;border:0;border-radius:0;overflow:hidden;text-align:left;${s.range||s.active===index?'outline:2px solid #27815e;outline-offset:-2px':''}">${esc(text)}</button>`;
    const cells=s.mode==='merge'
      ? `<td colspan="4" style="height:56px;padding:0"><button type="button" data-lab-act="cell" data-value="0" aria-label="A1 合并单元格 ${esc(s.title)}" ${s.pane?'disabled':''} style="display:block;width:100%;height:56px;padding:5px;border-radius:0;text-align:center;outline:2px solid #27815e;outline-offset:-2px">${esc(s.title)}</button></td>`
      : Array.from({length:4},(_,i)=>`<td style="${cellStyle}">${nativeButton(i,'')}${i===0?`<div data-cross-center-title style="position:absolute;left:0;top:0;width:${s.mode==='center'?'100%':'400%'};height:56px;display:flex;align-items:center;justify-content:${s.mode==='across'||s.mode==='center'?'center':'flex-start'};padding:0 5px;pointer-events:none;overflow:hidden;box-sizing:border-box;white-space:nowrap;z-index:1">${esc(s.title)}</div>`:''}</td>`).join('');
    return `<div class="lab-controls"><label>名称框<input aria-label="名称框" readonly value="${selected}" style="width:7em"></label><label style="flex:1">编辑栏<input aria-label="编辑栏" readonly value="${esc(value)}" style="width:100%;min-width:0"></label></div><div class="lab-table-scroll" style="position:relative" tabindex="0" aria-label="标题工作表"><table style="width:100%;table-layout:fixed;min-width:0;margin:0"><thead><tr>${['A','B','C','D'].map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody><tr>${cells}</tr><tr>${['姓名','计算机','英语','高数'].map(c=>`<td>${c}</td>`).join('')}</tr><tr><td>王宁</td><td>86</td><td>79</td><td>92</td></tr></tbody></table></div>`;
  }
register(['y2020q47'],'居中的标题下面，到底还有几个单元格','对同一段标题分别使用跨列居中和合并后居中，再点击 B1，检查名称框和编辑栏。',centerInitial,s=>
    `<div class="lab-coach"><b>演示操作</b><p>本例使用 A1:D1，规则与笔记中的 A1:G1 相同。点击选区按钮准备范围；点击工作表单元格可查看其地址。</p><div class="lab-controls">${btn('选中 A1:D1','range','',s.pane?'disabled':'')}${field('title','标题文字',s.title,'text',`maxlength="40" ${s.pane?'disabled':''}`)}</div></div>`+
    office('Excel','开始',btn('设置单元格格式','format','',s.pane?'disabled':'')+btn(s.mode==='merge'?'取消合并单元格':'合并后居中','merge','',s.pane?'disabled':''),centerSheet(s)+
      (s.pane?dialog('设置单元格格式',`<p>对齐</p>${select('draft','水平对齐',s.draft,[['general','常规'],['center','居中'],['across','跨列居中']])}<p>选定区域：${s.range?'A1:D1':String.fromCharCode(65+s.active)+'1'}</p>`,btn('确定','apply')+btn('取消','cancel')):''))+
    output(esc(s.message)),(s,a,v)=>{
      if(a==='range'&&!s.pane){s.range=true;s.active=0;s.message='已选中 A1:D1，可以设置整个标题范围的对齐方式。';}
      if(a==='cell'&&!s.pane){s.range=false;s.active=s.mode==='merge'?0:Number(v);s.message=s.mode==='merge'?'A1:D1 已合为一个单元格，单击任何位置都选中 A1。':s.active===0?'A1 保存标题文字。':`${String.fromCharCode(65+s.active)}1 仍是独立的空白单元格；标题只保存在 A1。`;}
      if(a==='format'){
        if(s.mode==='merge'){s.message='当前是合并单元格。先取消合并，再选择 A1:D1 比较跨列居中。';return;}
        s.pane=true;s.draft=s.mode;s.message='水平对齐设置尚未应用，点击取消会保留原来的外观。';
      }
      if(a==='cancel'){s.pane=false;s.draft=s.mode;s.message='已取消，对齐方式和单元格结构均未改变。';}
      if(a==='apply'){
        if(s.draft==='across'&&!s.range){s.pane=false;s.message='只选中了一个单元格，没有可跨的范围。请先选中 A1:D1 再设置跨列居中。';return;}
        if(s.range||s.active===0){s.mode=s.draft;}s.pane=false;
        s.message=s.mode==='across'?'跨列居中已应用：标题横跨 A1:D1 显示，四格地址与结构保留。点击 B1 验证。':s.mode==='center'?'已设为单元格内居中。A1 保存标题，其余三格仍独立且为空。':'已恢复常规对齐，标题仍保存在 A1。';
      }
      if(a==='merge'){
        if(s.mode==='merge'){s.mode='center';s.active=0;s.range=true;s.message='已取消合并，A1:D1 恢复为四个单元格，标题留在 A1；单元格内的居中格式仍保留。';return;}
        if(!s.range){s.message='先选中 A1:D1，再使用合并后居中。';return;}
        s.mode='merge';s.active=0;s.range=false;s.message='A1:D1 已合成一个单元格。原 B1、C1、D1 不能再单独选中。';
      }
    },(s,k,v)=>{if(k==='title'&&!s.pane)s.title=String(v);if(k==='draft')s.draft=v;});
})();
