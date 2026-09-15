import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "windows-phone-package-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = JSON.parse(
  execFileSync(
    npm,
    [
      "pack",
      "./packages/react",
      "--pack-destination",
      temp,
      "--json",
      "--ignore-scripts",
    ],
    { cwd: root, encoding: "utf8" },
  ),
)[0];
const files = result.files.map((file) => file.path);
for (const path of [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles.css",
  "dist/motion.css",
  "README.md",
]) {
  assert(files.includes(path), `Missing published file: ${path}`);
}
assert(
  !files.some(
    (path) => path.startsWith("src/") || path.includes("node_modules"),
  ),
  "Package contains source/dependency internals",
);
for (const path of files.filter((path) => path.endsWith(".js"))) {
  const source = readFileSync(join(root, "packages/react", path), "utf8");
  assert(
    !/from\s+["'](?:next[/'"]|@\/)/.test(source),
    `${path} imports app-specific code`,
  );
}
for (const name of [
  "Pressable",
  "Tile",
  "Transition",
  "Stagger",
  "Button",
  "AppBar",
  "Pivot",
  "Panorama",
  "TileSequence",
  "Progress",
  "MessageBanner",
  "Dialog",
  "Floating",
  "List",
  "Field",
  "Selection",
]) {
  assert(
    /^['"]use client['"];/.test(
      readFileSync(join(root, `packages/react/dist/${name}.js`), "utf8"),
    ),
    `${name} lost its client boundary`,
  );
}
writeFileSync(
  join(temp, "package.json"),
  JSON.stringify({
    name: "plain-react-consumer",
    private: true,
    type: "module",
  }),
);
execFileSync(
  npm,
  [
    "install",
    "--offline",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    join(temp, result.filename),
    "react@19.2.8",
    "react-dom@19.2.8",
    "@types/react@19.2.18",
    "@types/react-dom@19.2.5",
  ],
  { cwd: temp, stdio: "pipe" },
);
writeFileSync(
  join(temp, "verify.mjs"),
  `
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { Theme, TileLink, RevealTile, LiveTile, Transition, Stagger, Pivot, PivotList, PivotTrigger, PivotPanel, Panorama, TileSequence, Button, IconButton, AppBarLink, AppBarOverflow, ProgressDots, Field, TextField, TextArea, Checkbox, Switch, RadioGroup, Select, Slider, Progress, ProgressRing, MessageBanner, Dialog, AlertDialog, Menu, Popover, List, ListItem, SectionHeader, EmptyState } from '@windows-phone/react';
const html = renderToString(h(Theme, {mode:'light'},
  h(TileLink, {href:'/hello',label:'hello'}, 'world'),
  h(RevealTile, {label:'details',front:'front',back:'back'}),
  h(LiveTile, {label:'news', accessibleLabel:'two updates',items:['one','two']}),
  h(Transition, {show:true}, 'visible content'),
  h(Transition, {show:false}, 'absent content'),
  h(Stagger, {show:true}, h('span',null,'staggered content')),
  h(Pivot, {defaultValue:'first'}, h(PivotList, {'aria-label':'sections'}, h(PivotTrigger, {value:'first'}, 'first')), h(PivotPanel, {value:'first'}, 'pivot body')),
  h(Panorama, {'aria-label':'journey',items:[{id:'a',label:'a',children:'panorama body'}]}),
  h(TileSequence, {show:true, items:[{id:'a',content:'sequence body'}]}),
  h(Button, {loading:true}, 'save command'),
  h(IconButton, {label:'Add item',icon:'+'}),
  h(AppBarLink, {href:'/docs',label:'Docs',icon:'?'}),
  h(AppBarOverflow, {defaultOpen:true}, 'extra commands'),
  h(ProgressDots, {label:'Syncing content'}),
  h(Progress, {label:'Download files',value:25,max:50}),
  h(ProgressRing, {label:'Finding files'}),
  h(MessageBanner, {heading:'Saved',announcement:'polite'},'Consumer feedback'),
  h(SectionHeader, {level:3},'Consumer collections'),
  h(List, {'aria-label':'Consumer collection list'},h(ListItem,{title:'Weekend',action:{type:'link',href:'/weekend'}})),
  h(EmptyState,{title:'No collections',description:'Create your first collection.'}),
  h(Menu, {label:'Consumer actions',items:[{id:'edit',label:'Edit',onSelect:()=>{}}]}),
  h(Popover, {label:'Consumer filters',title:'Filters'},'Filter content'),
  h(Dialog, {open:true,title:'Consumer dialog',onOpenChange:()=>{}},'Dialog content'),
  h(AlertDialog, {open:false,title:'Delete?',description:'Confirm deletion',onOpenChange:()=>{}}),
  h(Field, {label:'Email address',controlId:'consumer-email',description:'Keep it private'}, h(TextField, {type:'email',name:'email'})),
  h(Field, {label:'Mode',controlId:'consumer-mode'}, h(Select, {name:'mode',defaultValue:'dark'}, h('option',{value:'dark'},'Dark'))),
  h(Field, {label:'Level',controlId:'consumer-level'}, h(Slider, {name:'level',min:0,max:100,step:5,defaultValue:60})),
  h(Checkbox, {label:'Updates',name:'updates',defaultChecked:true}),
  h(Switch, {label:'Sync',name:'sync'}),
  h(RadioGroup, {label:'Schedule',name:'schedule',options:[{value:'weekly',label:'Weekly'}],defaultValue:'weekly'})
));
assert(html.includes('href="/hello"'));
assert(html.includes('visible content'));
assert(!html.includes('absent content'));
assert(html.includes('data-mode="light"'));
assert(html.includes('pivot body'));
assert(html.includes('panorama body'));
assert(html.includes('sequence body'));
assert(html.includes('save command'));
assert(html.includes('extra commands'));
assert(html.includes('aria-label="Syncing content"'));
assert(html.includes('for="consumer-email"'));
assert(html.includes('aria-describedby="consumer-email-description"'));
assert(html.includes('href="/docs"'));
assert(html.includes('for="consumer-mode"'));
assert(html.includes('for="consumer-level"'));
assert(html.includes('type="range"'));
assert(html.includes('value="60"'));
assert(html.includes('selected=""'));
assert(html.includes('aria-valuenow="25"'));
assert(html.includes('aria-label="Finding files"'));
assert(html.includes('Consumer feedback'));
assert(html.includes('Consumer dialog'));
assert(html.includes('Consumer actions'));
assert(html.includes('href="/weekend"'));
assert(html.includes('No collections'));
assert(html.includes('aria-haspopup="menu"'));
assert(!/<dialog[^>]* open/.test(html));
assert(import.meta.resolve('@windows-phone/react/styles.css').endsWith('/dist/styles.css'));
console.log('Packed package renders in a clean plain React consumer without browser globals.');
`,
);
execFileSync(process.execPath, [join(temp, "verify.mjs")], {
  cwd: temp,
  stdio: "inherit",
});
writeFileSync(
  join(temp, "consumer.tsx"),
  `
import { createRef } from 'react';
import { Theme, TileLink, RevealTile, Transition, Panorama, TileSequence, Button, IconButton, AppBarLink, AppBarOverflow, ProgressDots, Field, TextField, TextArea, Checkbox, Switch, RadioGroup, Select, Slider, Progress, ProgressRing, MessageBanner, Dialog, AlertDialog, Menu, Popover, List, ListItem, SectionHeader, EmptyState } from '@windows-phone/react';
const link = createRef<HTMLAnchorElement>();
const valid = <Theme mode="light"><Transition show preset="turnstile"><TileLink ref={link} href="/hello" label="hello">world</TileLink><RevealTile label="details" front="front" back="back" /></Transition></Theme>;
// @ts-expect-error Unsupported appearance must fail at the consumer boundary.
const invalid = <TileLink href="/hello" label="hello" size="enormous" />;
const panorama = <Panorama items={[{id:'a',label:'a',children:'content'}]} />;
const selection = <RadioGroup label="Schedule" name="schedule" options={[{value:"weekly",label:"Weekly"}]} />;
const check = <Checkbox label="Updates" name="updates" />;
// @ts-expect-error Selection controls need a label.
const unnamedCheckbox = <Checkbox />;
const field = <Field label="Name"><TextField name="name" /></Field>;
// @ts-expect-error Text fields do not masquerade as checkbox controls.
const invalidField = <TextField type="checkbox" />;
const select = <Select ref={createRef<HTMLSelectElement>()} defaultValue="dark"><option value="dark">Dark</option></Select>;
const slider = <Slider ref={createRef<HTMLInputElement>()} min={0} max={100} step={5} defaultValue={60} />;
// @ts-expect-error Slider is always a range control.
const wrongSlider = <Slider type="text" />;
const progress = <Progress ref={createRef<HTMLSpanElement>()} label="Download" value={50} />;
const ring = <ProgressRing decorative size="large" />;
const banner = <MessageBanner ref={createRef<HTMLDivElement>()} onDismiss={() => {}} dismissLabel="Dismiss confirmation">Saved</MessageBanner>;
// @ts-expect-error Named progress must have a label.
const unnamedBar = <Progress value={50} />;
// @ts-expect-error Named ring must have a label.
const unnamedRing = <ProgressRing />;
// @ts-expect-error Dismiss commands require a label.
const unnamedDismiss = <MessageBanner onDismiss={() => {}}>Saved</MessageBanner>;
// @ts-expect-error Value semantics belong to the normalized value prop.
const conflictingValue: import('@windows-phone/react').ProgressProps = { label: 'Download', 'aria-valuenow': 12 };
const dialog = <Dialog ref={createRef<HTMLDialogElement>()} open={false} title="Edit" onOpenChange={() => {}}><button>Cancel</button></Dialog>;
const alert = <AlertDialog open title="Delete?" description="Remove the collection" onOpenChange={() => {}} />;
// @ts-expect-error Controlled modal needs an owner callback.
const unownedModal = <Dialog open title="Edit" />;
// @ts-expect-error Alert dialogs require a description.
const unexplainedAlert = <AlertDialog open title="Delete?" onOpenChange={() => {}} />;
const menu = <Menu ref={createRef<HTMLButtonElement>()} label="Actions" items={[{id:'edit',label:'Edit',onSelect:()=>{}}]} />;
const popover = <Popover label="Filter" title="Filters" open={false} onOpenChange={()=>{}}>Content</Popover>;
// @ts-expect-error Controlled popup requires state ownership.
const unownedPopup = <Popover label="Filter" title="Filters" open>Content</Popover>;
// @ts-expect-error Menu actions require stable identities.
const unstableMenu = <Menu label="Actions" items={[{label:'Edit',onSelect:()=>{}}]} />;
const list = <List ref={createRef<HTMLUListElement>()}><ListItem ref={createRef<HTMLLIElement>()} title="Weekend" action={{type:'link',href:'/weekend'}} /></List>;
const empty = <EmptyState title="No matches" actions={<button>Clear filters</button>} />;
// @ts-expect-error Link actions require real destinations.
const brokenRow = <ListItem title="Weekend" action={{type:'link'}} />;
// @ts-expect-error Empty states require a heading.
const unnamedEmpty = <EmptyState />;
const dots = <ProgressDots label="Syncing" />;
// @ts-expect-error Standalone progress needs a label.
const unnamedProgress = <ProgressDots />;
const button = <Button type="submit" loading variant="accent">Save</Button>;
const commandLink = <AppBarLink href="/docs" label="Docs" icon="?" />;
// @ts-expect-error Icon-only buttons require a human-readable label.
const unnamed = <IconButton icon="+" />;
// @ts-expect-error Command destinations must provide a real href.
const destination = <AppBarLink label="Docs" icon="?" />;
const sequence = <TileSequence show items={[{id:'a',content:'tile',size:'wide'}]} />;
// @ts-expect-error A panorama item needs a stable identity.
const invalidPanorama = <Panorama items={[{label:'a',children:'content'}]} />;
`,
);
execFileSync(
  process.execPath,
  [
    join(root, "node_modules/typescript/bin/tsc"),
    "--noEmit",
    "--strict",
    "--module",
    "NodeNext",
    "--jsx",
    "react-jsx",
    "--target",
    "ES2020",
    "--lib",
    "ES2020,DOM",
    "consumer.tsx",
  ],
  { cwd: temp, stdio: "inherit" },
);
console.log(
  "Packed declarations typecheck in the clean consumer, including rejected invalid props.",
);
const js = files
  .filter((path) => path.endsWith(".js"))
  .map((path) => readFileSync(join(root, "packages/react", path)))
  .reduce((all, buffer) => Buffer.concat([all, buffer]), Buffer.alloc(0));
const css = files
  .filter((path) => path.endsWith(".css"))
  .map((path) => readFileSync(join(root, "packages/react", path)))
  .reduce((all, buffer) => Buffer.concat([all, buffer]), Buffer.alloc(0));
console.log(
  JSON.stringify(
    {
      package: result.filename,
      files: files.length,
      unpackedBytes: result.unpackedSize,
      allJsBytes: js.length,
      allJsGzipBytes: gzipSync(js).length,
      cssBytes: css.length,
      cssGzipBytes: gzipSync(css).length,
      consumer: temp,
    },
    null,
    2,
  ),
);
