Mad.ArrayStream = function(array) {
    var buffer = (array instanceof Uint8Array ? array :
		         array.buffer instanceof ArrayBuffer ? new Uint8Array(array.buffer) :
				 new Uint8Array(array));
    this.state = {
	    offset: 0,
		buffer: buffer,
		amountRead: buffer.byteLength,
		length: buffer.byteLength
	};
};

Mad.ArrayStream.prototype = new Mad.ByteStream();

Mad.ArrayStream.prototype.absoluteAvailable = function(n, updated) {
    return n < this.state.amountRead;
};

Mad.ArrayStream.prototype.seek = function(n) {
    this.state.offset += n;
};

Mad.ArrayStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
};

Mad.ArrayStream.prototype.peek = function(n) {
    try {
        return this.get(this.state.offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.ArrayStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return String.fromCharCode.apply(String,this.state.buffer.subarray(offset, offset + length));
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};

Mad.ArrayStream.prototype.getb = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state.buffer.subarray(offset, offset + length);
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};
