const { $, rpgen3, imgur } = window;
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
const inputPass = rpgen3.addInputText(h1,{
    title: "pass",
    change: v => v.replace(/[^0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]/g,'')
});
const btnSharing = $("<button>").appendTo(h1).text("共有").on("click",()=>{
    const str = inputText();
    if(!str) return alert("共有する内容がありません。");
    const pass = inputPass();
    upload(strToImg(encode(str, pass)), pass);
}),
      btnSharingStop = $("<button>").appendTo(h1).text("共有停止").hide();
rpgen3.addInputBool(h1,{
    title: "コピペモード",
    change: b => {
        if(!startFlag) return;
        inputText = rpgen3.addInputText(hInputText.empty(),{
            hankaku: false,
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
const disabled = b => inputFile.add(btnSharing).add(btnSharingStop).add(btnDelete).attr("disabled", b);
function upload(base64, isMemo){
    disabled(true);
    imgur.upload(base64).then(({ id, deletehash, token })=>{
        disabled(false);
        btnSharing.hide();
        btnSharingStop.show().off("click").on("click",()=>{
            del({ deletehash, token });
            btnSharingStop.hide();
            btnSharing.show();
        });
        output.empty();
        if(isMemo){
            rpgen3.addInputText(output,{
                readonly: true,
                title: "共有用URL",
                value: `https://rpgen3.github.io/imgur/?imgur=${id}&pass=${isMemo}`
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
            value: `id=${id}&deletehash=${deletehash}&token=${token}`
        });
    }).catch(()=>{
        disabled(false);
        alert("アップロードできませんでした。");
    });
}
$("<h3>").appendTo(h2).text("画像をimgurにアップロードする");
const inputFile = $("<input>").appendTo(h2).attr({
    type: "file"
}).on("change",loadFile);
const defaultText = "クリップボードの画像をここに貼り付け",
      inputPaste = $("<div>").appendTo(h2).text(defaultText).attr({
          contenteditable: true
      }).css({
          width: "70vw",
          height: "30vh",
          border: "2px solid #000000",
          margin:  "0 auto"
      }).on("input",()=>{
          upload(inputPaste.find("img").attr("src"));
          inputPaste.text(defaultText);
      });
function loadFile(e){
    disabled(true);
    const file = e.target.files[0];
    if(!file) return;
    const img = new Image();
    img.onload = () => upload(ImageToBase64(img, file.type));
    img.src = window.URL.createObjectURL(file);
}
function ImageToBase64(img, mime_type) {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    console.log(img, cv.width, cv.height)
    return cv.toDataURL(mime_type);
}
$("<h3>").appendTo(h3).text("アップロードした画像を削除");
const inputDeletePass = rpgen3.addInputText(h3,{
    title: "削除パスを入力",
    change: v => {
        const p = rpgen3.getParam('?' + v);
        if(p.imgur) viewImg.attr("src", `https://i.imgur.com/${p.imgur}.png`).show();
    }
});
const btnDelete = $("<button>").appendTo(h3).text("画像を削除").on("click",v=>{
    const url = inputDeletePass();
    if(!url) return alert("削除パスを入力してください。");
    del(rpgen3.getParam('?' + url));
});
const viewImg = $("<img>").appendTo($("<div>").appendTo(h3)).hide();
function del({ deletehash, token }){
    disabled(true);
    imgur.delete({ deletehash, token }).then(()=>{
        alert("削除しました。");
        disabled(false);
    }).catch(()=>{
        alert("削除できません。");
        disabled(false);
    });
}
(()=>{
    const p = rpgen3.getParam();
    if(!p.imgur) return (startFlag = true);
    disabled(true);
    imgur.load(p.imgur).then(img => {
        inputText = rpgen3.addInputText(hInputText.empty(),{
            hankaku: false,
            textarea: true,
            title: "共有データ",
            value: decode(imgToStr(img), p.pass)
        });
        $("title").text(p.imgur);
    })
        .catch(()=>alert("共有データの読み込みに失敗しました。"))
        .finally(()=>{
        disabled(false);
        startFlag = true;
    });
})();
function encode(str, pass){
    if(!pass) return str;
    //パスワードはUTF-8エンコーディング
    var secret_passphrase = CryptoJS.enc.Utf8.parse(pass);
    var salt = CryptoJS.lib.WordArray.random(128 / 8);
    var key128Bits500Iterations = CryptoJS.PBKDF2(secret_passphrase, salt, {keySize: 128 / 8, iterations: 500 });
    //初期化ベクトル（ブロック長と同じ）
    var iv = CryptoJS.lib.WordArray.random(128 / 8);
    //暗号化オプション（IV:初期化ベクトル, CBCモード, パディングモード：PKCS7
    var options = {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7};
    //暗号化内容のエンコーディングは「UTF-8」
    var message_text = CryptoJS.enc.Utf8.parse(str);

    //----------------------------------------------------------------------
    //暗号化
    var encrypted = CryptoJS.AES.encrypt(message_text, key128Bits500Iterations, options);
    //----------------------------------------------------------------------

    //暗号結果データをカンマ（","）で結合してまとめる（復号時にわかるように）
    //（salt + iv + ciphertext)
    return [
        CryptoJS.enc.Hex.stringify(salt),
        CryptoJS.enc.Hex.stringify(iv),
        encrypted
    ].join(',');
}
function decode(str, pass){
    if(!pass) return str;
    // あからじめ仕込んでおいた暗号化データのカンマ","を使って文字列をそれぞれに分割
    var array_rawData = str.split(',');

    var salt = CryptoJS.enc.Hex.parse(array_rawData[0]);  // パスワードSalt
    var iv = CryptoJS.enc.Hex.parse(array_rawData[1]);    // 初期化ベクトル（IV）
    var encrypted_data = CryptoJS.enc.Base64.parse(array_rawData[2]); //暗号化データ本体

    //パスワード（鍵空間の定義）
    var secret_passphrase = CryptoJS.enc.Utf8.parse(pass);
    var key128Bits500Iterations = CryptoJS.PBKDF2(secret_passphrase, salt, {keySize: 128 / 8, iterations: 500 });

    //復号オプション（暗号化と同様）
    var options = {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7};

    //復号
    var decrypted = CryptoJS.AES.decrypt({"ciphertext":encrypted_data}, key128Bits500Iterations, options);
    // 文字コードをUTF-8にする
    return decrypted.toString(CryptoJS.enc.Utf8);
}
