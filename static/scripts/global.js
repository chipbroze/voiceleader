// GLOBAL JAVASCRIPT //

// DOM Ready ================================================================

var populateBtn = document.getElementById('pop');
populateBtn.addEventListener('click', populateScores);

// Score Functions ==========================================================

// Fill body with score-thumbnail divs
function populateScores() {

  // Create new XMLHttpRequest object
  var xReq = new XMLHttpRequest();

  // Set Response listener
  xReq.addEventListener('load', function() {
    var container = document.getElementById('container');
    var textNode = document.createTextNode(this.responseText);
    pTag.appendChild(textNode);
    container.appendChild(pTag);
  });

  // Submit request
  xReq.open("GET", '/scores/xml');
  xReq.send();
}
