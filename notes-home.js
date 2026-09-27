(() => {
  'use strict';
  const {escape:esc, search, snippet, highlight}=window.NOTE_SEARCH;
  const data=window.NOTE_CATALOGUE, version=data.version;
  const $=selector=>document.querySelector(selector);
  $('#source-total').textContent=`${data.sourceCount}道真题来源`;
  $('#note-total').textContent=`${data.noteCount}条知识笔记`;
  $('#chapter-grid').innerHTML=data.chapters.map(c=>`<a class="home-chapter" href="./chapter${c.number}.html?v=${version}"><span class="home-number">${String(c.number).padStart(2,'0')}</span><span class="home-copy"><strong>${esc(c.title)}</strong><small>${esc(c.sections.map(s=>s.id+' '+s.title).join(' · '))}</small></span><span class="home-count">${c.noteCount}条 · ${c.sourceCount}题</span></a>`).join('');
  $('#comparison-grid').innerHTML=data.comparisons.map(topic=>`<details class="comparison-topic" id="compare-${topic.id}"><summary>${esc(topic.title)}<span>${topic.rows.length}项对照</span></summary><p>${esc(topic.intro)}</p><p class="table-hint">表格可左右滑动，点笔记名称回看原文。</p><div class="topic-table" tabindex="0" role="region" aria-label="${esc(topic.title)}，可横向滚动"><table><thead><tr>${topic.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}<th scope="col">回看笔记</th></tr></thead><tbody>${topic.rows.map(row=>`<tr>${row.cells.map((cell,i)=>`<${i?'td':'th scope="row"'}>${esc(cell)}</${i?'td':'th'}>`).join('')}<td>${row.notes.map(n=>`<a href="./chapter${n.chapter}.html?v=${version}#${n.id}">${esc(n.title)}</a>`).join('')}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
  const pageSize=30, maximum=Math.ceil((data.noteCount+data.comparisons.length)/pageSize)*pageSize;
  let entries,loading,results=[],limit=pageSize,request=0;
  const loadIndex=()=>loading ||= fetch(data.searchIndex).then(response=>{
    if(!response.ok)throw Error('index');return response.json();
  }).then(value=>entries=value).catch(error=>{loading=null;throw error;});
  function saveQuery(query){
    const url=new URL(location.href);
    query?url.searchParams.set('q',query):url.searchParams.delete('q');
    if(query)url.hash='';
    query&&limit>pageSize?url.searchParams.set('shown',String(limit)):url.searchParams.delete('shown');
    history.replaceState(history.state,'',url);
  }
  function resultHTML(result){
    const query=$('#global-search').value;
    const href=result.kind==='comparison'?`./index.html?v=${version}#compare-${result.id}`:`./chapter${result.chapter}.html?v=${version}#${result.field.anchor}`;
    return `<li><a class="search-result" href="${href}"><small>${result.kind==='comparison'?'易混知识对照':`第${result.chapter}章 · ${esc(result.chapterTitle)}`}</small><strong>${highlight(result.field.title||result.title,query)}</strong>${result.field.title?`<span>${highlight(result.title,query)}</span>`:''}<p>${highlight(window.NOTE_SEARCH.fieldSnippet(result.field,query),query)}</p></a></li>`;
  }
  function renderResults(append=false){
    const list=$('#global-results'),start=append?list.children.length:0;
    if(!append)list.replaceChildren();
    list.insertAdjacentHTML('beforeend',results.slice(start,limit).map(resultHTML).join(''));
    $('#search-more').hidden=results.length<=limit;
    $('#global-status').textContent=results.length?`找到 ${results.length} 项，已显示 ${Math.min(limit,results.length)} 项；点击结果直达相关段落`:'没有找到相关内容。试试更短的词，或用空格组合关键词。';
  }
  async function apply(restore=false){
    const token=++request,query=$('#global-search').value.trim();
    if(!restore)limit=pageSize;
    saveQuery(query);
    $('#global-clear').hidden=!query;$('#global-search-results').hidden=!query;
    $('#browse-notes').hidden=!!query;$('#browse-comparisons').hidden=!!query;
    $('#search-retry').hidden=true;$('#search-more').hidden=true;
    if(!query){results=[];$('#global-results').replaceChildren();return;}
    $('#global-status').textContent='正在查找…';$('#global-results').replaceChildren();
    try{
      await loadIndex();if(token!==request)return;
      results=search(entries,query);renderResults();
    }catch{
      if(token!==request)return;
      $('#global-status').textContent='搜索内容暂未载入，请重试；也可以清空搜索后按章节阅读。';$('#search-retry').hidden=false;
    }
  }
  $('#global-search').addEventListener('input',event=>{if(!event.isComposing)apply();});
  $('#global-search').addEventListener('compositionstart',()=>{request++;});
  $('#global-search').addEventListener('compositionend',()=>apply());
  $('#global-search').addEventListener('search',()=>apply());
  $('#global-clear').addEventListener('click',()=>{$('#global-search').value='';apply();$('#global-search').focus();});
  $('#search-retry').addEventListener('click',()=>apply(true));
  $('#search-more').addEventListener('click',()=>{
    const firstNew=$('#global-results').children.length;
    limit=Math.min(maximum,limit+pageSize);saveQuery($('#global-search').value.trim());renderResults(true);
    const link=$('#global-results').children[firstNew]?.querySelector('a');
    if(link){link.focus({preventScroll:true});link.scrollIntoView({block:'start'});}
  });
  function rememberTopic(topic){
    if($('#global-search').value.trim())return;
    const url=new URL(location.href);url.hash=topic.id;history.replaceState(history.state,'',url);
  }
  function openTopic(){
    const topic=document.getElementById(location.hash.slice(1));
    if(!topic?.matches('.comparison-topic'))return;
    $('#global-search').value='';apply();topic.open=true;topic.scrollIntoView({block:'start'});
  }
  $('#comparison-grid').addEventListener('toggle',event=>{
    const topic=event.target;if(!topic.matches('.comparison-topic'))return;
    if(topic.open)rememberTopic(topic);
    else if(location.hash==='#'+topic.id&&!$('#global-search').value.trim()){
      const url=new URL(location.href);url.hash='browse-comparisons';history.replaceState(history.state,'',url);
    }
  },true);
  $('#comparison-grid').addEventListener('click',event=>{
    const link=event.target.closest('a'),topic=link?.closest('.comparison-topic');if(topic)rememberTopic(topic);
  });
  function restoreFromURL(){
    const params=new URLSearchParams(location.search),requested=Number(params.get('shown'));
    limit=Number.isSafeInteger(requested)&&requested>pageSize?Math.min(maximum,Math.ceil(requested/pageSize)*pageSize):pageSize;
    $('#global-search').value=params.get('q')||'';
    apply(true);if(!$('#global-search').value.trim())openTopic();
  }
  addEventListener('popstate',restoreFromURL);
  addEventListener('hashchange',openTopic);
  restoreFromURL();
})();
