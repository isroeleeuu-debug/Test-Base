// Cloudflare Worker: oculta tus keys y cachea la API de YouTube (5 min).
// Secrets: ANTHROPIC_KEY, YT_KEY. Variable: ALLOW="https://tu-dominio.com" (recomendado)
export default{async fetch(req,env,ctx){
 const o=req.headers.get('Origin')||'',ok=!env.ALLOW||env.ALLOW.split(',').includes(o);
 const cors={'Access-Control-Allow-Origin':ok?o:'null','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS',Vary:'Origin'};
 if(req.method=='OPTIONS')return new Response(null,{headers:cors});
 if(!ok)return new Response('forbidden',{status:403,headers:cors});
 const u=new URL(req.url);
 if(u.pathname=='/ai'&&req.method=='POST'){const b=await req.json();b.max_tokens=Math.min(b.max_tokens||1000,4000);
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':env.ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify(b)});
  return new Response(r.body,{status:r.status,headers:{...cors,'content-type':'application/json'}})}
 if(u.pathname.startsWith('/yt/')){const t=new URL('https://www.googleapis.com/youtube/v3/'+u.pathname.slice(4));
  u.searchParams.forEach((v,k)=>k!='key'&&t.searchParams.set(k,v));t.searchParams.set('key',env.YT_KEY);
  const ck=new Request(t.toString()),c=caches.default;let r=await c.match(ck);
  if(!r){r=await fetch(t);if(r.ok){r=new Response(r.body,r);r.headers.set('Cache-Control','public,max-age=300');ctx.waitUntil(c.put(ck,r.clone()))}}
  r=new Response(r.body,r);for(const k in cors)r.headers.set(k,cors[k]);return r}
 return new Response('not found',{status:404,headers:cors})}}
