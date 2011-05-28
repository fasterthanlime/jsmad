Mad.SubStream = function(stream, offset, length) {
    this.parentStream = stream;
    this.state['start'] = offset;
    this.state['length'] = length;
}

Mad.SubStream.prototype = new Mad.ByteStream();

Mad.SubStream.prototype.absoluteAvailable = function(n) {
    return this.parentStream.absoluteAvailable(this.state['start'] + n);
}

Mad.SubStream.prototype.seek = function(n) {
    this.state['offset'] += n;
}

Mad.SubStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
}

Mad.SubStream.prototype.peek = function(n) {
    return this.get(this.state['offset'], n);
}

Mad.SubStream.prototype.get = function(offset, length) {
    return this.parentStream.get(this.state['start'] + this.state['offset'], n);
}

Mad.SubStream.prototype.requestAbsolute = function(n, callback) {
    this.parentStream.requestAbsolute(this.state['start'] + n)
}

Mad.SubStream.prototype.request = function(n, callback) {
    this.parentStream.requestAbsolute(this.state['start'] + this.state['offset'] + n)
}
