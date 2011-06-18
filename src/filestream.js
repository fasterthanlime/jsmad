Mad.FileStream = function(file, callback) {
    this.state = { 'offset': 0 };
    
    var self = this, reader = new FileReader(), buffer;
    
    reader.onload = function () {
      self.length =
      self.state['amountRead'] = 
      self.state['contentLength'] = reader.result.length;
      
      buffer = new Uint8Array(self.length);
      for(var i = self.length-1; i >= 0; i -= 1){
	buffer[i] = reader.result[i];
      }
      self.state['buffer'] = buffer;
      
      callback(self);
    }
    
    reader.onerror = function () {
        console.log("Error!");
    }
    
    reader.readAsBinaryString(file);
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
        throw 'TODO: THROW PEEK ERROR!';
    }
}

Mad.FileStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
		//this version creates a new wrapper on the same memory
        /*return this.state['buffer'].subarray(offset, offset + length);*/
		//this should return a new Uint8Array
	return Array.prototype.slice.call(this.state['buffer'], offset, offset + length);
    } else {
        throw 'TODO: THROW GET ERROR!';
    }
}