Mad.ByteStream = function(url) {
    var request = window.XMLHttpRequest ? new XMLHttpRequest() :  ActiveXObject("Microsoft.XMLHTTP");
    
    request.open('GET', url);
    
    var state = {
        'request': request,
        'offset': 0,
        'amountRead': 0,
        'inProgress': true
    };
    
    this.state = state;
    
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

Mad.ByteStream.prototype.updateBuffer = function() {
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

Mad.ByteStream.prototype.available = function(n) {
    return this.absoluteAvailable(this.state['offset'] + n);
}

Mad.ByteStream.prototype.absoluteAvailable = function(n, updated) {
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

Mad.ByteStream.prototype.seek = function(n) {
    this.state['offset'] += n;
}

Mad.ByteStream.prototype.read = function(n) {
    var result = this.peek(n);
    
    this.seek(n);
    
    return result;
}

Mad.ByteStream.prototype.peek = function(n) {
    if (this.available(n)) {
        var offset = this.state['offset'];
        
        var result = this.state['buffer'].slice(offset, offset + n);
        
        return result;
    } else {
        console.log('TODO: THROW PEEK ERROR!');
        return;
    }
}

Mad.ByteStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        return this.state['buffer'].slice(offset, offset + length);
    } else {
        console.log('TODO: THROW GET ERROR!');
        
        return;
    }
}

Mad.ByteStream.prototype.getU8 = function(offset, bigEndian) {
    var bytes = this.get(offset, 1);
    
    return bytes.charCodeAt(0);
}

Mad.ByteStream.prototype.getU16 = function(offset, bigEndian) {
    var bytes = this.get(offset, 2);
    
    if (!bigEndian) {
        bytes = bytes.reverse();
    }
    
    return (bytes.charCodeAt(0) << 8) | bytes.charCodeAt(1);
}

Mad.ByteStream.prototype.getU32 = function(offset, bigEndian) {
    var bytes = this.get(offset, 4);
    
    if (!bigEndian) {
        bytes = bytes.reverse();
    }
    
    return (bytes.charCodeAt(0) << 8) | bytes.charCodeAt(1);
}

Mad.ByteStream.prototype.getI8 = function(offset, bigEndian) {
    return this.getU8(offset, bigEndian) - 128;            // 2 ** 7
}

Mad.ByteStream.prototype.getI16 = function(offset, bigEndian) {
    return this.getU16(offset, bigEndian) - 65536;         // 2 ** 15
}

Mad.ByteStream.prototype.getI32 = function(offset, bigEndian) {
    return this.getU32(offset, bigEndian) - 2147483648;    // 2 ** 31
}

Mad.ByteStream.prototype.peekU8 = function(bigEndian) {
    return this.getU8(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.peekU16 = function(bigEndian) {
    return this.getU16(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.peekU32 = function(bigEndian) {
    return this.getU32(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.peekI8 = function(bigEndian) {
    return this.getI8(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.peekI16 = function(bigEndian) {
    return this.getI16(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.peekI32 = function(bigEndian) {
    return this.getI32(this.state['offset'], bigEndian);
}

Mad.ByteStream.prototype.readU8 = function(bigEndian) {
    var result = this.peekU8(bigEndian);
    
    this.seek(1);
    
    return result;
}

Mad.ByteStream.prototype.readU16 = function(bigEndian) {
    var result = this.peekU16(bigEndian);
    
    this.seek(2);
    
    return result;
}

Mad.ByteStream.prototype.readU32 = function(bigEndian) {
    var result = this.peekU32(bigEndian);
    
    this.seek(4);
    
    return result;
}

Mad.ByteStream.prototype.readI8 = function(bigEndian) {
    var result = this.peekI8(bigEndian);
    
    this.seek(1);
    
    return result;
}

Mad.ByteStream.prototype.readI16 = function(bigEndian) {
    var result = this.peekI16(bigEndian);
    
    this.seek(2);
    
    return result;
}

Mad.ByteStream.prototype.readI32 = function(bigEndian) {
    var result = this.peekI32(bigEndian);
    
    this.seek(4);
    
    return result;
}
