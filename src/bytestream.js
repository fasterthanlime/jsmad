/*
ByteStream is an abstract object type, to be used as a prototype for concrete streams.
The methods provided by the ByteStream prototype depend on the following fields to be
implemented by concrete streams:

.absoluteAvailable(n, updated)
.get(offset, length)
.seek(n)
.state.offset

There's still a heckuvalotta code duplication here that could probably be fixed.

*/

(function(){
	function composeBytes(bytes,len,bigEndian,step){
		var res,shift=step;
		if (bigEndian) {
			res = bytes[0];
			for(i=1;i<len;i++,shift+=step){
				res |= bytes[i] << shift;
			}
		} else {
			i=len-1;
			res = bytes[i];
			for(i--;i>=0;i--,shift+=step){
				res |= bytes[i] << shift;
			}
		}
		return res;
	}

	Mad.ByteStream = function(url) { }

	Mad.ByteStream.prototype.available = function(n) {
		return this.absoluteAvailable(this.state.offset + n);
	}

	/*Unsigned integer getters*/
	
	Mad.ByteStream.prototype.getU8 = function(offset, bigEndian) {
		return this.get(offset, 1)[0];
	}

	//it'd be nice to abstract this out with .bind(), but that's not supported everywhere
	Mad.ByteStream.prototype.getU16 = function(offset, bigEndian) {
		return composeBytes(this.get(offset, 2), 2, bigEndian,8);
	}

	Mad.ByteStream.prototype.getU24 = function(offset, bigEndian) {
		return composeBytes(this.get(offset, 3), 3, bigEndian,8);
	}

	Mad.ByteStream.prototype.getU32 = function(offset, bigEndian) {
		return composeBytes(this.get(offset, 4),4,bigEndian,8);
	}

	/*Signed integer getters*/
	
	Mad.ByteStream.prototype.getI8 = function(offset, bigEndian) {
		return this.getU8(offset, bigEndian) - 128;            // 2 ** 7
	}

	Mad.ByteStream.prototype.getI16 = function(offset, bigEndian) {
		return this.getU16(offset, bigEndian) - 65536;         // 2 ** 15
	}

	Mad.ByteStream.prototype.getI32 = function(offset, bigEndian) {
		return this.getU32(offset, bigEndian) - 2147483648;    // 2 ** 31
	}

	Mad.ByteStream.prototype.getSyncInteger = function(offset) {
		return composeBytes(this.get(offset, 4), 4, false, 7);
	}

	/*Unsigned integer peeks*/
	
	Mad.ByteStream.prototype.peekU8 = function(bigEndian) {
		return this.getU8(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekU16 = function(bigEndian) {
		return this.getU16(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekU24 = function(bigEndian) {
		return this.getU24(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekU32 = function(bigEndian) {
		return this.getU32(this.state.offset, bigEndian);
	}

	/*Signed integer peeks*/
	
	Mad.ByteStream.prototype.peekI8 = function(bigEndian) {
		return this.getI8(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekI16 = function(bigEndian) {
		return this.getI16(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekI32 = function(bigEndian) {
		return this.getI32(this.state.offset, bigEndian);
	}

	Mad.ByteStream.prototype.peekSyncInteger = function() {
		return this.getSyncInteger(this.state.offset);
	}

	/*Unsigned integer reads*/
	
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

	Mad.ByteStream.prototype.readU24 = function(bigEndian) {
		var result = this.peekU24(bigEndian);
		
		this.seek(3);
		
		return result;
	}

	Mad.ByteStream.prototype.readU32 = function(bigEndian) {
		var result = this.peekU32(bigEndian);
		
		this.seek(4);
		
		return result;
	}

	/*Signed integer reads*/
	
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

	Mad.ByteStream.prototype.readSyncInteger = function() {
		var result = this.getSyncInteger(this.state.offset);
		
		this.seek(4);
		
		return result;
	}
}());