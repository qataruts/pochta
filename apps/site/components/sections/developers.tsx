import type { Dictionary } from "@/lib/i18n";
import { LINKS } from "@/lib/links";
import { IconCheck, IconNpm, IconDoc, IconGitHub } from "@/components/icons";

const SDK_CODE = `<span class="pr">$</span> npm i @elementaio/vox-sdk

<span class="kw">import</span> { createIdentity, Client } <span class="kw">from</span> <span class="st">"@elementaio/vox-sdk"</span>;

<span class="cm">// your key + 12 backup words — no account server</span>
<span class="kw">const</span> me = <span class="kw">await</span> <span class="fn">createIdentity</span>();

<span class="cm">// sign-then-seal E2E; you inject storage + transport</span>
<span class="kw">const</span> client = <span class="kw">new</span> <span class="fn">Client</span>({ store, relayUrl });
<span class="kw">await</span> client.<span class="fn">send</span>(to, { type: <span class="st">"text"</span>, text: <span class="st">"hi 📮"</span> });`;

const RELAY_CODE = `<span class="cm"># one image bundles the relay, web client + storage</span>
docker run -p 4000:4000 -v vox-data:/data \\
  -e SECRET_KEY_BASE=$(openssl rand -base64 48) \\
  vox-relay

<span class="cm"># → open http://localhost:4000</span>`;

export function Developers({ dict }: { dict: Dictionary }) {
  const d = dict.developers;
  return (
    <section className="section section--alt" id="developers">
      <div className="container">
        <div className="dev-grid">
          <div>
            <span className="eyebrow">{d.eyebrow}</span>
            <h2 className="h-section">{d.title}</h2>
            <p className="lead">{d.lead}</p>

            <ul className="dev-features">
              {d.features.map((f) => (
                <li key={f}>
                  <span className="ck">
                    <IconCheck />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="dev-links">
              <a className="btn btn-ghost btn-sm" href={LINKS.npm} target="_blank" rel="noreferrer">
                <IconNpm width={16} height={16} />
                {d.links.npm}
              </a>
              <a className="btn btn-ghost btn-sm" href={LINKS.protocol} target="_blank" rel="noreferrer">
                <IconDoc width={16} height={16} />
                {d.links.protocol}
              </a>
              <a className="btn btn-ghost btn-sm" href={LINKS.architecture} target="_blank" rel="noreferrer">
                <IconDoc width={16} height={16} />
                {d.links.architecture}
              </a>
              <a className="btn btn-ghost btn-sm" href={LINKS.github} target="_blank" rel="noreferrer">
                <IconGitHub width={16} height={16} />
                {d.links.github}
              </a>
            </div>
          </div>

          <div>
            <div className="code-card">
              <div className="code-top">
                <span className="traffic">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="code-file">app.ts</span>
              </div>
              <pre dangerouslySetInnerHTML={{ __html: SDK_CODE }} />
            </div>
            <p className="dev-caption">{d.codeCaption}</p>

            <div className="code-card">
              <div className="code-top">
                <span className="traffic">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="code-file">{d.relayTitle}</span>
              </div>
              <pre dangerouslySetInnerHTML={{ __html: RELAY_CODE }} />
            </div>
            <p className="dev-caption">{d.relayCaption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
