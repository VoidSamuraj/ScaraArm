/**
 * File setting listeners to menu
 *
 */

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              variables and html handlers
//////////////////////////////////////////////////////////////////////////////////////////////////

//first manu
const firstMenu = document.getElementById("firstMenu");
const firstMenuUl = document.querySelectorAll("#firstMenu ul");

//menus inside first menu
const portMenu = document.getElementById("portMenu");
const loadMenu = document.getElementById("loadMenu");
const optionsMenu = document.getElementById("optionsMenu");

//manual menu
var radioButtons;

//options menu
const direction = document.getElementById("switch");
const checkbox = document.getElementById("toggle");
const arm1Length = document.getElementById("arm1Length");
const arm2Length = document.getElementById("arm2Length");
const toolDistance = document.getElementById("toolDistance");
const logout = document.getElementById("logout");
const deleteAccount = document.getElementById("deleteAccount");

//setup values in options menu
arm1Length.value = parseFloat(localStorage.getItem("arm1Length") || 4) * 5;
arm2Length.value = parseFloat(localStorage.getItem("arm2Length") || 4) * 5;
//tool distance to second arm
toolDistance.value =
  parseFloat(localStorage.getItem("toolDistanceToArm") || 0.8) * 5;

//constraints defining max sizes of arm
const maxArmLength = 40;
const minArmLength = 15;
const maxToolLength = 25;
const minToolLength = 4;

//positions of specific menu on hide
const optionMenuHide = "-400px";
const portMenuHide = "-400px";
const loadMenuHide = "-600px";
const barWidth = "74px";

//buttons in main menu
const manual = document.getElementById("manual");
const loadFileButton = document.getElementById("loadFile");
const optionsButton = document.getElementById("options");

//styles of menus
const firstMenuStyle = getComputedStyle(firstMenu);
const portMenuStyle = getComputedStyle(portMenu);
const loadMenuStyle = getComputedStyle(loadMenu);
const optionsMenuStyle = getComputedStyle(optionsMenu);

var icons = document.querySelectorAll(".icons");
var buttons = document.querySelectorAll(".first");
var expanded = false;
var menuDisplayed = false;
var canMoveArm = false;

portMenu.style.minHeight = firstMenuStyle.height;
loadMenu.style.minHeight = firstMenuStyle.height;
optionsMenu.style.minHeight = firstMenuStyle.height;

firstMenuUl[1].style.display = "none";
firstMenu.style.height = "74px";
firstMenuUl[1].style.transform = "translateY(" + optionMenuHide + ")";

//////////////////////////////////////////////////////////////////////////////////////////////////
//                              functions definitions
//////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Function checking if arm can be moved, basing on selected mode.
 * @returns {boolean} - true if can move or false
 */
export function getCanMoveArm() {
  return canMoveArm;
}

/**
 * Replaces ',' with '.', checks if number is inside range
 * @param {string} text string to change to float
 * @param {int} min min possible number
 * @param {int} max max possible number
 * @returns {float|null} float or null if string is not valid number or outside range
 */
function formatFloat(text, min, max) {
  let formatted = text.replace("/,/g", ".");
  if (
    formatted.split(".").length - 1 > 1 ||
    formatted > max ||
    formatted < min
  ) {
    alert("Please insert valid number between " + min + " and " + max);
    return null;
  }
  return parseFloat(formatted);
}

/**
 * Function to apply changes of arm length properties
 * @param {*} event event trigerring this function
 * @param {string} name name of element with changed property
 * @param {callback} updateDrawing function to show applied changes
 * @returns {boolean} true if pressed [number, ',', '.', enter] else false
 */
