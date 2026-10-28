import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { ArrowDown, Briefcase, Download, Gamepad2, Globe, Languages, Layers, MonitorSmartphone, Sparkles, Trophy, User, ChevronRight, Code, Cpu, Mail, Send, X } from "lucide-react";

// Lazy — three.js + r3f only download when the user enters the immersive gallery.
const ImmersiveGallery = lazy(() => import("./immersive/ImmersiveGallery.jsx"));

const PHOTO  = "/images/adhurim-thaqi.jpg";
const CV_URL = "/Adhurim_Thaqi_CV.pdf";

/* ── CV Download ─────────────────────────────────────────────── */
function downloadCV(){const a=document.createElement("a");a.href=CV_URL;a.download="Adhurim_Thaqi_CV.pdf";document.body.appendChild(a);a.click();a.remove();}

/* ════════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════════ */
const stats = [
  { label:"Projects done",   value:"17+" },
  { label:"Clients",         value:"15+" },
  { label:"Awards",          value:"5+"  },
];

const services = [
  { icon:Code,              title:"Web Development",        desc:"Fast, responsive websites in React, Vue or WordPress. Built so they're easy to find on Google and easy to keep updating." },
  { icon:MonitorSmartphone, title:"UI/UX Design",           desc:"Interfaces and prototypes in Figma and Adobe XD, worked out with you before any code gets written." },
  { icon:Gamepad2,          title:"Games",                  desc:"Unity and C# games, from gameplay systems and enemy AI to level design." },
  { icon:Cpu,               title:"AR / VR",                desc:"Immersive apps and experiences. It's what I'm studying at HSLU right now." },
  { icon:Layers,            title:"3D & Visualisation",     desc:"Models, scenes and architectural renders in Blender, 3ds Max and AutoCAD." },
  { icon:Sparkles,          title:"Interior Design",        desc:"Interior concepts that look good and still work for the people using the space." },
];

const hardSkills = [
  ["HTML / CSS",95],["JavaScript",75],["React / Vue.js",70],
  ["C# / Unity",76], ["Blender / 3D",82],["Game Design",80],
  ["Java / Spring Boot",62],["Figma / Adobe XD",85],["AR/VR Development",60],["Algorithms",74],
];

const languages = [
  ["Albanian","Native"],["English","Fluent (B2/C1)"],
  ["German","Good (B1/B2)"],["Bosnian & Turkish","Basic"],
];

const timeline = [
  { role:"Software Engineering Project", company:"BSc Immersive Technologies · HSLU", period:"2025 – Present", color:"#a78bfa",
    details:"Team project at HSLU: full-stack apps in Java (Spring Boot) and Node.js, with Docker, CI/CD and cloud hosting.",
    bullets:[
      "Built full-stack applications in Java (Spring Boot) and Node.js as part of an Agile team.",
      "Set up Docker and CI/CD pipelines so deployments became quicker and less error-prone.",
      "Deployed and looked after services on AWS and Azure.",
      "Reviewed teammates' code and had mine reviewed. Both made the codebase noticeably better.",
    ],
    tech:["Java","Spring Boot","Node.js","Docker","CI/CD","AWS","Azure","Agile"] },
  { role:"Freelance Developer & Designer", company:"Remote · Clients in Switzerland and abroad", period:"2023 – Present", color:"#22d3ee",
    details:"15+ websites and apps for clients, built with React, Vue.js and WordPress, plus a few mobile apps in Flutter and React Native.",
    bullets:[
      "Built more than 15 responsive websites and web apps with React, Vue.js and WordPress.",
      "Designed the UI in Figma and Adobe XD first, which cut down the back-and-forth on revisions (about 30% fewer).",
      "Built and shipped mobile apps with Flutter and React Native.",
      "Took care of SEO so clients' sites show up on the first page of Google.",
    ],
    tech:["React.js","Vue.js","Flutter","React Native","Figma","Adobe XD","WordPress","SEO"] },
  { role:"Freelance Web Developer", company:"ASM Promissa GmbH · Switzerland", period:"2023 – Present", color:"#34d399",
    details:"Designed and built the company's website from scratch. It now loads 30% faster and ranks in the top 3 on Google.",
    bullets:[
      "Designed and built a responsive company website from scratch.",
      "Made it about 30% faster by optimising and compressing assets.",
      "Worked on SEO until the site ranked in Google's top 3 for its main searches.",
      "Added contact forms, automated emails and a clear, safe navigation.",
    ],
    tech:["HTML5","CSS3","JavaScript","WordPress","SEO","Performance"] },
  { role:"Graphic & Interior Designer / Customer Rep", company:"OnaCandy & TelePerformance · Kosovo", period:"2023 – 2024", color:"#fb923c",
    details:"Logos, branding and 3D interior visualisations in AutoCAD, Blender and 3ds Max, alongside a customer sales role.",
    bullets:[
      "Designed logos, marketing material and social media graphics.",
      "Made 3D architectural and interior visualisations in AutoCAD, Blender and 3ds Max.",
      "Kept a 100% customer satisfaction rating as a sales representative.",
      "Handled 5+ design and service projects at once, often on tight deadlines.",
    ],
    tech:["AutoCAD","Blender","3ds Max","Branding","Interior Design","Customer Service"] },
  { role:"Fitness Trainer & Content Creator", company:"Self-employed · YouTube & Instagram", period:"2024 – Present", color:"#f472b6",
    details:"Coaching strength, kettlebell and fat-loss training, and growing a fitness channel on the side.",
    bullets:[
      "Started a fitness channel on YouTube and Instagram and built a small, engaged community.",
      "Film and edit all the videos myself and handle the marketing.",
      "Coach clients on strength training, kettlebells and nutrition.",
    ],
    tech:["Content Creation","YouTube","Video Editing","Marketing","Personal Training"] },
];

/* Projects live in /projects/<name>/project.json, with their images in the
   same folder (cover.* first). See projects/README.md. */
const projectFiles=import.meta.glob("/projects/*/project.json",{eager:true,import:"default"});
const projectImages=import.meta.glob("/projects/*/*.{jpg,jpeg,png,webp,gif}",{eager:true,import:"default"});
const games=Object.entries(projectFiles).map(([path,p])=>{
  const dir=path.slice(0,path.lastIndexOf("/")+1);
  const imgs=Object.keys(projectImages).filter(k=>k.startsWith(dir))
    .sort((a,b)=>(/\/cover\./.test(b)-/\/cover\./.test(a))||a.localeCompare(b)).map(k=>projectImages[k]);
  return {type:"game",stack:[],features:[],...p,images:()=>imgs};
}).filter(p=>!p.hidden).sort((a,b)=>(a.order??99)-(b.order??99));

/* ════════════════════════════════════════════════════════════════
   HOOKS
════════════════════════════════════════════════════════════════ */
function useInView(ref, threshold=0.1) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{
    if(!ref.current)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVis(true);obs.disconnect();}},{threshold});
    obs.observe(ref.current);
    return()=>obs.disconnect();
  },[]);
  return vis;
}
function useScrollPct(){
  const [pct,setPct]=useState(0);
  useEffect(()=>{
    const h=()=>{const d=document.documentElement;setPct(d.scrollTop/(d.scrollHeight-d.clientHeight)||0);};
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[]);
  return pct;
}
function useWindowWidth(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
}
/* Projects added through the /admin panel. Falls back silently to the
   built-in `games` list when the backend isn't reachable (e.g. local `vite`
   dev without functions). Normalises `images` to the ()=>[...] contract the
   cards/modal expect. */
function useProjects(){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    let alive=true;
    fetch("/api/projects")
      .then(r=>r.ok?r.json():[])
      .then(list=>{
        if(!alive||!Array.isArray(list))return;
        setItems(list.map(p=>({...p,images:()=>Array.isArray(p.images)?p.images:[]})));
      })
      .catch(()=>{});
    return()=>{alive=false;};
  },[]);
  return items;
}

