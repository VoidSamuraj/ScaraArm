
const menu=document.querySelector('nav');


document.getElementById('burger-button').addEventListener('click', function() {
    menu.style.left = '0';
});

document.getElementById('menu-button-icon').addEventListener('click', function() {
    menu.style.left = '-250px';
});
