Mad.StringStream = function(string) {
    this.state = { offset: 0, buffer: string, amountRead: string.length, length: string.length };
};

Mad.StringStream.prototype = new Mad.ByteStream();

Mad.StringStream.prototype.absoluteAvailable = function(n, updated) {
    return n < this.state.amountRead;
};

Mad.StringStream.prototype.seek = function(n) {
    this.state.offset += n;
};

Mad.StringStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
};

Mad.StringStream.prototype.peek = function(n) {
    try {
        return this.get(this.state.offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.StringStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state.buffer.substr(offset, length);
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};

Mad.StringStream.prototype.getb = function(offset, length) {
    var i, j, buffer, str;
    if (this.absoluteAvailable(offset + length)) {
        buffer = new Uint8Array(length);
	    str = this.state.buffer;
        for(i = 0, j = offset; i < length; i++, j++){
		    buffer[i] = str.charCodeAt(j);
	    }
	    return buffer;
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};
