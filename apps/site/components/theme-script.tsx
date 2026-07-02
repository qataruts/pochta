// Runs before paint (first child of <body>) so there is no flash of the
// wrong theme. Default is LIGHT; an explicit stored choice wins.
const script = `(function(){try{var t=localStorage.getItem('pochta-theme');var d=t==='dark';var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
