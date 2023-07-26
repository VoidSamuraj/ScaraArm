
const firstMenu=document.getElementById('firstMenu');
const firstMenuUl= document.querySelectorAll('#firstMenu ul');
const loadMenu=document.getElementById('loadMenu');
const optionsMenu=document.getElementById('optionsMenu');
const direction=document.getElementById('switch');
const checkbox=document.getElementById('toggle');
const logout=document.getElementById('logout');
const deleteAccount=document.getElementById('deleteAccount');

const optionMenuHide='-226px';
const loadMenuHide='-600px';
const barWidth='74px';

const manual=document.getElementById('manual');
const loadFileButton=document.getElementById('loadFile');
const optionsButton=document.getElementById('options');

const firstMenuStyle=getComputedStyle(firstMenu);
const loadMenuStyle=getComputedStyle(loadMenu);
const optionsMenuStyle=getComputedStyle(optionsMenu);

var icons = document.querySelectorAll('.icons');
var buttons = document.querySelectorAll('.first');
var expanded= false;
var menuDisplayed=false;
var canMoveArm=true;
export function getCanMoveArm(){return canMoveArm;}

loadMenu.style.minHeight=firstMenuStyle.height;
optionsMenu.style.minHeight=firstMenuStyle.height;

firstMenuUl[1].style.display='none';
firstMenu.style.height= '74px';
firstMenuUl[1].style.transform = 'translateY('+optionMenuHide+')';



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

    firstMenu.style.width = barWidth;
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
    turnOnOverlay();
    firstMenu.style.width = barWidth;
    var time=(optionsMenuStyle.left === optionMenuHide)?0:200;
    optionsMenu.style.left = optionMenuHide;
    setTimeout(function(){
        if(loadMenuStyle.left === loadMenuHide)  {
            expanded=true;
            loadMenu.style.left = barWidth;
            canMoveArm=false;
        }else{
            expanded=false;
            loadMenu.style.left = loadMenuHide;
            canMoveArm=true;
        }
    },time);
            fetch('/endMove', {
              method: 'POST'})
            .catch(error => {
              console.error('Error:', error);
            });
});

manual.addEventListener('click',function(){
    turnOffOverlay();
    optionsMenu.style.left = optionMenuHide;
    loadMenu.style.left = loadMenuHide;
    canMoveArm=true;
        fetch('/startMove', {
          method: 'POST'})
        .catch(error => {
          console.error('Error:', error);
        });
});

optionsButton.addEventListener('click', function(){
    turnOnOverlay();
    firstMenu.style.width = barWidth;
    var time=(loadMenuStyle.left === optionMenuHide)?0:200;
    loadMenu.style.left = loadMenuHide;
    setTimeout(function(){

        if(optionsMenuStyle.left === optionMenuHide)  {
            expanded=true;
            optionsMenu.style.left = barWidth;
        }else{
            expanded=false;
            optionsMenu.style.left = optionMenuHide;
        }
    },time);


});
document.getElementById('menuIcon').addEventListener('click', function() {
    if(menuDisplayed){
        loadMenu.style.left = loadMenuHide;
        optionsMenu.style.left = '-300px';
        setTimeout(function(){
            firstMenuUl[1].style.transform = 'translateY('+optionMenuHide+')';
            firstMenu.style.height= barWidth;
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
                loadMenu.style.left = loadMenuHide;
                optionsMenu.style.left = optionMenuHide;
            },200);
        },100);


    }
});
document.getElementById('closeLoadIcon').addEventListener('click', function() {
    loadMenu.style.left = loadMenuHide;
    expanded=false;
});
document.getElementById('closeOptionsIcon').addEventListener('click', function() {
    optionsMenu.style.left = optionMenuHide;
    expanded=false;
});


direction.addEventListener('click',function(){toggle.click();});
checkbox.addEventListener('click',function(){toggle.click();});

logout.addEventListener('click', function() {

    if (confirm("Are you sure you want to Logout?") == true) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/logout');

        xhr.onload = function() {
            if (xhr.status === 200) {
                alert("Logged out successfully");
                location.reload(true);
            }
        }
        xhr.send();
    }
});
deleteAccount.addEventListener('click', function() {
    if (confirm("Are you sure you want to delete account?")) {
        if(confirm("Flies associated with account will be removed. Do you want to continue?")){
            let xhr = new XMLHttpRequest();
            xhr.open('POST', '/delete');

            xhr.onload = function() {
                if (xhr.status === 200) {
                    alert("Account deleted successfully");
                    location.reload(true);
                }
            }
            xhr.send();
        }
    }
});

document.getElementById('myfile').addEventListener('change', function() {
    let fileName = this.files[0].name;
    const formData = new FormData();
    formData.append('file', this.files[0]);

    fetch('/files/'+fileName)
            .then(response => {
                if (response.ok) {
                    alert("A file with this name already exists, please rename the uploaded file.")
        } else {

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

        }
    })
            .catch(error => {
                console.log('Checking file error: ', error);
    });



});
//File table
function fillTable(){

    let html="";
    fetch("/files") .then(response => response.text())
            .then(files => {
                files.replace('[','').replace(']','').replace(/"/g, "").split(",").forEach(file => {
                    let fileData = file.split(';');
            if(fileData.length > 0&& fileData[0]!="")
                html+="<tr><td>"+fileData[0]+"</td><td>"+fileData[1]+"</td><td>"+fileData[2]+"</td><td><button onClick=\"window.loadFile('"+fileData[0]+"')\">Load</button><button onClick=\"window.deleteFile('"+fileData[0]+"')\">Delete</button></td></tr>";
        });

        document.querySelector("table tbody").innerHTML = html;
    })
            .catch(error => {
                console.error("ERROR during reading file list:", error);
    });


}
window.deleteFile=function(fileName){
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
window.loadFile=function(fileName){
    drawFileOnScene(fileName);
}

function turnOnOverlay(){
    var overlay=document.getElementById("overlay");
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    overlay.style.zIndex = '2';
    overlay.style.display='block';
    overlay.addEventListener('click',turnOffOverlay);
}
function turnOffOverlay(){
    var overlay=document.getElementById("overlay");
    overlay.style.backgroundColor = "rgba(255, 163, 26, 0.2)";
    overlay.style.zIndex = '6';
    optionsMenu.style.left = optionMenuHide;
    loadMenu.style.left = loadMenuHide;
    overlay.style.display='none';
}
document.addEventListener("DOMContentLoaded",fillTable);


