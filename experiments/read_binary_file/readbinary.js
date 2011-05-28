
console.log("readbinary.js loaded");

function readFile() {
    console.log("readFile called");

    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if(!file) return;
    
    // Perform file ops
    console.log("Got file = " + file.name + ", type = " + typeof(file));
    var reader = new FileReader();
    
    reader.onloadend = function (evt) {
      var stream = new MadStream(evt.target.result);
      
      console.log("Reading a " + Math.round(stream.bufend / 1024) + "KB file");
      ID3_skipHeader(stream);
    };
    
    reader.readAsBinaryString(file);
    return false;
}
