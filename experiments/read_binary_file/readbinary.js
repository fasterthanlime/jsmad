
function readFile() {
    // uploadData is a form element
    // fileChooser is input element of type 'file'
    var file = document.forms['uploadData']['fileChooser'].files[0];
    
    if(file)
    {
      // Perform file ops
      console.log("Got file = " + file.name);
    }
}
