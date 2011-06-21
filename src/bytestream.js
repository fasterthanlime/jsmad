/*
ByteStream is an abstract object type, to be used as a prototype for concrete streams.
The methods provided by the ByteStream prototype depend on the following fields to be
implemented by concrete streams:

.absoluteAvailable(n, updated)
.get(offset, length)
.seek(n)
.state.offset

*/
Mad.ByteStream = function(url) { }

Mad.ByteStream.prototype.available = function(n) {
    return this.absoluteAvailable(this.state.offset + n);
};

Mad.ByteStream.prototype.getb = function(offset, length){
	var i,buffer = new Uint8Array(length),
		str = this.get(offset, length);
	for(i = 0; i < length; i++){
		buffer[i] = str.charCodeAt(i);
	}
	return buffer;	
};

Mad.ByteStream.prototype.readb = function(n) {
    var result = this.peekb(n);
    
    this.seek(n);
    
    return result;
};

Mad.ByteStream.prototype.peekb = function(n) {
    try {
        return this.getb(this.state.offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.ByteStream.prototype.look = function(n, offset) {
    try {
        return this.get(this.state.offset + offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.ByteStream.prototype.lookb = function(n, offset) {
    try {
        return this.getb(this.state.offset + offset, n);
    } catch (e) {
        throw 'TODO: THROW PEEK ERROR!';
    }
};

Mad.ByteStream.prototype.getU8 = function(offset, bigEndian) {
    return this.getb(offset, 1)[0];
};

Mad.ByteStream.prototype.getI8 = function(offset, bigEndian) {
    return this.getb(offset, 1)[0] - 1<<7;
};

Mad.ByteStream.prototype.getU24 = function(offset, bigEndian) {
	var bytes = this.getb(offset, 3);
	
	if (!bigEndian) {
		return (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
	}
	
	return (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
};

Mad.ByteStream.prototype.getSyncInteger = function(offset) {
	var bytes = this.getb(offset, 4);
	
	return (bytes[0] << 21) | (bytes[1] << 14) | (bytes[2] << 7) | bytes[3];
};

if(window.DataView){

	Mad.ByteStream.prototype.getU16 = function(offset, bigEndian) {
		return new DataView(this.getb(offset, 2)).getUint16(0,!bigEndian);
	};

	Mad.ByteStream.prototype.getU32 = function(offset, bigEndian) {
		return new DataView(this.getb(offset, 2)).getUint32(0,!bigEndian);
	};

	Mad.ByteStream.prototype.getI16 = function(offset, bigEndian) {
	    return new DataView(this.getb(offset, 2)).getInt16(0,!bigEndian);
	};

	Mad.ByteStream.prototype.getI32 = function(offset, bigEndian) {
	    return new DataView(this.getb(offset, 2)).getInt32(0,!bigEndian);
	};

} else {

	Mad.ByteStream.prototype.getU16 = function(offset, bigEndian) {
		var bytes = this.getb(offset, 2);
		
		if (!bigEndian) {
			return (bytes[1] << 8) | bytes[0];
		}
		
		return (bytes[0] << 8) | bytes[1];
	};

	Mad.ByteStream.prototype.getU32 = function(offset, bigEndian) {
		var bytes = this.get(offset, 4);
		
		if (!bigEndian) {
			return (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
		}
		
		return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
	};

	Mad.ByteStream.prototype.getI16 = function(offset, bigEndian) {
		return this.getU16(offset, bigEndian) - 1<<15;
	};

	Mad.ByteStream.prototype.getI32 = function(offset, bigEndian) {
		return this.getU32(offset, bigEndian) - 1<<31;
	};

}

Mad.ByteStream.prototype.peekU8 = function(bigEndian) {
    return this.getU8(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekU16 = function(bigEndian) {
    return this.getU16(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekU24 = function(bigEndian) {
    return this.getU24(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekU32 = function(bigEndian) {
    return this.getU32(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekI8 = function(bigEndian) {
    return this.getI8(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekI16 = function(bigEndian) {
    return this.getI16(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekI32 = function(bigEndian) {
    return this.getI32(this.state.offset, bigEndian);
};

Mad.ByteStream.prototype.peekSyncInteger = function() {
    return this.getSyncInteger(this.state.offset);
};

Mad.ByteStream.prototype.readU8 = function(bigEndian) {
    var result = this.peekU8(bigEndian);
    
    this.seek(1);
    
    return result;
};

Mad.ByteStream.prototype.readU16 = function(bigEndian) {
    var result = this.peekU16(bigEndian);
    
    this.seek(2);
    
    return result;
};

Mad.ByteStream.prototype.readU24 = function(bigEndian) {
    var result = this.peekU24(bigEndian);
    
    this.seek(3);
    
    return result;
};

Mad.ByteStream.prototype.readU32 = function(bigEndian) {
    var result = this.peekU32(bigEndian);
    
    this.seek(4);
    
    return result;
};

Mad.ByteStream.prototype.readI8 = function(bigEndian) {
    var result = this.peekI8(bigEndian);
    
    this.seek(1);
    
    return result;
};

Mad.ByteStream.prototype.readI16 = function(bigEndian) {
    var result = this.peekI16(bigEndian);
    
    this.seek(2);
    
    return result;
};

Mad.ByteStream.prototype.readI32 = function(bigEndian) {
    var result = this.peekI32(bigEndian);
    
    this.seek(4);
    
    return result;
};

Mad.ByteStream.prototype.readSyncInteger = function() {
    var result = this.getSyncInteger(this.state.offset);
    
    this.seek(4);
    
    return result;
};
