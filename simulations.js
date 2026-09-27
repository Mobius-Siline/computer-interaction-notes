(function () {
  'use strict';

  const demos = window.NOTE_DEMOS || {};
  const escapeHTML = value => String(value ?? '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const getItems = demo => demo?.kind === 'choose' ? demo.options : demo?.actions || [];
  const choice = (demo, index, className = '') => {
    const item = getItems(demo)[index];
    return item ? `<button type="button" class="sim-hit ${className}" data-sim-choice="${index}"><span>${escapeHTML(item.label)}</span></button>` : '';
  };
  const choices = (demo, className = '') => getItems(demo).map((_, index) => choice(demo, index, className)).join('');
  const step = (demo, index, label, className = '') => `<button type="button" class="sim-hit ${className}" data-sim-step="${index}"><span>${escapeHTML(label || demo.steps[index].label)}</span></button>`;
  const toolbar = (app, active, commands = '', tabStep = null) => {
    const tabs = app === 'Excel' ? ['开始','插入','页面布局','公式','数据','审阅','视图'] : app === 'PowerPoint' ? ['开始','插入','设计','切换','动画','幻灯片放映','审阅','视图'] : ['开始','插入','设计','布局','引用','邮件','审阅','视图'];
    if (active && !tabs.includes(active)) tabs.push(active);
    return `<div class="office-ribbon" aria-label="${app} 2016 功能区" ${tabStep === null ? '' : `data-tab-step="${tabStep}"`}>
    <div class="office-tabs"><span>文件</span>${tabs.map(tab => tab === active && tabStep !== null ? `<button type="button" class="office-tab active" data-sim-step="${tabStep}">${tab}</button>` : `<span class="${tab === active ? 'active' : ''}">${tab}</span>`).join('')}</div>
    <div class="office-commands">${commands}</div>
  </div>`;
  };
  const office = (app, title, activeTab, commands, canvas, side = '', tabStep = null) => `<div class="office-window app-${app.toLowerCase()}">
    <div class="office-titlebar"><i></i><strong>${escapeHTML(title)} - ${app} 2016</strong><span>—　□　×</span></div>
    ${toolbar(app, activeTab, commands, tabStep)}
    <div class="office-workspace">${canvas}${side}</div>
    <div class="office-status"><span>第 1 页</span><span>${app === 'Excel' ? '就绪' : '中文（中国）'}　　▁▂▃　100%</span></div>
  </div>`;
  const win = (title, body, taskbar = true) => `<div class="win10-screen">
    <div class="win-window"><div class="win-title"><span class="win-app-dot"></span><strong>${escapeHTML(title)}</strong><span>—　□　×</span></div>${body}</div>
    ${taskbar ? '<div class="win-taskbar"><b>⊞</b><span class="win-search">在这里输入你要搜索的内容</span><i></i><i></i><i></i><small>10:28<br>2026/9/2</small></div>' : ''}
  </div>`;
  const feedback = text => `<div class="sim-feedback" data-sim-feedback aria-live="polite"><span>观察区</span><p>${escapeHTML(text)}</p></div>`;
  const coach = (label, text, controls = '') => `<aside class="practice-dock" aria-label="练习引导">
    <div class="practice-copy"><span>${escapeHTML(label)}</span><p>${escapeHTML(text)}</p></div>
    ${controls ? `<div class="practice-controls">${controls}</div>` : ''}
  </aside>`;
  const genericInitial = demo => demo?.initial || (demo?.kind === 'sequence' ? '从界面中找到第一步并开始操作。' : '直接操作画面中的对象，观察它怎样变化。');

  // Each legacy scene has one definition. Stateful models register separately.
  const scenes = {
    "y2025q23": function (demo) {
      return `<div class="v25-info-lab"><div class="raw-data"><small>原始符号</small><b>80</b></div><div class="context-slots">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><span>${escapeHTML(item.label)}</span><i>${['?','kg','分'][i]||'?'}</i></button>`).join('')}</div><div class="meaning-screen"><small>解释结果</small><b>数据 + 语境 → 信息</b></div></div>${feedback('数据负责承载，语境和解释让它产生信息。')}`;
    },
    "y2026q18": function (demo) {
      return `<div class="sovereignty-map">
        <div class="sovereignty-core"><b>长期自主运行</b><span data-sim-gauge>四项能力</span></div>
        <div class="dependency-ring">${getItems(demo).map((item, i) => `<button type="button" data-sim-choice="${i}" class="dependency-node node-${i}"><i>${['⌘','§','◇','↻'][i]}</i><b>${escapeHTML(item.label)}</b><small>${['能否修改','能否合法用','能否替代','能否维护'][i]}</small></button>`).join('')}</div>
        <p class="diagram-caption">点开依赖环节，查看它支撑的具体能力。</p>
      </div>${feedback('“国产”只是来源标签；自主可控是一条不能断裂的能力链。')}`;
    },
    "y2025q21": function (demo) {
      return `<div class="v25-eniac"><div class="eniac-wall">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join('')}<b>ENIAC · 1946</b></div><div class="eniac-console">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['◎','10','⎇','RAM'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="eniac-cable">插线与开关编程</div></div>${feedback('观察电子管、十进制计数和插线编程：不要把后来的存储程序结构倒套给ENIAC。')}`;
    },
    "y2026q1": function (demo) {
      return `<div class="evolution-lab">
        <div class="evolution-axis"><span>性能 ↑</span><i></i><small>体积 →</small>
          <button data-sim-choice="1" class="device-dot super"><b>超算</b><em>极强 · 极大</em></button>
          <button data-sim-choice="1" class="device-dot phone"><b>手机</b><em>强 · 很小</em></button>
          <button data-sim-choice="1" class="device-dot embed"><b>嵌入式</b><em>专用 · 微型</em></button>
          <button data-sim-choice="0" class="false-rule">体积越大<br>速度越快？</button>
        </div>
        <div class="trend-chips">${choice(demo, 2, 'trend-chip')}</div>
      </div>${feedback('看散点位置：性能和体积不是一条必然同向的直线。')}`;
    },
    "y2020q23": function (demo) {
      return `<div class="language-terminal">
        <div class="code-panes"><div class="code-pane human"><span>高级语言</span><code>total = a + b</code></div><div class="compiler-tunnel"><i>编译 / 汇编</i><b>→</b></div><div class="code-pane cpu"><span>CPU</span><code>1011 0010</code></div></div>
        <div class="language-elevator">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><b>${escapeHTML(item.label)}</b><small>${['直接执行','助记符层','接近人类'][i]}</small></button>`).join('')}</div>
      </div>${feedback('点一种语言，观察它到CPU之间还需要哪一层翻译。')}`;
    },
    "merged-2": function (demo) {
      return `<div class="software-desktop">
        <div class="software-icons">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="app-tile app-${i}"><i>${['⊞','▧','W','{ }'][i]}</i><b>${escapeHTML(item.label)}</b></button>`).join('')}</div>
        <div class="software-drawers"><div><span>系统软件</span><p>管理资源 · 提供环境</p></div><div><span>应用软件</span><p>完成用户具体任务</p></div></div>
      </div>${feedback('不是看“系统自带”还是“后来安装”，而是看软件的主要功能。')}`;
    },
    "y2024q41": function (demo) {
      return `<div class="v24-instruction"><div class="instruction-tape"><button data-sim-choice="0" class="opcode">ADD</button><button data-sim-choice="1">R1</button><button data-sim-choice="2">[2048]</button></div><div class="instruction-decoder"><small>控制器 · 指令译码</small><div class="decoder-lights"><i></i><i></i><i></i><i></i></div><b data-op-readout>做什么？　用谁？　在哪里？</b></div><button data-sim-choice="3" class="wrong-field">把地址当操作码</button><div class="instruction-route"><span>操作码</span><span>寄存器</span><span>存储地址</span></div></div>${feedback('点击指令字段：操作码回答“做什么”，其余字段回答“对谁或在哪里做”。')}`;
    },
    "y2026q31": function (demo) {
      return `<div class="compute-arena" data-drag-lab>
        <div class="processor cpu-board" data-drop-target="cpu"><header><b>CPU</b><span>4 个复杂核心</span></header><div>${Array.from({length:4},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><small>分支 · 调度 · 通用控制</small><em>放到这里</em></div>
        <div class="workload-queue">${getItems(demo).map((item,i)=>`<button type="button" data-drag-kind="workload" data-choice="${i}" data-correct-target="${i===1?'gpu':'cpu'}" aria-label="拖动${['复杂分支与系统调度','大规模矩阵并行','整个操作系统'][i]}"><span>${['系统调度','矩阵运算','操作系统'][i]}</span><i>按住并拖动</i></button>`).join('')}</div>
        <div class="processor gpu-board" data-drop-target="gpu"><header><b>GPU</b><span>大量并行单元</span></header><div>${Array.from({length:48},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><small>同类任务 · 大规模并行</small><em>放到这里</em></div>
      </div>${feedback('选择工作负载，合适的一侧会点亮；CPU和GPU是协作关系。')}`;
    },
    "y2020q1": function (demo) {
      const parts = [['内存条','▥▥▥▥▥'],['CPU','▣'],['网卡','▤○'],['主板','▦']];
      return `<div class="pc-workbench"><div class="anti-static-mat">${parts.map((p,i)=>`<button type="button" data-sim-choice="${i}" class="pc-part part-${i}"><i>${p[1]}</i><b>${p[0]}</b><small>${['长条PCB · 金手指','方形封装','RJ45接口','大型电路板'][i]}</small></button>`).join('')}</div><div class="bench-label">装机识别台 · 点击零件查看辨识证据</div></div>${feedback('内存条最稳定的外形线索是长条电路板和底边成排金手指。')}`;
    },
    "y2020q22": function (demo) {
      return `<div class="io-station"><div class="computer-core"><span>计算机</span><b>数据</b></div>${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="io-device io-${i}"><i>${['✎','◉','▰','▱'][i]}</i><b>${escapeHTML(item.label)}</b><span data-direction>${['→','→','←','↔'][i]}</span></button>`).join('')}<div class="io-legend"><span>→ 信息进入计算机</span><span>← 信息离开计算机</span></div></div>${feedback('沿着数据流箭头判断主要功能；硬盘是存储设备，同时具有双向读写。')}`;
    },
    "y2025q1": function (demo) {
      return `<div class="v25-clock"><div class="clock-dial"><i></i><b>3.20</b><span>GHz</span><small>CPU CLOCK</small></div><div class="clock-specs">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><span>${escapeHTML(item.label)}</span></button>`).join('')}</div></div>${feedback('GHz是每秒周期数；它不是容量单位，也不能独自代表整机速度。')}`;
    },
    "y2025q31": function (demo) {
      return `<div class="v25-storage-race"><div class="drive hdd"><div class="platter"><i></i></div><b>HDD</b><span>机械寻道</span></div><div class="race-tasks">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="drive ssd"><div class="nand">${Array.from({length:8},()=>'<i></i>').join('')}</div><b>SSD</b><span>电子访问</span></div></div>${feedback('同一任务下，SSD省去了磁头寻道与盘片旋转等待。')}`;
    },
    "y2026q7": function (demo) {
      return `<div class="v26-os-features"><div class="os-feature-screen"><div class="feature-timeline"><b>CPU 调度现场</b><div><i>A</i><i>B</i><i>A</i><i>B</i><i>A</i></div><small>完成顺序会随事件与调度变化</small></div><div class="feature-memory"><span>进程 A</span><span>进程 B</span><b>各自看到独立地址空间</b></div><div class="feature-printer"><b>共享打印机</b><span>A 文档</span><span>B 文档</span></div></div><div class="v26-choice-grid">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><i>${['并发','共享','虚拟','异步'][i]}</i><b>${escapeHTML(item.label)}</b><small>${escapeHTML(item.stage)}</small></button>`).join('')}</div></div>${feedback('先问现象关注“同时推进、共同使用、逻辑映射”还是“完成先后不可预知”。')}`;
    },
    "y2024q6": function (demo) {
      return `<div class="v24-os-console"><header><b>操作系统调度中心</b><span>先看任务最不能违背的约束</span></header><div class="os-missions"><button data-sim-choice="0" class="mission realtime"><i>12ms</i><b>汽车制动</b><small>超过截止时间即失败</small></button><button data-sim-choice="1" class="mission distributed"><i>32台</i><b>计算集群</b><small>统一协调多机资源</small></button><button data-sim-choice="2" class="mission general"><i>18个</i><b>桌面应用</b><small>兼容、交互与多任务</small></button></div><button data-sim-choice="3" class="security-scope"><b>安全只负责挡住陌生用户？</b><span>认证　授权　隔离　审计　完整性</span></button></div>${feedback('“实时”不是平均速度快，而是必须在规定时限内给出可预测响应。')}`;
    },
    "y2025q6": function (demo) {
      return `<div class="v25-usability"><div class="task-path"><b>找到网络设置</b><span>开始</span><i>→</i><span>设置</span><i>→</i><span>网络</span></div><div class="ux-controls">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['▦','?','文','≡≡≡'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="ux-meter"><span>操作负担</span><i></i></div></div>${feedback('易用性体现在容易找、容易学、容易纠错；无意义的复杂层级只会增加负担。')}`;
    },
    "y2025q7": function (demo) {
      return `<div class="v25-batch"><div class="batch-reader"><b>批处理队列</b>${['工资结算','成绩统计','夜间备份'].map((x,i)=>`<span><i>${i+1}</i>${x}</span>`).join('')}</div><div class="batch-cpu"><strong>AUTO RUN</strong><i></i><small>提交后连续处理</small></div><div class="batch-actions">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('批处理擅长吞吐，不擅长让用户在执行过程中随时对话和干预。')}`;
    },
    "y2026q32": function (demo) {
      return `<div class="power-comparison">
        <div class="power-scene"><div class="desktop-wallpaper"><div class="start-menu"><header>Drd</header><div class="start-apps"><i>文档</i><i>设置</i><i>图片</i></div><footer><b>⏻</b><button type="button" data-sim-choice="0">关机</button></footer></div><div class="shutdown-overlay" data-shutdown-state><b>Windows</b><span>正在关闭应用并写回数据…</span></div></div></div>
        <aside class="device-chassis"><span>实体电源键</span><button type="button" class="physical-power" data-long-press-choice="1" data-short-press-choice="2" aria-label="短按或长按实体电源键"><i></i><b>⏻</b></button><strong data-press-label>轻触＝短按 · 持续按住＝强制断电</strong></aside>
      </div><details class="lab-assist"><summary>键盘辅助：比较短按与持续长按</summary><p>以下按钮直接模拟相应按键时长的结果；真实电源键仍需区分短按和持续长按。</p>${choice(demo,2)}${choice(demo,1)}</details>${feedback('规范关机会先通知程序、写回缓存并卸载文件系统；强制断电跳过这些步骤。')}`;
    },

    "y2026q9": function (demo) {
      return win('本地组策略编辑器', `<div class="policy-editor"><aside><b>计算机配置</b><span>管理模板</span><span>系统</span><strong>可移动存储访问</strong></aside><main><header>策略设置</header><div class="policy-row"><b>可移动磁盘：拒绝读取权限</b><span data-read-policy>未配置</span></div><div class="policy-row"><b>可移动磁盘：拒绝写入权限</b><span data-write-policy>未配置</span></div><div class="policy-actions">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="usb-test"><i>USB</i><span data-usb-read>可读取</span><span data-usb-write>可写入</span></div></main></div>`)+feedback('读权限和写权限是两条独立策略，可以形成三种不同限制组合。');
    },
    "y2024q33": function (demo) {
      const names=['程序主体','用户病例标注','偏好与缓存','共享运行库'];
      return `<div class="v24-uninstall"><div class="uninstall-app"><i>IM</i><b>影像标注工具</b><span>卸载程序正在评估内容…</span></div><div class="uninstall-tree">${names.map((name,i)=>`<button data-sim-choice="${i}" class="uninstall-item item-${i}"><i>${['EXE','DATA','CFG','DLL'][i]}</i><b>${name}</b><small>${['随程序移除','属于用户','可能保留','检查依赖'][i]}</small></button>`).join('')}</div><div class="uninstall-ledger"><span>卸载 ≠ 抹除全部文件</span><b>先分清所有权与依赖</b></div></div>${feedback('卸载器优先移除程序本体；用户数据和共享组件有充分理由被保留。')}`;
    },
    "y2025q34": function (demo) {
      return win('截图和草图', `<div class="v25-snipping"><div class="snip-canvas"><b>课程资料</b><span class="watermark">示例水印</span><i class="crop-corner"></i></div><div class="snip-tools">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['▱','⌗','✎','AI'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div></div>`)+feedback('截图工具截取、裁剪和标注可见画面，不会自动重建水印覆盖的内容。');
    },

    "y2024q66": function (demo) {
      const controls=getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><b>${escapeHTML(item.label)}</b><small>${escapeHTML(item.stage)}</small></button>`).join('');
      return office('Word','图文报告.docx','开始','<span>段落</span>',`<div class="word-page v24-lineheight-page"><p>图1展示采样结果：</p><div class="inline-image-line"><span class="baseline">文字基线</span><div class="inline-photo"><i></i><b>肺部影像</b></div></div><p>图片是嵌入型对象，与这一行文字共用行框。</p></div>`,`<aside class="v24-line-panel"><header>段落 · 行距</header>${controls}</aside>`)+feedback('固定值把行框高度锁死；“最小值”允许内容更高时自动把行撑开。');
    },
    "y2020q60": function (demo) {
      const commands = `<div class="table-tools">${step(demo,2,'边框 ▼','ribbon-command')}${step(demo,3,'所有框线','ribbon-command all-borders')}</div>`;
      return office('Word','成绩表.docx','设计',commands,`<div class="word-page table-border-page"><button type="button" data-sim-step="0" class="table-select-handle" aria-label="选中整张表">✥</button><table data-border-table><thead><tr><th>姓名</th><th>计算机</th><th>高数</th></tr></thead><tbody><tr><td>王宁</td><td>92</td><td>88</td></tr><tr><td>李悦</td><td>86</td><td>94</td></tr></tbody></table></div>`,'',1)+feedback('光标位于表格内即可显示表格工具。本例先选中整表，再从设计选项卡的边框菜单应用“所有框线”，使命令作用于整表。');
    },
    "y2020q62": function (demo) {
      const commands = `<div class="table-tools">${step(demo,2,'重复标题行','ribbon-command repeat-header')}</div>`;
      const rows = Array.from({length:8},(_,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td>学生 ${i+1}</td><td>${80+i}</td></tr>`);
      return office('Word','长成绩表.docx','布局',commands,`<div class="two-paper-table"><article><table><thead data-sim-step="0" tabindex="0" role="button" aria-label="选中表格首行标题"><tr><th>序号</th><th>姓名</th><th>成绩</th></tr></thead><tbody>${rows.slice(0,4).join('')}</tbody></table></article><article><table><thead data-repeated-header><tr><th>序号</th><th>姓名</th><th>成绩</th></tr></thead><tbody>${rows.slice(4).join('')}</tbody></table></article></div>`,'',1)+coach('当前动作','直接点第一页表格的首行进行选择；选中后会出现真正的表格工具“布局”选项卡。')+feedback('重复标题只在表格自然跨页时显示；手工复制一行不是同一功能。');
    },
    "y2024q55": function (demo) {
      return `<div class="v25-stage-shell v24-word-stages"><section data-v25-stage="0">${office('Word','实验报告.docx','页眉和页脚工具/设计','<span>页眉编辑</span>','<div class="word-page v24-pagefield"><div class="page-header"><button data-sim-step="0" class="page-shape selected">页码框</button></div><h4>实验报告</h4></div>')}</section><section data-v25-stage="1">${office('Word','实验报告.docx','页眉和页脚工具/设计','<span>形状文字编辑</span>','<div class="word-page v24-pagefield"><div class="page-header"><button data-sim-step="1" class="page-shape editing">在内部放置光标<i></i></button></div><h4>实验报告</h4></div>')}</section><section data-v25-stage="2">${office('Word','实验报告.docx','页眉和页脚工具/设计','<div class="page-number-menu"><button data-sim-step="2">页码 → 当前位置</button><span>页面顶端</span><span>页面底端</span></div>','<div class="word-page v24-pagefield"><div class="page-header"><div class="page-shape editing"><i></i></div></div></div>')}</section><section data-v25-stage="3">${office('Word','实验报告.docx','页眉和页脚工具/设计','<div class="page-number-menu"><button data-sim-step="3">普通数字</button><span>强调线条</span></div>','<div class="word-page v24-pagefield"><div class="page-header"><div class="page-shape editing">1</div></div></div>')}</section><section data-v25-stage="4">${office('Word','实验报告.docx','页眉和页脚工具/设计','<button data-sim-step="4" class="ribbon-command">关闭页眉和页脚</button>','<div class="word-page v24-pagefield"><div class="page-header"><div class="page-shape">1</div></div><h4>实验报告</h4></div>')}</section><section data-v25-stage="5"><div class="v24-page-spread"><article><div>1</div><b>第一页</b></article><article><div>2</div><b>第二页</b></article><article><div>3</div><b>第三页</b></article></div></section></div>${feedback('必须先让光标进入形状文字区；“当前位置”才会把PAGE域插入现有形状。')}`;
    },
    "y2020q10": function (demo) {
      const commands = getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="ribbon-command"><i>${['▦','▣','▶'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('');
      return office('PowerPoint','医学AI汇报.pptx','视图',commands,`<div class="ppt-view-stage"><aside class="ppt-thumbnails">${Array.from({length:6},(_,i)=>`<button type="button" data-slide-nav="${i+1}"><span>${i+1}</span><i style="--slide:${i}"></i></button>`).join('')}</aside><div class="ppt-main-slide" data-ppt-view><small data-slide-number>01</small><h4 data-slide-heading>人工智能辅助医学影像</h4><div class="ppt-hero-chart"><i></i><i></i><i></i></div><p data-slide-subtitle>课程汇报</p></div><div class="slide-sorter" data-slide-sorter>${Array.from({length:6},(_,i)=>`<button type="button" data-drag-kind="slide" data-slide-num="${i+1}" aria-label="拖动第${i+1}张幻灯片重排"><i style="--slide:${i}"></i><span>第${i+1}页</span></button>`).join('')}</div></div>`)+coach('页面与排序','普通视图可直接点左侧缩略图换页；切到浏览视图后，按住任一缩略图拖到另一页上即可重排。')+feedback('幻灯片浏览视图把全部页面平铺，最适合整体重排；普通视图适合编辑单页。');
    },
    "y2023q45": function (demo) {
      return `<div class="v26-ppt-files"><div class="file-launcher"><div class="ppt-file"><i>P</i><b data-ppt-ext>.pptx</b><small data-ppt-action>进入编辑界面</small></div><div class="launch-window"><span>PowerPoint 2016</span><b data-launch-mode>编辑模式</b></div></div><div class="v26-choice-grid">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><b>${escapeHTML(item.label)}</b><small>${escapeHTML(item.stage)}</small></button>`).join('')}</div></div>${feedback('.ppsx改变默认打开行为，不会把内容变成不可编辑，也不提供加密保护。')}`;
    },
    "y2020q15": function (demo) {
      return `<div class="network-zoom-map"><div class="map-ring wan"><span>WAN · 世界</span><div class="map-ring man"><span>MAN · 城市</span><div class="map-ring lan"><span>LAN · 校园/楼宇</span><div class="map-building">教学楼</div></div></div></div><div class="map-controls">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="map-zoom zoom-${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('点覆盖范围，镜头会落到LAN、MAN或WAN对应的尺度。')}`;
    },
    "merged-13": function (demo) {
      const layers=[['应用层','HTTP · DNS','应用/表示/会话'],['传输层','TCP · UDP','传输层'],['网际层','IP','网络层'],['网络接口层','Ethernet · Wi-Fi','数据链路/物理']];
      return `<div class="protocol-stack"><div class="tcp-stack">${layers.map((x,i)=>`<button type="button" data-sim-choice="${i}" class="protocol-layer layer-${i}"><b>${x[0]}</b><span>${x[1]}</span></button>`).join('')}</div><div class="encapsulation-arrow"><span>封装 ↓</span><i data-protocol-packet>DATA</i><span>↑ 解封装</span></div><div class="osi-stack">${layers.map((x,i)=>`<div class="osi-layer layer-${i}"><b>${x[2]}</b><span>OSI对应</span></div>`).join('')}</div></div>${feedback('点击TCP/IP的一层，右侧会点亮它近似对应的OSI层。')}`;
    },
    "y2025q13": function (demo) {
      return `<div class="v25-network-route"><div class="campus-lan"><b>校园网</b><i>PC</i><i>服务器</i><i>Wi‑Fi</i></div><div class="network-devices">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['SW','R','BR','AMP'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="internet-cloud"><b>Internet</b><code>203.0.113.8</code></div></div>${feedback('跨IP网络要读取路由表选择下一跳；交换和信号放大解决的是别的问题。')}`;
    },
    "y2024q16": function (demo) {
      return `<div class="v24-mail-route"><div class="mail-client"><b>浏览器</b><span>写信给 user@qq.com</span></div><button data-sim-choice="0" class="mail-link web"><i>HTTPS</i><span>网页界面</span></button><div class="mail-server from"><b>163 邮件服务器</b><small>smtp.163.com</small></div><button data-sim-choice="1" class="mail-link smtp"><i>SMTP</i><span>服务器投递</span></button><div class="mail-server to"><b>QQ 邮件服务器</b><small>mx.qq.com</small></div><button data-sim-choice="2" class="mail-link imap"><i>IMAP</i><span>同步收件箱</span></button><div class="mail-phone"><b>手机</b></div><button data-sim-choice="3" class="pop-trap">POP3用来发送？</button></div>${feedback('服务器之间搬运邮件的是SMTP；HTTPS只是网页邮箱界面的通信外壳。')}`;
    },
    "y2024q48": function (demo) {
      const nodes=[['OLT','运营商机房'],['SPLITTER','无源分光器'],['ONU','家庭光猫'],['Wi‑Fi','家庭终端']];
      return `<div class="v24-ftth"><svg viewBox="0 0 760 120" preserveAspectRatio="none"><path d="M40 60H720"/><circle cx="40" cy="60" r="8"/><circle cx="267" cy="60" r="8"/><circle cx="493" cy="60" r="8"/><circle cx="720" cy="60" r="8"/></svg><div class="fiber-nodes">${nodes.map((n,i)=>`<button data-sim-step="${i}" class="fiber-node n${i}"><i>${n[0]}</i><b>${n[1]}</b></button>`).join('')}</div><div class="fiber-label"><b>FTTH</b><span>Fiber To The Home · 光纤到户</span></div></div>${feedback('光猫完成光信号终接；路由器再把连接分发给家庭有线与无线终端。')}`;
    },
    "y2026q15": function (demo) {
      return `<div class="hotspot-scene"><div class="laptop-device"><div class="laptop-screen"><b>可用网络</b>${step(demo,1,'连接 DRD-Hotspot','wifi-network')}</div><i></i></div><div class="wifi-waves"><i></i><i></i><i></i><span data-hotspot-packet></span></div><div class="phone-device"><div class="phone-screen"><b>个人热点</b>${step(demo,0,'开启热点','phone-switch')}<span>已连接设备：<i data-device-count>0</i></span>${step(demo,2,'转发流量 / NAT','phone-route')}</div></div><div class="cell-tower">${step(demo,3,'连接移动网络','tower-button')}<i></i><i></i></div></div>${feedback('先开启接入点，再建立Wi‑Fi连接，手机随后转发流量到移动网络。')}`;
    },
    "y2020q16": function (demo) {
      return `<div class="web-ide"><aside class="file-tree"><b>网站项目</b>${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="file-type file-${i}"><i>${['HTML','CSS','JS','DOC'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</aside><main><div class="editor-tabs"><span>index.html　×</span></div><pre><code>&lt;h1&gt;计算机笔记&lt;/h1&gt;\n&lt;p&gt;网页由结构、样式和脚本组成。&lt;/p&gt;</code></pre><div class="live-preview"><h4>计算机笔记</h4><p>网页由结构、样式和脚本组成。</p></div></main></div>${feedback('HTML、CSS和JavaScript是网页资源；docx即使能被浏览器下载，也不是网页源文件。')}`;
    },
    "y2020q36": function (demo) {
      return `<div class="anchor-builder"><div class="html-code-line"><span>&lt;</span>${choice(demo,0,'code-token tag-token')} <span data-anchor-attribute>${choice(demo,1,'code-token attr-token')}<span>=&quot;chapter1.html&quot;</span></span><span>&gt;</span>${choice(demo,2,'code-token text-token')}<span>&lt;/a&gt;</span></div><div class="anchor-wire"><i></i></div><div class="link-preview"><b>浏览器预览</b><a href="chapter1.html" data-preview-link>第一章</a><span>目标：chapter1.html</span></div>${choice(demo,3,'remove-href')}</div>${feedback('a是元素，href决定目标，标签之间的文字才是用户真正看到并点击的内容。')}`;
    },
    "y2024q17": function (demo) {
      const stages=[['临床问题','糖尿病患者远程随访是否改善依从性？'],['概念拆分','糖尿病　远程随访　依从性'],['资源选择','医学文献数据库'],['检索式','diabetes AND (telemedicine OR remote follow-up)'],['结果评价','128篇 → 筛出18篇高相关研究'],['迭代完成','补充时间范围与研究类型']];
      return `<div class="v25-stage-shell v24-retrieval-stages">${stages.map((s,i)=>`<section data-v25-stage="${i}"><div class="v24-retrieval-card"><small>步骤 ${Math.min(i+1,5)} / 5</small><b>${s[0]}</b><p>${s[1]}</p>${i<5?`<button data-sim-step="${i}">${escapeHTML(demo.steps[i].label)}</button>`:'<i>检索策略已形成闭环</i>'}</div></section>`).join('')}</div>${feedback('高质量检索会根据结果反复调整，不是只输入一次关键词。')}`;
    },
    "y2024q28": function (demo) {
      return `<div class="v24-search-desk"><div class="search-request"><b>今天要找什么？</b><span>工具随信息对象改变</span></div><div class="search-tools">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}" class="tool-${i}"><i>${['书','文','专','×'][i]}</i><b>${escapeHTML(item.label)}</b><small>${['馆藏目录','学术数据库','专利数据库','错误边界'][i]}</small></button>`).join('')}</div><div class="search-scope"><span>文献线索</span><span>事实数据</span><span>全文</span><span>图像</span></div></div>${feedback('信息检索的本质是从信息集合中找到所需内容，电脑只是常用工具之一。')}`;
    },
    "y2025q37": function (demo) {
      return `<div class="v25-literature"><aside><input value="人工智能 医学影像" readonly><span>检索结果 128 条</span></aside><article><h4>深度学习辅助肺结节识别研究</h4><p>作者：王宁　期刊：医学信息学</p><div class="record-tabs">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="pdf-access">PDF全文 <b>机构权限</b></div></article></div>${feedback('全文数据库能检索多层信息；是否可获取全文还取决于收录和授权。')}`;
    },
    "y2025q38": function (demo) {
      return `<div class="v25-patent"><div class="patent-card"><small>CN 2025 1 0123456</small><b>一种医学影像分析装置</b><span>申请中</span></div><div class="patent-tasks">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['#','⌕','§','!'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="legal-timeline"><span>申请</span><i></i><span>公开</span><i></i><span>审查</span><i></i><span>授权/失效</span></div></div>${feedback('技术相关性与权利是否有效是两条线；专利检索必须看法律状态。')}`;
    },
    "y2020q27": function (demo) {
      return `<div class="media-stage"><div class="creative-canvas"><div class="media-layer text-layer">文字</div><div class="media-layer image-layer">图像</div><div class="media-layer sound-layer">♪ 声音</div><div class="media-layer video-layer">▶ 视频</div></div><div class="media-shelf">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="shelf-item item-${i}"><i>${['Aa ◉ ♪','▶ ◫','SSD USB'][i]}</i><b>${escapeHTML(item.label)}</b></button>`).join('')}</div><div class="carrier-slot"><span>硬盘 / U盘只负责保存文件</span></div></div>${feedback('能表达信息的是媒体元素；硬盘、U盘属于保存这些文件的物理载体。')}`;
    },
    "y2026q4": function (demo) {
      return `<div class="multimedia-console"><div class="conference-screen"><div class="video-person"><i></i><b>实时视频</b></div><div class="shared-slide"><b>CT影像讲解</b><div class="scan-lines"></div></div><div class="live-captions">正在识别语音并生成字幕…</div></div><div class="conference-controls">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="feature-control feature-${i}"><i>${['▦','☝','●','□'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="latency-chip">LIVE · 38 ms</div></div>${feedback('多种媒体被集成；用户能改变内容；采集、处理和反馈必须及时。')}`;
    },
    "y2020q17": function (demo) {
      return `<div class="color-workbench"><div class="color-output screen-output"><div class="rgb-lights"><i class="red"></i><i class="green"></i><i class="blue"></i></div><b>显示器 · 自发光</b></div><div class="color-mode-switch">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="color-output print-output"><div class="cmyk-dots"><i class="cyan"></i><i class="magenta"></i><i class="yellow"></i><i class="black"></i></div><b>印刷纸张 · 反射光</b></div><div class="gamut-warning" data-gamut-warning>屏幕亮蓝可能超出印刷色域</div></div>${feedback('RGB用光做加色混合；CMYK用油墨吸收光做减色混合，输出介质决定模式。')}`;
    },
    "y2024q43": function (demo) {
      return `<div class="v24-sharpen-lab"><div class="sharpen-image"><div class="scan-anatomy"><i class="lung left"></i><i class="lung right"></i><span class="edge"></span><em class="noise"></em></div><b>边缘</b><small>噪声与光晕</small></div><div class="sharpen-controls">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><i>${['原','适','过','?'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="frequency-bars"><span>低频结构</span><i></i><span>高频边缘/噪声</span><i></i></div></div>${feedback('适度锐化提升边缘对比；过度锐化会把噪声和光晕一起放大。')}`;
    },
    "y2023q39": function (demo) {
      const states=[['校外电脑','未连接','连接VPN网关并认证'],['身份验证','MFA ✓','协商密钥并建立隧道'],['加密隧道','AES-GCM','访问授权的内网资源'],['校园内网','图书馆数据库 ✓','断开VPN'],['连接已断开','临时路由已撤销','']];
      return `<div class="v25-stage-shell v26-vpn-stages">${states.map((s,i)=>`<section data-v25-stage="${i}"><div class="v26-vpn"><div class="remote-device"><b>${s[0]}</b><small>${s[1]}</small></div><div class="vpn-path ${i>1&&i<4?'active':''}"><i></i><span>公共互联网</span></div><div class="intranet"><b>校园内网</b><span>仅授权资源</span></div>${i<4?`<button data-sim-step="${i}">${s[2]}</button>`:'<strong>公网仍是公网 · 受保护逻辑连接已结束</strong>'}</div></section>`).join('')}</div>${feedback('VPN是在公共网络上建立受保护的逻辑通道，不是把互联网物理改造成专线。')}`;
    },
    "y2024q49": function (demo) {
      return `<div class="v24-dos-console"><div class="server-rack"><b>FILE-SRV-01</b><div class="server-load"><i></i><span data-server-load>100 req/s</span></div><small>可用性</small></div><div class="traffic-stream">${Array.from({length:30},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="dos-actions">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}" class="dos-${i}"><b>${['20万 req/s','IDS','清洗','?'][i]}</b><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="availability-meter"><span>服务可用</span><i></i></div></div>${feedback('DoS/DDoS是攻击；IDS负责检测告警，限速和流量清洗负责缓解。')}`;
    },
    "y2025q30": function (demo) {
      return `<div class="v25-defense-map"><div class="protected-core">数据系统</div>${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="defense-${i}"><i>${['脸','🔒','IDS','✍'][i]}</i><b>${escapeHTML(item.label)}</b><small>${['认证','机密性','检测','来源与完整性'][i]}</small></button>`).join('')}</div>${feedback('四种技术分别保护不同安全目标，组合起来才形成纵深防御。')}`;
    },
    "y2026q16": function (demo) {
      return `<div class="cia-hospital"><div class="hospital-server"><header>成绩管理系统</header><div class="service-screen" data-service-screen><b>服务在线</b><span>授权师生可以访问</span></div></div><div class="cia-gauges"><div class="cia-gauge confidential"><b data-cia-c>未见异常</b><span>机密性</span></div><div class="cia-gauge integrity"><b data-cia-i>未见异常</b><span>完整性</span></div><div class="cia-gauge availability"><b data-cia-a>未见异常</b><span>可用性</span></div></div><div class="attack-console">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="attack attack-${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('触发一个事件，观察它最直接击中CIA三属性中的哪一项。')}`;
    },
    "y2020q28": function (demo) {
      return `<div class="v26-malware-lab"><div class="infected-machine"><header>LAB-PC-07</header><div class="system-health"><b>文件完整性</b><i></i><b>系统性能</b><i></i></div><div class="virus-core">VIRUS<small>潜伏 → 触发 → 破坏</small></div></div><div class="defense-stack">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}" class="d${i}"><i>${['!','✉','↻','钥','盾'][i]}</i><b>${escapeHTML(item.label)}</b><small>${escapeHTML(item.stage)}</small></button>`).join('')}</div></div>${feedback('“删除文件、拖慢系统”描述病毒特征；补丁、权限、备份等描述防护层。')}`;
    },
    "y2020q20": function (demo) {
      return `<div class="permission-console"><div class="identity-badge"><i>DRD</i><b>当前身份：普通用户</b><span>授权范围：自己的设备与文件</span></div><div class="permission-grid">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="permission-case case-${i}"><i>${['✓','🔒','⚠','✉'][i]}</i><b>${escapeHTML(item.label)}</b><span data-verdict>检查授权</span></button>`).join('')}</div><div class="permission-scales"><span>是否授权</span><span>行为目的</span><span>对他人影响</span></div></div>${feedback('网络行为先检查授权，再看目的和影响；“没有造成损失”不能补上缺失的授权。')}`;
    },
    "y2026q30": function (demo) {
      return `<div class="ai-publish-studio"><div class="draft-post"><span class="ai-badge">AI 草稿</span><h4>某医院已实现100%治愈率</h4><p>未经核验的夸张医学信息准备公开发布。</p><div class="post-image-placeholder">合成示意图</div><button class="publish-button" data-sim-choice="3">立即发布</button></div><div class="publish-gates">${getItems(demo).slice(0,3).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="publish-gate gate-${i}"><i>${i+1}</i><b>${escapeHTML(item.label)}</b><span data-gate-status>未检查</span></button>`).join('')}</div><div class="publication-status" data-publication-status>发布锁定：还有 3 项未完成</div></div>${feedback('事实、权利和标识是发布前的三道门；“AI生成”不免除传播者责任。')}`;
    },
    "merged-18": function (demo) {
      return `<div class="vr-cockpit"><div class="headset-view"><div class="vr-world" data-vr-world><div class="virtual-room"><i></i><i></i><i></i><span>虚拟训练室</span></div><div class="tracking-reticle">＋</div></div><div class="headset-frame"></div></div><div class="vr-sensors"><span>头部定位 <b data-vr-track>待选</b></span><span>用户交互 <b data-vr-hand>待选</b></span><span>实时反馈 <b data-vr-live>待选</b></span></div><div class="vr-scenes">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('3D画面只是视觉形式；典型VR还要有沉浸、空间跟踪和实时交互。')}`;
    },
    "y2026q39": function (demo) {
      return `<div class="cloud-control-panel"><aside class="cloud-nav"><b>云服务器 ECS</b><span>实例</span><span>镜像</span><span>安全组</span><span>费用中心</span></aside><main><div class="instance-card"><header><i></i><b>study-server-01</b><span data-instance-state>运行中</span></header><div class="resource-dials"><div><b data-vcpu>2</b><span>vCPU</span></div><div><b data-vram>4 GB</b><span>内存</span></div><div><b data-bill>¥0.32/h</b><span>按量费用</span></div></div><div class="cloud-actions">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div><div class="resource-pool">共享资源池 <i></i><i></i><i></i><i></i></div></main></div>${feedback('云计算的关键不是“远程”，而是资源池化、按需弹性、网络交付和可度量。')}`;
    },
    "merged-19": function (demo) {
      return `<div class="iot-ward"><div class="patient-sensor"><b>床旁传感器</b><div class="pulse-wave"><svg viewBox="0 0 200 60"><polyline points="0,35 35,35 45,8 56,52 69,25 81,35 200,35"/></svg></div>${step(demo,0,'采集：心率 132','sensor-step')}</div><div class="iot-link">${step(demo,1,'Wi‑Fi 上传','link-step')}<i data-iot-packet></i></div><div class="edge-gateway">${step(demo,2,'边缘判断：超过阈值','gateway-step')}</div><div class="nurse-phone">${step(demo,3,'护士站收到告警','alert-step')}<div data-alert-screen>监护提醒</div></div></div>${feedback('物联网链条必须走完：感知 → 传输 → 处理 → 应用反馈。')}`;
    },
    "y2025q18": function (demo) {
      return `<div class="v26-bigdata-v"><div class="v-wheel"><span class="v-center">BIG<br>DATA</span><i class="volume">Volume</i><i class="velocity">Velocity</i><i class="variety">Variety</i><i class="value">Value</i><div class="data-stream"><b>TXT</b><b>IMG</b><b>WAV</b><b>LOG</b></div></div><div class="v26-choice-grid">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><b>${escapeHTML(item.label)}</b><small>${escapeHTML(item.stage)}</small></button>`).join('')}</div></div>${feedback('看到“格式种类多”先想到Variety；看到“海量中只有少量有用”再想到低价值密度。')}`;
    },
    "y2025q40": function (demo) {
      return `<div class="v25-causality"><div class="book-node a">买书A</div><div class="book-node b">买书B</div><div class="interest-node">共同兴趣</div><i class="corr-line">相关</i><i class="cause-a">↙</i><i class="cause-b">↘</i><div class="causal-actions">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('A与B共同出现可能来自第三个因素；相关性可预测，但不能单独证明因果。')}`;
    },
    "y2020q30": function (demo) {
      return `<div class="ai-lab"><div class="ai-senses"><div class="camera-feed"><i></i><span>视觉输入</span></div><div class="mic-wave"><i></i><i></i><i></i><span>声音输入</span></div></div><div class="model-core"><b>模型</b><span>识别 · 学习 · 推理 · 决策</span><i data-model-pulse></i></div><div class="ai-apps">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="ai-app app-${i}"><i>${['◉','◎','◇','⏱'][i]}</i><b>${escapeHTML(item.label)}</b></button>`).join('')}</div><div class="rule-timer">固定规则：19:00 → 开灯</div></div>${feedback('自动执行不等于AI；要看系统是否在进行感知、学习、推理或自适应决策。')}`;
    },
    "y2025q20": function (demo) {
      return `<div class="v25-ai-editor"><div class="prompt-pane"><small>原句</small><p>某疗法可能改善症状。</p><button data-sim-choice="0">生成润色稿</button></div><div class="ai-draft"><span>AI草稿</span><p>这项疗法能够保证彻底治愈。</p><i>⚠ “可能改善”被夸大为“保证治愈”</i></div><div class="verify-pane">${getItems(demo).slice(1).map((item,i)=>`<button data-sim-choice="${i+1}">${escapeHTML(item.label)}</button>`).join('')}</div></div>${feedback('润色属于自然语言生成，但任何事实变化都必须回到证据核验。')}`;
    },
    "y2026q45": function (demo) {
      return `<div class="compute-benchmark"><div class="chip-die"><b>AI 加速器</b><div class="compute-cores">${Array.from({length:64},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="memory-bus" data-memory-bus><span>HBM 带宽</span><i></i></div></div><div class="benchmark-screen"><header>性能影响因素 · 定性对照</header><div class="benchmark-readout"><b data-real-tops>选择条件，检查限制在哪里</b></div><div class="benchmark-actions">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div></div></div>${feedback('实际算力受并行单元、内存带宽、软件优化和数值精度共同限制。')}`;
    },
    "y2024q20": function (demo) {
      return `<div class="v24-metaverse"><div class="headset"><i class="lens l"></i><i class="lens r"></i><b>XR</b></div><div class="data-orbits">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}" class="orbit o${i}"><i>${['◎','⌂','◆','!'][i]}</i><b>${escapeHTML(item.label)}</b></button>`).join('')}</div><div class="privacy-vault"><b>最小采集</b><span>明确目的</span><span>权限控制</span><span>保留期限</span></div></div>${feedback('沉浸式设备会产生视线、动作和空间等高敏感数据；技术越丰富，治理越不能省略。')}`;
    },
    "y2024q47": function (demo) {
      const states=[['现有结构','学号　姓名　班级'],['编写语句','ALTER TABLE student ADD 年龄 INT;'],['执行迁移','旧记录的年龄先为NULL'],['结构检查','学号　姓名　班级　年龄'],['验证完成','应用读写与约束均正常']];
      return `<div class="v25-stage-shell v24-sql-stages">${states.map((s,i)=>`<section data-v25-stage="${i}"><div class="v24-alter"><small>数据库结构迁移</small><b>${s[0]}</b><code>${s[1]}</code>${i<4?`<button data-sim-step="${i}">${escapeHTML(demo.steps[i].label)}</button>`:'<i>ALTER成功 · 0行数据丢失</i>'}</div></section>`).join('')}</div>${feedback('ALTER改变表结构；生产环境还要检查旧数据默认值、锁表和应用兼容性。')}`;
    },
    "y2025q12": function (demo) {
      return `<div class="v25-stage-shell v25-sql-stages"><section data-v25-stage="0"><div class="v25-sql"><pre><span>INSERT INTO</span> 新生信息 (<button data-sim-step="0">学号, 姓名, 专业</button>)</pre><table><tr><th>学号</th><th>姓名</th><th>专业</th></tr></table></div></section><section data-v25-stage="1"><div class="v25-sql"><pre>INSERT INTO 新生信息 (学号, 姓名, 专业)\n<span>VALUES</span> (<button data-sim-step="1">'2025001','王宁','临床医学'</button>);</pre></div></section><section data-v25-stage="2"><div class="v25-sql"><pre>INSERT INTO 新生信息 (...) VALUES (...);</pre><button data-sim-step="2" class="run-query">▶ 执行INSERT</button><div class="constraint-check">主键 ✓　非空 ✓　外键 ✓</div></div></section><section data-v25-stage="3"><div class="v25-sql"><button data-sim-step="3">SELECT * FROM 新生信息;</button><table><tr><th>学号</th><th>姓名</th><th>专业</th></tr><tr><td>2025001</td><td>王宁</td><td>临床医学</td></tr></table></div></section><section data-v25-stage="4"><div class="v25-sql success"><b>1 row inserted</b><span>新记录已验证</span></div></section></div>${feedback('INSERT负责新增记录；字段、值和约束必须同时匹配。')}`;
    },
    "y2020q13": function (demo) {
      return `<div class="access-window"><div class="access-title">Microsoft Access　学生管理.accdb</div><aside class="access-nav"><b>所有Access对象</b><span>表</span><i>学生</i><i>成绩</i><span>查询</span><i>女生名单</i></aside><main><div class="access-tabs"><span>学生表　×</span></div><table><tr><th>ID</th><th>姓名</th><th>班级</th></tr><tr><td>1</td><td>王宁</td><td>1班</td></tr><tr><td>2</td><td>李悦</td><td>2班</td></tr></table><div class="access-objects">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}"><i>${['DB','A','▦','W'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div></main></div>${feedback('accdb是数据库文件，Access是管理它的DBMS，二维表及关系属于数据模型。')}`;
    },
    "y2025q42": function (demo) {
      return `<div class="v25-dba-console"><aside><b>生产数据库</b><span>状态：在线</span><span>备份：昨夜成功</span><span>告警：1</span></aside><main><div class="role-badge">DBA 值班</div><div class="dba-tasks">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><i>${['↻','🔑','◇','{ }'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="uptime">运行时间 128 天</div></main></div>${feedback('DBA守住运行、权限、备份和性能；需求分析与页面开发由其他角色主导。')}`;
    },
    "y2026q12": function (demo) {
      return `<div class="database-model-lab"><div class="document-store"><header>静态结构对照 · 文档与键值</header><pre>文档示例：\n{ name: "王宁", score: 92 }\n{ name: "李悦", tags: ["AI"], city: "济宁" }\n\n键值示例：\nkey: session:01 → value: 王宁\nkey: session:02 → value: 李悦</pre><div class="cluster-nodes"><i>Node A</i><i>Node B</i><i>Node C</i></div></div><div class="model-selector">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="relational-store"><header>关系数据库</header><table><tr><th>ID</th><th>姓名</th><th>班级ID</th></tr><tr><td>01</td><td>王宁</td><td>1</td></tr><tr><td>02</td><td>李悦</td><td>2</td></tr></table><small>固定结构 · 约束 · 事务 · SQL</small></div></div>${feedback('这是静态结构对照，不执行数据库查询。模型选择看结构、事务、查询与扩展需求；NoSQL不是“无SQL、无一致性、一定更快”。')}`;
    },
    "y2025q11": function (demo) {
      return `<div class="v25-stage-shell v25-design-stages"><section data-v25-stage="0"><button data-sim-step="0" class="design-card"><i>01</i><b>需求分析</b><span>对象、查询、规则</span></button></section><section data-v25-stage="1"><button data-sim-step="1" class="design-card"><i>02</i><b>概念结构</b><span>E‑R图，不绑定DBMS</span></button></section><section data-v25-stage="2"><button data-sim-step="2" class="design-card"><i>03</i><b>逻辑结构</b><span>关系表、主键、外键</span></button></section><section data-v25-stage="3"><button data-sim-step="3" class="design-card"><i>04</i><b>物理结构</b><span>文件、索引、存储方法</span></button></section><section data-v25-stage="4"><div class="design-complete"><b>数据库设计完成</b><span>规模小也要走完必要思考</span></div></section></div>${feedback('从需求到物理存储逐层收敛；小型数据库可以简化过程，不能跳过设计。')}`;
    },
    "y2025q4": function (demo) {
      return `<div class="v25-ct-workbench"><div class="clinical-problem"><b>高风险患者识别</b><span>10万份病例</span></div><div class="ct-steps">${getItems(demo).map((item,i)=>`<button data-sim-choice="${i}"><i>${['拆','抽','跑','×'][i]}</i><span>${escapeHTML(item.label)}</span></button>`).join('')}</div><div class="ct-pipeline"><span>病例</span><i>→</i><span>特征</span><i>→</i><span>规则</span><i>→</i><span>复核</span></div></div>${feedback('计算思维是跨专业的问题求解方式：分解、抽象，再把明确步骤自动化。')}`;
    },
    "y2026q5": function (demo) {
      return `<div class="control-flow-theatre"><div class="flowchart" data-flowchart><div class="flow-node start">开始</div><i>↓</i><div class="flow-node input">读取 x</div><i>↓</i><div class="flow-node branch">x &gt; 0？</div><div class="flow-split"><section><span>是</span><div class="flow-node loop">重复输出 x 次</div></section><section><span>否</span><div class="flow-node output">输出“无效”</div></section></div><i>↓</i><div class="flow-node end">结束</div></div><div class="structure-controls">${getItems(demo).map((item,i)=>`<button type="button" data-sim-choice="${i}" class="structure structure-${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="execution-cursor" data-execution-cursor>●</div></div>${feedback('顺序、分支、循环可以互相嵌套；结构化控制保持清晰入口、出口和可追踪路径。')}`;
    },
    "y2025q24": function (demo) {
      return `<div class="v25-oop"><div class="class-card"><header>class 患者</header><span>姓名</span><span>体温</span><b>计算风险()</b></div><div class="object-card"><header>患者A</header><span>姓名：王宁</span><span>体温：39.2℃</span><button data-sim-choice="3">调用 计算风险()</button></div><div class="oop-actions">${getItems(demo).slice(0,3).map((item,i)=>`<button data-sim-choice="${i}">${escapeHTML(item.label)}</button>`).join('')}</div><div class="message-arrow">对象 → 消息 → 方法</div></div>${feedback('类是模板，对象是实例；封装把数据和方法放在一起，对象通过消息协作。')}`;
    }
  };
  window.NOTE_SIMULATIONS = { demos, scenes, escapeHTML, choice, choices, step, toolbar, office, win, feedback, genericInitial };
})();
