let loop;
self.addEventListener('message', function(e){
    var data = e.data;
    if(data.clear){
        clearInterval()
    }
    switch (data.loop) {
        case 'start':
            loop = setInterval(() => {
                self.postMessage('loop');
            }, data.period);
            break;
        case 'stop':
            clearInterval(loop);
            break;
    };
}, false);