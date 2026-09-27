/* Search canonical text only; simulation state never changes the index. */
(() => {
  'use strict';
  const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const indexes = new WeakMap();
  // Each caller supplies an immutable content array; normalize it once per page.
  const prepare = entries => {
    if(!indexes.has(entries)) indexes.set(entries,entries.map(entry=>({
      entry,title:normalize(entry.title),
      text:normalize([entry.title,...(entry.aliases||[]),...entry.fields.flatMap(f=>[f.title||'',...(f.aliases||[]),f.text])].join(' ')),
      fields:entry.fields.map((field,order)=>({field,order,text:normalize([field.title||'',...(field.aliases||[]),field.text].join(' '))}))
    })));
    return indexes.get(entries);
  };
  const search = (entries, query) => {
    const terms=[...new Set(normalize(query).split(' ').filter(Boolean))];
    if(!terms.length)return [];
    return prepare(entries).flatMap(({entry,title,text,fields})=>{
      if(!terms.every(term=>text.includes(term)))return [];
      const ranked=fields.map(({field,order,text})=>({...field,order,score:terms.filter(term=>text.includes(term)).length})).sort((a,b)=>b.score-a.score||a.order-b.order);
      const field=ranked[0];if(!field)return [];
      const score=terms.reduce((n,term)=>n+(title.includes(term)?5:0),0)+field.score;
      return [{...entry,field,matches:ranked.filter(f=>f.score>0),score}];
    }).sort((a,b)=>b.score-a.score||(a.chapter||99)-(b.chapter||99));
  };
  const snippet = (text, query, length = 150) => {
    const terms = normalize(query).split(' ').filter(Boolean), normalized = normalize(text);
    const first = terms.map(t => normalized.indexOf(t)).filter(i => i >= 0).sort((a,b) => a-b)[0] || 0;
    const start = Math.max(0, first-35);
    return (start ? '…' : '') + text.slice(start, start+length) + (text.length > start+length ? '…' : '');
  };
  // A match may come from a visible title/group rather than the paragraph itself.
  // Show that real static entrance explicitly instead of inventing a body match.
  const fieldSnippet = (field, query, length = 150) => {
    const terms = normalize(query).split(' ').filter(Boolean);
    const body = String(field.text || '');
    const missingFromBody = terms.filter(term => !normalize(body).includes(term));
    const labels = [...new Set([field.title || '', ...(field.aliases || [])])]
      .filter(label => label && missingFromBody.some(term => normalize(label).includes(term)));
    return (labels.length ? '命中入口：' + labels.join(' / ') + '。' : '') + snippet(body, query, length);
  };
  // Presentation-only: escape first, then wrap already-matched original slices.
  const highlight = (text, query) => {
    const raw = String(text ?? '');
    const terms = [...new Set(normalize(query).split(' ').filter(Boolean))].sort((a,b) => b.length - a.length);
    if (!terms.length) return escape(raw);
    const re = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    let out = '', last = 0, match;
    while ((match = re.exec(raw))) {
      if (!match[0]) { re.lastIndex += 1; continue; }
      out += escape(raw.slice(last, match.index)) + '<mark>' + escape(match[0]) + '</mark>';
      last = match.index + match[0].length;
    }
    return out + escape(raw.slice(last));
  };
  window.NOTE_SEARCH = {normalize, escape, search, snippet, fieldSnippet, highlight};
})();
