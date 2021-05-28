$(document).ready(function () {
    app.init();
})

var videoList = [
    {
        id: 1,
        title: "step one",
        src: "video/ForcePhoto.mp4"
    },
    {
        id: 2,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 3,
        title: "step three",
        src: "video/ForcePhoto.mp4"
    },
    {
        id: 4,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 5,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 6,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 7,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 8,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },
    {
        id: 9,
        title: "step two",
        src: "video/SelectLoadIssue.mp4"
    },

]

var app = {
    async init() {
        var self = this;
        await db.init();
        await this.loadVideoList()
    },
    loadVideoList() {
        console.log('load list')
        var videoListUl = $('#videoList');
        videoListUl.empty()
        for (var i = 0; i < videoList.length; i++) {
            var item = '<li id="li_' + videoList[i].id + '"></li>'
            videoListUl.append(item)
            this.getDownloadTool(videoList[i])
        }

        this.availableStorage();

    },
    async getDownloadTool(item) {
        await db.init();

        for (var i = 0; i < db.allDocs.length; i++) {
            if (db.allDocs[i].id == 'video_' + item.id) {
                var res = '<button class="downloaded" onclick="app.playVideo('+item.id+')">' +
                    '<img src="assets/media/icon-play.png">' +
                    '<span> See Video ' + item.title + '</span>' +
                    '</button>' +
                    '<div class="progress-bar" id="pb_' + item.id + '"><div></div></div>';
                $('#li_' + item.id).html('')
                $('#li_' + item.id).append(res)
                return;
            }
        }

        var res = '<button onclick="app.downloadVideo(' + item.id + ')">' +
            '<img src="assets/media/icon-download.png">' +
            '<span> Download Video ' + item.title + '</span>' +
            '</button>' +
            '<div class="progress-bar" id="pb_' + item.id + '"><div></div></div>';
        $('#li_' + item.id).html('')
        $('#li_' + item.id).append(res)
    },
    downloadVideo(id) {
        var self = this;

        var video = null;
        for (var i = 0; i < videoList.length; i++)
            if (videoList[i].id == id)
                video = videoList[i]
        if (!video) {
            alert('video invalid')
            return false;
        }

        $.ajax({
            url: video.src,
            cache: false,
            xhr: function () {
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'arraybuffer'
                //Upload progress
                xhr.addEventListener('progress', function (e) {
                    if (e.lengthComputable) {
                        console.log((100 * e.loaded / e.total))
                        $('#pb_' + video.id + ' > div').css('width', '' + (100 * e.loaded / e.total) + '%');
                    }
                });
                return xhr;
            },
            success: function (data) {

                var videoRow = {
                    "_id": 'video_' + video.id,
                    "title": video.title,
                    "_attachments": {
                        "video.mp4": {
                            "content_type": "video/mp4",
                            "data": new Blob([new Uint8Array(data)], {type: 'video/mp4'})
                        }
                    }
                };
                db.db.put(videoRow).then(function (result) {
                    //alert('video success download , can watch in download list')
                    self.getDownloadTool(video)

                    self.availableStorage();

                }).catch(function (err) {
                    console.log(err);
                });


            },
        });
    },
    async playVideo(id){
        var doc = await db.db.getAttachment('video_'+id, 'video.mp4')
        var url = window.URL || window.webkitURL;
        var blobUrl = url.createObjectURL(doc);
        $('#preview_video').attr('src',blobUrl)
        $('.modal_view').css('display','flex')
        console.log(blobUrl)
    },
    availableStorage(){

        if ('storage' in navigator && 'estimate' in navigator.storage) { 
            navigator.storage.estimate() 
                .then(function(estimate){
                    console.log("Updating Storage");
                    document.querySelector('.used').textContent = estimate.usage;
                    document.querySelector('.available').textContent = estimate.quota;
        }); 
    }
}

}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/assets/js/sw.js')
        .then(() => { console.log('Service Worker Registered'); });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {

  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();

  // Stash the event so it can be triggered later.
  deferredPrompt = e;

});

function showA2HSPrompt(){

    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
}

var db = {
    db: null,
    allDocs: [],
    init() {
        var self = this;
        return new Promise((resolve, reject) => {
            this.db = new PouchDB('video');
            this.db.allDocs({include_docs: true, descending: true}, function (err, doc) {
                self.allDocs = doc.rows;
                resolve()
            });
        })
    },
}
