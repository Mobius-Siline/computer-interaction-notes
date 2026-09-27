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
