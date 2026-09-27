// Generated from src/labs; edit the corresponding chapter source.
/* Shared lab calculations. Runtime must load first. */
(() => {
'use strict';
const {esc}=window.NOTE_LABS.ui;
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
const radixConvert = raw => {
    if(!/^[01]{1,16}(\.[01]{1,12})?$/.test(raw))return null;
    const [whole,frac='']=raw.split('.');
    const left=whole.padStart(Math.ceil(whole.length/4)*4,'0');const right=frac.padEnd(Math.ceil(frac.length/4)*4,'0');
    const groups=x=>x.match(/.{4}/g)||[];
    return {binary:[groups(left).join(' '),groups(right).join(' ')].filter(Boolean).join(' . '),hex:parseInt(whole,2).toString(16).toUpperCase()+(frac?'.'+groups(right).map(x=>parseInt(x,2).toString(16).toUpperCase()).join(''):''),decimal:parseInt(whole,2)+[...frac].reduce((sum,v,i)=>sum+Number(v)*2**(-i-1),0)};
  };
function clusteredChart(labels,series){
    const all=series.flatMap(x=>x.values),max=Math.max(1,...all),group=420/labels.length,bw=Math.min(40,group/(series.length+1));
    return `<svg class="lab-data-chart" viewBox="0 0 480 270" role="img" aria-label="簇状柱形图"><line x1="40" x2="460" y1="220" y2="220" stroke="#687482"/>${labels.map((label,i)=>series.map((x,j)=>{const h=Number(x.values[i])/max*165,xp=40+i*group+15+j*bw;return `<rect x="${xp}" y="${220-h}" width="${bw-5}" height="${h}" fill="${x.color}"/><text x="${xp+(bw-5)/2}" y="${210-h}" text-anchor="middle">${x.values[i]}</text>`;}).join('')+`<text x="${40+i*group+group/2}" y="244" text-anchor="middle">${esc(label)}</text>`).join('')}</svg><div class="lab-chart-legend">${series.map(x=>`<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div>`;
  }
Object.assign(window.NOTE_LABS,{radixConvert,daysBetween,clusteredChart});
})();

/* Independent comparisons are labelled as such; they do not imitate saved operations. */
(() => {
  'use strict';
  const {register,ui}=window.NOTE_LABS;
  const {btn,table,output,esc}=ui;
  const comparisons={
    'syllabus-word-smartart':[
      ['流程布局','按步骤组织内容',[['登记 → 审核 → 归档','依次进行的三步'],['增加步骤','选相邻形状，再从设计中添加形状']]],
      ['层次布局','表示上下级关系',[['学校 → 院系 → 班级','不是按时间排列的三个动作'],['修改对象','先分清文字、形状与整幅SmartArt']]],
      ['截图后的流程','只剩画面快照',[['图片','可以缩放、裁剪'],['结构','不能再按SmartArt节点添加形状']]]
    ],
    'syllabus-word-screen-clipping':[
      ['可用视窗','插入一个完整窗口的快照',[['准备','打开目标窗口，保持未最小化'],['入口','Word → 插入 → 屏幕截图 → 选择窗口缩略图']]],
      ['屏幕剪辑','只插入拖选的矩形区域',[['选择','拖出需要的对话框或局部内容'],['结果','插入的是图片，源窗口改变不会同步修改它']]]
    ],
    'syllabus-media-edit-export':[
      ['编辑工程','保留剪辑结构供继续修改',[['保存','轨道、片段位置、效果与素材引用'],['迁移','同时核对所需素材，工程文件不一定内含全部媒体']]],
      ['导出音频','产生可播放的声音文件',[['设置','格式、声道与编码参数'],['检查','预听起止点，多轨按需要混合']]],
      ['导出视频','产生按时间播放的成片',[['设置','分辨率、帧率、编码与保存位置'],['检查','重新播放，核对起止画面、音画同步']]]
    ],
    'syllabus-document-coauthor':[
      ['共享查看链接','同一份云端文档',[['参与者','可以阅读，不能直接改正文'],['讨论与编辑','需要相应功能及权限；查看权不等于编辑权']]],
      ['共享编辑链接','同一份云端文档',[['参与者','具备编辑权限时可协同修改'],['收尾','核对同步状态与版本，避免相互覆盖']]],
      ['发送附件','每位接收者得到独立副本',[['内容位置','改动保存在各自文件中'],['合并','需要另外汇总，不能自动视为共同编辑']]],
      ['批注与修订','讨论和审阅是不同动作',[['批注','提出意见，不直接替换正文'],['修订','记录文字增删，接受或拒绝决定最终文本']]]
    ],
    'syllabus-office-exchange':[
      ['DOCX','继续编辑结构化文档',[['保留','段落样式、表格、图片等文档结构'],['核对','跨软件打开后检查字体、分页和对象']]],
      ['TXT','交换纯文本',[['保留','字符与换行'],['不保留','复杂版面、字符富格式和嵌入图片']]],
      ['PDF','按固定页面阅读或打印',[['重点','检查导出后的页数和版面'],['编辑','PDF可有编辑工具，但不等于保留完整Word源结构']]]
    ],
    'syllabus-quantum-basics':[
      ['经典比特','取0或1',[['表示','以确定的二值状态编码'],['读取','读取该比特的值']]],
      ['量子基态','计算基测量为对应结果',[['|0⟩','理想计算基测量得到0'],['|1⟩','理想计算基测量得到1']]],
      ['等幅叠加态','一次测量仍只有一个结果',[['每次重新制备等幅叠加态','分别有50%的概率得到0和1'],['不能推出','一次性读取所有可能答案']]],
      ['纠缠','多个量子系统有不可独立分解的关联',[['利用','量子信息处理中的关联资源'],['边界','不能据此超光速发送可控消息']]]
    ],
    'syllabus-mobile-communication':[
      ['蜂窝上网','手机通过移动通信网络接入',[['终端到网络','蜂窝无线链路'],['体验','受覆盖、终端能力与网络负载影响']]],
      ['手机热点','笔记本到互联网分为两段',[['笔记本 → 手机','通常是Wi-Fi'],['手机 → 运营商','移动通信网络；不是5 GHz Wi-Fi']]],
      ['5G应用方向','三个方向关注不同目标',[['增强移动宽带','高数据速率业务'],['大规模机器通信','大量设备连接'],['超可靠低时延通信','对时效与可靠性敏感的业务']]]
    ]
  };
  for(const note of window.NOTES.notes){
    const cases=comparisons[note.id];if(!cases)continue;
    register([note.id],note.title,'选择一个独立情境，观察对象、作用与结果的对应关系。',{scenario:0},s=>
      `<div class="lab-controls">${cases.map((entry,i)=>btn(esc(entry[0]),'scenario',i,`aria-pressed="${s.scenario===i}"`)).join('')}</div>`+
      table(['观察对象','含义'],cases[s.scenario][2].map(row=>row.map(esc)))+output(esc(cases[s.scenario][1]))+
      '<p class="core-caption">独立情境对照 · 切换情境用于比较概念。</p>',(s,a,v)=>{if(a==='scenario')s.scenario=Number(v);});
  }
})();

/* Chapter 11: algorithms. Maintained source; edit this domain directly. */
/* Source provenance: note-labs.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
function integer(raw,min,max){const t=String(raw).trim();return /^\d+$/.test(t)&&Number.isSafeInteger(Number(t))&&Number(t)>=min&&Number(t)<=max?Number(t):null;}
function cacheData(raw){const text=String(raw).trim();if(!text)return null;const tokens=text.split(/[,，\s]+/);if(tokens.length>30||tokens.some(x=>! /^-?\d+$/.test(x)||Math.abs(Number(x))>999))return null;return tokens.map(Number);}
register(['y2022q33'],'用缓存换计算：区间求和工作台','先载入数据、建立前缀和，再查询；真实运算记录与大规模成本估算分开。',{
 n:100,q:10,raw:'3,5,2',loaded:'3,5,2',values:[3,5,2],left:'2',right:'3',prefix:null,buildOps:0,scanOps:0,prefixOps:0,rows:[],message:'已载入3、5、2；前缀缓存尚未建立。'
},s=>{
 const costs=[s.n*s.q,s.n+s.q],max=Math.max(...costs);
 return `<div class="lab-controls">${field('raw','整数数据（1—30项，−999—999）',s.raw)}${btn('载入数据','loadData')}${btn('建立/重建前缀和','build')}</div>`+
 table(['已载入的位置（1基）',...s.values.map((_,i)=>i+1)], [['数据',...s.values]])+
 (s.prefix?table(['前缀位置',...s.prefix.map((_,i)=>i)], [['前缀和',...s.prefix]]):'<p data-prefix-empty>缓存尚未建立，不能用前缀相减查询。</p>')+
 `<div class="lab-controls">${field('left','起点 L',s.left,'number','min="1" max="30"')}${field('right','终点 R',s.right,'number','min="1" max="30"')}${btn('逐项扫描查询','scan')}${btn('前缀相减查询','cached','',s.prefix?'':'disabled')}</div>`+
 `<div data-cache-costs>${table(['建表加法累计','扫描加法累计','缓存查询减法累计','缓存单元数'],[[s.buildOps,s.scanOps,s.prefixOps,s.prefix?s.prefix.length:0]])}</div>`+
 table(['方法','区间','结果','本次主要运算'],s.rows)+output(esc(s.message))+
 (s.raw!==s.loaded?'<p>数据输入是未载入草稿；查询仍针对上方已载入数据，成功载入新数据会清除旧缓存。</p>':'')+
 `<details><summary>查看规模估算（不是上方实际运行次数）</summary><div class="lab-controls">${field('n','数据项数 n',s.n,'range','min="10" max="1000" step="10"')}${field('q','查询次数 q',s.q,'range','min="1" max="100"')}</div><div class="lab-complexity">${[['逐次全长扫描',costs[0],1],['先建前缀和',costs[1],s.n+1]].map(([name,time,space])=>`<section><h4>${name}</h4><div class="lab-bar"><i style="width:${time/max*100}%"></i></div><p>示意运算量 ${money(time)}</p><p>额外存储单元 ${money(space)}</p></section>`).join('')}</div><p>全长查询时估算为nq与n+q；q很小时建表未必划算。这里未计输入存储、循环控制与硬件耗时，不能用柱长代替实测秒数。</p></details>`;
},(s,a)=>{
 if(a==='loadData'){const v=cacheData(s.raw);if(!v){s.message='载入被拒绝：需1—30个−999到999的整数；已载入数据和缓存未改变。';return;}Object.assign(s,{values:v,loaded:s.raw,prefix:null,buildOps:0,scanOps:0,prefixOps:0,rows:[],left:'1',right:String(v.length),message:'新数据已载入，旧缓存已失效；请重新建表。'});}
 if(a==='build'){s.prefix=[0];for(const x of s.values)s.prefix.push(s.prefix.at(-1)+x);s.buildOps+=s.values.length;s.message=`用${s.values.length}次加法建立${s.prefix.length}个前缀值（含初值0）。`;}
 if(a==='scan'||a==='cached'){
  const l=integer(s.left,1,s.values.length),r=integer(s.right,1,s.values.length);
  if(l===null||r===null||l>r){s.message='查询被拒绝：L、R须为已载入位置范围内的整数，且L≤R。已确认结果不变。';return;}
  if(a==='cached'&&!s.prefix){s.message='尚未建立缓存，不能执行前缀查询。';return;}
  let result=0,ops=1;if(a==='scan'){for(let i=l-1;i<r;i++)result+=s.values[i];ops=r-l+1;s.scanOps+=ops;}else{result=s.prefix[r]-s.prefix[l-1];s.prefixOps++;}
  s.rows.push([a==='scan'?'逐项扫描':'前缀相减',`${l}—${r}`,result,`${ops}次${a==='scan'?'加法':'减法'}`]);s.rows=s.rows.slice(-12);
  s.message=a==='scan'?`第${l}至${r}项逐项相加，结果${result}。`:`P[${r}]−P[${l-1}]=${s.prefix[r]}−${s.prefix[l-1]}=${result}；复用已有缓存，无须重新建表。`;
 }
},(s,k,v)=>{if(k==='n'||k==='q'){const value=integer(v,k==='n'?10:1,k==='n'?1000:100);if(value!==null)s[k]=value;}else if(['raw','left','right'].includes(k))s[k]=v;});
register(['y2022q43'],'逐轮执行1到n的累加','每次执行一轮，查看S与i的实际更新；n=0时循环体执行0次。',{n:10,draftN:'10',i:1,sum:0,history:[],error:''},s=>
 `<div class="lab-controls">${field('n','循环上限 n（0—30整数）',s.draftN,'number','min="0" max="30" step="1"')}${btn('执行一轮','step','',s.error||s.i>s.n?'disabled':'')}${btn('运行到结束','run','',s.error||s.i>s.n?'disabled':'')}</div><div class="lab-registers"><b>i = ${s.i}</b><b>S = ${s.sum}</b><b>已确认条件 i ≤ ${s.n}：${s.i<=s.n?'成立':'不成立'}</b></div><pre class="lab-code">S ← 0; i ← 1\nwhile i ≤ n:\n    S ← S + i\n    i ← i + 1\n输出 S</pre><div class="lab-tape">${s.history.map(x=>`<span>${esc(x)}</span>`).join('')}</div>${output(s.error||(s.i>s.n?`循环结束。S=${s.sum}；下次条件检查时i=${s.i}。`:'等待下一轮，S保留此前累加结果。'))}`,
 (s,a)=>{if(s.error)return;const step=()=>{if(s.i<=s.n){const old=s.sum;s.sum+=s.i;s.history.push(`${old} + ${s.i} = ${s.sum}`);s.i++;}};if(a==='run')while(s.i<=s.n)step();else if(a==='step')step();},(s,k,v)=>{if(k!=='n')return;s.draftN=v;const n=integer(v,0,30);if(n===null){s.error='请输入0—30的整数；空值不会当作0或1，已执行状态保留。';return;}s.n=n;s.i=1;s.sum=0;s.history=[];s.error='';});
Object.assign(window.NOTE_LABS.algorithmMath ||= {}, {cacheData});
})();

/* Source provenance: note-labs-2021.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui} = window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money} = ui;
const chips=values=>`<div class="lab-tape">${values.map(v=>`<span>${esc(String(v))}</span>`).join('')}</div>`;
register(['y2021q3'],'两队过桥：只能放行队首','交替放行两个队列，观察合法次序怎样形成。',{a:['A','B','C','D'],b:['E','F','G','H'],passed:[],message:'A与E分别处在各自队首。'},s=>
    `<div class="lab-queue"><section><b>车道一 · 队首在左</b>${chips(s.a)}${btn('放行车道一队首','release','a',s.a.length?'':'disabled')}</section><section><b>车道二 · 队首在左</b>${chips(s.b)}${btn('放行车道二队首','release','b',s.b.length?'':'disabled')}</section></div><div class="lab-bridge"><b>单向窄桥 · 已通过顺序</b>${chips(s.passed)}</div><div class="lab-controls">${btn('尝试让F越过E','overtake','',s.b.includes('E')&&s.b.includes('F')?'':'disabled')}</div>${output(s.message)}`,
    (s,a,v)=>{if(a==='release'&&s[v].length){const x=s[v].shift();s.passed.push(x);s.message=`${x}通过。只移除该队队首，另一队不受影响。`;}if(a==='overtake')s.message='F被E挡在后面：先让E通过，才能轮到F。这一步不会改变队列。';});
register(['y2021q33'],'按流程箭头走：先加，再更新，再判断','每次执行一轮，或改变终止边界看最后一项是否进入和。',{limit:10,draftLimit:'10',inclusive:false,k:1,sum:0,done:false,rows:[],error:''},s=>
 `<div class="lab-controls">${field('limit','边界值（1—31整数）',s.draftLimit,'number','min="1" max="31" step="1"')}${select('inclusive','继续条件',String(s.inclusive),[['false','k < 边界'],['true','k ≤ 边界']])}${btn('执行一轮','step','',s.error||s.done?'disabled':'')}</div><pre class="lab-code">S = 0; k = 1\ndo:\n    S = S + k\n    k = k + 3\nwhile k ${s.inclusive?'≤':'<'} ${s.limit}\n输出 S</pre>${table(['加进S的k','新的S','更新后的k','继续？'],s.rows)}${output(s.error||`当前 S=${s.sum}，k=${s.k}。${s.done?'条件不成立，循环已结束。':'下一次先执行循环体。'}`)}`,
 (s,a)=>{if(a!=='step'||s.done||s.error)return;const old=s.k;s.sum+=s.k;s.k+=3;const again=s.inclusive?s.k<=s.limit:s.k<s.limit;s.rows.push([old,s.sum,s.k,again?'是':'否']);s.done=!again;},(s,k,v)=>{if(k==='limit'){s.draftLimit=v;const t=String(v).trim(),n=Number(t);if(!/^\d+$/.test(t)||!Number.isInteger(n)||n<1||n>31){s.error='请输入1—31的整数边界；空值不会自动改成1，原执行状态保留。';return;}s.limit=n;s.error='';}else if(k==='inclusive')s.inclusive=v==='true';else return;s.k=1;s.sum=0;s.rows=[];s.done=false;});
})();

/* Source provenance: note-labs-audit.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,registry,ui,clusteredChart,daysBetween}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,office,dialog,paper,esc,number,money}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
const area=(n,l,v)=>`<label>${l}<textarea data-field="${n}">${esc(v)}</textarea></label>`;
register(['y2026q6'],'让辗转相除真正走到终点','输入两个正整数，逐轮观察被除数、除数和余数。',{a:'48',b:'18',x:null,y:null,rows:[],answer:null,error:''},s=>
 controls(field('a','正整数 a',s.a)+field('b','正整数 b',s.b)+btn('开始计算','start')+btn('执行一轮','step','',s.x===null||s.answer!==null?'disabled':''))+table(['被除数','除数','余数'],s.rows)+output(s.error|| (s.answer!==null?`余数为0，当前除数是最大公约数：${s.answer}`:s.x!==null?`下一轮：${s.x} ÷ ${s.y}`:'等待输入。'))+table(['特征','在本算法中的体现'],[['输入','两个正整数'],['输出','最大公约数'],['确定性','每轮取余和赋值明确'],['可行性','整除和取余可执行'],['有穷性','非零余数严格递减']]),
 (s,a)=>{if(a==='start'){s.rows=[];s.answer=null;s.error='';const x=Number(s.a),y=Number(s.b);if(!/^\d+$/.test(s.a)||!/^\d+$/.test(s.b)||![x,y].every(n=>Number.isSafeInteger(n)&&n>0)){s.x=s.y=null;s.error='本模型的输入域是正的安全整数，不能输入0、小数或文字。';return;}s.x=x;s.y=y;}if(a==='step'&&s.x!==null&&s.answer===null){const r=s.x%s.y;s.rows.push([s.x,s.y,r]);if(r===0)s.answer=s.y;else{s.x=s.y;s.y=r;}}},(s,k,v)=>{s[k]=v;s.x=null;s.answer=null;s.rows=[];s.error='输入已改变，请重新开始。';});
register(['y2026q42'],'三数比较：明确规则才有确定输出','修改数值，比较明确算法与没有定义判断规则的伪代码。',{a:3,b:8,c:5,mode:'max'},s=>{
 const raw=[s.a,s.b,s.c],values=raw.map(Number),valid=raw.every(x=>String(x).trim()!=='')&&values.every(Number.isFinite);
 return controls(field('a','a',s.a,'number')+field('b','b',s.b,'number')+field('c','c',s.c,'number')+select('mode','伪代码',s.mode,[['max','明确：求最大值'],['ambiguous','含糊：选一个合适的数']]))+`<pre class="lab-code">${s.mode==='max'?'m ← a\n若 b > m 则 m ← b\n若 c > m 则 m ← c\n输出 m':'从 a、b、c 选择一个“合适”的数\n输出它'}</pre>`+output(s.mode==='ambiguous'?'“合适”没有可执行的判断规则，无法推出唯一结果。':valid?`m依次比较三个输入，最终输出 ${Math.max(...values)}。`:'请输入三个非空有限数值；空输入不是0。');
},()=>{});
register(['y2023q69'],'逐个读成绩，只有不及格才加计数','编辑成绩列表，每轮读一个值；循环次数与不及格人数分开累计。',{raw:'85,59,72,40,91,60,58',data:[],i:0,count:0,rows:[],error:''},s=>
 controls(area('raw','成绩（逗号分隔，0—100）',s.raw)+btn('载入成绩','load')+btn('执行一轮','step','',s.i>=s.data.length?'disabled':''))+table(['本轮序号','读入成绩','成绩<60？','累计不及格人数'],s.rows)+output(s.error||`已处理 ${s.i}/${s.data.length} 人，不及格 ${s.count} 人。`),
 (s,a)=>{if(a==='load'){const t=s.raw.split(/[,，\s]+/).filter(Boolean),v=t.map(Number);s.i=s.count=0;s.rows=[];s.data=[];s.error='';if(!v.length||v.length>60||v.some(x=>!Number.isFinite(x)||x<0||x>100)){s.error='请输入1—60个0到100之间的成绩。';return;}s.data=v;}if(a==='step'&&s.i<s.data.length){const v=s.data[s.i++];if(v<60)s.count++;s.rows.push([s.i,v,v<60?'是':'否',s.count]);}},(s,k,v)=>{s.raw=v;s.data=[];s.rows=[];s.i=s.count=0;s.error='成绩已修改，请重新载入。';});
})();

/* Source provenance: note-labs-data.js:2. Preserve this closure. */
(() => {
'use strict';
const {register,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,esc}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
function parseSort(raw){const t=String(raw).trim().split(/[,，\s]+/);if(t.length<2||t.length>12||t.some(v=>! /^-?\d+$/.test(v)||Math.abs(Number(v))>999))return null;return t.map((v,i)=>({value:Number(v),origin:i+1}));}
function sortStep(s){if(!s.items||s.done)return;const n=s.items.length,a=s.items[s.j],b=s.items[s.j+1],swap=s.direction==='asc'?a.value>b.value:a.value<b.value;
   s.comparisons++;s.last=[s.j,s.j+1];if(swap){[s.items[s.j],s.items[s.j+1]]=[b,a];s.swaps++;s.passSwaps++;}
   s.trace.push(`第${s.pass+1}趟，第${s.j+1}次：${a.value} ${s.direction==='asc'?'>':'<'} ${b.value} 为${swap?'真，交换':'假，保留'}。`);s.j++;
   if(s.j>=n-1-s.pass){s.pass++;s.j=0;s.message=`第${s.pass}趟完成：${s.items.map(x=>x.value).join('，')}。`;if(s.passSwaps===0||s.pass>=n-1){s.done=true;s.message+=s.passSwaps===0?' 本趟未交换，提前结束。':' 全部有序。';}else{s.message+=' 一趟结束不代表全序列已有序。';s.passSwaps=0;}}
   else s.message=`下一次比较第${s.j+1}与第${s.j+2}个元素。`;
 }
register(['y2024q69'],'输入自己的数组，比较一次或跑完一趟冒泡','可改升降序、重复值和负数；每一步的交换、趟数与比较次数都实际计算。',{
   raw:'8,5,2,9,7,3',direction:'asc',items:null,pass:0,j:0,passSwaps:0,comparisons:0,swaps:0,done:false,last:[],trace:[],message:'载入数组后，从相邻元素开始。'
 },s=>controls(field('raw','数组（2—12个整数，−999—999）',s.raw)+select('direction','排序方向',s.direction,[['asc','升序：左值 > 右值才交换'],['desc','降序：左值 < 右值才交换']])+btn('载入数组','load'))+
   (s.items?`<div class="ext-sort-array">${s.items.map((v,i)=>`<div class="${s.last.includes(i)?'active ':''}${s.done||i>=s.items.length-s.pass?'settled':''}"><b>${v.value}</b><small>原位置${v.origin}</small></div>`).join('')}</div>`+controls(btn('比较一次','step','',s.done?'disabled':'')+btn('完成当前一趟','pass','',s.done?'disabled':'')+btn('完成全部排序','all','',s.done?'disabled':''))+table(['已完成趟数','比较次数','交换次数'],[[s.pass,s.comparisons,s.swaps]]):'')+output(esc(s.message))+`<ol class="ext-step-log">${s.trace.slice(-12).map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`+coach('采用从左往右扫描、每趟缩短右端范围、无交换即提前退出的版本。相等时不交换，重复值按原先相对顺序保留，因此这个实现稳定。原位置标签帮助核对相等元素，不参与大小比较。'),
 (s,a)=>{if(a==='load'){s.items=parseSort(s.raw);Object.assign(s,{pass:0,j:0,passSwaps:0,comparisons:0,swaps:0,done:false,last:[],trace:[]});s.message=s.items?'已载入，尚未比较。':'请输入2—12个−999到999的整数。';}if(a==='step')sortStep(s);if(a==='pass'&&s.items){const p=s.pass;while(!s.done&&s.pass===p)sortStep(s);}if(a==='all'&&s.items)while(!s.done)sortStep(s);},(s,k,v)=>{s[k]=v;s.items=null;s.trace=[];s.message='数组或方向已改变，请重新载入。';});
Object.assign(window.NOTE_LABS.dataMath ||= {}, {parseSort,sortStep});
})();

/* Chapter 11 teaching sandboxes: instance state and bounded array search. */
(() => {
'use strict';
const {register,ui}=window.NOTE_LABS;
const {btn,field,select,table,coach,output,esc}=ui;
const controls=x=>`<div class="lab-controls">${x}</div>`;
const student=(name,score)=>({name,score});
register(['y2025q24'],'同一个类，两个独立对象','先创建两个学生对象，再通过方法改成绩；观察实例状态、校验和取消。',{
 objects:{},selected:'A',draft:'',message:'类只规定姓名、成绩和方法；先创建A、B两个实例。'
},s=>{
 const current=s.objects[s.selected];
 return `<div class="lab-registers"><b>学生类</b><span>实例属性：姓名、成绩</span><span>方法：修改成绩(新值)、是否及格()</span></div>`+
 controls(btn('创建对象A（59分）','create','A',s.objects.A?'disabled':'')+btn('创建对象B（80分）','create','B',s.objects.B?'disabled':''))+
 `<div data-object-states>${table(['对象','姓名','实例成绩','选择接收消息的对象'],Object.entries(s.objects).map(([id,x])=>[id,x.name,x.score,btn(`选择${id}`,'select',id)]))}</div>`+
 (current?controls(`<b>当前对象：${s.selected}</b>`+field('draft','新成绩（0—100）',s.draft,'number','min="0" max="100"')+btn('调用修改成绩','apply')+btn('调用是否及格','check')+btn('取消草稿','cancel')):'')+
 output(esc(s.message))+coach('本例成绩是实例字段，A与B分别保存；方法只修改接收请求的对象。非法成绩被接口拒绝。演示不模拟完整编程语言，也不推导所有类成员都独立。');
},(s,a,v)=>{
 if(a==='create'&&['A','B'].includes(v)&&!s.objects[v]){s.objects[v]=student(v==='A'?'王宁':'李明',v==='A'?59:80);s.selected=v;s.draft=String(s.objects[v].score);s.message=`从学生类创建对象${v}；它有自己的姓名和成绩状态。`;}
 if(a==='select'&&s.objects[v]){s.selected=v;s.draft=String(s.objects[v].score);s.message=`后续消息发给对象${v}；未提交草稿不修改其他对象。`;}
 const current=s.objects[s.selected];if(!current)return;
 if(a==='apply'){const t=String(s.draft).trim(),n=Number(t);if(!t||!Number.isFinite(n)||n<0||n>100){s.message='方法拒绝本次请求：成绩须是0—100的非空有限数值。两个对象的已确认状态均未改变。';return;}const old=current.score;current.score=n;s.draft=String(n);s.message=`对象${s.selected}.修改成绩(${n})：${old}→${n}；另一个对象的成绩不变。`;}
 if(a==='check')s.message=`对象${s.selected}.是否及格()读取已确认成绩${current.score}，返回${current.score>=60?'真（及格）':'假（不及格）'}；不修改成绩，也不提交草稿。`;
 if(a==='cancel'){s.draft=String(current.score);s.message='已取消草稿；对象仍保存原先确认的成绩。';}
},(s,k,v)=>{if(k==='draft')s.draft=v;});

function parseSearch(raw){const t=String(raw).trim();if(!t)return [];const ts=t.split(/[,，\s]+/);if(ts.length>16||ts.some(x=>! /^-?\d+$/.test(x)||Math.abs(Number(x))>999))return null;return ts.map(Number);}
function targetValue(raw){const t=String(raw).trim();return /^-?\d+$/.test(t)&&Math.abs(Number(t))<=999?Number(t):null;}
function searchStep(s){
 const x=s.active;if(!x||x.done)return;
 const l=x.left,r=x.right,i=x.mode==='binary'?Math.floor((l+r)/2):x.index,value=x.data[i];
 const match=value===x.target;x.comparisons++;x.rows.push([x.comparisons,l+1,r+1,i+1,value,match?'相等':value<x.target?'小于目标':'大于目标']);x.last=i;
 if(match){x.found=i;x.done=true;}
 else if(x.mode==='binary'){if(value<x.target)x.left=i+1;else x.right=i-1;if(x.left>x.right)x.done=true;}
 else{x.index++;x.left=x.index;if(x.index>=x.data.length)x.done=true;}
 s.message=x.done?(x.found===null?`候选已空，未找到${x.target}；共比较${x.comparisons}次。`:`找到${x.target}，位置${x.found+1}；共比较${x.comparisons}次。`):`下一步检查已缩小的候选范围；已比较${x.comparisons}次。`;
}
register(['syllabus-algorithm-strategies'],'先核有序前提，再逐步查找','对同一数组执行线性或二分查找，实际记录区间、比较对象、次数和终止状态。',{
 raw:'2,5,8,12,16,23,38',target:'16',mode:'binary',active:null,message:'设置数据和目标后开始；空数组允许，空目标不允许。'
},s=>{
 const x=s.active,dirty=x&&(s.raw!==x.raw||s.target!==x.rawTarget||s.mode!==x.mode);
 return controls(field('raw','数组（0—16个整数，−999—999；空白为空数组）',s.raw)+field('target','查找目标（整数）',s.target)+select('mode','方法',s.mode,[['linear','线性逐项查找'],['binary','升序二分查找']])+btn('开始/重新开始','start')+btn('取消输入修改','cancel'))+
 (x?`<p data-search-confirmed>已确认：${x.mode==='binary'?'二分':'线性'}查找，目标${x.target}。${dirty?'输入为未开始的草稿，先确认或取消后再单步。':''}</p>`+
 `<div class="ext-sort-array">${x.data.map((v,i)=>`<div class="${i===x.last?'active ':''}${x.found===i?'settled':''}"><b>${v}</b><small>位置${i+1}${!x.done&&i>=x.left&&i<=x.right?' · 候选':''}</small></div>`).join('')}</div>`+
 controls(btn('比较一次','step','',x.done||dirty?'disabled':'')+btn('运行到结束','run','',x.done||dirty?'disabled':''))+
 table(['次序','比较前L','比较前R','本次位置','值','与目标比较'],x.rows)+`<div data-search-result data-done="${x.done}" data-comparisons="${x.comparisons}" data-found="${x.found===null?'':x.found+1}">${x.done?(x.found===null?'未找到':`找到：位置${x.found+1}`):`尚未结束；候选位置${x.left+1}—${x.right+1}`}</div>`:'')+
 output(esc(s.message))+coach('二分采用非降序数组、1基位置和向下取整中点；不自动排序。重复目标只承诺任一命中。计数是本实现比较过多少个元素，不是实测秒数。');
},(s,a)=>{
 if(a==='start'){
  const data=parseSearch(s.raw),target=targetValue(s.target);
  if(data===null||target===null){s.message='不开始：数组须为0—16个−999到999的整数，目标须为范围内非空整数；上次已确认状态保留。';return;}
  if(s.mode==='binary'&&data.some((v,i)=>i>0&&data[i-1]>v)){s.message='不开始二分：数组尚未按非降序排列。可改用线性查找；不会悄悄替你排序。';return;}
  s.active={data,target,raw:s.raw,rawTarget:s.target,mode:s.mode,left:0,right:data.length-1,index:0,found:null,last:null,comparisons:0,rows:[],done:data.length===0};s.message=data.length?'初始化完成，尚未比较任何元素。':'空数组没有候选，0次比较，未找到。';return;
 }
 if(a==='cancel'){if(s.active){s.raw=s.active.raw;s.target=s.active.rawTarget;s.mode=s.active.mode;}else{s.raw='2,5,8,12,16,23,38';s.target='16';s.mode='binary';}s.message='已取消未开始的输入修改，已确认执行记录保持。';return;}
 const x=s.active;if(!x||s.raw!==x.raw||s.target!==x.rawTarget||s.mode!==x.mode)return;
 if(a==='step')searchStep(s);if(a==='run')while(!x.done)searchStep(s);
},(s,k,v)=>{if(['raw','target'].includes(k)||k==='mode'&&['linear','binary'].includes(v))s[k]=v;});
Object.assign(window.NOTE_LABS.algorithmMath ||= {}, {parseSearch,searchStep});
})();
