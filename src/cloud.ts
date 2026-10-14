import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key&&!url.includes('YOUR')?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
export const bucket='ha-slide-media';
export async function isAdmin(){if(!db)return true;const{data,error}=await db.rpc('ha_slide_is_admin');if(error)throw error;return data===true;}
export async function cloudRpc<T>(name:string,args:Record<string,unknown>={}):Promise<T>{if(!db)throw Error('Supabase 환경변수를 설정하세요.');const{data,error}=await db.rpc(name,args);if(error)throw Error(error.message.includes('REVISION_CHANGED')?'다른 창에서 수정되었습니다. 저장한 JSON을 보관하고 편집본을 다시 불러오세요.':error.message);return data as T;}
