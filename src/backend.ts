import {createClient} from '@supabase/supabase-js';
import seed from './content/day1.json';
import {getLocal} from './localMedia';
import type {Deck,Workspace} from './types';
import {cleanDeck,cleanWorkspace,publicPaths} from './model';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
export const defaultDeck=()=>cleanDeck(seed);
export const cacheKey=(slug:string)=>`ha-public:${slug}`;
export async function published(slug:string):Promise<Deck>{
 if(db&&navigator.onLine){const {data,error}=await db.from('ha_public_decks').select('deck').eq('slug',slug).abortSignal(AbortSignal.timeout(10000)).maybeSingle();if(error)throw Error(`게시본 조회 실패: ${error.message}`);if(data){const deck=cleanDeck(data.deck);localStorage.setItem(cacheKey(slug),JSON.stringify(deck));return deck}}
 const cache=localStorage.getItem(cacheKey(slug));if(cache)return cleanDeck(JSON.parse(cache));if(slug==='day1')return defaultDeck();throw Error('아직 게시되지 않은 강의입니다.');
}
export async function listDecks(){if(!db)return [{slug:'day1',title:defaultDeck().title}];const {data,error}=await db.from('ha_public_decks').select('slug,deck');if(error)throw error;return data?.map(x=>({slug:x.slug,title:x.deck.title}))||[]}
export async function isAdmin(){if(!db)return false;const {data,error}=await db.rpc('ha_is_admin');if(error)throw error;return data===true}
export async function workspace(slug:string):Promise<Workspace|null>{if(!db)return null;const {data,error}=await db.from('ha_drafts').select('deck,notes,revision').eq('slug',slug).maybeSingle();if(error)throw error;return data?cleanWorkspace(data):null}
export async function save(w:Workspace){if(!db)throw Error('서버 설정이 없습니다.');const {data,error}=await db.rpc('ha_save',{p_slug:w.deck.slug,p_deck:cleanDeck(w.deck),p_notes:w.notes,p_expected:w.revision});if(error)throw Error(error.message);return Number(data)}
export async function publish(w:Workspace){if(!db)throw Error('서버 설정이 없습니다.');const {data,error}=await db.rpc('ha_publish',{p_slug:w.deck.slug,p_expected:w.revision});if(error)throw Error(error.message);return Number(data)}
export async function history(slug:string){if(!db)return [];const {data,error}=await db.from('ha_history').select('id,revision,created_at,deck,notes').eq('slug',slug).order('id',{ascending:false}).limit(20);if(error)throw error;return data||[]}
export async function sign(path:string){if(path.startsWith('local:'))return getLocal(path);if(!db)return '';const {data,error}=await db.storage.from('ha-media').createSignedUrl(path,604800);if(error)throw error;return data.signedUrl}
export async function cacheAssets(deck:Deck){const urls=[...deck.slides.flatMap(s=>s.media&&!s.media.path&&s.media.src?[s.media.src]:[]),...deck.demos.flatMap(d=>d.media&&!d.media.path&&d.media.src?[d.media.src]:[])];for(const path of publicPaths(deck)){const u=await sign(path);localStorage.setItem('ha-publicasset:'+path,u);urls.push(u)}const cache=await caches.open(`ha-content-${deck.slug}-v${deck.version}`);let failed=0;for(const u of urls)try{const r=await fetch(u);if(!r.ok)throw Error();await cache.put(u,r)}catch{failed++}return {count:urls.length-failed,failed}}
export async function upload(file:File,slug:string):Promise<{path:string;kind:'image'|'video'}>{
 if(!db)throw Error('이미지·영상 업로드는 서버 연결 후 사용할 수 있습니다.');
 if(file.size>25*1024*1024)throw Error('파일은 25MB 이하로 올려주세요.');
 let blob:Blob,kind:'image'|'video',extension:string;
 if(['image/jpeg','image/png','image/webp'].includes(file.type)){const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>60_000_000){bitmap.close();throw Error('이미지 해상도가 너무 큽니다.')}const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('이미지 변환 실패')),'image/webp',.85));kind='image';extension='webp';}
 else if(['video/mp4','video/webm'].includes(file.type)){const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());const mp4=String.fromCharCode(...bytes.slice(4,8))==='ftyp';const webm=bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3;if(!mp4&&!webm)throw Error('올바른 MP4 또는 WebM 파일을 선택하세요.');blob=file;kind='video';extension=mp4?'mp4':'webm'}else throw Error('JPG·PNG·WebP 이미지 또는 MP4·WebM 영상만 가능합니다.');
 const path=`${slug}/${crypto.randomUUID()}.${extension}`;const {error}=await db.storage.from('ha-media').upload(path,blob,{contentType:kind==='image'?'image/webp':file.type,upsert:false});if(error)throw error;return {path,kind};
}

export async function presenterNotes(slug:string):Promise<Workspace|null>{if(!db)return null;const {data,error}=await db.from('ha_presenter_notes').select('deck,notes,revision').eq('slug',slug).maybeSingle();if(error)throw error;return data?cleanWorkspace(data):null}
