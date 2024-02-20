
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
export function showDialog(alertItem, messageItem, type, message, duration=5000){
    messageItem.textContent=message;
    if(type=='e' || type=='E'){
        alertItem.classList.add("alert-error");
        alertItem.classList.remove("alert-info");
        alertItem.classList.remove("alert-success");
    }else if(type=='s' || type=='S'){
        alertItem.classList.add("alert-success");
        alertItem.classList.remove("alert-error");
        alertItem.classList.remove("alert-info");
    }else{
        alertItem.classList.add("alert-info");
        alertItem.classList.remove("alert-error");
        alertItem.classList.remove("alert-success");
    }

    alertItem.classList.add("show");
    alertItem.classList.remove("hide");
    alertItem.classList.add("showAlert");
    if(duration>-1)
        setTimeout(function(){
            alertItem.classList.remove("show");
            alertItem.classList.add("hide");
        },duration);
}