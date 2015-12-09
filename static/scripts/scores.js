
  var btns = document.getElementsByClassName('del-score');
  for (var b = 0, len = btns.length; b < len; b++) {
    btns[b].addEventListener('click', function(ev) {
      ev.preventDefault();
      if (!confirm("Are you sure you want to delete this score?")) {
        return false;
      }
      var xhttp = new XMLHttpRequest();
      xhttp.open('DELETE', '/scores/' + this.id);
      xhttp.send();
      this.parentNode.style.display = 'none';
    });
  }
