import {showDialog, defaultAlertTime}from '/static/navigation.js'
/**
 * Replaces ',' with '.', checks if number is inside range and rounds it to two decimal places
 * @param {string} text string to change to float
 * @param {int} min min possible number
 * @param {int} max max possible number
 * @returns {float|null} float or null if string is not valid number or outside range
 */
export function formatFloat(text, min, max) {
  let formatted = text.replace("/,/g", ".");
  let parsedNumber = parseFloat(formatted);
  if (
    isNaN(parsedNumber) ||
    formatted.split(".").length - 1 > 1 ||
    formatted > max ||
    formatted < min
  ) {
    showDialog('i',"Please insert valid number between " + min + " and " + max,defaultAlertTime);
    return null;
  }
  return parsedNumber.toFixed(2);
}
/**
 * Format input to int, checks if int is in range
 * @param {string} text string to change to float
 * @param {int} min min possible number
 * @param {int} max max possible number
 * @returns {float|null} float or null if string is not valid number or outside range
 */
export function formatInt(text, min, max) {
  let formatted = text.replace(",", ".");
  let parsedNumber = parseInt(formatted, 10);
  if (
    isNaN(parsedNumber) ||
    parsedNumber > max ||
    parsedNumber < min
  ) {
    showDialog('i', "Please insert a valid integer between " + min + " and " + max, defaultAlertTime);
    return null;
  }
  return parsedNumber;
}