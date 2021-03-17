((window, undefined) => {
    "use strict";
    function load(imgurID){
        return new Promise((resolve, reject) => {
            const url = "https://i.imgur.com/" + imgurID + ".png";
            new Promise(r => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => /removed/.test(xhr.responseURL) ? reject() : r();
                xhr.onerror = reject;
                xhr.open('GET', url);
                xhr.send();
            }).then(() => {
                $("<img>").on("error", reject).on("load", function(){
                    resolve(this);
                }).attr({
                    crossOrigin: "anonymous",
                    src: url
                });
            });
        });
    }
    let tokens = [];
    $.ajax({
        url: "https://rpgen3.github.io/imgur/mylib/token.txt"
    }).done(d=>{
        tokens = d.split('\n').filter(v=>v);
    }).fail(()=>{
        ["upload", "delete"].forEach(v=>{
            window.imgur[v] = () => new Promise((resolve, reject) => reject);
        });
    });
    function upload(base64){
        const token = rpgen3.randArray(tokens);
        return new Promise((resolve, reject) => {
            $.ajax({
                dataType: 'json',
                headers: {
                    Authorization: 'Client-ID ' + token
                },
                url: "https://api.imgur.com/3/upload.json",
                type: "POST",
                data: {
                    image: base64.replace(/^[^,]+;base64,/, '')
                }
            }).done(r=>{
                const d = r.data,
                      id = d.id,
                      dhash = d.deletehash;
                resolve({ id, dhash, token });
            }).fail(reject);
        });
    }
    function del({dhash, token}){
        return new Promise((resolve, reject) => {
            $.ajax({
                dataType: 'json',
                headers: {
                    Authorization: 'Client-ID ' + token
                },
                url: "https://api.imgur.com/3/image/" + dhash,
                type: "DELETE"
            }).done(resolve).fail(reject);
        });
    }
    window.imgur = {
        load: load,
        upload: upload,
        delete: del
    };
})(typeof window === 'object' ? window : this);
