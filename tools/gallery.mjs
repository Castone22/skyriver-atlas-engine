import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const descriptions = {
  galaxy: 'Galaxy · current child atlases',
  geographic: 'Geography · globe and surface',
  stellar: 'Stellar · regions, systems and worlds'
};
export async function gallery(out, report, kinds = {}) {
  const titles = JSON.parse(
    await readFile(new URL('../data/gallery.json', import.meta.url), 'utf8')
  );
  const cards = report
    .map(
      (r, i) =>
        `<a class="card" href="${r.file}"><span class="number">0${i + 1}</span><h2>${titles[r.id]?.title || r.id}</h2><p>${descriptions[kinds[r.id]] || descriptions.stellar}</p><span class="open">Open atlas ↗</span></a>`
    )
    .join('');
  await writeFile(
    path.join(out, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skyriver Atlas Framework</title><style>*{box-sizing:border-box}body{margin:0;background:#09111c;color:#e7edf4;font:16px/1.6 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:64px 28px}header{max-width:850px;margin-bottom:42px}.eyebrow{color:#80ccda;letter-spacing:.2em;font-size:12px}h1{font-size:clamp(36px,6vw,62px);line-height:1.08;font-weight:600;letter-spacing:-.04em;margin:18px 0}p{color:#9cacc0}nav{display:flex;gap:12px;flex-wrap:wrap;margin:25px 0}a{color:inherit;text-decoration:none}nav a{border:1px solid #355163;border-radius:7px;padding:9px 15px}.primary{background:#80ccda;color:#09111c}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}.card{padding:24px;border:1px solid #29384b;background:#101c2b;border-radius:10px;display:flex;flex-direction:column}.card:hover{border-color:#80ccda;background:#142438}.number{color:#6f8198;font:12px monospace}.card h2{font-size:22px;line-height:1.25;margin:20px 0 0}.card p{font-size:14px;flex:1}.open{font-size:13px;color:#80ccda;margin-top:12px}.note{margin-top:36px;max-width:850px;font-size:14px}a:focus-visible{outline:3px solid #80ccda;outline-offset:5px}</style></head><body><main><header><div class="eyebrow">SKYRIVER CODEX · FRAMEWORK 1.0</div><h1>One source framework.<br>Data-defined atlases.</h1><p>Seven migrated atlases, reusable renderer profiles and a JavaScript DSL. Choose a map below, or open the small authoring example to inspect a map created entirely through the DSL.</p><nav><a class="primary" href="dsl-demo-atlas.html">Open DSL example ↗</a><a href="../README.md">Read the guide</a><a href="../examples/new-stellar.atlas.mjs">View example source</a></nav></header><section>${cards}</section><p class="note">These HTML files are generated outputs. Edit <code>maps/</code> and <code>data/</code>, then run <code>node tools/build.mjs</code>. Shared renderer changes belong in <code>engine/</code>. DOM integration and catalogue-preservation checks passed; visual browser testing and live Codex refresh verification remain outstanding.</p></main></body></html>`
  );
}
