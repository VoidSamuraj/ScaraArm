
const firstMenu=document.getElementById('firstMenu');
const firstMenuUl= document.querySelectorAll('#firstMenu ul');
const loadMenu=document.getElementById('loadMenu');
const optionsMenu=document.getElementById('optionsMenu');
const direction=document.getElementById('switch');
const checkbox=document.getElementById('toggle');
const logout=document.getElementById('logout');


const loadFileButton=document.getElementById('loadFile');
const optionsButton=document.getElementById('options');

const firstMenuStyle=getComputedStyle(firstMenu);
const loadMenuStyle=getComputedStyle(loadMenu);
const optionsMenuStyle=getComputedStyle(optionsMenu);

var icons = document.querySelectorAll('.icons');
var buttons = document.querySelectorAll('.first');
var expanded= false;
var menuDisplayed=false;


loadMenu.style.minHeight=firstMenuStyle.height;
optionsMenu.style.minHeight=firstMenuStyle.height;

firstMenuUl[1].style.display='none';
firstMenu.style.height= '74px';
firstMenuUl[1].style.transform = 'translateY(-226px)';



firstMenu.addEventListener('mouseover', function() {
    if(!expanded&&menuDisplayed){
        firstMenu.style.width = '300px';
        for (var i = 0; i < icons.length; i++) {
            var element = icons[i];
            element.style.display = 'none';
        }
        buttons[1].firstChild.textContent = 'Manual Control';
        buttons[2].firstChild.textContent = 'Load File';
        buttons[3].firstChild.textContent = 'Options';
    }
});
firstMenu.addEventListener('mouseout', function() {

    firstMenu.style.width = '74px';
    for (var i = 0; i < buttons.length; i++) {
        var element = buttons[i];
        element.firstChild.textContent = '';


    }
    for (var i = 0; i < icons.length; i++) {
        var element = icons[i];
        element.style.display = 'inline';
    }
});

loadFileButton.addEventListener('click', function() {
    firstMenu.style.width = '74px';
    var time=(optionsMenuStyle.left === '-226px')?0:200;
    optionsMenu.style.left = '-226px';
    setTimeout(function(){
        if(loadMenuStyle.left === '-500px')  {
            expanded=true;
            loadMenu.style.left = '74px';
        }else{
            expanded=false;
            loadMenu.style.left = '-500px';
        }
    },time);

});
optionsButton.addEventListener('click', function(){
    firstMenu.style.width = '74px';
    var time=(loadMenuStyle.left === '-226px')?0:200;
    loadMenu.style.left = '-500px';
    setTimeout(function(){

        if(optionsMenuStyle.left === '-226px')  {
            expanded=true;
            optionsMenu.style.left = '74px';
        }else{
            expanded=false;
            optionsMenu.style.left = '-226px';
        }
    },time);


});
document.getElementById('menuIcon').addEventListener('click', function() {
    if(menuDisplayed){
        loadMenu.style.left = '-500px';
        optionsMenu.style.left = '-300px';
        setTimeout(function(){
            firstMenuUl[1].style.transform = 'translateY(-226px)';
            firstMenu.style.height= '74px';
            setTimeout(function(){
                firstMenuUl[1].style.display='none';
                menuDisplayed=false;
                expanded=false;
            },100);
        },200);
    }else{

        menuDisplayed=true;
        firstMenuUl[1].style.display='block';
        setTimeout(function(){
            firstMenuUl[1].style.transform = 'translateY(0px)';
            firstMenu.style.height = '308px';
            setTimeout(function(){
                loadMenu.style.left = '-500px';
                optionsMenu.style.left = '-226px';
            },200);
        },100);


    }
});
document.getElementById('closeLoadIcon').addEventListener('click', function() {
    loadMenu.style.left = '-500px';
    expanded=false;
});
document.getElementById('closeOptionsIcon').addEventListener('click', function() {
    optionsMenu.style.left = '-226px';
    expanded=false;
});

direction.addEventListener('click',toggle.click());
checkbox.addEventListener('click',toggle.click());

document.getElementById('myfile').addEventListener('change', function() {
    let fileName = this.files[0].name;
    document.getElementById('fileBtn').textContent = fileName;
     const formData = new FormData();
          formData.append('file', this.files[0]);

          fetch('/files/upload', {
            method: 'POST',
            body: formData
          })
          .then(response => {
            fillTable();
          })
          .catch(error => {
            console.error("File upload error: "+error);
          });


});
function saveFile(fileName){

}

logout.addEventListener('click', function() {

    if (confirm("Are you sure you want to Logout?") == true) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/logout');

        xhr.onload = function() {
            if (xhr.status === 200) {
                alert("Logged out successfully");
                location.reload(true);
            }
        };formatFileSize(file.size)
        xhr.send();
    }
});

//File table
function fillTable(){

    let html="";
        fetch("/files") .then(response => response.text())
            .then(files => {
                    files.replace('[','').replace(']','').replace(/"/g, "").split(",").forEach(file => {
                        let fileData = file.split(';');
                        html+="<tr><td>"+fileData[0]+"</td><td>"+fileData[1]+"</td><td><button onClick=\"loadFile('"+fileData[0]+"')\">Load</button><button onClick=\"deleteFile('"+fileData[0]+"')\">Delete</button></td></tr>";
                    });

                document.querySelector("table tbody").innerHTML = html;
            })
            .catch(error => {
                console.error("ERROR during reading file list:", error);
            });


}
function deleteFile(fileName){
    if (confirm("Confirm deletion of "+fileName) == true) {
        fetch("/files/delete/"+fileName, {
          method: "DELETE"
        }).then(response => {
              if (response.ok) {
                console.log("File was deleted.");
                fillTable();
              } else {
                console.error("ERROR during file deletion.");
              }
            })
            .catch(error => {
              console.error("ERROR occurred:", error);
            });

    }
}
function loadFile(fileName){

}



document.addEventListener("DOMContentLoaded",fillTable);


