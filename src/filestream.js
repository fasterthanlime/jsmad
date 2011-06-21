Mad.FileStream = function(file, callback) {
    this.state = { 'offset': 0 };
    
    var self = this, reader = new FileReader();
    
    reader.onload = function () {
		self.length =
		self.state.amountRead = 
		self.state.contentLength = reader.result.length;
		self.state.buffer = reader.result;
		  
		callback(self);
    }
    
    reader.onerror = function () {
        console.log("Error!");
    }
    
    reader.readAsBinaryString(file);
};

Mad.FileStream.prototype = new Mad.ByteStream();

Mad.FileStream.prototype.absoluteAvailable = function(n, updated) {
    return n < this.state.amountRead;
};

Mad.FileStream.prototype.seek = function(n) {
    this.state.offset += n;
};

Mad.FileStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
};

Mad.FileStream.prototype.peek = function(n) {
    try {
        return this.get(this.state.offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.FileStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state.buffer.slice(offset, offset + length);
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};

Mad.FileStream.prototype.getb = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
		var i,buffer = new Uint8Array(length);
		for(i = 0; i < length; i++) {
			buffer[i] = this.state.buffer.charCodeAt(i+offset);
		}
		return buffer;
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
};