
// Well duh.
var CHAR_BIT = 8;

/*
 * NAME:	bit.init()
 * DESCRIPTION:	initialize bit pointer struct
 */
function MadBit(data, offset) {
    if(typeof(data) != "string") {
        console.log("Invalid data type: " + typeof(data));
        return;
    }
    
    this.data = data;
    this.offset = offset;
    this.cache = 0;
    this.left = CHAR_BIT;
}

/*
 * NAME:	bit.length()
 * DESCRIPTION:	return number of bits between start and end points
 */
MadBit.prototype.length = function(end) {
    return this.left + CHAR_BIT * (end.offset - (this.offset + 1)) + (CHAR_BIT - end.left);
}

/*
 * NAME:	bit.nextbyte()
 * DESCRIPTION:	return pointer to next unprocessed byte
 */
MadBit.prototype.nextbyte = function() {
    return this.left == CHAR_BIT ? this.offset : this.offset + 1;
}

/*
 * NAME:	bit.skip()
 * DESCRIPTION:	advance bit pointer
 */
MadBit.prototype.skip = function(len) {
  this.offset += len / CHAR_BIT;
  this.left -= len % CHAR_BIT;

  if (this.left > CHAR_BIT) {
    this.offset++;
    this.left += CHAR_BIT;
  }

  if (this.left < CHAR_BIT)
    this.cache = this.data[this.offset];
}

/*
 * NAME:	bit.read()
 * DESCRIPTION:	read an arbitrary number of bits and return their UIMSBF value
 */
MadBit.prototype.read = function(len) {
  var value;

  if (this.left == CHAR_BIT)
    this.cache = this[this.offset];

  if (len < this.left) {
    value = (this.cache & ((1 << this.left) - 1)) >> (this.left - len);
    this.left -= len;

    return value;
  }

  /* remaining bits in current byte */

  value = this.cache & ((1 << this.left) - 1);
  len  -= this.left;

  this.offset++;
  this.left = CHAR_BIT;

  /* more bytes */

  while (len >= CHAR_BIT) {
    value = (value << CHAR_BIT) | this.data[this.offset++];
    len  -= CHAR_BIT;
  }

  if (len > 0) {
    this.cache = *this.offset;

    value = (value << len) | (this.cache >> (CHAR_BIT - len));
    this.left -= len;
  }

  return value;
}

