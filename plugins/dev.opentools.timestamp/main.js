// list 插件：运行在 JavaScriptCore 中，返回的条目由 OpenTools 原生渲染。
// 每个条目：{ title, subtitle?, icon?, action? }
// action 为 { type: 'copy', text } 时，回车直接复制，无需写 select()。

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const copy = (text, subtitle) => ({ title: text, subtitle, action: { type: 'copy', text } });

function fromDate(d) {
  return [
    copy(String(Math.floor(d.getTime() / 1000)), '秒级时间戳 · 回车复制'),
    copy(String(d.getTime()), '毫秒级时间戳 · 回车复制'),
    copy(fmt(d), '本地时间'),
    copy(d.toISOString(), 'ISO 8601 (UTC)'),
  ];
}

ot.command('convert', {
  search(query) {
    const q = query.trim();
    if (!q) return fromDate(new Date());

    if (/^\d{10}(\d{3})?$/.test(q)) {
      const d = new Date(q.length === 10 ? Number(q) * 1000 : Number(q));
      return [
        copy(fmt(d), '本地时间 · 回车复制'),
        copy(d.toISOString(), 'ISO 8601 (UTC)'),
        copy(d.toUTCString(), 'UTC'),
      ];
    }

    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(q)) {
      const d = new Date(q.replace(/[./]/g, '-').replace(' ', 'T'));
      if (!isNaN(d)) return fromDate(d);
    }

    return [{ title: '无法识别', subtitle: '请输入 10/13 位时间戳，或 2024-01-01 12:00:00 格式的日期', icon: 'sf:questionmark.circle' }];
  },
});
