import type {Deck,Media} from './types';
import {getLocal} from './localMedia';
import {cleanDeck} from './model';
export async function portableDeck(input:Deck):Promise<Deck>{
 const deck=structuredClone(input);
 async function embed(media?:Media){
  if(!media?.path?.startsWith('local:'))return;
  const url=await getLocal(media.path);
  try{const blob=await (await fetch(url)).blob();
   media.src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('이미지 내보내기 실패'));reader.readAsDataURL(blob)});
   delete media.path;
  }finally{URL.revokeObjectURL(url)}
 }
 for(const slide of deck.slides){await embed(slide.media);for(const image of slide.images||[])await embed(image);}
 for(const demo of deck.demos)await embed(demo.media);
 return cleanDeck(deck);
}
