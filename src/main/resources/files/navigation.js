import { formatInt, formatFloat, showDialog } from "/static/helpers.js";
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
const precisionMoveInput = document.getElementById("precision-move");
const precisionUnit = document.getElementById("precisionUnit");
const precisionRotationInput = document.getElementById("precision-rotate");
const precisionRotationUnit = document.getElementById("precisionUnitDegree");

//options menu
const direction = document.getElementById("switch");
const checkbox = document.getElementById("toggle");
const modeList = document.getElementById("mode");
const speedInput = document.getElementById("speed");
const arm1Length = document.getElementById("arm1Length");
const arm2Length = document.getElementById("arm2Length");
const toolDistance = document.getElementById("toolDistance");
const arm1Ratio = document.getElementById("arm1Ratio");
const arm2Ratio = document.getElementById("arm2Ratio");
const armAdditionalRatio = document.getElementById("armAdditionalRatio");
const alertItem = document.getElementById("alert");
const closeAlertButton = document.getElementById("alert-close");
const alertMessage = document.getElementById("alert-msg");

speedInput.value = parseFloat(localStorage.getItem("maxSpeed") || "20");
arm1Ratio.value = parseFloat(localStorage.getItem("arm1Ratio") || "1").toFixed(
  2
);
arm2Ratio.value = parseFloat(localStorage.getItem("arm2Ratio") || "1").toFixed(
  2
);
armAdditionalRatio.value = parseFloat(
  localStorage.getItem("armAdditionalRatio") || "1"
).toFixed(2);

const logout = document.getElementById("logout");
const deleteAccount = document.getElementById("deleteAccount");

//setup values in options menu
var stepperVal = localStorage.getItem("stepperVal") || "200";
arm1Length.value = parseFloat(localStorage.getItem("arm1Length") || 4).toFixed(2);
arm2Length.value = parseFloat(localStorage.getItem("arm2Length") || 4).toFixed(2);
//tool distance to second arm
toolDistance.value = parseFloat(
  localStorage.getItem("toolDistanceToArm") || 0.8
).toFixed(2);

var movePrecision = localStorage.getItem("movePrecision") || 10;
var moveUnit = localStorage.getItem("moveUnit") || "mm";
var rotatePrecision = localStorage.getItem("rotatePrecision") || 1;
var rotateUnit = localStorage.getItem("rotateUnit") || "1";

precisionMoveInput.value = movePrecision;
precisionUnit.value = moveUnit;
precisionRotationInput.value = rotatePrecision;
precisionRotationUnit.value = rotateUnit;

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
export var demoMode = false;

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
 * Function to disable or activate loading buttons when arm is not connected.
 * @param state boolean
 */
function blockLoadButtons(state) {
  let loadFileButtons = document.querySelectorAll(".loadFileButtons");
  loadFileButtons.forEach((button) => {
    if (state) button.setAttribute("disabled", "");
    else button.removeAttribute("disabled");
  });
}
/**
 * Function returns calculated units of move by single click.
 * @returns {number}
 */
export function getMovePrecision() {
  if (moveUnit == "0.1mm") {
    return movePrecision / 100;
  } else if (moveUnit == "mm") {
    return movePrecision / 10;
  } else if (moveUnit == "cm") {
    return movePrecision;
  }
  return 0;
}

/**
 * Function returns calculated units of move by single click.
 * @returns {number}
 */
