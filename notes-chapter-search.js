/* Chapter filtering, temporary disclosure and URL restoration share the site search rules. */
(() => {
  'use strict';
  function init({notes,simulation,homeUrl,onLayout,onHide}) {
    const input=document.getElementById('search-input'),articles=[...document.querySelectorAll('.note-item')];
    const sections=[...document.querySelectorAll('.section-block')],autoOpened=new Set();
    // Exactly the same immutable entries as global search; no live model output.
    const entries=window.NOTE_SEARCH_ENTRIES;
    function restoreDisclosures(){
      for(const detail of autoOpened)detail.open=false;
      autoOpened.clear();
    }
    function apply(syncURL=true){
      restoreDisclosures();
      document.querySelectorAll('.note-search-jumps').forEach(el=>el.remove());
      document.querySelectorAll('.note-search-match').forEach(el=>el.classList.remove('note-search-match'));
      const query=input.value.trim(),results=window.NOTE_SEARCH.search(entries,query),matches=new Map(results.map(r=>[r.id,r]));
      const terms=window.NOTE_SEARCH.normalize(query).split(' ').filter(Boolean);
      for(const article of articles){
        if(query&&!matches.has(article.id))onHide?.(article);
        article.classList.toggle('hidden',!!query&&!matches.has(article.id));
        const heading=article.querySelector('h3');
        if(heading) heading.classList.toggle('note-search-match', !!(query && matches.has(article.id) && terms.some(term=>window.NOTE_SEARCH.normalize(heading.textContent).includes(term))));
        const targets=[];
        for(const field of matches.get(article.id)?.matches||[]){
          const target=document.getElementById(field.anchor);if(!target)continue;
          target.classList.add('note-search-match');
          if(!targets.includes(target))targets.push(target);
          const detail=target.matches('details')?target:target.closest('details');
          if(detail&&!detail.open){detail.open=true;autoOpened.add(detail);}
        }
        if(query&&targets.length){
          const nav=document.createElement('nav');nav.className='note-search-jumps';nav.setAttribute('aria-label','跳到命中段落');
          const label=document.createElement('span');label.textContent='跳到命中段落';nav.append(label);
          const labels=targets.map(target=>{
            const field=matches.get(article.id).matches.find(f=>f.anchor===target.id);
            return {target,title:field.title,text:field.text,summary:window.NOTE_SEARCH.fieldSnippet(field,query,110)};
          });
          // If clipped extracts collide, expose their complete actual text.
          // Numbers alone must never be the only distinction between two hits.
          labels.forEach(item=>{if(labels.some(other=>other!==item&&other.title===item.title&&other.summary===item.summary))item.summary=item.text;});
          labels.forEach(({target,title,summary})=>{
            const link=document.createElement('a');link.href='#'+target.id;
            const heading=document.createElement('strong');heading.innerHTML=window.NOTE_SEARCH.highlight(title,query);
            const extract=document.createElement('span');extract.className='note-hit-summary';extract.innerHTML=window.NOTE_SEARCH.highlight(summary,query);
            link.append(heading,extract);
            nav.append(link);
          });
          article.querySelector('h3').after(nav);
        }
      }
      sections.forEach(section=>section.classList.toggle('hidden',!section.querySelector('.note-item:not(.hidden)')));
      const shown=query?results.length:notes.length;
      document.getElementById('result-count').textContent=query?`${shown} / ${notes.length}条`:`${shown}条笔记`;
      document.getElementById('clear-search').hidden=!input.value;
      document.getElementById('search-empty').hidden=shown!==0;
      document.getElementById('search-all').href=homeUrl+(query?'&q='+encodeURIComponent(query):'');
      if(syncURL){
        const url=new URL(location.href),previous=url.searchParams.get('q')||'';
        query?url.searchParams.set('q',query):url.searchParams.delete('q');
        if(query&&query!==previous)url.hash='';
        history.replaceState(history.state,'',url);
      }
      requestAnimationFrame(onLayout);
    }
    function clear(focus=true){input.value='';apply();if(focus)input.focus();}
    input.addEventListener('input',event=>{if(!event.isComposing)apply();});
    input.addEventListener('compositionend',()=>apply());
    input.addEventListener('search',()=>apply());
    document.getElementById('clear-search').addEventListener('click',()=>clear());
    document.getElementById('restore-notes').addEventListener('click',()=>clear());
    // A learner's explicit disclosure choice takes over from automatic search expansion.
    document.getElementById('notes-root').addEventListener('click',event=>{
      const summary=event.target.closest('summary');if(summary)autoOpened.delete(summary.parentElement);
    });
    const restore=()=>{input.value=new URLSearchParams(location.search).get('q')||'';apply(false);};
    addEventListener('popstate',restore);
    restore();
    return {clear,claim:target=>{
      for(let el=target;el;el=el.parentElement)if(el.matches?.('details'))autoOpened.delete(el);
    }};
  }
  window.NOTE_CHAPTER_SEARCH={init};
})();
