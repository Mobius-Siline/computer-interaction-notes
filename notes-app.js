(() => {
  'use strict';

  const data = window.NOTES;
  const simulation = window.NOTE_SIMULATIONS;
  const presentation = window.NOTE_PRESENTATION;
  const chapterNumber = Number(document.body.dataset.chapter);
  const refined = true;
  const chapter = data.chapters.find(item => item.number === chapterNumber);
  const notes = data.notes.filter(item => item.chapter === chapterNumber);
  const sourceCount = notes.reduce((sum, note) => sum + note.sources.length, 0);
  const version = data.version;
  const chapterUrl = number => `./chapter${number}.html?v=${version}`;
  const homeUrl = `./index.html?v=${version}`;
  const appNames = {1:'原理实验室',2:'Windows 10',3:'Word 2016',4:'Excel 2016',5:'PowerPoint 2016',6:'网络实验室',7:'多媒体工作台',8:'安全控制台',9:'前沿技术沙盘',10:'数据库实验室',11:'算法运行器'};

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip-link" href="#main-content">跳到正文</a>
    <header class="site-header">
      <a class="brand" href="${homeUrl}"><span class="brand-mark">11</span><span class="brand-copy"><strong>计算机系统笔记</strong><small id="brand-chapter"></small></span></a>
      <div class="header-actions">
        <button id="open-drawer" type="button" aria-controls="drawer" aria-expanded="false" aria-haspopup="dialog"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>目录</span><small>第${chapterNumber}章</small></button>
      </div>
    </header>
    <div class="progress" aria-hidden="true"><i id="progress-bar"></i></div>
    <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="目录" aria-hidden="true" inert hidden></aside>
    <button class="scrim" id="scrim" type="button" aria-label="关闭目录" tabindex="-1" aria-hidden="true"></button>
    <main id="main-content">
      <section class="chapter-intro" id="chapter-top">
        <p class="chapter-kicker" id="chapter-kicker"></p><h1 id="chapter-title"></h1><p class="chapter-summary" id="chapter-summary"></p>
        <div class="chapter-meta"><span id="chapter-count"></span><span id="source-count"></span></div>
      </section>
      <section class="chapter-tools" aria-label="搜索本章笔记"><div class="search"><span aria-hidden="true">⌕</span><label class="sr-only" for="search-input">搜索本章</label><input id="search-input" type="search" placeholder="搜索本章知识点" title="多个关键词用空格分隔" autocomplete="off"><button id="clear-search" type="button" aria-label="清空搜索" hidden>×</button></div><span class="count" id="result-count" role="status" aria-live="polite" aria-atomic="true"></span></section>
      <section id="search-empty" class="search-empty" hidden><p>本章没有找到相关笔记。</p><p>试试更短的关键词，或从顶部切换到相关章节。</p><button id="restore-notes" type="button" class="shell-btn shell-btn-primary">清空搜索，显示本章全部笔记</button></section>
      <nav class="learning-links learning-toolbar" aria-label="继续查找"><a id="search-all" href="${homeUrl}">搜索全部11章</a><a href="${homeUrl}#browse-comparisons">易混知识对照</a></nav>
      <div id="notes-root"></div>
    </main>
    <footer class="site-footer"><a href="${homeUrl}">全部章节</a><a href="https://www.sdzk.cn/NewsInfo.aspx?BCID=1195&amp;CID=1133&amp;NewsID=7081" target="_blank" rel="noreferrer">现行考试要求</a></footer>`);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  if (!chapter || !simulation) return;

  document.title = `第${chapter.number}章 ${chapter.title}｜计算机系统笔记`;
  $('#brand-chapter').textContent = `第${chapter.number}章 · 真题来源笔记`;
  $('#chapter-kicker').textContent = `教材第${chapter.number}章 · 真题来源笔记`;
  $('#chapter-title').textContent = chapter.title;
  $('#chapter-summary').textContent = chapter.summary;
  $('#chapter-count').textContent = `${notes.length}条知识笔记`;
  $('#source-count').textContent = `${sourceCount}道真题来源`;
  $('#result-count').textContent = `${notes.length}条笔记`;

  const grouped = chapter.sections.map(section => ({...section, notes: notes.filter(note => note.section === section.id)})).filter(section => section.notes.length);
  $('#notes-root').innerHTML = grouped.map(section => `
    <section class="section-block" id="section-${section.id.replace('.', '-')}">
      <header class="section-head"><p>${section.id}</p><h2>${section.title}</h2></header>
      ${section.notes.map(renderNote).join('')}
    </section>`).join('');

  function renderNote(note) {
    const sources = note.sources.map(source => `<span>${source.year} · 第${source.q}题</span>`).join('');
    const references = (window.NOTE_REFERENCES?.[note.id] || []).map(([title,url])=>`<p><a href="${url}" target="_blank" rel="noreferrer">${title} ↗</a></p>`).join('');
    return `<article class="note-item" id="${note.id}">
      ${note.origin==='syllabus'?'<span class="note-origin">考纲补充</span>':''}
      ${refined ? '' : `<div class="note-topic">${note.topic}</div>`}
      <h3>${note.title}</h3>
      <p class="conclusion" id="${note.id}--conclusion"><b>核心结论：</b>${note.conclusion}</p>
      ${renderSubtopics(note)}
      <div class="note-explanation">
      ${note.pointGroups ? note.pointGroups.map(group=>`<section class="note-point-group"><h4>${simulation.escapeHTML(group.title)}</h4><ul class="points">${group.indices.map(i=>renderPoint(note,i)).join('')}</ul></section>`).join('') : `<ul class="points">${note.points.map((point,i) => renderPoint(note,i)).join('')}</ul>`}
      <div id="${note.id}--comparison">${note.comparison ? renderComparison(note.comparison) : ''}</div></div>
      ${presentation.parts(note,'boundary').some(p=>p.role!=='demo')?`<div class="boundary" id="${note.id}--boundary"><b>易错边界：</b>${renderProse(note,'boundary')}</div>`:''}
      ${(note.workedExamples||[]).map((example,i)=>renderWorked(note,example,i)).join('')}
      <details class="note-provenance" id="${note.id}--sources"><summary>${note.origin==='syllabus'?'考纲与参考资料':`真题来源 · ${note.sources.length}题`}</summary><div class="note-source">${sources}</div>${note.fieldPresentation?.trigger?renderProse(note,'trigger'):`<p>${renderProse(note,'trigger')}</p>`}${references}</details>
      ${renderDemoLimits(note)}
      ${renderSimulation(note)}
      ${renderRelated(note)}
    </article>`;
  }

  function renderSubtopics(note) {
    const links=presentation.subtopics(note),esc=simulation.escapeHTML;
    return links.length?`<nav class="note-subtopics" aria-label="${esc(note.title)}的子主题">${links.map(link=>`<a href="#${link.anchor}">${esc(link.label)}</a>`).join('')}</nav>`:'';
  }
  function renderBlock(part,field) {
    const esc=simulation.escapeHTML,source=text=>`<span data-source-field="${field}">${text}</span>`;
    const body=part.steps?`<ol class="note-operation-steps">${presentation.split(part.text,part.steps.map(from=>({from}))).map(step=>`<li>${source(step.text)}</li>`).join('')}</ol>`:`<p>${source(part.text)}</p>`;
    return `<div class="note-prose-block">${part.label?`<h6>${esc(part.label)}</h6>`:''}${body}</div>`;
  }
  function renderProse(note,field) {
    if(!presentation.fieldMeta(note,field).blocks)return `<span data-source-field="${field}">${presentation.fieldText(note,field)}</span>`;
    return presentation.parts(note,field).filter(part=>part.role!=='demo').map(part=>renderBlock(part,field)).join('');
  }
  function renderPoint(note,index) {
    const field='point-'+index,meta=presentation.pointMeta(note,index),esc=simulation.escapeHTML;
    return `<li id="${note.id}--${field}" data-note-point="${index}"${meta.title?` data-point-title="${esc(meta.title)}" class="note-structured-point"`:''}>${meta.title?`<h5>${esc(meta.title)}</h5>`:''}${renderProse(note,field)}</li>`;
  }
  function renderDemoLimits(note) {
    const fields=[...note.points.map((_,i)=>'point-'+i),'boundary','trigger'];
    const blocks=fields.flatMap(field=>presentation.parts(note,field).filter(part=>part.role==='demo').map(part=>({field,part})));
    if(!blocks.length)return '';
    return `<aside class="note-demo-limits" id="${note.id}--demo-limits" aria-label="本演示的范围与限制"><h4>本演示的范围与限制</h4>${blocks.map(({field,part})=>`<div${field==='boundary'&&presentation.parts(note,field).every(p=>p.role==='demo')?` id="${note.id}--boundary"`:''}>${renderBlock(part,field)}</div>`).join('')}</aside>`;
  }

  function renderWorked(note,example,index) {
    const esc=simulation.escapeHTML;
    return `<section class="note-worked" id="${note.id}--worked-${index}"><h4>真题怎么判断 · ${example.year}年第${example.q}题</h4><p>${esc(example.questionSummary)}</p><ol>${example.reasoning.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p><b>易误判：</b>${esc(example.pitfall)}</p><p><b>换个条件：</b>${esc(example.transfer)}</p>${example.historicalVersionNote?`<p class="worked-source">${esc(example.historicalVersionNote)}</p>`:''}<p class="worked-source"><a href="${esc(example.sourceURL)}" target="_blank" rel="noreferrer">题面来源 ↗</a> · ${esc(example.sourceStatus)}</p></section>`;
  }

  function renderRelated(note) {
    const links=window.NOTE_NAVIGATION?.[note.id], esc=simulation.escapeHTML;
    if(!links || (!links.related.length&&!links.topics.length))return '';
    return `<nav class="note-related" aria-label="${esc(note.title)}的关联知识"><p>联系起来理解</p><ul>${links.related.map(n=>`<li><a href="${chapterUrl(n.chapter)}#${n.id}">${esc(n.label)}<small>${esc(n.reason)}</small></a></li>`).join('')}</ul>${links.topics.map(t=>`<a class="topic-link" href="${homeUrl}#compare-${t.id}">对照：${esc(t.title)}</a>`).join('')}</nav>`;
  }

  function looksLikeFormula(text) {
    const t = String(text).trim();
    return /^(?:=|'=)/.test(t)
      || /\$[A-Z]{1,3}\$\d+/.test(t)
      || /\b(?:SUM|VLOOKUP|HLOOKUP|RANK(?:\.EQ)?|LEFT|RIGHT|MID|IF|DATE|MONTH|YEAR|INT|ROUND|COUNTIF|AVERAGE)\s*\(/i.test(t)
      || /^\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?$/.test(t);
  }
  function formulaHTML(text) {
    const html = simulation.escapeHTML(text);
    return looksLikeFormula(text) ? `<span class="note-formula">${html}</span>` : html;
  }
  function renderComparison(comparison) {
    const escape = simulation.escapeHTML;
    return `<div class="note-comparison" role="region" aria-label="${escape(comparison.caption || '知识点对照')}" tabindex="0"><table>${comparison.caption ? `<caption>${escape(comparison.caption)}</caption>` : ''}<thead><tr>${comparison.headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${comparison.rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${formulaHTML(cell)}</th>`:`<td>${formulaHTML(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderSimulation(note) {
    const demo = simulation.demos[note.id];
    const scene = simulation.scenes[note.id];
    if (!demo || !scene) return '';
    const bodyId = `simulation-${note.id}`;
    const types = [...new Set(note.sources.map(source => source.type))];
    const operation = types.some(type => /操作|分析|综合/.test(type));
    return `<section id="${note.id}--demo" class="reality-demo chapter-sim-${note.chapter} ${operation ? 'is-operation' : 'is-concept'}" data-sim-id="${note.id}" data-state="-1" data-progress="0" data-tone="">
      <button class="simulation-toggle" type="button" aria-expanded="false" aria-controls="${bodyId}">
        ${refined ? '' : `<span class="simulation-icon" aria-hidden="true"><i></i><b>${String(note.chapter).padStart(2,'0')}</b></span>`}
        <span class="simulation-heading"><small>${operation ? '拟真操作演示' : '拟真概念演示'} · ${appNames[note.chapter]}</small><b>${simulation.escapeHTML(demo.title)}</b></span>
        <span class="simulation-open"><i>打开</i><b>›</b></span>
      </button>
      <div class="simulation-body" id="${bodyId}" hidden>
        <header class="simulation-brief">${refined ? '' : '<span>动手理解</span>'}<p>${simulation.escapeHTML(demo.task)}</p>${refined ? '<div class="demo-view-actions"><button type="button" class="shell-btn shell-btn-primary" data-sim-expand>展开操作区</button><button type="button" class="shell-btn" data-sim-reset>重置演示</button></div>' : ''}</header>
        <div class="simulation-mount" data-sim-mount></div>
        ${refined ? '' : '<footer class="simulation-footer"><span>直接操作画面；不计分</span><button type="button" data-sim-reset>↻ 恢复初始状态</button></footer>'}
      </div>
    </section>`;
  }

  $('#notes-root').addEventListener('click', event => {
    const card = event.target.closest('[data-sim-id]');
    if (!card) return;
    const id = card.dataset.simId;
    const demo = simulation.demos[id];
    const previewLink=event.target.closest('[data-preview-link]');if(previewLink){event.preventDefault();updateFeedback(card,previewLink.hasAttribute('href')?'目标是chapter1.html；本卡片只预览目标，不离开笔记。':'当前没有href，点击不会导航。','链接预览');return;}
    const toggle = event.target.closest('.simulation-toggle');
    if (toggle) {
      const body = $('.simulation-body', card);
      const opening = body.hidden;
      if (!opening) { cancelLegacyGesture(card); window.NOTE_LABS?.cancel(card); }
      body.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
      $('.simulation-open i', toggle).textContent = opening ? '收起' : '打开';
      if (opening && !card.dataset.mounted) {
        card.dataset.mounted = '1';
        $('[data-sim-mount]', card).innerHTML = simulation.scenes[id](demo);
        initialiseSpecialScene(card, id); refreshSequenceAvailability(card, demo);
      }
      return;
    }
    if (event.target.closest('[data-sim-reset]')) { resetSimulation(card, id, demo); return; }

    const dragMode = event.target.closest('[data-drag-mode]');
    if (dragMode) {
      card.dataset.dragMode = dragMode.dataset.dragMode;
      $$('[data-drag-mode]', card).forEach(button => {
        const active = button === dragMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      updateFeedback(card, `当前拖动条件：${dragMode.textContent.trim()}。现在把文件拖到同盘或跨盘目标。`, '条件已设置');
      return;
    }

    const slideNav = event.target.closest('[data-slide-nav]');
    if (slideNav) {
      navigateSlide(card, id, Number(slideNav.dataset.slideNav));
      return;
    }

    const chosen = event.target.closest('[data-sim-choice]');
    if (chosen) {
      const index = Number(chosen.dataset.simChoice);
      activateChoice(card, id, demo, index, chosen);
      return;
    }

    const next = event.target.closest('[data-sim-step]');
    if (next) {
      const picked = Number(next.dataset.simStep);
      if (id === 'y2020q52' && picked === 3) {
        const threshold = $('[data-condition-threshold]', card)?.value.trim();
        const format = $('[data-condition-format]', card)?.value;
        if (threshold !== '60' || !format) {
          updateFeedback(card, '请在“小于”对话框中输入60，并选择一种突出显示格式后再确定。', '条件还未填写完整', 'bad');
          return;
        }
      }
      completeSequenceStep(card, id, demo, next, picked);
      return;
    }

    if (event.target.closest('[data-run-query]')) {
      card.classList.remove('query-ran');
      requestAnimationFrame(() => card.classList.add('query-ran'));
      updateFeedback(card, '查询只返回成绩大于80的姓名和成绩，并按成绩降序显示；原表行序没有改变。', '查询执行完成', 'good');
    }
  });

  $('#notes-root').addEventListener('dblclick', event => {
    const doubleStep = event.target.closest('[data-sim-double-step]');
    if (doubleStep) {
      const card = doubleStep.closest('[data-sim-id]');
      completeSequenceStep(card, card.dataset.simId, simulation.demos[card.dataset.simId], doubleStep, Number(doubleStep.dataset.simDoubleStep));
      return;
    }
    const handle = event.target.closest('[data-fill-handle]');
    if (!handle) return;
    const card = handle.closest('[data-sim-id]');
    const demo = simulation.demos[card.dataset.simId];
    fillSeries(card);
    activateChoice(card, card.dataset.simId, demo, 3, handle);
  });

  function activateChoice(card, id, demo, index, chosen = null) {
    const items = demo.kind === 'choose' ? demo.options : demo.actions;
    const item = items[index];
    if (!item) return;
    card.dataset.state = String(index);
    card.dataset.tone = item.tone || '';
    $$('[data-sim-choice]', card).forEach(button => {
      let active = chosen ? button === chosen : Number(button.dataset.simChoice) === index;
      if (id === 'y2026q30') {
        const gate = button.classList.contains('publish-gate');
        active = gate ? button.classList.contains('active') || button === chosen : index === 3 && button === chosen;
      }
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (id === 'y2020q2' && chosen) {
      const currentWindow = chosen.closest('[data-demo-window]');
      if (currentWindow) {
        $$('[data-demo-window]', card).forEach(win => win.classList.toggle('active', index !== 1 && win === currentWindow));
      }
    }
    updateFeedback(card, item.result, item.stage || item.label);
    applyChoiceEffect(card, id, index);
  }

  function completeSequenceStep(card, id, demo, control, picked) {
    const progress = Number(card.dataset.progress);
    if (picked !== progress) {
      const expected = demo.steps[progress];
      if (!expected) { updateFeedback(card,'本次操作已完成。可恢复初始状态重新尝试。','操作已完成'); return false; }
      updateFeedback(card, `当前先在画面中完成“${expected.label}”。`, '操作顺序还没到这里', 'bad');
      control.classList.remove('nudge');
      requestAnimationFrame(() => control.classList.add('nudge'));
      return false;
    }
    control.disabled = true;
    control.classList.add('done');
    card.dataset.progress = String(progress + 1);
    const complete = progress + 1 === demo.steps.length;
    card.dataset.tone = complete ? 'good' : '';
    refreshSequenceAvailability(card, demo);
    updateFeedback(card, demo.steps[progress].detail, complete ? '操作完成' : `第${progress + 1}步完成`);
    applyStepEffect(card, id, progress, complete);
    keepCurrentStageVisible(card);
    return true;
  }

  function keepCurrentStageVisible(card) {
    requestAnimationFrame(() => {
      const currentStage = $$('[data-v25-stage],[data-stage-view]', card)
        .find(stage => getComputedStyle(stage).display !== 'none');
      currentStage?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  let activeGesture = null;
  const gestureRoot = $('#notes-root');

  gestureRoot.addEventListener('pointerdown', event => {
    const pressTarget = event.target.closest('[data-long-press-choice]');
    if (pressTarget) {
      startPressGesture(event, pressTarget);
      return;
    }
    const windowHandle = event.target.closest('[data-window-drag]');
    if (windowHandle && !event.target.closest('button')) {
      startDragGesture(event, windowHandle, 'window');
      return;
    }
    const dragSource = event.target.closest('[data-drag-kind]');
    if (dragSource) startDragGesture(event, dragSource, dragSource.dataset.dragKind);
  });

  gestureRoot.addEventListener('contextmenu', event => {
    if (event.target.closest('[data-drag-kind="file"],[data-long-press-choice]')) event.preventDefault();
  });

  gestureRoot.addEventListener('keydown', event => {
    const fauxButton = event.target.closest('[role="button"][data-sim-step]');
    if (fauxButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      fauxButton.click();
      return;
    }
    const source = event.target.closest('[data-drag-kind]');
    if (!source || !['Enter',' '].includes(event.key)) return;
    event.preventDefault();
    const card = source.closest('[data-sim-id]');
    const id = card.dataset.simId;
    const demo = simulation.demos[id];
    if (source.dataset.dragKind === 'column-resize') finishColumnResize(card, 92, demo);
    if (source.dataset.dragKind === 'fill') { fillSeries(card); activateChoice(card, id, demo, 2, source); }
    if (source.dataset.dragKind === 'file') completeFileDrag(card, source, $('[data-drop-target="cross"]', card), demo, {});
    if (['workload','relation'].includes(source.dataset.dragKind)) completeMappedDrag(card, source, $(`[data-drop-target="${source.dataset.correctTarget}"]`, card), demo);
  });

  document.addEventListener('pointermove', event => {
    const gesture = activeGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    gesture.distance = Math.hypot(dx, dy);
    if (gesture.type === 'press') {
      if (gesture.distance > 10) cancelPressGesture(gesture);
      return;
    }
    event.preventDefault();
    gesture.dx = dx; gesture.dy = dy;
    moveDragGesture(gesture, dx, dy);
  }, {passive:false});

  document.addEventListener('pointerup', finishPointerGesture);
  document.addEventListener('pointercancel', cancelPointerGesture);
  document.addEventListener('lostpointercapture', cancelPointerGesture);
  addEventListener('blur', () => cancelLegacyGesture());

  function cancelLegacyGesture(card) {
    if (activeGesture && (!card || activeGesture.card === card || card.contains(activeGesture.card))) {
      cancelPointerGesture({pointerId:activeGesture.pointerId});
    }
  }

  function gestureVisible(gesture) {
    return gesture.card.isConnected && (gesture.target || gesture.source).isConnected
      && !gesture.card.closest('[hidden],.hidden')
      && !$('.simulation-body', gesture.card)?.hidden;
  }

  function startPressGesture(event, target) {
    if (event.button !== 0 || event.isPrimary === false) return;
    if (activeGesture) cancelPointerGesture({pointerId:activeGesture.pointerId});
    const card = target.closest('[data-sim-id]');
    const gesture = {type:'press', pointerId:event.pointerId, target, card, startX:event.clientX, startY:event.clientY, distance:0, fired:false};
    activeGesture = gesture;
    target.classList.remove('press-complete');
    target.classList.add('pressing');
    target.setPointerCapture?.(event.pointerId);
    const label = $('[data-press-label]', card);
    if (label) label.textContent = '继续按住…达到圆环终点才会强制断电';
    gesture.timer = setTimeout(() => {
      if (activeGesture !== gesture) return;
      if (!gestureVisible(gesture)) { cancelLegacyGesture(gesture.card); return; }
      gesture.fired = true;
      target.classList.remove('pressing');
      target.classList.add('press-complete');
      const demo = simulation.demos[card.dataset.simId];
      activateChoice(card, card.dataset.simId, demo, Number(target.dataset.longPressChoice), target);
      if (label) label.textContent = '已持续按住：触发强制断电';
    }, 700);
  }

  function cancelPressGesture(gesture) {
    clearTimeout(gesture.timer);
    gesture.target.classList.remove('pressing');
    const label = $('[data-press-label]', gesture.card);
    if (label && !gesture.fired) label.textContent = '手指移动过远，长按已取消';
  }

  function startDragGesture(event, source, kind) {
    if (event.isPrimary === false) return;
    if (event.button !== 0 && !(kind === 'file' && event.button === 2)) return;
    cancelLegacyGesture();
    const card = source.closest('[data-sim-id]');
    const movable = kind === 'window' ? source.closest('[data-demo-window]') : source;
    const measured = kind.startsWith('picture-') ? source.closest('[data-picture],[data-ppt-picture]') : movable;
    const rect = measured.getBoundingClientRect();
    activeGesture = {
      type:'drag', kind, source, movable, card, pointerId:event.pointerId,
      startX:event.clientX, startY:event.clientY, startWidth:rect.width, startHeight:rect.height,
      dx:0, dy:0, distance:0,
      baseX:Number(movable.dataset.dragX) || 0, baseY:Number(movable.dataset.dragY) || 0,
      rightButton:event.button===2, ctrlKey:event.ctrlKey, shiftKey:event.shiftKey
    };
    source.setPointerCapture?.(event.pointerId);
    movable.classList.add('dragging');
    if (kind === 'window') {
      $$('[data-demo-window]', card).forEach(win => win.classList.toggle('active', win === movable));
    }
  }

  function moveDragGesture(gesture, dx, dy) {
    const {kind, movable, card} = gesture;
    if (kind === 'window') {
      movable.style.setProperty('--drag-x', `${gesture.baseX + dx}px`);
      movable.style.setProperty('--drag-y', `${gesture.baseY + dy}px`);
      return;
    }
    if (kind === 'column-resize') {
      const extra = Math.max(0, Math.min(170, dx));
      const grid = $('[data-column-grid]', card);
      if (grid) grid.style.gridTemplateColumns = `40px ${72 + extra}px`;
      const heading = $('[data-column-b]', card);
      if (heading) heading.style.width = `${72 + extra}px`;
      const cell = $('[data-hash-cell]', card);
      if (cell) { cell.style.width = `${72 + extra}px`; cell.textContent = extra > 62 ? '2026/9/2 10:28' : '########'; }
      return;
    }
    if (kind === 'fill') {
      const y = Math.max(0, Math.min(155, dy));
      movable.style.setProperty('--drag-y', `${y}px`);
      card.style.setProperty('--fill-preview', `${y}px`);
      card.classList.add('fill-previewing');
      return;
    }
    if (kind === 'picture-resize') {
      const picture = movable.closest('[data-picture],[data-ppt-picture]');
      if (!gesture.picture) gesture.picture = picture;
      const lock = $('[data-aspect-lock]', card)?.checked !== false;
      const width = Math.max(110, Math.min(380, gesture.startWidth + dx));
      const height = lock ? width * gesture.startHeight / gesture.startWidth : Math.max(80, Math.min(300, gesture.startHeight + dy));
      picture.style.width = `${width}px`; picture.style.height = `${height}px`;
      updatePictureReadout(card, width, height);
      return;
    }
    if (kind === 'picture-crop') {
      const picture = movable.closest('[data-picture],[data-ppt-picture]');
      const art = $('.photo-art,.scan-image', picture);
      const crop = Math.max(0, Math.min(48, -dx / Math.max(1, picture.getBoundingClientRect().width) * 100));
      if (art) art.style.clipPath = `inset(0 ${crop}% 0 0)`;
      gesture.crop = crop;
      return;
    }
    if (kind === 'group') {
      $$('.group-object,[data-group-boundary]', card).forEach(object => {
        object.style.setProperty('--drag-x', `${gesture.baseX + dx}px`);
        object.style.setProperty('--drag-y', `${gesture.baseY + dy}px`);
      });
      return;
    }
    movable.style.setProperty('--drag-x', `${dx}px`);
    movable.style.setProperty('--drag-y', `${dy}px`);
    const selector = kind === 'slide' ? '[data-drag-kind="slide"]' : '[data-drop-target]';
    const hovered = findPointTarget(card, gesture.startX + dx, gesture.startY + dy, selector, movable);
    $$(selector, card).forEach(target => target.classList.toggle('drag-over', target === hovered));
  }

  function finishPointerGesture(event) {
    const gesture = activeGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!gestureVisible(gesture)) { cancelLegacyGesture(gesture.card); return; }
    activeGesture = null;
    if (gesture.type === 'press') {
      clearTimeout(gesture.timer);
      gesture.target.classList.remove('pressing');
      if (!gesture.fired && gesture.distance <= 10) {
        const demo = simulation.demos[gesture.card.dataset.simId];
        activateChoice(gesture.card, gesture.card.dataset.simId, demo, Number(gesture.target.dataset.shortPressChoice), gesture.target);
        const label = $('[data-press-label]', gesture.card);
        if (label) label.textContent = '这是短按：行为由电源选项决定，没有触发强制断电';
      }
      return;
    }
    const {card, kind, source, movable} = gesture;
    $$('[data-drop-target],[data-drag-kind="slide"]', card).forEach(target => target.classList.remove('drag-over'));
    movable.classList.remove('dragging');
    if (kind === 'window') {
      movable.dataset.dragX = String(gesture.baseX + gesture.dx);
      movable.dataset.dragY = String(gesture.baseY + gesture.dy);
      if (gesture.distance > 8) activateChoice(card, card.dataset.simId, simulation.demos[card.dataset.simId], 2, source);
      return;
    }
    if (kind === 'column-resize') {
      finishColumnResize(card, gesture.dx, simulation.demos[card.dataset.simId]);
      return;
    }
    if (kind === 'fill') {
      card.classList.remove('fill-previewing');
      card.style.removeProperty('--fill-preview');
      source.style.removeProperty('--drag-y');
      if (gesture.dy > 62) {
        fillSeries(card);
        activateChoice(card, card.dataset.simId, simulation.demos[card.dataset.simId], 2, source);
      } else updateFeedback(card, '要把绿色填充柄向下拖到A7附近，松手后才会生成序列。', '拖动距离不足', 'warn');
      return;
    }
    if (kind === 'picture-resize' || kind === 'picture-crop') {
      if (kind === 'picture-crop' && gesture.crop > 4 && card.dataset.simId === 'y2026q53') activateChoice(card, card.dataset.simId, simulation.demos[card.dataset.simId], 2, source);
      else updateFeedback(card, kind === 'picture-crop' ? '裁剪只改变可见范围，图片对象与动画仍保留。' : '图片尺寸已随手柄连续变化；锁定纵横比时宽高联动。', kind === 'picture-crop' ? '裁剪边界已移动' : '缩放完成', 'good');
      return;
    }
    if (kind === 'group') {
      $$('.group-object,[data-group-boundary]', card).forEach(object => {
        object.dataset.dragX = String(gesture.baseX + gesture.dx);
        object.dataset.dragY = String(gesture.baseY + gesture.dy);
      });
      updateFeedback(card, gesture.distance > 8 ? '三个对象保持相对位置并一起移动，说明它们已经成为一个组合。' : '按住组合外框并拖动，三个对象会一起移动。', gesture.distance > 8 ? '组合拖动成功' : '尚未移动', gesture.distance > 8 ? 'good' : 'warn');
      return;
    }
    const target = findPointTarget(card, event.clientX, event.clientY, kind === 'slide' ? '[data-drag-kind="slide"]' : '[data-drop-target]', source);
    movable.style.removeProperty('--drag-x'); movable.style.removeProperty('--drag-y');
    if (kind === 'file') completeFileDrag(card, source, target, simulation.demos[card.dataset.simId], gesture);
    if (kind === 'workload' || kind === 'relation') completeMappedDrag(card, source, target, simulation.demos[card.dataset.simId]);
    if (kind === 'slide') completeSlideDrag(card, source, target);
  }

  function cancelPointerGesture(event) {
    const gesture = activeGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    activeGesture = null;
    if (gesture.type === 'press') cancelPressGesture(gesture);
    else {
      gesture.movable.classList.remove('dragging');
      if (gesture.kind === 'window') {
        gesture.movable.style.setProperty('--drag-x', `${gesture.baseX}px`);
        gesture.movable.style.setProperty('--drag-y', `${gesture.baseY}px`);
      } else if (gesture.kind === 'group') {
        $$('.group-object,[data-group-boundary]', gesture.card).forEach(object => {
          object.style.setProperty('--drag-x', `${gesture.baseX}px`);
          object.style.setProperty('--drag-y', `${gesture.baseY}px`);
        });
      } else {
        gesture.movable.style.removeProperty('--drag-x');
        gesture.movable.style.removeProperty('--drag-y');
      }
    }
  }

  function findPointTarget(card, x, y, selector, source) {
    return $$(selector, card).find(target => {
      if (target === source) return false;
      const rect = target.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
  }

  function finishColumnResize(card, dx, demo) {
    if (dx < 36) {
      updateFeedback(card, '请抓住B列标题右边界向右拖动；轻点不会改变列宽。', '还没有加宽', 'warn');
      return;
    }
    $('[data-hash-cell]', card).textContent = '2026/9/2 10:28';
    activateChoice(card, card.dataset.simId, demo, 0, $('[data-column-b]', card));
  }

  function fillSeries(card) {
    $$('[data-fill-row]', card).forEach((cell, index) => { cell.textContent = String(20260001 + index); });
    card.classList.add('series-filled');
  }

  function completeFileDrag(card, source, target, demo, gesture) {
    if (!target) {
      updateFeedback(card, '文件没有落在目标文件夹中，请再拖一次。', '未放入目标', 'warn');
      return;
    }
    const mode = gesture.rightButton ? 'right' : gesture.ctrlKey ? 'ctrl' : gesture.shiftKey ? 'shift' : card.dataset.dragMode || 'none';
    const targetType = target.dataset.dropTarget;
    const index = mode === 'ctrl' ? 2 : mode === 'shift' ? 3 : mode === 'right' ? 4 : targetType === 'same' ? 0 : 1;
    $$('.drop-zone', card).forEach(zone => { zone.classList.remove('drop-complete','right-drop'); zone.querySelector('.dropped-file,.drag-menu')?.remove(); });
    if (index === 4) {
      target.classList.add('right-drop');
      target.insertAdjacentHTML('beforeend','<div class="drag-menu"><span>复制到此处</span><span>移动到此处</span><span>在当前位置创建快捷方式</span></div>');
    } else {
      target.classList.add('drop-complete');
      target.insertAdjacentHTML('beforeend','<span class="dropped-file">W　笔记.docx</span>');
    }
    source.classList.toggle('moved-away', index === 0 || index === 3);
    activateChoice(card, card.dataset.simId, demo, index, source);
  }

  function completeMappedDrag(card, source, target, demo) {
    if (!target) {
      updateFeedback(card, '请把对象完整拖入有“放到这里”提示的目标区域。', '没有放到目标', 'warn');
      return;
    }
    const expected = source.dataset.correctTarget;
    if (target.dataset.dropTarget !== expected) {
      target.classList.remove('wrong-drop');
      requestAnimationFrame(() => target.classList.add('wrong-drop'));
      updateFeedback(card, source.dataset.dragKind === 'relation' ? '联系方向必须从起点拖到另一端，不能在原实体内松手。' : '这个工作负载与目标处理器不匹配，已退回任务队列。', '放置不合适', 'bad');
      return;
    }
    target.classList.add('accepted-drop');
    activateChoice(card, card.dataset.simId, demo, Number(source.dataset.choice), source);
  }

  function completeSlideDrag(card, source, target) {
    if (!target) {
      updateFeedback(card, '松手位置没有落在另一张缩略图上，顺序保持不变。', '未重排', 'warn');
      return;
    }
    const list = source.parentElement;
    const oldOrder = [...list.children].indexOf(source) + 1;
    const targetOrder = [...list.children].indexOf(target) + 1;
    if (oldOrder < targetOrder) target.after(source); else target.before(source);
    [...list.querySelectorAll('[data-slide-num]')].forEach((slide, index) => slide.querySelector('span').textContent = `位置 ${index + 1} · 原第${slide.dataset.slideNum}页`);
    updateFeedback(card, `原第${source.dataset.slideNum}页已从位置${oldOrder}移动到位置${targetOrder}。`, '缩略图已重排', 'good');
  }

  function updatePictureReadout(card, width, height) {
    const readout = $('[data-picture-readout]', card);
    if (!readout) return;
    const w = width / 35, h = height / 35;
    const ratio = width / height;
    const ratioText = Math.abs(ratio - 8.5 / 6) < .04 ? '保持原始8.5:6' : Math.abs(ratio - 6 / 5) < .04 ? '目标6:5' : '比例已改变';
    readout.textContent = `${w.toFixed(2)} × ${h.toFixed(2)} cm · ${ratioText}`;
    const widthInput = $('[data-image-width]', card), heightInput = $('[data-image-height]', card);
    if (widthInput) widthInput.value = `${w.toFixed(2)} cm`;
    if (heightInput) heightInput.value = `${h.toFixed(2)} cm`;
  }

  function navigateSlide(card, id, page) {
    $$('[data-slide-nav]', card).forEach(button => button.classList.toggle('selected', Number(button.dataset.slideNav) === page));
    const titles = {
      y2020q10:['人工智能辅助医学影像','研究背景','数据与方法','实验结果','局限与讨论','总结与展望'],
      y2020q12:['答辩封面','研究方法','备用数据','致谢'],
      y2026q54:['学习目标','学习目标（续）']
    };
    const title = titles[id]?.[page - 1];
    if (!title) return;
    const slide = $('.ppt-main-slide', card);
    slide?.classList.remove('page-changing');
    requestAnimationFrame(() => slide?.classList.add('page-changing'));
    const number = $('[data-slide-number]', card);
    if (number) number.textContent = String(page).padStart(2,'0');
    const heading = $('[data-slide-heading],[data-slide-title]', card);
    if (heading) heading.textContent = title;
    if (id === 'y2020q12') {
      const stamp = $('[data-hidden-stamp]', card);
      if (stamp) stamp.hidden = page !== 3;
      const subtitle = $('[data-slide-subtitle]', card);
      if (subtitle) subtitle.textContent = page === 3 ? '页面仍保留在文件中，只在正常放映时被跳过。' : `当前正在编辑第${page}页；隐藏状态只属于第3页。`;
    }
    if (id === 'y2020q10') {
      const subtitle = $('[data-slide-subtitle]', card);
      if (subtitle) subtitle.textContent = ['课程汇报','为什么需要辅助诊断','数据集与训练流程','准确率与召回率','误差来源','课程汇报结束'][page-1];
    }
    if (id === 'y2026q54') {
      const text = $('[data-autofit-text]', card);
      if (text) text.textContent = page === 1 ? '掌握计算机基础概念；理解操作系统的基本功能。' : '完成Word、Excel和PowerPoint规范操作；形成信息安全意识。';
    }
    updateFeedback(card, `已切换到第${page}页：${title}。`, '页面已切换', 'good');
  }

  $('#notes-root').addEventListener('input', event => {
    const card = event.target.closest('[data-sim-id]');
    if (!card) return;
    const id = card.dataset.simId;
    if (id === 'y2020q41' && event.target.matches('[data-sequence-input]')) {
      const stepIndex = Number(event.target.dataset.sequenceInput);
      const expected = stepIndex === 4 ? '牡丹' : '山东专升本计算机';
      if (event.target.value.trim() === expected) completeSequenceStep(card, id, simulation.demos[id], event.target, stepIndex);
      else updateFeedback(card, `继续输入完整页眉：“${expected}”。`, '正在编辑页眉');
      return;
    }
    if (event.target.matches('[data-sim-toggle="extensions"]')) {
      $('[data-filename]', card).textContent = event.target.checked ? 'report' : 'report.docx';
      updateFeedback(card, '只是隐藏界面中的扩展名，文件实际仍是report.docx。', '显示设置已改变');
    }
    if (event.target.matches('[data-sim-toggle="readonly"]')) {
      $('[data-file-attr]', card).textContent = event.target.checked ? 'R' : '—';
      updateFeedback(card, event.target.checked ? '只读属性主要限制内容修改，不等于绝对禁止删除。' : '只读属性已取消。', '属性已更新');
    }
  });

  function updateFeedback(card, text, label = '操作反馈', tone = '') {
    const box = $('[data-sim-feedback]', card);
    if (!box) return;
    box.className = `sim-feedback ${tone ? `tone-${tone}` : card.dataset.tone ? `tone-${card.dataset.tone}` : ''}`;
    box.innerHTML = `<span>${simulation.escapeHTML(label)}</span><p>${simulation.escapeHTML(text)}</p>`;
  }

  function resetSimulation(card, id, demo) {
    cancelLegacyGesture(card);
    window.NOTE_LABS?.unmount(card);
    card.dataset.state = '-1'; card.dataset.progress = '0'; card.dataset.tone = ''; delete card.dataset.dragMode; card.classList.remove('simulation-complete','cjk-compact','query-ran','series-filled','fill-previewing');
    $('[data-sim-mount]', card).innerHTML = simulation.scenes[id](demo);
    initialiseSpecialScene(card, id);
    refreshSequenceAvailability(card, demo);
  }

  function applyChoiceEffect(card, id, index) {
    const text = (selector, value) => { const node = $(selector, card); if (node) node.textContent = value; };
    const html = (selector, value) => { const node = $(selector, card); if (node) node.innerHTML = value; };
    switch (id) {
      case 'merged-18': { const values=[['有','有','有'],['通常无头部跟踪','有','有'],['设备位置跟踪','可交互','有'],['无','无','预先录制']][index]; ['track','hand','live'].forEach((key,i)=>text('[data-vr-'+key+']',values[i])); break; }
      case 'y2020q36': { const attribute=$('[data-anchor-attribute]',card);if(attribute)attribute.hidden=index===3;const link=$('[data-preview-link]',card); if(index===3)link?.removeAttribute('href');else link?.setAttribute('href','chapter1.html');text('.link-preview > span',index===3?'没有href：不执行链接导航':'目标：chapter1.html'); break; }
      case 'y2026q18': text('[data-sim-gauge]', ['能理解与修改','权利与授权','替代与供应','维护与演进'][index]); break;
      case 'y2026q9':
        text('[data-read-policy]', index === 1 || index === 2 ? '已启用' : '未配置');
        text('[data-write-policy]', index === 0 || index === 2 ? '已启用' : '未配置');
        text('[data-usb-read]', index === 1 || index === 2 ? '读取被拒绝' : '可读取');
        text('[data-usb-write]', index === 0 || index === 2 ? '写入被拒绝' : '可写入');
        break;
      case 'y2026q39': if(index===0){text('[data-vcpu]','8');text('[data-vram]','16 GB');text('[data-bill]','¥1.28/h');} else if(index===4){text('[data-instance-state]','已释放');text('[data-vcpu]','—');text('[data-vram]','—');text('[data-bill]','¥0.00/h');const resize=$('[data-sim-choice="0"]',card);if(resize)resize.disabled=true;} break;
      case 'y2026q16':
        text('[data-cia-a]',index===0?'受损':'未直接受损'); text('[data-cia-c]',index===1?'受损':'未直接受损'); text('[data-cia-i]',index===2?'受损':'未直接受损'); html('[data-service-screen]',index===0?'<b>服务不可用</b><span>授权用户无法访问</span>':index===1?'<b>发生未授权读取</b><span>机密信息已泄露</span>':'<b>记录被篡改</b><span>数据可信性受损</span>'); break;
      case 'y2026q30': {
        const done = $$('.publish-gate.active',card).length;
        if(index<3){ const gate=$(`.gate-${index} [data-gate-status]`,card); if(gate)gate.textContent='已检查'; text('[data-publication-status]',done===3?'检查完成：可以审慎发布':`发布锁定：还有 ${3-done} 项未完成`); }
        if(index===3){
          const allowed = done === 3;
          text('[data-publication-status]', allowed ? '已通过三道检查：进入人工复核后发布' : `发布被拦截：还有 ${3-done} 项未完成`);
          updateFeedback(card, allowed ? '三项发布前检查均完成；仍应由发布者进行最终人工复核。' : '事实核验、权利检查和AI标识没有全部完成，系统拒绝直接发布。', allowed ? '进入人工复核' : '发布已拦截', allowed ? 'good' : 'bad');
        }
        break;
      }
      case 'y2026q45': text('[data-real-tops]', ['并行任务吞吐可能提高','带宽不足：等待数据','软件适配不足：单元空闲','不同数值精度不能直接混比'][index]); break;
      case 'y2023q45': {
        const states = [
          ['.pptx','进入编辑界面','编辑模式'],
          ['.ppsx','直接开始放映','放映模式'],
          ['.potx','以此创建新演示文稿','模板模式'],
          ['.ppsm','放映；宏执行仍受安全设置控制','可含宏的放映']
        ][index] || ['.pptx','进入编辑界面','编辑模式'];
        text('[data-ppt-ext]', states[0]); text('[data-ppt-action]', states[1]); text('[data-launch-mode]', states[2]);
        break;
      }
      case 'y2024q41':
        text('[data-op-readout]', ['ADD → 算术加法','R1 → 寄存器操作数','2048 → 存储器地址','字段职责混淆：无法正确译码'][index]);
        break;
      case 'y2024q49':
        text('[data-server-load]', ['200,000 req/s · 过载','异常流量已告警','恶意流量被清洗','等待日志证据'][index]);
        break;
      default: break;
    }
  }

  function applyStepEffect(card, id, stepIndex, complete) {
    const text = (selector, value) => { const node = $(selector, card); if (node) node.textContent = value; };
    switch (id) {
      case 'y2020q60': if(complete) $('[data-border-table]',card)?.classList.add('all-borders-applied'); break;
      case 'y2020q62': if(complete) $('[data-repeated-header]',card)?.classList.add('visible'); break;
      case 'y2026q15': if(stepIndex===0)text('[data-device-count]','0 · 热点已开'); if(stepIndex===1)text('[data-device-count]','1'); break;
      case 'merged-19': if(complete)$('[data-alert-screen]',card)?.classList.add('alerting'); break;
      default: break;
    }
    if (complete) card.classList.add('simulation-complete');
  }

  function refreshSequenceAvailability(card, demo) {
    if (demo?.kind !== 'sequence') return;
    const progress = Number(card.dataset.progress);
    $$('[data-v25-stage]',card).forEach(stage => { stage.hidden = Number(stage.dataset.v25Stage) !== progress; });
    $$('[data-sim-step],[data-sim-double-step],[data-sequence-input]', card).forEach(node => {
      const index = Number(node.dataset.simStep ?? node.dataset.simDoubleStep ?? node.dataset.sequenceInput);
      node.classList.toggle('is-current-step', index === progress);
      node.classList.toggle('is-past-step', index < progress);
      node.classList.toggle('is-future-step', index > progress);
      if (node.matches('[data-sequence-input]')) node.disabled = index !== progress;
      if (index === progress) node.setAttribute('aria-current','step'); else node.removeAttribute('aria-current');
    });
  }

  function initialiseSpecialScene(card) { window.NOTE_LABS?.mount(card); }

  function revealNote(hash, focus=false){
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
    const target=document.getElementById(id);if(!target)return;
    if(target.closest('.hidden')||target.classList.contains('hidden')){chapterSearch.clear(false);}
    chapterSearch.claim(target);
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.matches('details'))parent.open=true;
    $$('.note-search-target').forEach(el=>el.classList.remove('note-search-target'));
    if(target.closest('.note-item')&&!target.matches('.note-item'))target.classList.add('note-search-target');
    if(target.matches('details'))target.open=true;
    target.scrollIntoView({block:'start'});
    if(focus){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  }
  addEventListener('hashchange',()=>revealNote(location.hash,true));
  const markOverflowTables = () => {
    $$('.note-comparison').forEach(el => {
      const prev = el.previousElementSibling;
      const overflowing = el.scrollWidth > el.clientWidth + 1;
      if (overflowing && !prev?.classList.contains('table-hint')) {
        const hint = document.createElement('p');
        hint.className = 'table-hint';
        hint.textContent = '表格可左右滑动。';
        el.before(hint);
      } else if (!overflowing && prev?.classList.contains('table-hint')) prev.remove();
    });
  };
  const updateProgress = () => { const root = document.documentElement; const max = root.scrollHeight - innerHeight; $('#progress-bar').style.width = `${max > 0 ? scrollY / max * 100 : 0}%`; markOverflowTables(); };
  addEventListener('scroll', updateProgress, {passive:true});
  addEventListener('resize', updateProgress);
  try { localStorage.removeItem('notes-reading-mode'); } catch {}
  const chapterSearch=window.NOTE_CHAPTER_SEARCH.init({notes,simulation,homeUrl,onLayout:updateProgress,onHide:cancelLegacyGesture});
  window.NOTE_DIRECTORY.init({chapter,chapters:data.chapters,notes,chapterUrl,revealNote});
  if(location.hash)revealNote(location.hash);
  updateProgress();
})();