export function getRotationPrecision() {
  if (rotateUnit == "1/10") {
    return rotatePrecision / 10;
  } else if (rotateUnit == "1") {
    return rotatePrecision;
  } else if (rotateUnit == "10") {
    return rotatePrecision * 10;
  }
  return 0;
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
    let ratio = false;
    switch (name) {
      case "arm1Length":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          arm1Length.value,
          minArmLength,
          maxArmLength
        );
        break;
      case "arm2Length":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          arm2Length.value,
          minArmLength,
          maxArmLength
        );
        break;
      case "toolDistanceToArm":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          toolDistance.value,
          minToolLength,
          maxToolLength
        );
        break;
      case "arm1Ratio":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          arm1Ratio.value,
          0.01,
          1000
        );
        ratio = true;
        break;
      case "arm2Ratio":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          arm2Ratio.value,
          0.01,
          1000
        );
        ratio = true;
        break;
      case "armAdditionalRatio":
        valFormatted = formatFloat(
          alertItem,
          alertMessage,
          armAdditionalRatio.value,
          0.01,
          1000
        );
        ratio = true;
        break;
    }
    if (valFormatted != null) {
      if (!ratio) {
        let temp = localStorage.getItem(name);
        localStorage.setItem(name, valFormatted);
        let arm1L = parseFloat(
          localStorage.getItem("arm1Length") || 20
        ).toFixed(2);
        let arm2L = parseFloat(
          localStorage.getItem("arm2Length") || 16
        ).toFixed(2);
        let toolL = parseFloat(
          localStorage.getItem("toolDistanceToArm") || 4
        ).toFixed(2);

        let formData = new FormData();
        formData.append("arm1", arm1L);
        formData.append("arm2", arm2L + toolL);

        fetch("/arm/set/length", {
          method: "POST",
          body: formData,
        }).then((response) => {
          if (response.ok) {
            //save and update numbers in menu
            arm1Length.value = arm1L;
            arm2Length.value = arm2L;
            toolDistance.value = toolL;
            updateDrawing();
            return true;
          } else {
            console.error("Cannot change length of arm");
            showDialog(
              alertItem,
              alertMessage,
              "e",
              "Cannot change length of arm"
            );
            localStorage.setItem(name, temp);
            return false;
          }
        });
      } else {
        localStorage.setItem(name, valFormatted);
        let arm1R = localStorage.getItem("arm1Ratio") || "1";
        let arm2R = localStorage.getItem("arm2Ratio") || "1";
        let armAdditionalR = localStorage.getItem("armAdditionalRatio") || "1";
        let formData = new FormData();
        formData.append("arm1Ratio", arm1R);
        formData.append("arm2Ratio", arm2R);
        formData.append("armAdditionalRatio", armAdditionalR);

        fetch("/arm/set/gear-ratio", {
          method: "POST",
          body: formData,
        }).then((response) => {
          if (response.ok) {
            arm1Ratio.value = arm1R;
            arm2Ratio.value = arm2R;
            armAdditionalRatio.value = armAdditionalR;
            return true;
          } else {
            console.error("Cannot change gear ratio of arm");
            showDialog(
              alertItem,
              alertMessage,
              "e",
              "Cannot change gear ratio of arm"
            );
            return false;
          }
        });
      }
    } else {
      arm1Ratio.value = parseFloat(
        localStorage.getItem("arm1Length") || 20
      ).toFixed(2);
      arm2Ratio.value = parseFloat(
        localStorage.getItem("arm2Length") || 20
      ).toFixed(2);
      toolDistance.value = parseFloat(
        localStorage.getItem("toolDistanceToArm") || 4
      ).toFixed(2);
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

  arm1Ratio.addEventListener("keypress", function (event) {
    onEditSize(event, "arm1Ratio", updateDrawing);
  });

  arm2Ratio.addEventListener("keypress", function (event) {
    onEditSize(event, "arm2Ratio", updateDrawing);
  });

  armAdditionalRatio.addEventListener("keypress", function (event) {
    onEditSize(event, "armAdditionalRatio", updateDrawing);
  });


  arm1Length.addEventListener("blur", function () {
    arm1Length.value = parseFloat(
      localStorage.getItem("arm1Length") || 4
    ).toFixed(2);
  });

  //edited but not saved data
  arm2Length.addEventListener("blur", function () {
    arm2Length.value = parseFloat(
      localStorage.getItem("arm2Length") || 4
    ).toFixed(2);
  });

  toolDistance.addEventListener("blur", function () {
    toolDistance.value = parseFloat(
      localStorage.getItem("toolDistanceToArm") || 0.8
    ).toFixed(2);
  });

  armAdditionalRatio.addEventListener("blur", function () {
    armAdditionalRatio.value = parseFloat(
      localStorage.getItem("armAdditionalRatio") || "1"
    ).toFixed(2);
  });

  arm2Ratio.addEventListener("blur", function () {
    arm2Ratio.value = parseFloat(
      localStorage.getItem("arm2Ratio") || "1"
    ).toFixed(2);
  });

  arm1Ratio.addEventListener("blur", function () {
    arm1Ratio.value = parseFloat(
      localStorage.getItem("arm1Ratio") || "1"
    ).toFixed(2);
  });
    document.getElementById("load").addEventListener("click", function () {
      loadSavedSettings(updateDrawing);
    });
      setSettings();
}

