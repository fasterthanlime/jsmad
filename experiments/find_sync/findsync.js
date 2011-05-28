
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    if(!file) return;
    
    // Perform file ops
    Mad.Stream.fromFile(file, function(stream) {
        console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
        ID3_skipHeader(stream);
        
        var STEPS_COUNT = 0;
        
        while(true) {
            var frame = Mad.Frame.decode(stream);
            if(frame == null) {
                if(stream.error == Mad.Error.BUFLEN) {
                    console.log("End of file!");
                    break;
                }
                console.log("Error! code = " + stream.error);
            }
            
            if(STEPS_COUNT++ >= 4) break;
        }
    });
    
    return false;
}
