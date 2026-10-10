// 演示：异步 search（返回 Promise）、ot.http、ot.storage、防抖
let seq = 0;

ot.command('search', {
  async search(query) {
    const q = query.trim();
    if (!q) {
      const recent = (await ot.storage.get('recent')) || [];
      return recent.length
        ? recent.map((r) => item(r))
        : [{ title: '输入关键字搜索 GitHub 仓库', icon: 'sf:magnifyingglass' }];
    }

    // 防抖：300ms 内有新输入则放弃本次请求（OpenTools 也会丢弃过期结果）
    const my = ++seq;
    await ot.sleep(300);
    if (my !== seq) return [];

    const res = await ot.http.get(
      'https://api.github.com/search/repositories?per_page=15&q=' + encodeURIComponent(q),
      { Accept: 'application/vnd.github+json' }
    );
    if (res.status !== 200) return [{ title: `请求失败：HTTP ${res.status}`, icon: 'sf:exclamationmark.triangle' }];
    return JSON.parse(res.body).items.map((r) =>
      item({ name: r.full_name, url: r.html_url, desc: r.description || '', stars: r.stargazers_count })
    );
  },

  // 没有 action 的条目回车时调用 select
  async select(it) {
    if (!it.repo) return;
    const recent = ((await ot.storage.get('recent')) || []).filter((r) => r.name !== it.repo.name);
    await ot.storage.set('recent', [it.repo, ...recent].slice(0, 8));
    await ot.open(it.repo.url);
    await ot.hide();
  },
});

function item(repo) {
  return { title: repo.name, subtitle: `★ ${repo.stars} · ${repo.desc}`, repo };
}