//List all files from server and display in table
function fillFilesTable() {
  let html = "";
  fetch("/files")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response error for /files");
      }
      return response.text();
    })
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
              '</td><td><button class="loadFileButtons" onClick="window.loadFile(\'' +
              fileData[0] +
              "')\">Load</button><button onClick=\"window.deleteFile('" +
              fileData[0] +
              "')\">Delete</button></td></tr>";
        });

      document.querySelector("#tableFiles table tbody").innerHTML = html;
    })
    .catch((error) => {
      console.error("ERROR during reading files list:", error);
      showDialog(alertItem, alertMessage, "e", "Cannot read file list");
    });
}
//List all accessible ports from server and display in table
function fillPortsTable() {
  let html = "";
  fetch("/ports", { method: "GET" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response error for /ports");
      }
      return response.json();
    })
    .then((data) => {
      html +=
        '<tr><td class="radioItem"><input type="radio" name="portList" id="demo" value="demo" ><label for="demo">DEMO MODE</label></td></tr>';
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
            if (this.value == "demo") {
              canMoveArm = true;
              demoMode = true;
              showDialog(alertItem, alertMessage, "s", "DEMO MODE");
            } else {
              var formData = new FormData();
              formData.append("port", this.value);
              fetch("/ports/select", {
                method: "POST",
                body: formData,
              }).then((response) => {
                if (response.ok) {
                  demoMode = false;
                  connectToArm();
                } else {
                  console.error("Cannot connect to arm");
                  showDialog(
                    alertItem,
                    alertMessage,
                    "e",
                    "Cannot connect to arm"
                  );
                }
              });
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error("ERROR during reading ports list:", error);
      showDialog(alertItem, alertMessage, "e", "Cannot read port list");
    });
}
/**
 * Function to load possible stepper modes from server and display in select
 */
function fillModeList() {
  let html = "";
  fetch("/modes", { method: "GET" })
    .then((response) => response.json())
    .then((data) => {
      data.forEach((mode) => {
        let text = mode.first;
        switch (mode.first) {
          case "ONE":
            text = "1";
            break;
          case "HALF":
            text = "1/2";
            break;
          case "ONE_QUARTER":
            text = "1/4";
            break;
        }

        html += '<option value="' + mode.second + '">' + text + "</option>";
      });
      modeList.innerHTML = html;
      modeList.value = stepperVal;
    });
}
/**
 * Function to select connected port
 */
function selectConnectedPort() {
  canMoveArm = false;
  fetch("/ports/last", { method: "GET" }).then((response) => {
    if (response.status !== 204) {
      response.text().then((data) => {
        let radioButtons = document.querySelectorAll(
          'input[type="radio"][name="portList"]'
        );
        radioButtons.forEach((port) => {
          if (port.value === data) {
            port.checked = true;
            canMoveArm = true;
          }
        });
      });
    }
  });
}

/**
 * Function to init connection between arm, with selected port
 */
function connectToArm() {
  fetch("/arm/start", {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        canMoveArm = true;
        showDialog(alertItem, alertMessage, "s", "Connected to arm");
      } else {
        console.error("Cannot connect to arm");
        canMoveArm = false;
        showDialog(alertItem, alertMessage, "e", "Cannot connect to arm");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showDialog(alertItem, alertMessage, "e", "Cannot connect to arm");
    });
}

