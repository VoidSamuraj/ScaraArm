
var alertQueue = [];
var isAlertVisible=false;

/**
 * Replaces ',' with '.', checks if number is inside range and rounds it to two decimal places
  * @param alertItem html container containing dialog body
  * @param messageItem html container inside alertItem containing message
 * @param {string} text string to change to float
 * @param {int} min min possible number
 * @param {int} max max possible number
 * @param {int} time millis to display message if number invalid
 * @returns {float|null} float or null if string is not valid number or outside range
 */
export function formatFloat(alertItem, messageItem, text, min, max, time=5000) {
  let formatted = text.replace("/,/g", ".");
  let parsedNumber = parseFloat(formatted);
  if (
    isNaN(parsedNumber) ||
    formatted.split(".").length - 1 > 1 ||
    formatted > max ||
    formatted < min
  ) {
    showDialog(alertItem, messageItem, 'i',"Please insert valid number between " + min + " and " + max,time);
    return null;
  }
  return parsedNumber.toFixed(2);
}
/**
 * Format input to int, checks if int is in range
  * @param alertItem html container containing dialog body
  * @param messageItem html container inside alertItem containing message
 * @param {string} text string to change to float
 * @param {int} min min possible number
 * @param {int} max max possible number
 * @param {int} time millis to display message if number invalid
 * @returns {float|null} float or null if string is not valid number or outside range
 */
export function formatInt(alertItem, messageItem, text, min, max, time=5000) {
  let formatted = text.replace(",", ".");
  let parsedNumber = parseInt(formatted, 10);
  if (
    isNaN(parsedNumber) ||
    parsedNumber > max ||
    parsedNumber < min
  ) {
    showDialog(alertItem, messageItem, 'i', "Please insert a valid integer between " + min + " and " + max, time);
    return null;
  }
  return parsedNumber;
}

/**
 * Function to show alert
 * @param alertItem html container containing dialog body
 * @param messageItem html container inside alertItem containing message
 * @param {char} type char to select type of alert: s-success, i-info or e-error
 * @param {string} message message displayed in alert
 * @param {int} duration message display duration in ms, -1 to not hide
 */
export function showDialog(alertItem, messageItem, type, message, duration = 5000) {
    alertQueue.push({ alertItem, messageItem, type, message, duration }); // Dodanie powiadomienia do kolejki
    processQueue(); // Uruchomienie przetwarzania kolejki
}

function processQueue() {
    if (alertQueue.length === 0) return; // Jeśli kolejka jest pusta, nie ma nic do zrobienia

    if (isAlertVisible) return; // Sprawdzenie, czy powiadomienie jest aktualnie wyświetlane

    const { alertItem, messageItem, type, message, duration } = alertQueue.shift(); // Pobranie pierwszego elementu z kolejki
    isAlertVisible = true; // Ustawienie flagi na true, aby oznaczyć, że powiadomienie jest wyświetlane

    messageItem.textContent = message;
    if (type == 'e' || type == 'E') {
        alertItem.classList.add("alert-error");
        alertItem.classList.remove("alert-info");
        alertItem.classList.remove("alert-success");
    } else if (type == 's' || type == 'S') {
        alertItem.classList.add("alert-success");
        alertItem.classList.remove("alert-error");
        alertItem.classList.remove("alert-info");
    } else {
        alertItem.classList.add("alert-info");
        alertItem.classList.remove("alert-error");
        alertItem.classList.remove("alert-success");
    }

    alertItem.classList.add("show");
    alertItem.classList.remove("hide");
    alertItem.classList.add("showAlert");
    setTimeout(function () {
        alertItem.classList.remove("show");
        alertItem.classList.add("hide");
        isAlertVisible = false;
        processQueue();
    }, Math.abs(duration));
}
/**
*Function to check if input is GCode, it supports G1 command but G1 is not necessary.
* @param {string} line - line to check if is in GCode format
* @returns {boolean} - true if is in format "G1 X10 Y10 Z10 E10 F10", none of this params are necessary and it works with decimals.
*/
export function checkIfThatIsGCode(line){
   var elements = line.split(" ");
   var ret=true;
   elements.forEach(command => {
       if(command == "G1" || command == "g1"
        || command == "G91" || command == "g91"
        || command == "G90" || command == "g90"
        || command ==""){

       }else{
       var first = command.charAt(0);
       var value = command.slice(1);

       switch (first) {
           case 'X':
           case 'Y':
           case 'Z':
           case 'E':
           case 'F':
           case 'x':
           case 'y':
           case 'z':
           case 'e':
           case 'f':
               var numberRegex = /^-?\d+(\.\d+)?$/;
               if(!numberRegex.test(value))
                    ret=false;
               break;
           default:
            ret=false;
       }
    }
   });
   return ret;
}
