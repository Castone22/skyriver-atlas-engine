// The steps of the atlas tour, as plain data. Shared by the jsdom golden tours (tests/golden.cjs)
// and the Playwright browser tours (tests/e2e). Nothing here touches a page.
//
// A step is { key, route?, act?, always? }.
//   key     names the step in the golden files
//   route   passed to AtlasFramework.navigate(route) first; null means "do nothing" (the page as loaded)
//   act     a control to operate afterwards (see below)
//   always  kept in quick mode
//
// An act is one of:
//   { t: 'open', name }       open a station screen
//   { t: 'close' }            close the station screen
//   { t: 'search', term }     type into the search box
//   { t: 'click', sel, n }    click the nth element matching a selector
//   { t: 'clickId', id }      click the element with this id
//   { t: 'flip', n }          toggle the nth filter checkbox
//   { t: 'key', key }         press a key on the map

export function stepsFor(data) {
  const steps = [
    { key: 'start', route: null },
    { key: 'all', route: {} }
  ];
  for (const id of Object.keys(data.regions)) {
    steps.push({ key: 'region:' + id, route: { region: id } });
    steps.push({ key: 'overview:' + id, route: { region: id, chart: 'overview' } });
  }
  for (const s of data.systems) {
    steps.push({ key: 'system:' + s.id, route: { system: s.id } });
    steps.push({ key: 'station-overview:' + s.id, route: { system: s.id, station: 1 } });
    for (const world of s.worlds || [])
      steps.push({ key: `planet:${s.id}:${world}`, route: { system: s.id, planet: world } });
  }
  for (const m of data.satellites || [])
    steps.push({
      key: `object:${m.system}:${m.name}`,
      route: { system: m.system, object: m.name }
    });
  for (const st of data.stations || [])
    steps.push({
      key: `station:${st.system}:${st.name}`,
      route: { system: st.system, object: st.name }
    });
  // Station screens (schematics) are opened through a function, not a route.
  for (const st of data.stations || []) {
    steps.push({
      key: `open-station:${st.system}:${st.name}`,
      route: { system: st.system },
      act: { t: 'open', name: st.name }
    });
    steps.push({ key: `close-station:${st.system}:${st.name}`, act: { t: 'close' } });
  }
  return steps.concat(interactionSteps(data));
}

/** Steps that use the page's own controls rather than routes. Always run, even in quick mode. */
function interactionSteps(data) {
  const steps = [];
  const add = (key, act, route) => steps.push({ key: 'ui:' + key, act, route, always: true });
  add('reset', null, {});
  const names = [
    ...data.systems
      .filter((_, i) => i % 4 === 0)
      .slice(0, 40)
      .map((x) => x.name),
    ...Object.keys(data.worlds || {})
      .filter((_, i) => i % 25 === 0)
      .slice(0, 40)
  ];
  for (const term of ['', 'zzz-no-such-thing', 'station', 'federation', 'silent', 'moon', ...names])
    add('search:' + term, { t: 'search', term });
  add('search:clear', { t: 'search', term: '' });
  for (let i = 0; i < 4; i++) add('scope:' + i, { t: 'click', sel: '[data-scope]', n: i });
  for (let i = 0; i < 6; i++) {
    add(`filter:${i}:off`, { t: 'flip', n: i });
    add(`filter:${i}:on`, { t: 'flip', n: i });
  }
  for (const id of [
    'zoomIn',
    'zoomIn',
    'zoomOut',
    'fit',
    'indexToggle',
    'indexToggle',
    'toggleDetailPanel',
    'toggleDetailPanel',
    'filterBtn',
    'filterBtn',
    'footerNotes',
    'closeNotes',
    'download'
  ])
    add('button:' + id + ':' + steps.length, { t: 'clickId', id });
  for (const key of ['+', '-', '0', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'])
    add('key:' + key, { t: 'key', key });
  const first = data.systems[0];
  if (first) {
    add('zoom-in-system', { t: 'click', sel: '#zoomIn', n: 0 }, { system: first.id });
    add('key-in-system:+', { t: 'key', key: '+' });
    add('key-in-system:0', { t: 'key', key: '0' });
  }
  return steps;
}