/* ════════════════════════════════════════════════════════════════
   CURSOR
════════════════════════════════════════════════════════════════ */
function Cursor({pos}){
  const sm=useRef({x:-200,y:-200});
  const [d,setD]=useState({x:-200,y:-200});
  useEffect(()=>{
    let raf;
    const loop=()=>{sm.current.x+=(pos.x-sm.current.x)*.2;sm.current.y+=(pos.y-sm.current.y)*.2;setD({...sm.current});raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf);
  },[pos]);
  return <div style={{position:"fixed",zIndex:9999,pointerEvents:"none",left:d.x-11,top:d.y-11,width:22,height:22,borderRadius:"50%",border:"1.5px solid rgba(34,211,238,.85)",background:"rgba(34,211,238,.1)",mixBlendMode:"screen"}}/>;
}

/* ════════════════════════════════════════════════════════════════
   GRID CANVAS
════════════════════════════════════════════════════════════════ */
function GridCanvas({mouse}){
  const canvasRef=useRef(null);
  const animRef=useRef(null);
  const mRef=useRef({x:-999,y:-999});
  useEffect(()=>{mRef.current=mouse;},[mouse]);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const G=70;
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const{x:mx,y:my}=mRef.current; const R=230;
      for(let x=0;x<=canvas.width+G;x+=G){
        ctx.beginPath();
        for(let y=0;y<=canvas.height;y+=5){
          const dx=x-mx,dy=y-my,dist=Math.sqrt(dx*dx+dy*dy);
          const e=Math.max(0,1-dist/R)**2;
          y===0?ctx.moveTo(mx+dx*(1-e*.55),my+dy*(1-e*.55)):ctx.lineTo(mx+dx*(1-e*.55),my+dy*(1-e*.55));
        }
        const a=Math.min(.18,(1-Math.min(Math.abs(x-mx),R)/R)*.2);
        if(a<=0)continue;
        ctx.strokeStyle=`rgba(34,211,238,${a.toFixed(3)})`;ctx.lineWidth=.5;ctx.stroke();
      }
      for(let y=0;y<=canvas.height+G;y+=G){
        ctx.beginPath();
        for(let x=0;x<=canvas.width;x+=5){
          const dx=x-mx,dy=y-my,dist=Math.sqrt(dx*dx+dy*dy);
          const e=Math.max(0,1-dist/R)**2;
          x===0?ctx.moveTo(mx+dx*(1-e*.55),my+dy*(1-e*.55)):ctx.lineTo(mx+dx*(1-e*.55),my+dy*(1-e*.55));
        }
        const a=Math.min(.18,(1-Math.min(Math.abs(y-my),R)/R)*.2);
        if(a<=0)continue;
        ctx.strokeStyle=`rgba(34,211,238,${a.toFixed(3)})`;ctx.lineWidth=.5;ctx.stroke();
      }
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

/* ════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════════════════════════════ */
function FadeIn({children,delay=0,dir="up",style={}}){
  const ref=useRef(null);const vis=useInView(ref);
  const tx=dir==="left"?-28:dir==="right"?28:0,ty=dir==="up"?28:0;
  return <div ref={ref} style={{opacity:vis?1:0,transform:vis?"none":`translate(${tx}px,${ty}px)`,transition:`opacity .7s ease ${delay}s,transform .7s ease ${delay}s`,...style}}>{children}</div>;
}

function SkillBar({name,value,index}){
  const ref=useRef(null);const vis=useInView(ref);
  return(
    <div ref={ref} style={{opacity:vis?1:0,transform:vis?"none":"translateY(14px)",transition:`all .6s ease ${index*.06}s`}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#e2e8f0",marginBottom:6}}>
        <span>{name}</span><span style={{color:"#67e8f9"}}>{value}%</span>
      </div>
      <div style={{height:7,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,#22d3ee,#c084fc)",width:vis?`${value}%`:"0%",transition:`width 1.3s cubic-bezier(.4,0,.2,1) ${index*.05+.1}s`,boxShadow:"0 0 10px rgba(34,211,238,.4)"}}/>
      </div>
    </div>
  );
}

function Glass({children,style={},hover=false}){
  const [h,setH]=useState(false);
  return(
    <div onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
      style={{background:"rgba(255,255,255,.04)",border:`1px solid ${h?"rgba(34,211,238,.3)":"rgba(255,255,255,.08)"}`,borderRadius:20,backdropFilter:"blur(14px)",boxShadow:h?"0 0 28px rgba(34,211,238,.1)":"none",transition:"border-color .2s,box-shadow .2s",...style}}>
      {children}
    </div>
  );
}

function SectionHeading({tag,title,icon:Icon,iconColor="#22d3ee"}){
  return(
    <FadeIn>
      <div style={{textAlign:"center",marginBottom:52}}>
        {Icon&&<div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:48,height:48,borderRadius:14,background:iconColor+"18",border:`1px solid ${iconColor}33`,marginBottom:16}}><Icon size={22} color={iconColor}/></div>}
        <div style={{color:"#22d3ee",fontSize:11,letterSpacing:4,textTransform:"uppercase",fontWeight:600,display:"block",marginBottom:8}}>{tag}</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(1.8rem,4vw,2.8rem)",fontWeight:800,margin:0}}>{title}</h2>
      </div>
    </FadeIn>
  );
}

function SectionDivider(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:14,margin:"72px 0 0",opacity:.3}}>
      <div style={{flex:1,height:1,background:"linear-gradient(to right,transparent,rgba(34,211,238,.6))"}}/>
      <div style={{width:6,height:6,borderRadius:"50%",background:"#22d3ee"}}/>
      <div style={{width:4,height:4,borderRadius:"50%",background:"rgba(192,132,252,.8)"}}/>
      <div style={{width:6,height:6,borderRadius:"50%",background:"#22d3ee"}}/>
      <div style={{flex:1,height:1,background:"linear-gradient(to left,transparent,rgba(34,211,238,.6))"}}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROJECT MODAL
════════════════════════════════════════════════════════════════ */
// Convert a YouTube / Vimeo watch URL into an embeddable player URL.
function toEmbed(url){
  if(!url) return null;
  try{
    const u=new URL(url);
    const host=u.hostname.replace(/^www\./,"");
    if(host==="youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if(host.endsWith("youtube.com")){
      if(u.pathname.startsWith("/embed/")) return url;
      const v=u.searchParams.get("v");
      if(v) return `https://www.youtube.com/embed/${v}`;
    }
    if(host.endsWith("vimeo.com")){
      const id=u.pathname.split("/").filter(Boolean)[0];
      if(id&&/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    // Google Drive: /file/d/<id>/view → /file/d/<id>/preview (file must be shared "Anyone with the link")
    if(host==="drive.google.com"){
      const m=u.pathname.match(/\/file\/d\/([^/]+)/);
      if(m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  }catch{/* not a valid URL */}
  return null;
}

function ProjectModal({project,onClose}){
  const [visible,setVisible]=useState(false);
  const images=project.images();
  useEffect(()=>{
    const t=requestAnimationFrame(()=>setVisible(true));
    const esc=(e)=>{if(e.key==="Escape")handleClose();};
    document.addEventListener("keydown",esc);
    document.body.style.overflow="hidden";
    return()=>{cancelAnimationFrame(t);document.removeEventListener("keydown",esc);document.body.style.overflow="";};
  },[]);
  const handleClose=()=>{setVisible(false);setTimeout(onClose,320);};
  return(
    <div onClick={e=>e.target===e.currentTarget&&handleClose()} style={{position:"fixed",inset:0,zIndex:1000,background:`rgba(5,5,10,${visible?.88:0})`,backdropFilter:visible?"blur(18px)":"none",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px",transition:"background .35s,backdrop-filter .35s"}}>
      <div style={{width:"100%",maxWidth:800,maxHeight:"90vh",overflowY:"auto",borderRadius:24,background:"rgba(8,8,18,.97)",border:`1px solid ${project.color}44`,boxShadow:`0 0 100px ${project.color}1a,0 0 0 1px rgba(255,255,255,.05)`,opacity:visible?1:0,transform:visible?"scale(1) translateY(0)":"scale(.93) translateY(28px)",transition:"opacity .35s cubic-bezier(.4,0,.2,1),transform .35s cubic-bezier(.4,0,.2,1)",scrollbarWidth:"thin"}}>
        {images.length>0&&(
          <div style={{position:"relative",width:"100%",aspectRatio:"16/7",overflow:"hidden",borderRadius:"24px 24px 0 0",background:"#000"}}>
            <img src={images[0]} alt={project.title} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",opacity:visible?1:0,transition:"opacity .4s"}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 60%,rgba(8,8,18,.95))"}}/>
            <div style={{position:"absolute",top:16,left:16,padding:"4px 13px",borderRadius:99,background:`${project.color}22`,border:`1px solid ${project.color}55`,color:project.color,fontSize:11,fontWeight:700,backdropFilter:"blur(8px)"}}>{project.category}</div>
            <button onClick={handleClose} style={{position:"absolute",top:16,right:16,width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"rgba(5,5,10,.7)",backdropFilter:"blur(8px)",color:"rgba(255,255,255,.8)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.15)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(5,5,10,.7)";e.currentTarget.style.color="rgba(255,255,255,.8)";}}
            ><X size={16}/></button>
          </div>
        )}
        <div style={{padding:"24px 28px 28px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:"#fff",marginBottom:4}}>{project.title}</h2>
              <div style={{color:project.color,fontSize:13,fontWeight:600}}>{project.tech} · {project.year}</div>
            </div>
          </div>
          <p style={{color:"rgba(255,255,255,.6)",fontSize:15,lineHeight:1.75,marginBottom:22}}>{project.desc}</p>
          {toEmbed(project.videoUrl)&&(
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Gameplay</div>
              <div style={{position:"relative",width:"100%",aspectRatio:"16/9",borderRadius:14,overflow:"hidden",border:`1px solid ${project.color}30`,background:"#000"}}>
                <iframe src={toEmbed(project.videoUrl)} title={`${project.title} video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}}/>
              </div>
            </div>
          )}
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Tech Stack</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {project.stack.map(t=><span key={t} style={{padding:"5px 13px",borderRadius:99,background:project.color+"14",border:`1px solid ${project.color}30`,color:project.color,fontSize:12,fontWeight:600}}>{t}</span>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22}}>
            <div style={{padding:18,borderRadius:16,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Key Features</div>
              {project.features.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:9}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:project.color,marginTop:5,flexShrink:0,boxShadow:`0 0 6px ${project.color}`}}/>
                  <span style={{color:"rgba(255,255,255,.62)",fontSize:13,lineHeight:1.6}}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{padding:18,borderRadius:16,background:project.color+"08",border:`1px solid ${project.color}20`}}>
              <div style={{fontSize:10,color:project.color,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Challenge & Solution</div>
              <p style={{color:"rgba(255,255,255,.58)",fontSize:13,lineHeight:1.7}}>{project.challenge}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            {project.playUrl&&<a href={project.playUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",borderRadius:99,border:"none",background:`linear-gradient(135deg,${project.color},${project.color}bb)`,color:"#04121a",fontWeight:800,fontSize:13,boxShadow:`0 6px 24px ${project.color}44`,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 10px 32px ${project.color}66`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 6px 24px ${project.color}44`;}}>▶ Play Now</a>}
            {project.github&&<a href={project.github} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:99,border:`1px solid ${project.color}44`,background:project.color+"12",color:project.color,fontWeight:600,fontSize:13,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=project.color+"26";e.currentTarget.style.boxShadow=`0 0 20px ${project.color}33`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=project.color+"12";e.currentTarget.style.boxShadow="none";}}>⌥ View on GitHub</a>}
            {project.liveUrl&&<a href={project.liveUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:99,border:`1px solid ${project.color}44`,background:project.color+"12",color:project.color,fontWeight:600,fontSize:13,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=project.color+"26";e.currentTarget.style.boxShadow=`0 0 20px ${project.color}33`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=project.color+"12";e.currentTarget.style.boxShadow="none";}}>↗ Live Demo</a>}
            {project.docsUrl&&<a href={project.docsUrl} {...(/^https?:/.test(project.docsUrl)?{target:"_blank",rel:"noreferrer"}:{})} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:99,border:`1px solid ${project.color}44`,background:project.color+"12",color:project.color,fontWeight:600,fontSize:13,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=project.color+"26";e.currentTarget.style.boxShadow=`0 0 20px ${project.color}33`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=project.color+"12";e.currentTarget.style.boxShadow="none";}}>📄 Read more →</a>}
            <button onClick={handleClose} style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",borderRadius:99,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.45)",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(255,255,255,.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.45)";e.currentTarget.style.background="rgba(255,255,255,.04)";}}>Close ✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GAME CARD
════════════════════════════════════════════════════════════════ */
function GameCard({game,index,onOpen}){
  const ref=useRef(null);const vis=useInView(ref);
  const [hov,setHov]=useState(false);
  const previewImg=game.images()[0];
  return(
    <div ref={ref} onClick={()=>onOpen(game)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{opacity:vis?1:0,transform:vis?(hov?"translateY(-6px) scale(1.018)":"none"):"translateY(28px)",transition:vis?`transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s,border-color .25s,opacity .6s ease ${index*.1}s`:`opacity .6s ease ${index*.1}s,transform .6s ease ${index*.1}s`,borderRadius:20,background:hov?"rgba(255,255,255,.055)":"rgba(255,255,255,.04)",border:`1px solid ${hov?game.color+"55":"rgba(255,255,255,.08)"}`,backdropFilter:"blur(14px)",boxShadow:hov?`0 20px 60px ${game.color}22,0 0 0 1px ${game.color}22`:"none",cursor:"pointer",position:"relative",overflow:"hidden"}}>
      <div style={{width:"100%",aspectRatio:"16/9",overflow:"hidden",borderRadius:"20px 20px 0 0",position:"relative"}}>
        <img src={previewImg} alt={game.title} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",transform:hov?"scale(1.06)":"scale(1)",transition:"transform .5s cubic-bezier(.4,0,.2,1)"}}/>
        <div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,transparent 40%,rgba(5,5,10,.85))`}}/>
        <div style={{position:"absolute",top:10,left:10,padding:"3px 10px",borderRadius:99,background:`${game.color}22`,border:`1px solid ${game.color}44`,color:game.color,fontSize:10,fontWeight:700,backdropFilter:"blur(6px)"}}>{game.category}</div>
        <div style={{position:"absolute",top:10,right:10,padding:"3px 10px",borderRadius:99,background:"rgba(5,5,10,.7)",backdropFilter:"blur(6px)",color:"rgba(255,255,255,.7)",fontSize:10,fontWeight:600,opacity:hov?1:0,transform:hov?"translateY(0)":"translateY(-4px)",transition:"all .25s",border:"1px solid rgba(255,255,255,.12)"}}>Click to explore →</div>
      </div>
      <div style={{padding:20,position:"relative"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"0 0 20px 20px",opacity:hov?1:0,background:`radial-gradient(ellipse at 50% 0%,${game.color}0d 0%,transparent 70%)`,transition:"opacity .3s",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,marginBottom:2}}>{game.title}</div>
            <div style={{color:game.color,fontSize:11,fontWeight:600}}>{game.tech} · {game.year}</div>
          </div>
          <div style={{width:36,height:36,borderRadius:10,background:game.color+"18",border:`1px solid ${game.color}${hov?"55":"33"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,transform:hov?"rotate(-6deg) scale(1.1)":"none",transition:"all .3s"}}>{game.emoji||({game:"🎮",web:"🌐",design:"🎨"}[game.type]||"🎮")}</div>
        </div>
        <p style={{color:"rgba(255,255,255,.48)",fontSize:13,lineHeight:1.65,marginBottom:14}}>{game.desc}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {game.stack.slice(0,4).map(t=><span key={t} style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:game.color+"10",border:`1px solid ${game.color}${hov?"33":"18"}`,color:hov?game.color:"rgba(255,255,255,.38)",transition:"color .25s,border-color .25s"}}>{t}</span>)}
          {game.stack.length>4&&<span style={{color:"rgba(255,255,255,.22)",fontSize:11,padding:"3px 6px"}}>+{game.stack.length-4} more</span>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONTACT
════════════════════════════════════════════════════════════════ */
function ContactInput({label,type="text",value,onChange,multiline=false}){
  const [focused,setFocused]=useState(false);
  const active=focused||value.length>0;
  const base={width:"100%",background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:15,fontFamily:"'Outfit',sans-serif",padding:multiline?"26px 16px 10px":"24px 16px 8px",resize:"none",minHeight:multiline?130:"auto"};
  return(
    <div style={{position:"relative",marginBottom:16}}>
      <div style={{position:"relative",borderRadius:14,overflow:"hidden",border:`1px solid ${focused?"rgba(34,211,238,.55)":"rgba(255,255,255,.1)"}`,background:focused?"rgba(34,211,238,.04)":"rgba(255,255,255,.03)",boxShadow:focused?"0 0 20px rgba(34,211,238,.1)":"none",transition:"all .25s"}}>
        <label style={{position:"absolute",left:16,top:active?8:"50%",transform:active?"none":"translateY(-50%)",fontSize:active?10:14,color:focused?"#22d3ee":"rgba(255,255,255,.35)",fontWeight:600,letterSpacing:active?1.5:0,textTransform:active?"uppercase":"none",transition:"all .22s cubic-bezier(.4,0,.2,1)",pointerEvents:"none",zIndex:1}}>{label}</label>
        {multiline?<textarea value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={base}/>:<input type={type} value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={base}/>}
        <div style={{position:"absolute",bottom:0,left:0,height:2,width:focused?"100%":"0%",background:"linear-gradient(90deg,#22d3ee,#c084fc)",transition:"width .3s cubic-bezier(.4,0,.2,1)",borderRadius:"0 0 14px 14px"}}/>
      </div>
    </div>
  );
}

function ContactSection({isMobile}){
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [status,setStatus]=useState("idle");
  const [copied,setCopied]=useState(false);
  const set=(f)=>(e)=>setForm(p=>({...p,[f]:e.target.value}));
  const handleSubmit=()=>{
    if(!form.name||!form.email||!form.message){setStatus("error");setTimeout(()=>setStatus("idle"),2500);return;}
    setStatus("sending");
    const to="adhurimthaqi@gmx.ch";
    const sub=encodeURIComponent("[Portfolio] "+(form.subject||"New Message")+" — from "+form.name);
    const body=encodeURIComponent("Hi Adhurim,\n\nNew message from your portfolio:\n\nName:  "+form.name+"\nEmail: "+form.email+"\n\nMessage:\n"+form.message+"\n\n---\nSent from adhurim.ch");
    setTimeout(()=>{window.location.href="mailto:"+to+"?subject="+sub+"&body="+body;setStatus("sent");setForm({name:"",email:"",subject:"",message:""});setTimeout(()=>setStatus("idle"),4000);},600);
  };
  const copyEmail=()=>{navigator.clipboard.writeText("adhurimthaqi@gmx.ch").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const btnGrad=status==="sent"?"linear-gradient(135deg,#34d399,#059669)":status==="error"?"linear-gradient(135deg,#f87171,#dc2626)":"linear-gradient(135deg,#22d3ee,#0891b2)";
  const btnLabel=status==="sending"?"Opening mail…":status==="sent"?"✓ Opened!":status==="error"?"Fill required fields":"Send Message ✦";
  const info=[
    {icon:"✉",label:"Email",val:"adhurimthaqi@gmx.ch",href:"mailto:adhurimthaqi@gmx.ch"},
    {icon:"📍",label:"Location",val:"Dübendorf, Zürich, CH",href:null},
    {icon:"🌐",label:"Website",val:"adhurim.ch",href:"https://adhurim.ch"},
  ];
  return(
    <section id="contact" style={{paddingTop:isMobile?60:100}}>
      <SectionHeading tag="Get In Touch" title="Contact Me" icon={Mail} iconColor="#22d3ee"/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1.55fr",gap:20}}>
        <FadeIn dir="left">
          <Glass style={{padding:isMobile?22:32,height:"100%",display:"flex",flexDirection:"column"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(34,211,238,.08)",border:"1px solid rgba(34,211,238,.25)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><Mail size={30} color="#22d3ee"/></div>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,marginBottom:10}}>Let's work together</h3>
            <p style={{color:"rgba(255,255,255,.42)",fontSize:14,lineHeight:1.72,marginBottom:24}}>Have a project in mind or just want to say hi? Fill the form and your mail client opens with everything pre-filled.</p>
            <div style={{display:"flex",flexDirection:"column",gap:11,flex:1}}>
              {info.map(({icon,label,val,href})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:13,padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"rgba(34,211,238,.09)",border:"1px solid rgba(34,211,238,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.32)",letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:1}}>{label}</div>
                    {href?<a href={href} style={{color:"#22d3ee",fontSize:13.5,fontWeight:500}} onMouseEnter={e=>e.target.style.textDecoration="underline"} onMouseLeave={e=>e.target.style.textDecoration="none"}>{val}</a>:<span style={{color:"rgba(255,255,255,.62)",fontSize:13.5}}>{val}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={copyEmail} style={{marginTop:18,width:"100%",padding:"11px 0",borderRadius:12,background:copied?"rgba(52,211,153,.1)":"rgba(255,255,255,.04)",border:`1px solid ${copied?"rgba(52,211,153,.38)":"rgba(255,255,255,.09)"}`,color:copied?"#34d399":"rgba(255,255,255,.45)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .25s",fontFamily:"'Outfit',sans-serif"}}>
              {copied?"✓ Copied!":"📋  Copy email address"}
            </button>
          </Glass>
        </FadeIn>
        <FadeIn dir="right">
          <Glass style={{padding:isMobile?22:32,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,.14) 0%,transparent 70%)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 12px"}}>
                <ContactInput label="Your Name *"  value={form.name}    onChange={set("name")}/>
                <ContactInput label="Your Email *" type="email" value={form.email} onChange={set("email")}/>
              </div>
              <ContactInput label="Subject (optional)" value={form.subject} onChange={set("subject")}/>
              <ContactInput label="Your Message *" value={form.message} onChange={set("message")} multiline/>
              <div style={{display:"flex",alignItems:"center",gap:16,marginTop:8,flexWrap:"wrap"}}>
                <button onClick={handleSubmit} style={{display:"inline-flex",alignItems:"center",gap:9,padding:"13px 28px",borderRadius:99,border:"none",cursor:"pointer",background:btnGrad,color:"#000",fontWeight:800,fontSize:14,fontFamily:"'Outfit',sans-serif",boxShadow:"0 0 30px rgba(34,211,238,.3)",transition:"all .3s",opacity:status==="sending"?.8:1}}>
                  <Send size={16}/> {btnLabel}
                </button>
                <span style={{fontSize:12,color:"rgba(255,255,255,.28)",lineHeight:1.5}}>Opens your default<br/>mail client</span>
              </div>
              {status==="sent"&&<div style={{marginTop:14,padding:"10px 16px",borderRadius:10,background:"rgba(52,211,153,.09)",border:"1px solid rgba(52,211,153,.28)",color:"#34d399",fontSize:13}}>✓ Mail client opened. If not, email <strong>adhurimthaqi@gmx.ch</strong> directly.</div>}
              {status==="error"&&<div style={{marginTop:14,padding:"10px 16px",borderRadius:10,background:"rgba(248,113,113,.09)",border:"1px solid rgba(248,113,113,.28)",color:"#f87171",fontSize:13}}>✗ Please fill in your name, email, and message.</div>}
            </div>
          </Glass>
        </FadeIn>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════════════ */
function NavLink({href,children}){
  const [hov,setHov]=useState(false);
  return <a href={href} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{color:hov?"#22d3ee":"rgba(255,255,255,.55)",textDecoration:"none",fontSize:13,fontWeight:500,letterSpacing:1,textTransform:"uppercase"}}>{children}</a>;
}

function NavBar({scrollPct,isMobile}){
  const [atTop,setAtTop]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{const h=()=>setAtTop(window.scrollY<40);window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h);},[]);
  const links=["About","Services","Skills","Experience","Projects","Contact","CV"];
  return(
    <header style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:atTop?"transparent":"rgba(5,5,10,.88)",borderBottom:atTop?"none":"1px solid rgba(255,255,255,.07)",backdropFilter:atTop?"none":"blur(20px)",transition:"background .3s,border .3s,backdrop-filter .3s"}}>
      <div style={{position:"absolute",top:0,left:0,height:2,width:`${scrollPct*100}%`,background:"linear-gradient(90deg,#22d3ee,#c084fc)",boxShadow:"0 0 8px rgba(34,211,238,.6)"}}/>
      <nav style={{maxWidth:1200,margin:"0 auto",padding:"15px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"#fff"}}><span style={{color:"#22d3ee"}}>A</span>T</span>
        {!isMobile?<div style={{display:"flex",gap:28}}>{links.map(l=><NavLink key={l} href={`#${l.toLowerCase()}`}>{l}</NavLink>)}</div>
          :<button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"1px solid rgba(255,255,255,.2)",borderRadius:8,padding:"6px 10px",color:"#fff",cursor:"pointer",fontSize:18}}>☰</button>}
      </nav>
      {isMobile&&menuOpen&&(
        <div style={{background:"rgba(5,5,10,.96)",borderTop:"1px solid rgba(255,255,255,.07)",padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
          {links.map(l=><a key={l} href={`#${l.toLowerCase()}`} onClick={()=>setMenuOpen(false)} style={{color:"rgba(255,255,255,.7)",textDecoration:"none",fontSize:14,fontWeight:500,letterSpacing:1,textTransform:"uppercase"}}>{l}</a>)}
        </div>
      )}
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════
   APP
════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════
   EXPERIENCE MODAL
════════════════════════════════════════════════════════════════ */
function ExperienceModal({item,onClose}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const t=requestAnimationFrame(()=>setVisible(true));
    const esc=(e)=>{if(e.key==="Escape")setVisible(false)||setTimeout(onClose,300);};
    document.addEventListener("keydown",esc);
    document.body.style.overflow="hidden";
    return()=>{cancelAnimationFrame(t);document.removeEventListener("keydown",esc);document.body.style.overflow="";};
  },[]);
  const close=()=>{setVisible(false);setTimeout(onClose,300);};
  return(
    <div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,zIndex:1000,background:`rgba(5,5,10,${visible?.88:0})`,backdropFilter:visible?"blur(18px)":"none",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px",transition:"background .35s,backdrop-filter .35s"}}>
      <div style={{width:"100%",maxWidth:620,maxHeight:"88vh",overflowY:"auto",borderRadius:24,background:"rgba(8,8,18,.98)",border:`1px solid ${item.color}44`,boxShadow:`0 0 100px ${item.color}1a,0 0 0 1px rgba(255,255,255,.05)`,opacity:visible?1:0,transform:visible?"scale(1) translateY(0)":"scale(.94) translateY(20px)",transition:"opacity .35s cubic-bezier(.4,0,.2,1),transform .35s cubic-bezier(.4,0,.2,1)",padding:"26px 28px 28px",scrollbarWidth:"thin"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{minWidth:0}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff"}}>{item.role}</h2>
            <div style={{color:item.color,fontSize:14,fontWeight:600,marginTop:3}}>{item.company}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{padding:"5px 13px",borderRadius:99,background:item.color+"18",border:`1px solid ${item.color}33`,color:item.color,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{item.period}</span>
            <button onClick={close} style={{width:34,height:34,borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:15,fontFamily:"'Outfit',sans-serif"}}>✕</button>
          </div>
        </div>
        <p style={{color:"rgba(255,255,255,.6)",fontSize:14.5,lineHeight:1.7,marginBottom:20}}>{item.details}</p>
        {item.bullets&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>What I did</div>
            {item.bullets.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:11,alignItems:"flex-start",marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:item.color,marginTop:6,flexShrink:0,boxShadow:`0 0 6px ${item.color}`}}/>
                <span style={{color:"rgba(255,255,255,.66)",fontSize:13.5,lineHeight:1.6}}>{b}</span>
              </div>
            ))}
          </div>
        )}
        {item.tech&&(
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Tools & Tech</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {item.tech.map(t=><span key={t} style={{padding:"5px 13px",borderRadius:99,background:item.color+"14",border:`1px solid ${item.color}30`,color:item.color,fontSize:12,fontWeight:600}}>{t}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AI ASSISTANT — a talking guide grounded in the CV + projects
════════════════════════════════════════════════════════════════ */
/* AI avatar: gradient orb with a sparkle, used on the launcher and chat header. */
function AiOrb({size}){
  return(
    <div aria-hidden="true" style={{width:size,height:size,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 30% 25%,#a5f3fc 0%,#22d3ee 28%,#7c3aed 72%,#3b0764 100%)",boxShadow:"inset 0 -4px 12px rgba(0,0,0,.35),inset 0 3px 8px rgba(255,255,255,.3)"}}>
      <Sparkles size={Math.round(size*.48)} color="#fff" strokeWidth={2.2}/>
    </div>
  );
}
function AiAssistant(){
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Hi 👋 I'm an AI assistant trained on Adhurim's CV. Ask me about his skills, projects, or experience."}]);
  const bodyRef=useRef(null);
  useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=bodyRef.current.scrollHeight;},[msgs,open,busy]);
  const send=async(q)=>{
    const text=(q??input).trim(); if(!text||busy)return;
    setInput("");
    const history=msgs.slice(-4);
    setMsgs(m=>[...m,{role:"user",content:text}]);
    setBusy(true);
    try{
      const r=await fetch("/api/assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:text,history})});
      const d=await r.json().catch(()=>({}));
      const reply=d.reply||"Sorry, something went wrong — try the contact section below.";
      setMsgs(m=>[...m,{role:"assistant",content:reply}]);
    }catch{
      setMsgs(m=>[...m,{role:"assistant",content:"I couldn't reach the server just now. You can still explore the projects or use the contact section."}]);
    }finally{setBusy(false);}
  };
  const chips=["What are his top skills?","Tell me about his projects","Is he available for work?"];
  const bubble=(role)=>({
    alignSelf:role==="user"?"flex-end":"flex-start",
    maxWidth:"85%",
    padding:"9px 13px",
    borderRadius:role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
    background:role==="user"?"linear-gradient(135deg,#22d3ee,#0891b2)":"rgba(255,255,255,.06)",
    color:role==="user"?"#04121a":"rgba(255,255,255,.9)",
    border:role==="user"?"none":"1px solid rgba(255,255,255,.09)",
    fontSize:14,lineHeight:1.5,fontWeight:role==="user"?600:400,
  });
  return(
    <>
      {/* Launcher */}
      <button onClick={()=>setOpen(o=>!o)} aria-label="Ask Adhurim's AI assistant"
        style={{position:"fixed",bottom:24,right:24,zIndex:1500,width:64,height:64,borderRadius:"50%",border:"2px solid rgba(34,211,238,.6)",padding:0,overflow:"hidden",cursor:"pointer",background:"#05050a",boxShadow:"0 8px 30px rgba(34,211,238,.35)",transition:"transform .2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <AiOrb size={60}/>
        <span style={{position:"absolute",bottom:2,right:2,width:16,height:16,borderRadius:"50%",background:"#34d399",border:"2px solid #05050a"}}/>
      </button>

      {/* Panel */}
      {open&&(
        <div style={{position:"fixed",bottom:100,right:24,zIndex:1500,width:"min(370px,calc(100vw - 32px))",height:"min(520px,calc(100vh - 140px))",display:"flex",flexDirection:"column",borderRadius:20,overflow:"hidden",background:"rgba(8,8,18,.97)",border:"1px solid rgba(34,211,238,.25)",boxShadow:"0 20px 70px rgba(0,0,0,.6)",backdropFilter:"blur(16px)"}}>
          {/* header */}
          <div style={{display:"flex",alignItems:"center",gap:11,padding:"13px 15px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
            <AiOrb size={38}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15}}>Adhurim's AI</div>
              <div style={{color:"#34d399",fontSize:11,fontWeight:600}}>● online</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{width:34,height:34,borderRadius:10,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:15}}>✕</button>
          </div>
          {/* messages */}
          <div ref={bodyRef} style={{flex:1,overflowY:"auto",padding:15,display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=><div key={i} style={bubble(m.role)}>{m.content}</div>)}
            {busy&&<div style={{...bubble("assistant"),color:"rgba(255,255,255,.4)"}}>typing…</div>}
            {msgs.length<=1&&!busy&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
                {chips.map(c=><button key={c} onClick={()=>send(c)} style={{padding:"7px 12px",borderRadius:99,border:"1px solid rgba(34,211,238,.3)",background:"rgba(34,211,238,.06)",color:"#67e8f9",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{c}</button>)}
              </div>
            )}
          </div>
          {/* input */}
          <form onSubmit={e=>{e.preventDefault();send();}} style={{display:"flex",gap:8,padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about Adhurim…" style={{flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:99,color:"#fff",fontSize:14,padding:"10px 15px",outline:"none",fontFamily:"'Outfit',sans-serif"}}/>
            <button type="submit" disabled={busy||!input.trim()} aria-label="Send" style={{width:42,height:42,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#22d3ee,#0891b2)",color:"#04121a",fontWeight:800,cursor:busy?"not-allowed":"pointer",opacity:busy||!input.trim()?.5:1,flexShrink:0}}>➤</button>
          </form>
        </div>
      )}
    </>
  );
}

export default function App(){
  const [mouse,setMouse]=useState({x:-200,y:-200});
  const [loaded,setLoaded]=useState(false);
  const [activeProject,setActiveProject]=useState(null);
  const [activeExp,setActiveExp]=useState(null);
  const scrollPct=useScrollPct();
  const winW=useWindowWidth();
  const isMobile=winW<768;
  const isTablet=winW>=768&&winW<1024;
  const extraProjects=useProjects();
  // CMS-first: once you add projects in /admin, only those show (fully
  // editable & deletable). The built-in games are just a starter showcase
  // shown until your first project exists.
  // Folder projects first, then anything added via /admin (skipping same-title duplicates).
  const allProjects=[...games,...extraProjects.filter(p=>!games.some(g=>g.title.toLowerCase()===String(p.title||"").toLowerCase()))];
  const gamesVr=allProjects.filter(p=>(p.type||"game")==="game");
  const work=allProjects.filter(p=>(p.type||"game")!=="game");
  const [immersive,setImmersive]=useState(false);

  useEffect(()=>{

    const style=document.createElement("style");
    style.id="pt-global";
    style.textContent=`
      *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
      body{background:#05050a;color:#fff;font-family:'Outfit',sans-serif;overflow-x:hidden;cursor:none;-webkit-font-smoothing:antialiased}
      a{cursor:none;text-decoration:none}button{cursor:none}
      ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#080810}::-webkit-scrollbar-thumb{background:linear-gradient(#22d3ee,#c084fc);border-radius:99px}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
      .three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
      .hero-row{display:flex;align-items:center;gap:56px;width:100%}
      .hero-text{flex:1;min-width:0}.hero-photo{flex-shrink:0}
      @media(max-width:1023px){.two-col{grid-template-columns:1fr}.three-col{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:767px){.hero-row{flex-direction:column;gap:40px;text-align:center;align-items:center}.hero-photo{order:-1}.three-col{grid-template-columns:1fr}.two-col{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    const t=setTimeout(()=>setLoaded(true),80);
    const mv=(e)=>setMouse({x:e.clientX,y:e.clientY});
    window.addEventListener("mousemove",mv);
    return()=>{window.removeEventListener("mousemove",mv);clearTimeout(t);};
  },[]);

  const photoSize=isMobile?260:isTablet?300:340;

  return(
    <div style={{background:"#05050a",minHeight:"100vh",overflowX:"hidden"}}>
      {!isMobile&&<Cursor pos={mouse}/>}
      {activeProject&&<ProjectModal project={activeProject} onClose={()=>setActiveProject(null)}/>}
      {activeExp&&<ExperienceModal item={activeExp} onClose={()=>setActiveExp(null)}/>}
      {immersive&&<Suspense fallback={<div style={{position:"fixed",inset:0,zIndex:2000,background:"#05050a",display:"flex",alignItems:"center",justifyContent:"center",color:"#22d3ee",fontFamily:"'Syne',sans-serif",letterSpacing:6,fontSize:14}}>LOADING…</div>}><ImmersiveGallery projects={gamesVr} onExit={()=>setImmersive(false)} onOpen={setActiveProject}/></Suspense>}
      <AiAssistant/>
      <GridCanvas mouse={mouse}/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"15%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,.06) 0%,transparent 70%)",animation:"float 8s ease infinite"}}/>
        <div style={{position:"absolute",top:"55%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,.06) 0%,transparent 70%)",animation:"float 10s ease infinite reverse"}}/>
      </div>

      <NavBar scrollPct={scrollPct} isMobile={isMobile}/>

      <main style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:`0 ${isMobile?16:24}px 120px`}}>

        {/* HERO */}
        <section id="about" style={{minHeight:"92vh",display:"flex",alignItems:"center",paddingTop:isMobile?80:96}}>
          <div className="hero-row">
            <div className="hero-text">
              <div style={{opacity:loaded?1:0,transform:loaded?"none":"translateY(-12px)",transition:"all .8s ease .05s",marginBottom:20}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 14px",background:"rgba(34,211,238,.08)",border:"1px solid rgba(34,211,238,.2)",borderRadius:99,fontSize:12,color:"#67e8f9",letterSpacing:3,textTransform:"uppercase"}}>
                  <Globe size={11}/> Zürich, Switzerland
                </span>
              </div>
              <h1 style={{fontFamily:"'Syne',sans-serif",lineHeight:1.02,marginBottom:20}}>
                {["Adhurim","Thaqi"].map((w,i)=>(
                  <div key={w} style={{opacity:loaded?1:0,transform:loaded?"none":"translateY(40px)",transition:`all 1s cubic-bezier(.4,0,.2,1) ${.15+i*.15}s`,fontSize:`clamp(3rem,${isMobile?"14vw":"7.5vw"},6rem)`,fontWeight:800,background:"linear-gradient(135deg,#fff 30%,#a5f3fc 60%,#e879f9 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap"}}>{w}</div>
                ))}
              </h1>
              <p style={{opacity:loaded?1:0,transform:loaded?"none":"translateY(20px)",transition:"all .9s ease .45s",color:"rgba(255,255,255,.55)",fontSize:isMobile?15:17,lineHeight:1.65,maxWidth:480,marginBottom:28}}>
                Developer and designer from Zürich.<br/>
                I study Immersive Technologies at HSLU and build websites, Unity games and AR/VR projects. I care about how things look just as much as how they work.
              </p>
              <div style={{opacity:loaded?1:0,transition:"all .9s ease .55s",display:"flex",gap:12,marginBottom:24,justifyContent:isMobile?"center":"flex-start"}}>
                {[
                  {label:"GitHub",href:"https://github.com/AdhurimThaqi",path:"M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.5 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"},
                  {label:"LinkedIn",href:"https://www.linkedin.com/in/adhurim-thaqi-b0b9a9193/",path:"M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z"},
                ].map(s=>(
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}
                    style={{width:44,height:44,borderRadius:12,display:"inline-flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.14)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.7)",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="#22d3ee";e.currentTarget.style.borderColor="rgba(34,211,238,.5)";e.currentTarget.style.background="rgba(34,211,238,.1)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.7)";e.currentTarget.style.borderColor="rgba(255,255,255,.14)";e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.transform="none";}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={s.path}/></svg>
                  </a>
                ))}
              </div>
              <div style={{opacity:loaded?1:0,transition:"all .9s ease .6s",display:"flex",gap:14,flexWrap:"wrap",marginBottom:isMobile?32:44,justifyContent:isMobile?"center":"flex-start"}}>
                <a href="#experience" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 26px",borderRadius:99,background:"rgba(34,211,238,.12)",border:"1px solid rgba(34,211,238,.3)",color:"#a5f3fc",fontWeight:600,fontSize:14,transition:"background .2s,box-shadow .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,211,238,.22)";e.currentTarget.style.boxShadow="0 0 30px rgba(34,211,238,.2)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,211,238,.12)";e.currentTarget.style.boxShadow="none";}}>View Work <ArrowDown size={15}/></a>
                <button onClick={downloadCV} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 26px",borderRadius:99,border:"1px solid rgba(255,255,255,.15)",background:"transparent",color:"rgba(255,255,255,.8)",fontWeight:600,fontSize:14,fontFamily:"'Outfit',sans-serif",cursor:"pointer",transition:"border-color .2s,color .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(192,132,252,.5)";e.currentTarget.style.color="#e879f9";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.15)";e.currentTarget.style.color="rgba(255,255,255,.8)";}}>
                  <Download size={15}/> Download CV
                </button>
              </div>
              <div style={{opacity:loaded?1:0,transition:"all .9s ease .7s",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {stats.map(s=>(
                  <Glass key={s.label} style={{padding:"14px 16px"}} hover>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:isMobile?26:32,fontWeight:800,background:"linear-gradient(135deg,#22d3ee,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.value}</div>
                    <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:2,lineHeight:1.3}}>{s.label}</div>
                  </Glass>
                ))}
              </div>
            </div>
            <div className="hero-photo" style={{opacity:loaded?1:0,transform:loaded?"none":"translateX(30px) scale(.96)",transition:"all 1.2s cubic-bezier(.4,0,.2,1) .3s",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              <div style={{width:photoSize,borderRadius:24,overflow:"hidden",border:"1px solid rgba(34,211,238,.2)",boxShadow:"0 0 60px rgba(34,211,238,.1),0 0 0 1px rgba(255,255,255,.04)",position:"relative",flexShrink:0}}>
                <img src={PHOTO} alt="Adhurim Thaqi" style={{width:"100%",aspectRatio:"4/5",objectFit:"cover",objectPosition:"center 18%",display:"block",WebkitMaskImage:"radial-gradient(ellipse 90% 95% at 50% 38%,black 45%,transparent 100%)",maskImage:"radial-gradient(ellipse 90% 95% at 50% 38%,black 45%,transparent 100%)"}}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:.5}}>Adhurim Thaqi</div>
                <div style={{color:"rgba(255,255,255,.35)",fontSize:12,marginTop:3}}>Zürich · Switzerland</div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" style={{paddingTop:isMobile?60:100}}>
          <SectionHeading tag="What I do" title="Services"/>
          <div className="three-col">
            {services.map((s,i)=>(
              <FadeIn key={s.title} delay={i*.08}>
                <Glass hover style={{padding:24,height:"100%"}}>
                  <s.icon size={22} style={{color:"#22d3ee",marginBottom:14}}/>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:8}}>{s.title}</div>
                  <div style={{color:"rgba(255,255,255,.45)",fontSize:13.5,lineHeight:1.65}}>{s.desc}</div>
                </Glass>
              </FadeIn>
            ))}
          </div>
        </section>

        <SectionDivider/>

        {/* SKILLS */}
        <section id="skills" style={{paddingTop:isMobile?60:100}}>
          <SectionHeading tag="What I work with" title="Skills & Tools" icon={Trophy}/>
          <div className="two-col">
            <FadeIn dir="left">
              <Glass style={{padding:isMobile?20:28}}>
                <div style={{fontWeight:700,fontSize:14,color:"#22d3ee",letterSpacing:1,textTransform:"uppercase",marginBottom:24}}>Proficiency</div>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {hardSkills.map(([n,v],i)=><SkillBar key={n} name={n} value={v} index={i}/>)}
                </div>
              </Glass>
            </FadeIn>
            <FadeIn dir="right">
              <Glass style={{padding:isMobile?20:28}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,fontWeight:700,fontSize:14,color:"#c084fc",letterSpacing:1,textTransform:"uppercase"}}>
                  <Languages size={16}/> Languages & Stack
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:24}}>
                  {languages.map(([name,level])=>(
                    <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.07)",background:"rgba(255,255,255,.025)"}}>
                      <span style={{fontSize:14,fontWeight:500}}>{name}</span>
                      <span style={{fontSize:12,color:"#67e8f9",fontWeight:600}}>{level}</span>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:18}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.35)",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Full Stack</div>
                  {["React · Vue.js · Flutter · Node.js · Spring Boot","Docker · CI/CD · AWS · Azure · Firebase","Unity · C# · Blender · AutoCAD · 3ds Max","Figma · Adobe XD · Adobe Creative Suite"].map(row=>(
                    <div key={row} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.04)",color:"rgba(255,255,255,.55)",fontSize:13}}>
                      <ChevronRight size={11} color="#22d3ee"/>{row}
                    </div>
                  ))}
                </div>
              </Glass>
            </FadeIn>
          </div>
        </section>

        <SectionDivider/>

        {/* EXPERIENCE */}
        <section id="experience" style={{paddingTop:isMobile?60:100}}>
          <SectionHeading tag="Where I have worked" title="Experience" icon={Briefcase} iconColor="#22d3ee"/>
          <div style={{position:"relative",padding:`0 ${isMobile?8:32}px`}}>
            <div style={{position:"absolute",left:isMobile?8:32,top:0,bottom:0,width:1,background:"linear-gradient(to bottom,transparent,rgba(34,211,238,.4),rgba(192,132,252,.3),transparent)"}}/>
            <div style={{position:"absolute",right:isMobile?8:32,top:0,bottom:0,width:1,background:"linear-gradient(to bottom,transparent,rgba(34,211,238,.15),rgba(192,132,252,.15),transparent)"}}/>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {timeline.map((item,i)=>(
                <FadeIn key={item.role} delay={i*.09} dir="right">
                  <div style={{position:"relative"}} onClick={()=>setActiveExp(item)} role="button" tabIndex={0}
                    onKeyDown={e=>{if(e.key==="Enter")setActiveExp(item);}}>
                    <div style={{position:"absolute",left:isMobile?-16:-24,top:20,width:12,height:12,borderRadius:"50%",background:item.color,border:"3px solid #05050a",boxShadow:`0 0 12px ${item.color}88`}}/>
                    <Glass hover style={{padding:isMobile?16:22,cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:6}}>
                        <div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:isMobile?14:16}}>{item.role}</div>
                          <div style={{color:item.color,fontSize:12,fontWeight:600,marginTop:2}}>{item.company}</div>
                        </div>
                        <span style={{padding:"3px 10px",borderRadius:99,background:item.color+"18",border:`1px solid ${item.color}33`,color:item.color,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{item.period}</span>
                      </div>
                      <p style={{color:"rgba(255,255,255,.5)",fontSize:13.5,lineHeight:1.65}}>{item.details}</p>
                      <div style={{color:item.color,fontSize:12,fontWeight:600,marginTop:10,opacity:.85}}>View details →</div>
                    </Glass>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider/>

        {/* PROJECTS */}
        <section id="projects" style={{paddingTop:isMobile?60:100}}>
          {gamesVr.length>0&&(<>
            <SectionHeading tag="Unity · C# · AR/VR" title="Games & VR" icon={Gamepad2} iconColor="#a78bfa"/>
            <FadeIn>
              <div onClick={()=>setImmersive(true)} role="button" tabIndex={0}
                onKeyDown={e=>{if(e.key==="Enter")setImmersive(true);}}
                style={{cursor:"pointer",marginBottom:22,borderRadius:20,padding:isMobile?"20px 20px":"22px 28px",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap",position:"relative",overflow:"hidden",border:"1px solid rgba(34,211,238,.25)",background:"linear-gradient(120deg,rgba(34,211,238,.10),rgba(192,132,252,.10))",backdropFilter:"blur(14px)",transition:"transform .25s,box-shadow .25s,border-color .25s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 18px 60px rgba(34,211,238,.18)";e.currentTarget.style.borderColor="rgba(34,211,238,.5)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="rgba(34,211,238,.25)";}}>
                <div style={{fontSize:34,filter:"drop-shadow(0 0 12px rgba(34,211,238,.6))"}}>🥽</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:isMobile?18:21}}>Enter the Immersive Gallery</div>
                  <div style={{color:"rgba(255,255,255,.55)",fontSize:13.5,marginTop:3}}>Walk through my games and VR projects in 3D</div>
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:99,background:"linear-gradient(135deg,#22d3ee,#0891b2)",color:"#04121a",fontWeight:700,fontSize:13.5}}>Launch 3D ✦</div>
              </div>
            </FadeIn>
            <div className="three-col">
              {gamesVr.map((g,i)=><GameCard key={g.id||g.title} game={g} index={i} onOpen={setActiveProject}/>)}
            </div>
          </>)}
          {work.length>0&&(<>
            <div style={{height:gamesVr.length>0?(isMobile?52:80):0}}/>
            <SectionHeading tag="Web · Development · Design" title="Work & Projects" icon={Code} iconColor="#22d3ee"/>
            <div className="three-col">
              {work.map((g,i)=><GameCard key={g.id||g.title} game={g} index={i} onOpen={setActiveProject}/>)}
            </div>
          </>)}
        </section>

        <SectionDivider/>

        {/* CONTACT */}
        <ContactSection isMobile={isMobile}/>

        <SectionDivider/>

        {/* CV */}
        <section id="cv" style={{paddingTop:isMobile?60:100}}>
          <SectionHeading tag="Download" title="My CV" icon={Download} iconColor="#22d3ee"/>
          <FadeIn>
            <Glass style={{padding:isMobile?24:36,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",right:-60,top:-60,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(180px,1fr) 2fr",gap:28,alignItems:"center"}}>
                <div>
                  <img src={PHOTO} alt="Adhurim Thaqi" style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",objectPosition:"center 18%",borderRadius:18,border:"1px solid rgba(34,211,238,.2)"}}/>
                </div>
                <div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 14px",background:"rgba(34,211,238,.08)",border:"1px solid rgba(34,211,238,.2)",borderRadius:99,fontSize:11,color:"#67e8f9",letterSpacing:3,textTransform:"uppercase",marginBottom:16}}>
                    <User size={12}/> Premium CV Profile
                  </div>
                  <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(1.6rem,3vw,2.4rem)",marginBottom:10}}>Adhurim Thaqi</h3>
                  <p style={{color:"rgba(255,255,255,.5)",fontSize:15,marginBottom:16,lineHeight:1.5}}>Developer · Designer · Immersive Tech student at HSLU</p>
                  <p style={{color:"rgba(255,255,255,.38)",fontSize:13.5,lineHeight:1.7,marginBottom:24}}>
                    This downloadable CV showcases design-thinking, immersive-tech education, software engineering projects, and multidisciplinary creative production in one clean, client-ready format.
                  </p>
                  <button onClick={downloadCV} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 26px",borderRadius:99,background:"rgba(34,211,238,.12)",border:"1px solid rgba(34,211,238,.3)",color:"#a5f3fc",fontWeight:600,fontSize:14,fontFamily:"'Outfit',sans-serif",cursor:"pointer",transition:"background .2s,box-shadow .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,211,238,.22)";e.currentTarget.style.boxShadow="0 0 30px rgba(34,211,238,.2)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,211,238,.12)";e.currentTarget.style.boxShadow="none";}}>
                    <Download size={15}/> Download CV (PDF)
                  </button>
                </div>
              </div>
            </Glass>
          </FadeIn>
        </section>

      </main>

      <footer style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"28px 24px",textAlign:"center",color:"rgba(255,255,255,.22)",fontSize:13,position:"relative",zIndex:1}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"rgba(255,255,255,.55)",marginRight:14}}><span style={{color:"#22d3ee"}}>A</span>DHURIM THAQI</span>
        Creative Developer · Zürich · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
