let myNet = new QNet("test")
document.addEventListener("DOMContentLoaded", function() {
  console.log(myNet)
  let config_sl = {
    "element": "div",
    "class": ["tab","sl"]
  }
  myNet.addField("left", "sl", config_sl)
  let config_sr = {
    "element": "div",
    "class": ["tab","sr"]
  }
  myNet.addField("right", "sr", config_sr)
  let config_bc = {
    "element": "div",
    "class": ["tab","bc"]
  }
  myNet.addField("center", "bc", config_bc)
  console.log(myNet)
});
