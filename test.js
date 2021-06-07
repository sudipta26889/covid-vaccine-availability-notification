const GoogleHome = require('./googleHomePush');
//const GoogleHome = require('google-home-push');



let options = {
    language: "hi",
    port: "82"
  };


// Pass the name or IP address of your device
const myHome1 = new GoogleHome("122.170.6.87", options);
// const myHome1 = new GoogleHome("192.168.1.106", options);
// myHome1.speak("Dholai Molai amar sona may!");
myHome1.speak("Hey!");