function saveSettings() {
  const formData = new FormData();
  formData.append("right", checkbox.checked);
  formData.append("speed", speedInput.value);
  formData.append("arm1Length", arm1Length.value);
  formData.append("arm2Length", arm2Length.value);
  formData.append("toolDistance", toolDistance.value);
  formData.append("arm1Ratio", arm1Ratio.value);
  formData.append("arm2Ratio", arm2Ratio.value);
  formData.append("extraRatio", armAdditionalRatio.value);

  fetch("/files/options/save", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) console.error("Options saving error");
    })
    .catch((error) => {
      showDialog(alertItem, alertMessage, "e", "Cannot save options file");
    });
}
function setSettings() {
  const formData = new FormData();
  formData.append("right", checkbox.checked);
  formData.append("speed", speedInput.value);
  formData.append("arm1Length", arm1Length.value);
  formData.append("arm2Length", parseFloat(arm2Length.value)+parseFloat(toolDistance.value));
  formData.append("arm1Ratio", arm1Ratio.value);
  formData.append("arm2Ratio", arm2Ratio.value);
  formData.append("extraRatio", armAdditionalRatio.value);

  fetch("/files/options/set", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) console.error("Options setting error");
    })
    .catch((error) => {
      showDialog(alertItem, alertMessage, "e", "Cannot set options");
    });
}
function loadSavedSettings(onLoad) {
  fetch("/files/options/read", { method: "GET" })
    .then((response) => response.blob())
    .then((blob) => {
      var reader = new FileReader();
      reader.onload = function () {
        var fileData = reader.result;
        var lines = fileData.split("\n");
        //push vector to array if position changed
        lines.forEach((line) => {
          let values = line.split(": ");
          if(values.length == 2){
              switch (values[0].trim()) {
                case "right":
                  checkbox.checked = Boolean(values[1].trim());
                  localStorage.setItem("rightSide", checkbox.checked);
                  break;
                case "speed":
                  speedInput.value = parseFloat(values[1].trim());
                  localStorage.setItem("maxSpeed", speedInput.value);
                  break;
                case "arm1Length":
                  arm1Length.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("arm1Length", arm1Length.value);
                  break;
                case "arm2Length":
                  arm2Length.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("arm2Length", arm2Length.value);
                  break;
                case "toolDistance":
                  toolDistance.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("toolDistance", toolDistance.value);
                  break;
                case "arm1Ratio":
                  arm1Ratio.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("arm1Ratio", arm1Ratio.value);
                  break;
                case "arm2Ratio":
                  arm2Ratio.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("arm2Ratio", arm2Ratio.value);
                  break;
                case "extraRatio":
                  armAdditionalRatio.value = parseFloat(values[1].trim()).toFixed(2);
                  localStorage.setItem("armAdditionalRatio", armAdditionalRatio.value);
                  break;
                default:
                  break;
              }
          }
        });
        onLoad();
      };
      reader.readAsText(blob);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

export function refreshPorts() {
  fillPortsTable();
  selectConnectedPort();
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
 *Switch to expand menu after selecting port reactive mode is turned on, tool now can be moved by arrows and  arms by mouse scroll
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
      turnOffOverlay();
      expanded = false;
      portMenu.style.left = portMenuHide;
    }
  }, time);
});
document.getElementById("closePortIcon").addEventListener("click", function () {
  portMenu.style.left = portMenuHide;
  turnOffOverlay();
  expanded = false;
});
////    Manual menu
precisionMoveInput.addEventListener("keypress", function () {
  let temp = formatInt(
    alertItem,
    alertMessage,
    precisionMoveInput.value,
    1,
    1000
  );
  if (temp == null) {
    precisionMoveInput.value = movePrecision;
    return false;
  } else {
    movePrecision = temp;
    localStorage.setItem("movePrecision", movePrecision);
    return true;
  }
});
precisionUnit.addEventListener("change", function () {
  moveUnit = precisionUnit.value;
  localStorage.setItem("moveUnit", moveUnit);
});

precisionRotationInput.addEventListener("keypress", function () {
  let temp = formatInt(
    alertItem,
    alertMessage,
    precisionRotationInput.value,
    1,
    1000
  );
  if (temp == null) {
    precisionRotationInput.value = rotatePrecision;
    return false;
  } else {
    rotatePrecision = temp;
    localStorage.setItem("rotatePrecision", rotatePrecision);
    return true;
  }
});
precisionRotationUnit.addEventListener("change", function () {
  rotateUnit = precisionRotationUnit.value;
  localStorage.setItem("rotateUnit", rotateUnit);
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
      turnOnOverlay();
      loadMenu.style.left = barWidth;
      blockLoadButtons(!canMoveArm);
    } else {
      expanded = false;
      turnOffOverlay();
      loadMenu.style.left = loadMenuHide;
    }
  }, time);
});

