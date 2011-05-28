
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if(!file) return;
    
    // Perform file ops
    MadStream.fromFile(file, function(stream) {
        console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
        ID3_skipHeader(stream);
    });
    
    return false;
}
