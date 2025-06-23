javascript:(function(){
  if(location.hostname!=="netroom.oz96.com"){
    alert("このスクリプトはNETROOMでのみ使用できます。"); return;
  }
  if(document.getElementById("omikuji_toggle_btn")) return;

  let omikujiEnabled=false;
  let lastSentNumber=0;
  let activeTimerIds=[];

  const btn=document.createElement("button");
  btn.id="omikuji_toggle_btn";
  btn.textContent="機能: OFF";
  btn.style="position:fixed;bottom:10px;right:10px;z-index:9999;padding:6px 10px;font-size:14px;background:#333;color:#fff;border:none;border-radius:8px;cursor:pointer;";
  btn.onclick=function(){
    omikujiEnabled=!omikujiEnabled;
    btn.textContent="機能: "+(omikujiEnabled?"ON":"OFF");
  };
  document.body.appendChild(btn);

  const results=["大吉","中吉","小吉","吉","凶"];

  function rollDice(c,s){
    const r=[];
    for(let i=0;i<c;i++){r.push(Math.floor(Math.random()*s)+1);}
    return r;
  }

  function parseTimeString(str){
    const m=str.match(/(?:(\d+)m)?(?:(\d+)s)?/);
    if(!m) return 0;
    const min=parseInt(m[1]||"0",10), sec=parseInt(m[2]||"0",10);
    return (min*60+sec)*1000;
  }

  function sendChat(msg){
    const input=document.querySelector("#comment");
    const button=document.querySelector("button#b_send.btn");
    if(input&&button){
      input.value=msg;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      input.dispatchEvent(new Event("change",{bubbles:true}));
      ["mousedown","mouseup","click"].forEach(e=>
        button.dispatchEvent(new MouseEvent(e,{bubbles:true,cancelable:true,view:window}))
      );
    }
  }

  setInterval(function(){
    if(!omikujiEnabled) return;

    const comments=document.querySelectorAll("#view .comment");
    if(comments.length===0) return;

    const lastComment=comments[comments.length-1];
    if(!lastComment) return;

    const txt=lastComment.querySelector(".comd")?.textContent.trim();
    const msgNumberStr=lastComment.querySelector(".m_no")?.textContent.trim() || "";
    const msgNumber=parseInt(msgNumberStr,10);

    if(isNaN(msgNumber)||msgNumber<=lastSentNumber) return;

    let message="";

    if(txt==="/omikuji"){
      const result=results[Math.floor(Math.random()*results.length)];
      message=`>> ${msgNumber}\n🎴 おみくじ結果: ${result}`;
    }
    else if(txt==="/help"){
      message=`>> ${msgNumber}\n📝 機能一覧:\n・ /omikuji  おみくじを引けます\n・ /XdY      ダイスをX個、Y面で振ります\n・ /time XsYm タイマーをセットします\n・ /stop     タイマーをキャンセルします\n・ /help     このメッセージを表示します`;
    }
    else if(/^\/time\s+\d+[ms]/i.test(txt)){
      const timeStr=txt.replace("/time","").trim();
      const durationMs=parseTimeString(timeStr);
      if(durationMs>0){
        message=`>> ${msgNumber}\n⏱️ タイマー開始: ${timeStr}`;
        const halfway=Math.floor(durationMs/2);
        const id1=setTimeout(()=>sendChat(`>> ${msgNumber}\n⏳ 残り ${Math.floor(durationMs/2/1000)}秒です`),halfway);
        activeTimerIds.push(id1);
        if(durationMs>=6000){
          [5,4,3,2,1].forEach(sec=>{
            const id=setTimeout(()=>sendChat(`>> ${msgNumber}\n⏳ 残り ${sec}秒です`),durationMs-sec*1000);
            activeTimerIds.push(id);
          });
        }
        const id2=setTimeout(()=>sendChat(`>> ${msgNumber}\n⏰ タイマー終了`),durationMs);
        activeTimerIds.push(id2);
      }
    }
    else if(txt==="/stop"){
      activeTimerIds.forEach(id=>clearTimeout(id));
      activeTimerIds=[];
      message=`>> ${msgNumber}\n⛔ タイマーはキャンセルされました`;
    }
    else{
      const m=txt.match(/^\/(\d+)d(\d+)$/i);
      if(m){
        const c=Math.min(parseInt(m[1],10),100),
              s=Math.min(parseInt(m[2],10),1000);
        if(c>0&&s>0){
          const rolls=rollDice(c,s);
          const total=rolls.reduce((a,b)=>a+b,0);
          message=`>> ${msgNumber}\n🎲 ${c}d${s} の結果: [${rolls.join(", ")}] 合計: ${total}`;
        }
      }
    }

    if(message){
      sendChat(message);
      lastSentNumber=msgNumber;
    }
  },1000);
})();
