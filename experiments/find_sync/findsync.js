
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if(!file) return;
    
    // Perform file ops
    Mad.Stream.fromFile(file, function(stream) {
        console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
        ID3_skipHeader(stream);
        
        //stream.ptr.skip(0x413 * 8); // skip first sync mark
        //stream.doSync(); // and re-sync
        
        //console.log("Found second frame at " + stream.ptr.offset);
        //stream.next_frame = stream.ptr.offset;
        
        var frame = Mad.Frame.decode(stream);
        
        if(frame == null) {
            console.log("Error! code = " + stream.error);
        }
    });
    
    return false;
}