function onEditSize(event, name, updateDrawing) {
  if (event.charCode == 13) {
    //enter pressed
    let valFormatted;
    switch (name) {
      case "arm1Length":
        valFormatted = formatFloat(
          arm1Length.value,
          minArmLength,
          maxArmLength
        );
        break;
      case "arm2Length":
        valFormatted = formatFloat(
          arm2Length.value,
          minArmLength,
          maxArmLength
        );
        break;
      case "toolDistanceToArm":
        valFormatted = formatFloat(
          toolDistance.value,
          minToolLength,
          maxToolLength
        );
        break;
    }
    if (valFormatted != null) {
      //save and update numbers in menu
      localStorage.setItem(name, valFormatted / 5);
      arm1Length.value =
        parseFloat(localStorage.getItem("arm1Length") || 4) * 5;
      arm2Length.value =
        parseFloat(localStorage.getItem("arm2Length") || 4) * 5;
      toolDistance.value =
        parseFloat(localStorage.getItem("toolDistanceToArm") || 0.8) * 5;
      updateDrawing();
    }
  } else if (
    !(
      (event.charCode >= 48 && event.charCode <= 57) ||
      event.key === "." ||
      event.key === ","
    )
  ) {
    //if pressed key is no number, ',', '.' or enter. Do nothing (don't inset this key)
    event.preventDefault();
    return false;
  }
  return true;
}

/**
 * Function to show overlay over arm canvas
 */
function turnOnOverlay() {
  var overlay = document.getElementById("overlay");
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
  overlay.style.zIndex = "2";
  overlay.style.display = "block";
  overlay.addEventListener("click", turnOffOverlay);
}

/**
 * Function to hide overlay over arm canvas
 */
function turnOffOverlay() {
  var overlay = document.getElementById("overlay");
  overlay.style.backgroundColor = "rgba(255, 163, 26, 0.2)";
  overlay.style.zIndex = "6";
  optionsMenu.style.left = optionMenuHide;
  portMenu.style.left = portMenuHide;
  loadMenu.style.left = loadMenuHide;
  overlay.style.display = "none";
}

/**
 * Function to setup listeners of options menus number inputs
 * @param {callback} updateDrawing function to show arm length changes on the screen
 */
