Mad.AjaxStream = function(url) {
    this.inheritFrom = Mad.ByteStream;
    this.inheritFrom();
    
    var request = window.XMLHttpRequest ? new XMLHttpRequest() :  ActiveXObject("Microsoft.XMLHTTP");
    
    request.open('GET', url);
    
    this.state['request'] = request;
    this.state['amountRead'] = 0;
    this.state['inProgress'] = true;
    
    var state = this.state
    
    var onstatechange = function () {
        if (request.readyState == 4) {
            window.clearInterval(state['timer']);
            
            state['inProgress'] = false;
        }
    }
    
    request.onreadystatechange = onstatechange;
    
    state['timer'] = window.setInterval(onstatechange, 1000);
    
    request.send(null);
}

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

Mad.AjaxStream.prototype.available = function(n) {
    return this.absoluteAvailable(this.state['offset'] + n);
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
        
        var result = this.state['buffer'].slice(offset, offset + n);
        
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
