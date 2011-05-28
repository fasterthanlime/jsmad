Mad.AjaxStream = function(url) {
    this.state = { 'offset': 0 };
    
    var request = window.XMLHttpRequest ? new XMLHttpRequest() :  ActiveXObject("Microsoft.XMLHTTP");
    
    request.open('GET', url);
    
    this.state['request'] = request;
    this.state['amountRead'] = 0;
    this.state['inProgress'] = true;
    this.state['callbacks'] = [];
    
    var self = this;
    
    var iteration = 0;
    
    var onstatechange = function () {
        iteration += 1;
        
        if (self.state['callbacks'].length > 0 && iteration % 64 == 0) {
            self.updateBuffer();
            
            var newCallbacks = [];
            
            for (var i = 0; i < self.state['callbacks'].length; i++) {
                var callback = self.state['callbacks'][i];
                
                if (callback[0] < self.state['amountRead']) {
                    callback[1]();
                } else {
                    newCallbacks.push(callback);
                }
            }
            
            self.state['callbacks'] = newCallbacks;
        }
        
        if (request.readyState == 4) {
            for (var i = 0; i < self.state['callbacks'].length; i++) {
                var callback = self.state['callbacks'][i];
                
                callback[1]();
            }
            
            window.clearInterval(self.state['timer']);
            
            self.state['inProgress'] = false;
        }
    }
    
    request.onreadystatechange = onstatechange;
    
    this.state['timer'] = window.setInterval(onstatechange, 1000);
    
    request.send(null);
}

Mad.AjaxStream.prototype = new Mad.ByteStream();

Mad.AjaxStream.prototype.updateBuffer = function() {
    if (!this.state['finalAmount']) {
        this.state['buffer'] = this.state['request'].responseText
        this.state['amountRead'] = this.state['buffer'].length
    
        if (!this.state['inProgress']) {
            this.state['finalAmount'] = true;
        }
        
        return true;
    } else {
        return false;
    }
}

Mad.AjaxStream.prototype.absoluteAvailable = function(n, updated) {
    if (n > this.state['amountRead']) {
        if (updated) {
            console.log("TODO: THROW AVAILABLE ERROR!");
            
            return false;
        } else if (this.updateBuffer()) {
            return this.absoluteAvailable(n, true);
        } else {
            return false;
        }
    } else {
        return true;
    }
}

Mad.AjaxStream.prototype.seek = function(n) {
    this.state['offset'] += n;
}

Mad.AjaxStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
}

Mad.AjaxStream.prototype.peek = function(n) {
    if (this.available(n)) {
        var offset = this.state['offset'];
        
        var result = this.get(offset, n);
        
        return result;
    } else {
        console.log('TODO: THROW PEEK ERROR!');
        return;
    }
}

Mad.AjaxStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state['buffer'].slice(offset, offset + length);
    } else {
        console.log('TODO: THROW GET ERROR!');
        
        return;
    }
}

Mad.AjaxStream.prototype.requestAbsolute = function(n, callback) {
    if (n < this.state['amountRead']) {
        callback();
    } else {
        this.state['callbacks'].push([n, callback]);
    }
}

Mad.AjaxStream.prototype.request = function(n, callback) {
    this.requestAbsolute(this.state['offset'] + n, callback);
}