export function setupOptionMenu(updateDrawing) {
  arm1Length.addEventListener("keypress", function (event) {
    onEditSize(event, "arm1Length", updateDrawing);
  });
  arm2Length.addEventListener("keypress", function (event) {
    onEditSize(event, "arm2Length", updateDrawing);
  });
  toolDistance.addEventListener("keypress", function (event) {
    onEditSize(event, "toolDistanceToArm", updateDrawing);
  });
}
//List all files from server and display in table
function fillFilesTable() {
  let html = "";
  fetch("/files")
    .then((response) => response.text())
    .then((files) => {
      files
        .replace("[", "")
        .replace("]", "")
        .replace(/"/g, "")
        .split(",")
        .forEach((file) => {
          let fileData = file.split(";");
          if (fileData.length > 0 && fileData[0] != "")
            html +=
              "<tr><td>" +
              fileData[0] +
              "</td><td>" +
              fileData[1] +
              "</td><td>" +
              fileData[2] +
              "</td><td><button onClick=\"window.loadFile('" +
              fileData[0] +
              "')\">Load</button><button onClick=\"window.deleteFile('" +
              fileData[0] +
              "')\">Delete</button></td></tr>";
        });

      document.querySelector("#tableFiles table tbody").innerHTML = html;
    })
    .catch((error) => {
      console.error("ERROR during reading files list:", error);
    });
}
//List all accessible ports from server and display in table
function fillPortsTable() {
  let html = "";
  fetch("/ports", { method: "GET" })
    .then((response) => response.json())
    .then((data) => {
      data.forEach((port) => {
        if (port.length > 0)
          html +=
            '<tr><td class="radioItem"><input type="radio" name="portList" id="' +
            port +
            '" value="' +
            port +
            '" ><label for="' +
            port +
            '">' +
            port +
            "</label></td></tr>";
      });
      document.querySelector("#tablePorts table tbody").innerHTML = html;

      radioButtons = document.querySelectorAll(
        'input[type="radio"][name="portList"]'
      );
      radioButtons.forEach((radioButton) => {
        radioButton.addEventListener("change", function () {
          if (this.checked) {
            var formData = new FormData();
            formData.append("port", this.value);
            fetch("/ports/select", {
              method: "POST",
              body: formData,
            }).then((response) => {
              if (response.ok) {
                connectToArm();
              } else {
                console.error("Cannot connect to arm");
              }
            });
          }
        });
      });
    })
    .catch((error) => {
      console.error("ERROR during reading ports list:", error);
    });
}
/**
 * Function to init connection between arm, with selected port
 */
function connectToArm() {
  fetch("/arm/start", {
    method: "POST",
  }).then((response) => {
      if (response.ok) {
        canMoveArm = true;
      } else {
        console.error("Cannot connect to arm");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}


//////////////////////////////////////////////////////////////////////////////////////////////////
//                              setting up listeners
//////////////////////////////////////////////////////////////////////////////////////////////////

//button opening first menu
document.getElementById("menuIcon").addEventListener("click", function () {
  if (menuDisplayed) {
    portMenu.style.left = portMenuHide;
    loadMenu.style.left = loadMenuHide;
    optionsMenu.style.left = optionMenuHide;
    setTimeout(function () {
      firstMenuUl[1].style.transform = "translateY(" + optionMenuHide + ")";
      firstMenu.style.height = barWidth;
      setTimeout(function () {
        firstMenuUl[1].style.display = "none";
        menuDisplayed = false;
        expanded = false;
      }, 100);
    }, 200);
  } else {
    menuDisplayed = true;
    firstMenuUl[1].style.display = "block";
    setTimeout(function () {
      firstMenuUl[1].style.transform = "translateY(0px)";
      firstMenu.style.height = "308px";
      setTimeout(function () {
        portMenu.style.left = portMenuHide;
        loadMenu.style.left = loadMenuHide;
        optionsMenu.style.left = optionMenuHide;
      }, 200);
    }, 100);
  }
});

////    First menu

firstMenu.addEventListener("mouseover", function () {
  if (!expanded && menuDisplayed) {
    firstMenu.style.width = "300px";
    for (var i = 0; i < icons.length; i++) {
      var element = icons[i];
      element.style.display = "none";
    }
    buttons[1].firstChild.textContent = "Manual Control";
    buttons[2].firstChild.textContent = "Load File";
    buttons[3].firstChild.textContent = "Options";
  }
});
firstMenu.addEventListener("mouseout", function () {
  firstMenu.style.width = barWidth;
  for (var i = 0; i < buttons.length; i++) {
    var element = buttons[i];
    element.firstChild.textContent = "";
  }
  for (var i = 0; i < icons.length; i++) {
    var element = icons[i];
    element.style.display = "inline";
  }
});

/**
 *Switch to reactive mode, tool now can be moved by arrows and  arms by mouse scroll
 *you have first select element to move
 */
manual.addEventListener("click", function () {
  firstMenu.style.width = barWidth;
  var time =
    loadMenu.left === loadMenuHide && optionsMenu.left === optionMenuHide
      ? 0
      : 200;
  optionsMenu.style.left = optionMenuHide;
  loadMenu.style.left = loadMenuHide;
  setTimeout(function () {
    if (portMenuStyle.left === portMenuHide) {
      turnOnOverlay();
      expanded = true;
      portMenu.style.left = barWidth;
    } else {
      expanded = false;
      portMenu.style.left = portMenuHide;
      turnOffOverlay();
    }
  }, time);
});
document.getElementById("closePortIcon").addEventListener("click", function () {
  portMenu.style.left = portMenuHide;
  expanded = false;
});

document.getElementById("portButton").addEventListener("click", function () {
  fillPortsTable();
});

////    Load menu

/**
 * Button in First Menu, switch to passive mode, you cannot longer controll arm on your own,
 * Now you can execute file on arm
 */
loadFileButton.addEventListener("click", function () {
  turnOnOverlay();
  firstMenu.style.width = barWidth;
  var time =
    optionsMenuStyle.left === optionMenuHide &&
    portMenuStyle.left === portMenuHide
      ? 0
      : 200;
  optionsMenu.style.left = optionMenuHide;
  portMenu.style.left = portMenuHide;
  setTimeout(function () {
    if (loadMenuStyle.left === loadMenuHide) {
      expanded = true;
      loadMenu.style.left = barWidth;
      canMoveArm = false;
    } else {
      expanded = false;
      loadMenu.style.left = loadMenuHide;
      canMoveArm = true;
    }
  }, time);
});

document.getElementById("closeLoadIcon").addEventListener("click", function () {
  loadMenu.style.left = loadMenuHide;
  expanded = false;
});

//button to upload file on server
document.getElementById("myfile").addEventListener("change", function () {
  let fileName = this.files[0].name;
  const formData = new FormData();
  formData.append("file", this.files[0]);

  fetch("/files/" + fileName)
    .then((response) => {
      if (response.ok) {
        alert(
          "A file with this name already exists, please rename the uploaded file."
        );
      } else {
        fetch("/files/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            fillFilesTable();
          })
          .catch((error) => {
            console.error("File upload error: " + error);
          });
      }
    })
    .catch((error) => {
      console.log("Checking file error: ", error);
    });
});

//delete selected file
window.deleteFile = function (fileName) {
  if (confirm("Confirm deletion of " + fileName) == true) {
    fetch("/files/" + fileName, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          console.log("File was deleted.");
          fillFilesTable();
        } else {
          console.error("ERROR during file deletion.");
        }
      })
      .catch((error) => {
        console.error("ERROR occurred:", error);
      });
  }
};

//load selected file
window.loadFile = function (fileName) {
  drawFileOnScene(fileName);
};

////    Option menu

//button in first menu
optionsButton.addEventListener("click", function () {
  turnOnOverlay();
  firstMenu.style.width = barWidth;
  var time =
    loadMenuStyle.left === loadMenuHide && portMenuStyle.left === portMenuHide
      ? 0
      : 200;
  portMenu.style.left = portMenuHide;
  loadMenu.style.left = loadMenuHide;
  setTimeout(function () {
    if (optionsMenuStyle.left === optionMenuHide) {
      expanded = true;
      optionsMenu.style.left = barWidth;
    } else {
      expanded = false;
      optionsMenu.style.left = optionMenuHide;
    }
  }, time);
});

document
  .getElementById("closeOptionsIcon")
  .addEventListener("click", function () {
    optionsMenu.style.left = optionMenuHide;
    expanded = false;
  });
//isright li and checkbox
direction.addEventListener("click", function () {
  toggle.click();
});
checkbox.addEventListener("click", function () {
  toggle.click();
});

logout.addEventListener("click", function () {
  if (confirm("Are you sure you want to Logout?") == true) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/logout");

    xhr.onload = function () {
      if (xhr.status === 200) {
        alert("Logged out successfully");
        location.reload(true);
      }
    };
    xhr.send();
  }
});
deleteAccount.addEventListener("click", function () {
  if (confirm("Are you sure you want to delete account?")) {
    if (
      confirm(
        "Flies associated with account will be removed. Do you want to continue?"
      )
    ) {
      let xhr = new XMLHttpRequest();
      xhr.open("DELETE", "/user");

      xhr.onload = function () {
        if (xhr.status === 200) {
          alert("Account deleted successfully");
          location.reload(true);
        }
      };
      xhr.send();
    }
  }
});

document.addEventListener("DOMContentLoaded", fillFilesTable);
document.addEventListener("DOMContentLoaded", fillPortsTable);
