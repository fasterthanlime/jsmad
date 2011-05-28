
/* Global namespace */
Mad = {};

Mad.recoverable = function (error) {
    return ((error) & 0xff00) != 0;
}