document.getElementById("closeLoadIcon").addEventListener("click", function () {
  loadMenu.style.left = loadMenuHide;
  turnOffOverlay();
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
        showDialog(
          alertItem,
          alertMessage,
          "i",
          "A file with this name already exists, please rename the uploaded file."
        );
      } else {
        fetch("/files/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (response.ok) {
              fillFilesTable();
              showDialog(
                alertItem,
                alertMessage,
                "s",
                "File successfully uploaded"
              );
            } else
              showDialog(alertItem, alertMessage, "e", "Cannot uploaded file");
          })
          .catch((error) => {
            console.error("File upload error: " + error);
            showDialog(alertItem, alertMessage, "e", "Cannot uploaded file");
          });
      }
    })
    .catch((error) => {
      showDialog(alertItem, alertMessage, "e", "Cannot find file");
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
          showDialog(alertItem, alertMessage, "s", "File was deleted");
          fillFilesTable();
        } else {
          console.error("ERROR during file deletion.");
          showDialog(alertItem, alertMessage, "e", "Cannot delete file");
        }
      })
      .catch((error) => {
        console.error("ERROR occurred:", error);
        showDialog(alertItem, alertMessage, "e", "Cannot delete file");
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
      turnOnOverlay();
      optionsMenu.style.left = barWidth;
    } else {
      expanded = false;
      turnOffOverlay();
      optionsMenu.style.left = optionMenuHide;
    }
  }, time);
});

document
  .getElementById("closeOptionsIcon")
  .addEventListener("click", function () {
    optionsMenu.style.left = optionMenuHide;
    turnOffOverlay();
    expanded = false;
  });
//isright li and checkbox
direction.addEventListener("click", function () {
  toggle.click();
});
checkbox.addEventListener("click", function () {
  toggle.click();
});
modeList.addEventListener("change", function () {
  var selectedOption = modeList.value;
  var formData = new FormData();
  formData.append("mode", selectedOption);
  fetch("/arm/set/motor-mode", {
    method: "POST",
    body: formData,
  }).then((response) => {
    if (response.ok) {
      localStorage.setItem("stepperVal", selectedOption);
      return true;
    } else {
      console.error("Cannot change mode of motor");
      showDialog(alertItem, alertMessage, "e", "Cannot change mode of motor");
      return false;
    }
  });
});

speedInput.addEventListener("change", function () {
  let valFormatted = formatFloat(
    alertItem,
    alertMessage,
    speedInput.value,
    0.01,
    1000
  );
  var formData = new FormData();
  formData.append("speed", valFormatted);
  fetch("/arm/set/max-speed", {
    method: "POST",
    body: formData,
  }).then((response) => {
    if (response.ok) {
      localStorage.setItem("maxSpeed", valFormatted);
      return true;
    } else {
      console.error("Cannot change max speed");
      showDialog(alertItem, alertMessage, "e", "Cannot change max speed");
      return false;
    }
  });
});
speedInput.addEventListener("blur", function () {
  speedInput.value = parseFloat(localStorage.getItem("maxSpeed") || "20");
});

document.getElementById("save").addEventListener("click", function () {
  saveSettings();
});

logout.addEventListener("click", function () {
  if (confirm("Are you sure you want to Logout?") == true) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/logout");

    xhr.onload = function () {
      if (xhr.status === 200) {
        showDialog(alertItem, alertMessage, "s", "Logged out successfully");
        setTimeout(() => {
          location.reload(true);
        }, 5000);
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
          showDialog(
            alertItem,
            alertMessage,
            "s",
            "Account deleted successfully",
            defaultAlertTime
          );
          setTimeout(() => {
            location.reload(true);
          }, defaultAlertTime);
        }
      };
      xhr.send();
    }
  }
});
closeAlertButton.addEventListener("click", function () {
  alertItem.classList.remove("show");
  alertItem.classList.add("hide");
});
document.addEventListener("DOMContentLoaded", function () {
  fillFilesTable();
  fillPortsTable();
  fillModeList();
  selectConnectedPort();
});
