
/* Global namespace */
Mad = {};

Mad.recoverable = function (error) {
    return (error & 0xff00) != 0;
};

// credit: http://blog.stevenlevithan.com/archives/fast-string-multiply
Mad.mul = function (str, num) {
        var     i = Math.ceil(Math.log(num) / Math.LN2), res = str;
        do {
                res += res;
        } while (0 < --i);
        return res.slice(0, str.length * num);
};

Mad.memcpy = function (dst, dstOffset, src, srcOffset, length) {
	//console.log(typeof src); //src is always a stream
    if (typeof dst === 'string') {// this is a pretty weird memcpy actually - it constructs a new version of dst, because we have no other way to do it
        return dst.slice(0, dstOffset) + src.get(srcOffset, length) + dst.slice(dstOffset + length);
		//String.fromCharCode.apply(String, src.subarray(srcOffset, srcOffset + length))
	} else {
	    dst.set(src.getb(srcOffset, length),dstOffset);
		//src.subarray(srcOffset, srcOffset + length)
		return dst;
	}
};

Mad.rshift = function (num, bits) {
    return Math.floor(num / (1<<bits));
};

Mad.lshiftU32 = function (num, bits) {
    return Mad.bitwiseAnd(Mad.lshift(num, bits), (1<<32)-1 /* 2^32 - 1 */);
};

Mad.lshift = function (num, bits) {
    return num * (1<<bits);
};

Mad.bitwiseOr = function (a, b) {
    var w = 1<<31, // 2^31
        aHI = (a / w) << 0,
        aLO = a % w,
        bHI = (b / w) << 0,
        bLO = b % w;
    return ((aHI | bHI) * w + (aLO | bLO));
};

Mad.bitwiseAnd = function (a, b) {
    var w = 1<<31, // 2^31
        aHI = (a / w) << 0,
        aLO = a % w,
        bHI = (b / w) << 0,
        bLO = b % w;
    return ((aHI & bHI) * w + (aLO & bLO));
};
