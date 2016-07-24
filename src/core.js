var EP = require('./util/ep');

function YI(img) {
    var url = img.getAttribute('src'),
        source = new Image;

    source.src = url;

    source.onload = function() {
        var canvas = document.createElement('canvas'),
            cxt = canvas.getContext('2d'),
            width = source.width,
            height = source.height;

        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        cxt.drawImage(source, 0, 0);

        this.source = source;
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.cxt = cxt;
        this.img = img;
    }.bind(this);
}

YI.prototype = new EP;

YI.fn = YI.prototype;

YI.fn.getImageData = function() {
    return this.cxt.getImageData(0, 0, this.width, this.height);
};

YI.fn.notify = function(progress) {
    this.emit('progress', progress);
};

YI.fn.putImageData = function(imageData) {
    //    this.cxt.clearRect(0, 0, this.width, this.height);
    this.cxt.putImageData(imageData, 0, 0);
};

YI.fn.process = function(workerBuilder, data) {
    var _this = this;
    data = data || {};
    var worker = YI.createWorker(workerBuilder);
    var imageData = this.getImageData();
    data.data = imageData.data;
    data.width = imageData.width;
    data.height = imageData.height;
    return new Promise(function(resolve, reject) {
        worker.postMessage(data);
        worker.onmessage = function(evt) {
            if (evt.data.type === 'data') {
                var src = evt.data.data;
                YI.copy(src, imageData.data);
                _this.putImageData(imageData);
                worker.terminate();
                resolve(_this);
            } else if (evt.data.type === 'progress') {
                _this.notify(evt.data.progress);
            }
        };
        worker.onerror = function(err) {
            reject(err);
        };
    });
};


module.exports = YI;
