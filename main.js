const $ = window.$,
      rpgen3 = window.rpgen3,
      imgur = window.imgur;
let startFlag = false;
const h = $("<div>").appendTo($("body")).css({
    "text-align": "center",
    padding: "1em"
});
$("<h1>").appendTo(h).text("imgurメモ帳");
const output = $("<div>").appendTo(h);
var h1 = $("<div>").appendTo(h),
    h2 = $("<div>").appendTo(h),
    h3 = $("<div>").appendTo(h);
rpgen3.addTab(h,{
    list: {
        "文字列": h1,
        "画像": h2,
        "削除": h3
    }
});
$("<h3>").appendTo(h1).text("文字列をimgurにアップロードする");
const btnSharing = $("<button>").appendTo(h1).text("共有").on("click",()=>{
    const str = inputText();
    if(!str) return alert("共有する内容がありません。");
    upload(strToImg(str), true);
}),
      btnSharingStop = $("<button>").appendTo(h1).text("共有停止").hide();
rpgen3.addInputBool(h1,{
    title: "コピペモード",
    change: b => {
        if(!startFlag) return;
        inputText = rpgen3.addInputText(hInputText.empty(),{
            textarea: true,
            title: "自動保存されません",
            value: inputText(),
            readonly: b
        });
    }
});
const btnEval = $("<button>").appendTo(h1).text("メモの内容をevalする").on("click",()=>eval(inputText()));
const hInputText = $("<div>").appendTo(h1);
let inputText = rpgen3.addInputText(hInputText,{
    textarea: true,
    title: "メモ帳",
    save: "メモ帳"
});
const disabled = b => inputFile.add(btnSharing).add(btnSharingStop).attr("disabled", b);
function upload(base64, isMemo){
    disabled(true);
    imgur.upload(base64).then(({ id, dhash, token })=>{
        disabled(false);
        btnSharing.hide();
        btnSharingStop.show().off("click").on("click",()=>{
            del({ dhash, token });
            btnSharingStop.hide();
            btnSharing.show();
        });
        output.empty();
        if(isMemo){
            rpgen3.addInputText(output,{
                readonly: true,
                title: "共有用URL",
                value: `https://rpgen3.github.io/imgur/?id=${id}`
            });
        }
        else {
            rpgen3.addInputText(output,{
                readonly: true,
                title: "画像URL",
                value: `https://i.imgur.com/${id}.png`
            });
        }
        rpgen3.addInputText(output,{
            readonly: true,
            title: "削除パス",
            value: `id=${id}&dhash=${dhash}&token=${token}`
        });
    }).catch(()=>{
        disabled(false);
        alert("アップロードできませんでした。");
    });
}
$("<h3>").appendTo(h2).text("画像をimgurにアップロードする");
const inputFile = $("<input>").appendTo(h2).attr({
    type: "file"
}).on("change",loadImg);
function loadImg(e){
    disabled(true);
    const file = e.target.files[0];
    if(!file) return;
    const blobUrl = window.URL.createObjectURL(file),
          img = new Image();
    img.onload = () => upload(ImageToBase64(img, file.type));
    img.src = blobUrl;
}
function ImageToBase64(img, mime_type) {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return cv.toDataURL(mime_type);
}
$("<h3>").appendTo(h3).text("アップロードした内容を削除");
const inputDeletePass = rpgen3.addInputText(h3,{
    title: "削除パスを入力",
    change: v => {
        const p = rpgen3.getParam('?' + v);
        if(p.id) viewImg.attr("src", `https://i.imgur.com/${p.id}.png`).show();
    }
});
const btnDelete = $("<button>").appendTo(h3).text("画像を削除").on("click",v=>{
    const url = inputDeletePass();
    if(!url) return alert("削除パスを入力してください。");
    del(rpgen3.getParam('?' + url));
});
const viewImg = $("<img>").appendTo($("<div>").appendTo(h3)).hide();
function del({ dhash, token }){
    disabled(true);
    imgur.delete({ dhash, token }).then(()=>{
        alert("削除しました。");
        disabled(false);
    }).catch(()=>{
        alert("削除できません。");
        disabled(false);
    });
}
(()=>{
    const p = rpgen3.getParam();
    if(p.id){
        disabled(true);
        imgur.load(p.id).then(img => {
            inputText = rpgen3.addInputText(hInputText.empty(),{
                textarea: true,
                title: "共有データ",
                value: imgToStr(img)
            });
        })
            .catch(()=>alert("共有データの読み込みに失敗しました。"))
            .finally(()=>{
            disabled(false);
            startFlag = true;
        });
    }
})();
