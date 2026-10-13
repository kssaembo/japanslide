import seed from './content/day1.json';
import {getLocal,putLocal} from './localMedia';
import type {Deck,Workspace} from './types';
import {cleanDeck,cleanWorkspace,publicPaths} from './model';
// Static deck + browser-local editing. No server, authentication or remote storage.
export const db=null;
export const defaultDeck=()=>cleanDeck(seed);
export const cacheKey=(slug:string)=>`ha-public:${slug}`;
export async function published(slug:string):Promise<Deck>{const cached=localStorage.getItem(cacheKey(slug));if(cached){const deck=cleanDeck(JSON.parse(cached));if(slug!=='day1'||deck.version>=seed.version)return deck;}if(slug==='day1')return defaultDeck();throw Error('자료가 없습니다.');}
export async function listDecks(){return [{slug:'day1',title:defaultDeck().title}]}
export async function workspace(slug:string):Promise<Workspace|null>{const s=localStorage.getItem('ha-demo:'+slug);return s?cleanWorkspace(JSON.parse(s)):null;}
export async function save(w:Workspace){const revision=w.revision+1;localStorage.setItem('ha-demo:'+w.deck.slug,JSON.stringify({...w,revision}));return revision;}
export async function publish(w:Workspace){localStorage.setItem(cacheKey(w.deck.slug),JSON.stringify(cleanDeck(w.deck)));return w.deck.version;}
export async function history(slug:string){return JSON.parse(localStorage.getItem('ha-demo-history:'+slug)||'[]');}
export async function sign(path:string){return path.startsWith('local:')?getLocal(path):path.startsWith('/assets/')?path:'';}
export async function upload(file:File,_slug:string){return {path:await putLocal(file),kind:'image' as const};}
export async function presenterNotes(slug:string){return workspace(slug);}
export async function cacheAssets(deck:Deck){const urls=[...deck.slides.flatMap(s=>[s.media,...(s.images||[])].flatMap(m=>m&&!m.path&&m.src?[m.src]:[])),...deck.demos.flatMap(d=>d.media&&!d.media.path&&d.media.src?[d.media.src]:[])];for(const path of publicPaths(deck)){const u=await sign(path);if(u&&!u.startsWith('blob:'))urls.push(u);}const cache=await caches.open(`ha-content-${deck.slug}-v${deck.version}`);let failed=0;for(const u of urls.filter(u=>!u.startsWith('data:')))try{const r=await fetch(u);if(!r.ok)throw Error();await cache.put(u,r)}catch{failed++}return {count:urls.length-failed,failed};}
