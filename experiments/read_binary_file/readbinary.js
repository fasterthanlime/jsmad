
console.log("readbinary.js loaded");

function readFile() {
    console.log("readFile called");

    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if(!file) return;
    
    // Perform file ops
    console.log("Got file = " + file.name);
    var reader = new FileReader();
    
    reader.onloadend = function (evt) {
      var data = evt.target.result;
      console.log("Reading a " + (data.length / 1024) + "KB file");
      console.log("Data = " + data[0] + "" + data[1] + "" + data[2]);
    };
    
    reader.readAsBinaryString(file);
    return false;
}
