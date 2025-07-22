exports.id=593,exports.ids=[593],exports.modules={3955:(e,t,s)=>{"use strict";s.d(t,{L:()=>i,S:()=>l});var o=s(37094),r=s(15047),n=s(90861),a=s(62976);function i(e,t,s){let a=(0,r.a_)();if(e.group_id!==a){console.log("a toast here"),(0,n.A)(`New message in group "${s}"`);return}let i=e.sender_id===o.dZ.UserID,l=i?o.dZ.Username:t,d=l[0]?.toUpperCase()||"?",c=document.getElementById("chat-messages");if(!c)return;let p=`
    <div class="chat ${i?"chat-end":"chat-start"}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${d}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${l}
        <time class="text-xs opacity-50">${e.created_at?.slice(0,16).replace("T"," ")}</time>
      </div>
      <div class="chat-bubble bg-base-200 text-black" style="
        word-break: break-word;        
        overflow-wrap: break-word;      
        overflow-x: hidden;">
        ${e.text}
      </div>
      <div class="chat-footer opacity-50">
        ${i?"Seen":"Delivered"}
      </div>
    </div>
  `;c.innerHTML+=p,c.scrollTop=c.scrollHeight}async function l(e,t,s,r=10,n=0){try{let t=await (0,a.Y6)(e,r,n),i=document.getElementById("chat-messages");if(!i)return;0===n&&(i.innerHTML=""),Array.isArray(t)&&t.reverse().forEach(e=>{let t=document.createElement("div"),r=s[e.sender_id]||"User";t.innerHTML=function(e,t,s){let r=e.sender_id===o.dZ.UserID,n=r?o.dZ.Username:t,a=n[0]?.toUpperCase()||"?";return`
    <div class="chat ${r?"chat-end":"chat-start"}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${a}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${n}
        <time class="text-xs opacity-50">${e.created_at?.slice(0,16).replace("T"," ")}</time>
      </div>
      <div class="chat-bubble bg-base-200 text-black" style="
        word-break: break-word;
        overflow-wrap: break-word;
        overflow-x: hidden;">
        ${e.text}
      </div>
      <div class="chat-footer opacity-50">
        ${r?"Seen":"Delivered"}
      </div>
    </div>
  `}(e,r,0),i.prepend(t.firstElementChild)})}catch(e){console.error("Failed to load group chat history:",e)}}},15047:(e,t,s)=>{"use strict";s.d(t,{Be:()=>i,Q5:()=>r,YJ:()=>a,a_:()=>n});var o=s(26787);let r=(0,o.v)(e=>({selectedGroupId:null,selectedUserId:null,selectedGroupDetails:null,setSelectedGroupId:t=>e({selectedGroupId:t}),setSelectedUserId:t=>e({selectedUserId:t}),setSelectedGroupDetails:t=>e({selectedGroupDetails:t})})),n=()=>r.getState().selectedGroupId,a=()=>r.getState().selectedUserId,i=(0,o.v)(e=>({session:null,setSession:t=>e({session:t})}))},17239:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,16444,23)),Promise.resolve().then(s.t.bind(s,16042,23)),Promise.resolve().then(s.t.bind(s,88170,23)),Promise.resolve().then(s.t.bind(s,49477,23)),Promise.resolve().then(s.t.bind(s,29345,23)),Promise.resolve().then(s.t.bind(s,12089,23)),Promise.resolve().then(s.t.bind(s,46577,23)),Promise.resolve().then(s.t.bind(s,31307,23))},37094:(e,t,s)=>{"use strict";s.d(t,{L6:()=>d,dZ:()=>a,default:()=>l});var o=s(16189);s(43210);var r=s(62976),n=s(15047);let a=null,i=e=>{a=e};function l(){return(0,o.useRouter)(),(0,n.Be)(e=>e.setSession),null}async function d(e){let t=await (0,r.Ht)();t?.unauthorized?(console.log("401 received during session load. Resetting session."),i(null),e(null)):(i(t),e(t),console.log("Session loaded:",t))}},45263:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,86346,23)),Promise.resolve().then(s.t.bind(s,27924,23)),Promise.resolve().then(s.t.bind(s,35656,23)),Promise.resolve().then(s.t.bind(s,40099,23)),Promise.resolve().then(s.t.bind(s,38243,23)),Promise.resolve().then(s.t.bind(s,28827,23)),Promise.resolve().then(s.t.bind(s,62763,23)),Promise.resolve().then(s.t.bind(s,97173,23))},49770:(e,t,s)=>{"use strict";s.d(t,{D:()=>l,U:()=>i});var o=s(37094),r=s(62976),n=s(15047),a=s(90861);function i(e,t){let s=(0,n.YJ)();if(e.sender_id!==s&&e.sender_id!==o.dZ.UserID){console.log("a toast here"),(0,a.A)(`New message from "${t}"`);return}let r=e.sender_id===o.dZ.UserID,i=r?o.dZ.Username:t,l=i[0]?.toUpperCase()||"?",d=document.getElementById("chat-messages");if(!d)return;let c=`
    <div class="chat ${r?"chat-end":"chat-start"}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${l}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${i}
        <time class="text-xs opacity-50">${e.created_at?.slice(0,16).replace("T"," ")}</time>
      </div>
      <div class="chat-bubble bg-base-200 text-black" style="
        word-break: break-word;        
        overflow-wrap: break-word;      
        overflow-x: hidden;">
        ${e.text}
      </div>
      <div class="chat-footer opacity-50">
        ${r?"Seen":"Delivered"}
      </div>
    </div>
  `;d.innerHTML+=c,d.scrollTop=d.scrollHeight}async function l(e,t,s,n=10,a=0){try{let i=await (0,r.Zm)(e,t,n,a);if(!Array.isArray(i))return void console.warn("No chat messages or invalid response:",i);let l=document.getElementById("chat-messages");if(!l)return;0===a&&(l.innerHTML=""),i.reverse().forEach(e=>{let t=document.createElement("div");t.innerHTML=function(e,t){let s=e.sender_id===o.dZ.UserID,r=s?o.dZ.Username:t,n=r[0]?.toUpperCase()||"?";return`
    <div class="chat ${s?"chat-end":"chat-start"}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${n}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${r}
        <time class="text-xs opacity-50">${e.created_at?.slice(0,16).replace("T"," ")}</time>
      </div>
      <div class="chat-bubble bg-base-200 text-black" style="
        word-break: break-word;        
        overflow-wrap: break-word;      
        overflow-x: hidden;">
        ${e.text}
      </div>
      <div class="chat-footer opacity-50">
        ${s?"Seen":"Delivered"}
      </div>
    </div>
  `}(e,s),l.prepend(t.firstElementChild)})}catch(e){console.error("Failed to load chat history:",e)}}},54284:(e,t,s)=>{"use strict";s.d(t,{default:()=>r});var o=s(12907);(0,o.registerClientReference)(function(){throw Error("Attempted to call session() from the server but session is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\malak\\social-network\\frontend\\app\\utils\\session.ts","session"),(0,o.registerClientReference)(function(){throw Error("Attempted to call setSession() from the server but setSession is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\malak\\social-network\\frontend\\app\\utils\\session.ts","setSession");let r=(0,o.registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\malak\\\\social-network\\\\frontend\\\\app\\\\utils\\\\session.ts\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\malak\\social-network\\frontend\\app\\utils\\session.ts","default");(0,o.registerClientReference)(function(){throw Error("Attempted to call loadSession() from the server but loadSession is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\malak\\social-network\\frontend\\app\\utils\\session.ts","loadSession")},54309:(e,t,s)=>{Promise.resolve().then(s.bind(s,37094))},58014:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>c,metadata:()=>d});var o=s(37413),r=s(260),n=s.n(r),a=s(73298),i=s.n(a);s(82704);var l=s(54284);let d={title:"Create Next App",description:"Generated by create next app"};function c({children:e}){return(0,o.jsx)("html",{lang:"en",children:(0,o.jsxs)("body",{suppressHydrationWarning:!0,className:`${n().variable} ${i().variable} antialiased`,children:[(0,o.jsx)(l.default,{}),e]})})}},60389:(e,t,s)=>{Promise.resolve().then(s.bind(s,54284))},62976:(e,t,s)=>{"use strict";s.d(t,{EC:()=>C,F_:()=>k,Ht:()=>l,N_:()=>c,Nk:()=>p,PJ:()=>x,Pn:()=>P,U7:()=>m,UI:()=>v,Wu:()=>h,Y6:()=>g,Zm:()=>f,_j:()=>w,cf:()=>S,hO:()=>T,he:()=>$,o9:()=>_,sZ:()=>a,tT:()=>b,u4:()=>y,wj:()=>u,x5:()=>d});var o=s(49770),r=s(3955),n=s(66526);let a=null;async function i(e,t={}){let s=await fetch(`http://localhost:8080${e}`,{credentials:"include",headers:{"Content-Type":"application/json",...t.headers||{}},...t});return s.ok?s.json().catch(()=>({})):401===s.status?{unauthorized:!0}:(console.warn(`API error ${s.status}:`,await s.text()),{error:!0,status:s.status})}let l=async()=>{let e=await i("/getSession",{method:"GET"});return e.unauthorized?null:e},d=(e="")=>i("/users/search",{method:"POST",body:JSON.stringify({username:e}),headers:{"Content-Type":"application/json"}}),c=(e="")=>i("/groups/search",{method:"POST",body:JSON.stringify({name:e}),headers:{"Content-Type":"application/json"}}),p=e=>i("/groups/members?group_id="+e,{method:"GET",headers:{"Content-Type":"application/json"}}),u=e=>i("/groups",{method:"POST",body:JSON.stringify(e),headers:{"Content-Type":"application/json"}}),m=(e,t)=>i("/groups/join",{method:"POST",body:JSON.stringify({group_id:e,user_id:t}),headers:{"Content-Type":"application/json"}}),h=e=>i("/groups/vote",{method:"POST",body:JSON.stringify({option_id:e}),headers:{"Content-Type":"application/json"}}),v=e=>i("/notifications",{method:"POST",body:JSON.stringify(e),headers:{"Content-Type":"application/json"}}),f=(e,t,s=10,o=0)=>i(`/chat/messages?user1=${e}&user2=${t}&limit=${s}&offset=${o}`,{method:"GET"}),g=(e,t=10,s=0)=>i(`/groups/messages?group_id=${e}&limit=${t}&offset=${s}`,{method:"GET"}),y=e=>i("/groups/events",{method:"POST",body:JSON.stringify({...e,polls:e.polls||[]}),headers:{"Content-Type":"application/json"}}),b=e=>i(`/groups/events?group_id=${e}`,{method:"GET"}),w=e=>(console.log("[createGroupPost] Sending data:",e),i("/groups/posts",{method:"POST",body:JSON.stringify(e)})),x=e=>i(`/groups/posts?group_id=${e}`,{method:"GET"}),k=e=>i("/groups/comments",{method:"POST",body:JSON.stringify(e)}),S=e=>i(`/groups/comments?post_id=${e}`,{method:"GET"}),T=(e,t)=>i("/notifications/status",{method:"POST",body:JSON.stringify({id:e,status:t}),headers:{"Content-Type":"application/json"}}),$=()=>i("/notifications/mark-all-read",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}}),C=e=>i(`/follow-graph/${e}`,{method:"GET",credentials:"include",headers:{"Content-Type":"application/json"}}),P=e=>i("/followAccept",{method:"POST",body:JSON.stringify({inviter_id:e}),headers:{"Content-Type":"application/json"}});function _(e){(a=new WebSocket("ws://localhost:8080/ws")).onopen=()=>{console.log("WebSocket connected")},a.onmessage=t=>{let s=JSON.parse(t.data);switch(s.type){case"chat":console.log(`Message from ${s.username} (${s.from}): ${s.text}`),(0,o.U)({sender_id:s.from,text:s.text,created_at:new Date().toISOString()},s.username);break;case"group-chat":console.log(`Group message in ${s.group} from ${s.username} (${s.from}): ${s.text}`),(0,r.L)({sender_id:s.from,text:s.text,created_at:new Date().toISOString(),group_id:s.group},s.username,s.groupName);break;case"notifications-list":(0,n.p)(s)}e(t)},a.onclose=()=>{console.warn("WebSocket disconnected"),a=null},a.onerror=e=>{console.error("WebSocket error:",e)}}},66526:(e,t,s)=>{"use strict";s.d(t,{F:()=>r,p:()=>n});let o=null;function r(e){o=e}function n(e){o&&Array.isArray(e.notifications)?(console.log("Pushing notifications:",e.notifications),o(e.notifications)):console.warn("No notification updater set or invalid data")}},82704:()=>{},90861:(e,t,s)=>{"use strict";function o(e,t={}){let s=document.getElementById("toast-wrapper");s||((s=document.createElement("div")).id="toast-wrapper",s.style.position="fixed",s.style.zIndex="9999",s.style.top="1rem",s.style.left="50%",s.style.transform="translateX(-50%)",s.style.display="flex",s.style.flexDirection="column",s.style.gap="0.5rem",document.body.appendChild(s));let r=document.createElement("div");r.className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800",r.setAttribute("role","alert"),r.innerHTML=`
    <div class="text-sm font-normal">
      ${e}
    </div>
    <div class="flex items-center ms-auto space-x-2 rtl:space-x-reverse">
      <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" aria-label="Close">
        <span class="sr-only">Close</span>
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6  6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    </div>
  `,s.appendChild(r),setTimeout(()=>{r.style.opacity="0",r.style.transition="opacity 0.3s ease",setTimeout(()=>r.remove(),300)},t.duration||4e3);let n=r.querySelector('[aria-label="Close"]');n&&n.addEventListener("click",()=>{r.remove()})}s.d(t,{A:()=>o})}};