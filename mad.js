
/* Global namespace */
Mad = {};

Mad.recoverable = function (error) {
    return ((error) & 0xff00) != 0;
}


Mad.memcpy = function (dst, dstOffset, src, srcOffset, length) {
    // this is a pretty weird memcpy actually - it constructs a new version of dst, because we have no other way to do it
    return dst.slice(0, dstOffset) + src.slice(srcOffset, srcOffset + length) + dst.slice(dstOffset + length);
}
