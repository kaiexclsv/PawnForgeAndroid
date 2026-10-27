const $=id=>document.getElementById(id);
const starter=`#include <a_samp>

main()
{
    print("PawnForge is ready!");
}

public OnGameModeInit()
{
    print("Southside Roleplay started.");
    return 1;
}
`;
let files=[{name:"main.pwn",content:starter,dirty:false},{name:"config.inc",content:"// Add your project constants here.\\n",dirty:false}];
let active=0;
const keywords=new Set(("if else for while do switch case default return break continue new const static stock public forward native enum sizeof defined state tagof true false true false").split(" "));
const pawns=new Set(("main OnGameModeInit OnGameModeExit OnPlayerConnect OnPlayerDisconnect OnPlayerSpawn OnPlayerDeath OnPlayerCommandText OnPlayerUpdate OnDialogResponse OnPlayerStateChange OnVehicleSpawn OnVehicleDeath").split(" "));
function escapeHtml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function colorize(src){
 let out="",i=0;
 while(i<src.length){
  const rest=src.slice(i); let m;
  if((m=/^(#\s*[A-Za-z_]\w*)/.exec(rest))){out+=`<span class="pp">${escapeHtml(m[0])}</span>`;i+=m[0].length;continue}
  if((m=/^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(rest))){out+=`<span class="comment">${escapeHtml(m[0])}</span>`;i+=m[0].length;continue}
  if((m=/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/.exec(rest))){out+=`<span class="str">${escapeHtml(m[0])}</span>`;i+=m[0].length;continue}
  if((m=/^\b\d+(?:\.\d+)?\b/.exec(rest))){out+=`<span class="num">${m[0]}</span>`;i+=m[0].length;continue}
  if((m=/^[A-Za-z_]\w*/.exec(rest))){let cls=keywords.has(m[0])?"kw":pawns.has(m[0])?"fn":"";out+=cls?`<span class="${cls}">${m[0]}</span>`:m[0];i+=m[0].length;continue}
  out+=escapeHtml(src[i]);i++;
 }
 return out+"\n";
}
function renderHighlight(){const v=$("editor").value;$("highlight").innerHTML=colorize(v);$("lineNumbers").textContent=Array.from({length:v.split("\n").length},(_,i)=>i+1).join("\n");syncScroll();updateCursor()}
function syncScroll(){$("highlight").scrollTop=$("editor").scrollTop;$("highlight").scrollLeft=$("editor").scrollLeft;$("lineNumbers").scrollTop=$("editor").scrollTop}
function updateCursor(){const e=$("editor"),before=e.value.slice(0,e.selectionStart),line=before.split("\n").length,col=before.length-(before.lastIndexOf("\n")+1)+1;$("cursorPos").textContent=`Ln ${line}, Col ${col}`}
function current(){return files[active]}
function markDirty(){current().content=$("editor").value;current().dirty=true;$("fileStatus").textContent="Unsaved changes";renderTabs();renderHighlight();persist()}
function renderTabs(){const t=$("tabs");t.innerHTML="";files.forEach((f,i)=>{const b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=f.name;if(f.dirty){const d=document.createElement("span");d.className="dirty";d.textContent="●";b.appendChild(d)}b.onclick=()=>switchFile(i);t.appendChild(b)});$("currentFile").textContent=current().name}
function switchFile(i){files[active].content=$("editor").value;active=i;$("editor").value=current().content;$("fileStatus").textContent=current().dirty?"Unsaved changes":"Saved locally";renderTabs();renderHighlight()}
function persist(){try{localStorage.setItem("pawnforge.files",JSON.stringify(files));localStorage.setItem("pawnforge.active",String(active))}catch(e){}}
function restore(){try{const f=JSON.parse(localStorage.getItem("pawnforge.files"));if(Array.isArray(f)&&f.length)files=f;const a=Number(localStorage.getItem("pawnforge.active"));if(Number.isInteger(a)&&a>=0&&a<files.length)active=a}catch(e){}$("editor").value=current().content;renderTabs();renderHighlight()}
function log(message,kind=""){const p=document.createElement("p");if(kind)p.className=kind;p.textContent=message;$("console").appendChild(p);$("console").scrollTop=$("console").scrollHeight}
function download(name,content,type="text/plain"){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$("editor").addEventListener("input",markDirty);$("editor").addEventListener("scroll",syncScroll);$("editor").addEventListener("click",updateCursor);$("editor").addEventListener("keyup",updateCursor);
$("editor").addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();const a=e.target,st=a.selectionStart,en=a.selectionEnd;a.setRangeText("    ",st,en,"end");markDirty()}if(e.key==="Enter"){const a=e.target,st=a.selectionStart,line=a.value.slice(0,st).split("\n").pop(),indent=(line.match(/^\s*/)||[""])[0]+(line.trim().endsWith("{")?"    ":"");if(indent){e.preventDefault();a.setRangeText("\n"+indent,st,a.selectionEnd,"end");markDirty()}}});
$("saveBtn").onclick=()=>{const f=current();f.content=$("editor").value;if(window.AndroidBridge&&window.AndroidBridge.saveTextFile){window.AndroidBridge.saveTextFile(f.name,f.content,"text/plain")}else{download(f.name,f.content)}f.dirty=false;$("fileStatus").textContent="Downloaded";renderTabs();persist();log(`Saved ${f.name} to your device.`,"ok")};
$("openBtn").onclick=()=>$("fileInput").click();
$("fileInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;const content=await f.text(),idx=files.findIndex(x=>x.name===f.name);if(idx>=0){files[idx].content=content;files[idx].dirty=false;switchFile(idx)}else{files.push({name:f.name,content,dirty:false});switchFile(files.length-1)}$("fileStatus").textContent="Opened";persist();e.target.value=""};
$("compileBtn").onclick=async()=>{const endpoint=localStorage.getItem("pawnforge.endpoint")||"";const source=$("editor").value;const filename=current().name;$("console").innerHTML="";log(`Compiling ${filename}…`);if(!filename.endsWith(".pwn")){log("Select a .pwn file to compile.","error");return}if(!endpoint){log("Compiler is not connected yet.","error");log("Open ☰ → Compiler settings and enter a real Pawn compiler API endpoint.");log("This editor does not fake a successful compile. A backend running pawncc is required.");$("settingsPanel").classList.remove("hidden");return}try{$("compileBtn").disabled=true;const headers={"Content-Type":"application/json"};const key=localStorage.getItem("pawnforge.apikey");if(key)headers.Authorization="Bearer "+key;const r=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify({filename,source})});const data=await r.json();if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);log(data.output||"Compiler returned no output.",data.success?"ok":"error");if(data.success&&data.amxUrl){const a=document.createElement("a");a.href=data.amxUrl;a.textContent="Download compiled .amx";a.target="_blank";a.rel="noopener";a.style.display="block";a.style.marginTop="8px";$("console").appendChild(a)}else if(data.success&&data.amxBase64){const bin=atob(data.amxBase64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));if(window.AndroidBridge&&window.AndroidBridge.saveBase64File){window.AndroidBridge.saveBase64File(filename.replace(/\.pwn$/i,".amx"),data.amxBase64)}else{download(filename.replace(/\.pwn$/i,".amx"),bytes,"application/octet-stream")}}else if(data.success)log("Compile reported success, but no AMX download was provided.","error")}catch(err){log("Compile request failed: "+err.message,"error");log("Check endpoint URL, HTTPS/CORS, and backend logs.")}finally{$("compileBtn").disabled=false}};
$("clearConsole").onclick=()=>$("console").innerHTML="";
$("menuBtn").onclick=()=> $("drawer").classList.toggle("hidden");
$("projectBtn").onclick=()=> $("drawer").classList.toggle("hidden");
$("drawer").addEventListener("click",e=>{const action=e.target.dataset.action;if(!action)return;$("drawer").classList.add("hidden");if(action==="new"){const name=prompt("New file name","newfile.pwn");if(!name)return;const clean=name.endsWith(".pwn")||name.endsWith(".inc")?name:name+".pwn";files.push({name:clean,content:"",dirty:false});switchFile(files.length-1);persist()}if(action==="open")$("fileInput").click();if(action==="project")$("projectInput").click();if(action==="settings")$("settingsPanel").classList.remove("hidden");if(action==="about")alert("PawnForge Mobile Editor\\nA lightweight source editor for SA-MP/open.mp Pawn projects. Compiler backend must be configured separately.")});
$("projectInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;log("ZIP import needs a ZIP parser in a future version. For now, extract the project first and open individual .pwn/.inc files.","error");e.target.value=""};
$("closeSettings").onclick=()=>$("settingsPanel").classList.add("hidden");
$("saveSettings").onclick=()=>{localStorage.setItem("pawnforge.endpoint",$("endpoint").value.trim());localStorage.setItem("pawnforge.apikey",$("apiKey").value);$("settingsPanel").classList.add("hidden");log("Compiler settings saved on this device.");};
$("endpoint").value=localStorage.getItem("pawnforge.endpoint")||"";$("apiKey").value=localStorage.getItem("pawnforge.apikey")||"";
restore();
