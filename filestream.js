Mad.FileStream = function(file) {
    this.state['buffer'] = file.getAsBinary()
    this.state['amountRead'] = this.state['buffer'].length;
}

Mad.FileStream.prototype = new Mad.ByteStream();

Mad.FileStream.prototype.absoluteAvailable = function(n, updated) {
    return n < this.state['amountRead'];
}

Mad.FileStream.prototype.seek = function(n) {
    this.state['offset'] += n;
}

Mad.FileStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
}

Mad.FileStream.prototype.peek = function(n) {
    if (this.available(n)) {
        var offset = this.state['offset'];
        
        var result = this.get(offset, n);
        
        return result;
    } else {
        console.log('TODO: THROW PEEK ERROR!');
        return;
    }
}

Mad.FileStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state['buffer'].slice(offset, offset + length);
    } else {
        console.log('TODO: THROW GET ERROR!');
        
        return;
    }
}

Mad.FileStream.prototype.requestAbsolute = function(n, callback) {
    callback();
}

Mad.FileStream.prototype.request = function(n, callback) {
    callback();
}
