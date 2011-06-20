/*
ByteStream is an abstract object type, to be used as a prototype for concrete streams.
The methods provided by the ByteStream prototype depend on the following fields to be
implemented by concrete streams:

.absoluteAvailable(n, updated)
.get(offset, length)
.seek(n)
.state.offset

*/
(function(){
	var types = {
		'U8'	: 1, 'uint8'	: 1,
		'U16'	: 2, 'uint16'	: 2,
		'U24'	: 3, 'uint24'	: 3,
		'U32'	: 4, 'uint32'	: 4,
		'I8'	: -1, 'int8'	: -1,
		'I16'	: -2, 'int16'	: -2,
		'I24'	: -3, 'int24'	: -3,
		'I32'	: -4, 'int32'	: -4
	};

	Mad.ByteStream = function (url) { };

	Mad.ByteStream.prototype = {
		composeBytes : function (offset,len,bigEndian,step) {
			var res,shift=step||8,i,
				bytes = this.get(offset,len);
			if (bigEndian) {
				i = len - 1;
				res = bytes.charCodeAt(i);
				for (i--; i >= 0; i--, shift += step) {
					res |= bytes.charCodeAt(i) << shift;
				}
			} else {
				res = bytes.charCodeAt(0);
				for(i = 1; i < len; i++, shift += step) {
					res |= bytes.charCodeAt(i) << shift;
				}
			}
			return res;
		},
		available : function (n) {
			return this.absoluteAvailable(this.state.offset + n);
		},
		get_size : function (size, offset, bigEndian) {
			switch(size){
				case 1:
					return this.get(offset, 1).charCodeAt(0);
				case -1:
					return this.get(offset, 1).charCodeAt(0) - 1<<7;
				default:
					if (size < 0) {
						return this.composeBytes(offset, -1*size, bigEndian) - 1<<(-8*size-1);
					} else {
						return this.composeBytes(offset, size, bigEndian);
					}
			}
		},
		getInt : function (size, offset, bigEndian) {
			return this.get_size(
				typeof size === 'string' ? types[size] || 1 : size,
				offset, bigEndian);
		},
		getSyncInteger : function (offset) {
			return this.composeBytes(offset, 4, true, 7);
		},
		peek_size : function (size, bigEndian) {
			return this.get_size(size, this.state.offset, bigEndian);
		},
		peekInt : function (size, bigEndian) {
			return this.get(size, this.state.offset, bigEndian);
		},
		peekSyncInteger : function () {
			return this.composeBytes(this.state.offset, 4, true, 7);
		},
		read_size : function (size, bigEndian){
			var result = this.get_size(size, this.state.offset, bigEndian);
			this.seek(size < 0 ? -1 * size : size);
			return result;
		},
		readInt : function (size, bigEndian) {
			return this.read_size(
				typeof size === 'string' ? types[size] || 1 : size,
				bigEndian);
		},
		readSyncInteger : function () {
			var result = this.getSyncInteger(this.state.offset);	
			this.seek(4);
			return result;
		},
		getU8 : function (offset, bigEndian) {
			return this.get_size(1, offset);
		},
		getU16 : function (offset, bigEndian) {
			return this.get_size(2, offset, bigEndian);
		},
		getU24 : function (offset, bigEndian) {
			return this.get_size(3, offset, bigEndian);
		},
		getU32 : function (offset, bigEndian) {
			return this.get_size(4, offset, bigEndian);
		},
		getI8 : function (offset, bigEndian) {
			return this.get_size(-1, offset);
		},
		getI16 : function (offset, bigEndian) {
			return this.get_size(-2, offset, bigEndian);
		},
		getI32 : function (offset, bigEndian) {
			return this.get_size(-4, offset, bigEndian);
		},
		peekU8 : function (bigEndian) {
			return this.getU8(this.state.offset, bigEndian);
		},
		peekU16 : function (bigEndian) {
			return this.getU16(this.state.offset, bigEndian);
		},
		peekU24 : function (bigEndian) {
			return this.getU24(this.state.offset, bigEndian);
		},
		peekU32 : function (bigEndian) {
			return this.getU32(this.state.offset, bigEndian);
		},
		peekI8 : function (bigEndian) {
			return this.getI8(this.state.offset, bigEndian);
		},
		peekI16 : function (bigEndian) {
			return this.getI16(this.state.offset, bigEndian);
		},
		peekI32 : function (bigEndian) {
			return this.getI32(this.state.offset, bigEndian);
		},
		readU8 : function (bigEndian) {
			return this.read_size(1, bigEndian);
		},
		readU16 : function (bigEndian) {
			return this.read_size(2, bigEndian);
		},
		readU24 : function (bigEndian) {
			return this.read_size(3, bigEndian);
		},
		readU32 : function (bigEndian) {
			return this.read_size(4, bigEndian);
		},
		readI8 : function (bigEndian) {
			return this.read_size(-1, bigEndian);
		},
		readI16 : function (bigEndian) {
			return this.read_size(-2, bigEndian);
		},
		readI32 : function (bigEndian) {
			return this.read_size(-4, bigEndian);
		}
	};
}());