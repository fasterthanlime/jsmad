
/* Global namespace */
Mad = {};

Mad.recoverable = function (error) {
    return ((error) & 0xff00) != 0;
}

// credit: http://blog.stevenlevithan.com/archives/fast-string-multiply
Mad.mul = function (str, num) {
	var	i = Math.ceil(Math.log(num) / Math.LN2), res = str;
	do {
		res += res;
	} while (0 < --i);
	return res.slice(0, str.length * num);
};

Mad.memcpy = function (dst, dstOffset, src, srcOffset, length) {
    // this is a pretty weird memcpy actually - it constructs a new version of dst, because we have no other way to do it
    return dst.slice(0, dstOffset) + src.slice(srcOffset, srcOffset + length) + dst.slice(dstOffset + length);
}
