// ==UserScript==
// @name         Sophy with Pfaf
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Display Sophy phytotypes with Pfaf data
// @author       Clrh
// @match        https://sophy.tela-botanica.org/phytons/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==


(function() {
  'use strict';

  GM_addStyle(`
        .modal-content{
            padding: 2em;

        }

        .modal {
            border: 1px solid;
            background: white;
            display: block;
            position: absolute;
            right: 0;
            height: auto;
            width: 200px;
            top: 10%;
        }

        .close {
          color: #aaaaaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          padding: 0 1em;
        }

        .close:hover,
        .close:focus {
          color: #000;
          text-decoration: none;
          cursor: pointer;
        }

        label {
          font-weight: bold;
        }
`);

  var anchors = document.querySelectorAll("table pre font a");

  var modal;
  var modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");


  var modalParent = document.createElement("div");
  modalParent.classList.add("modal");
  var closeContent = document.createElement("span");
  closeContent.classList.add("close");
  closeContent.innerText = "x";
  modalParent.appendChild(closeContent);

  modalParent.appendChild(modalContent);
  //modalContent.innerText = "";
  document.body.appendChild(modalParent);
  modalParent.style.display = "none";

  closeContent.onclick = function() {
    modalParent.style.display = "none";
  }

  var pfafurl = "https://pfaf.org/user/Plant.aspx?LatinName=Arundinaria+gigantea";

  for (var i = 0; i < anchors.length; i++) {
    var latinName = anchors[i].innerText;

    let re = /([A-Z,-]{3,} )+/
    let result = re.exec(latinName);
    let latinNameToChange = result[0];
    let newLatinName = latinNameToChange.replace(/ /g, '+');
    pfafurl = "https://pfaf.org/user/Plant.aspx?LatinName=" + newLatinName;

    anchors[i].setAttribute('data-href', pfafurl);
    anchors[i].setAttribute('data-latinname', newLatinName);
    anchors[i].href = "#";

    anchors[i].onclick = function() {
      modalParent.style.display = "block";
      modalContent.innerHTML = '';
      var clickedurl = this.getAttribute('data-href');
      var clickedLatinName = this.getAttribute('data-latinname');
      clickedLatinName = clickedLatinName.replace(/\+/g, ' ');

      GM_xmlhttpRequest({
        method: "GET",
        url: clickedurl,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html"
        },
        onload: function(response) {
          var docPfaf = null;
          if (!response.doc) {
            docPfaf = new DOMParser().parseFromString(response.responseText, "text/html");

            putNewItem(clickedLatinName);
            putNewItemFromPfaf(docPfaf, 'ContentPlaceHolder1_lblCommanName');
            putNewItemFromPfaf(docPfaf, 'ContentPlaceHolder1_lblFamily', 'Famille');
            putNewItemFromPfaf(docPfaf, 'ContentPlaceHolder1_txtEdrating', 'Comestibilité');
            putNewItemFromPfaf(docPfaf, 'ContentPlaceHolder1_txtOtherUseRating', 'Autres usages');
            putNewItemFromPfaf(docPfaf, 'ContentPlaceHolder1_txtMedRating', 'Usage santé');

            putNewTableFromPfaf(docPfaf, 'ContentPlaceHolder1_tblIcons', 'Entretien');
            addLink("Source", clickedurl);

            var regex = /\b[A-Z]{2,}\b/g;
            clickedLatinName = clickedLatinName.replace(regex, function(match) {
              return match.toLowerCase();
            });
            addLink("Wikipedia", "https://fr.wikipedia.org/wiki/" + clickedLatinName);
          }
        }
      });

      return false;
    }
  }

  function putNewTableFromPfaf(docPfaf, idInPfaf, label) {
    var images = docPfaf.querySelectorAll('#' + idInPfaf + ' img');
    console.log(images);
    var plantData = document.createElement("p");

    if (label != undefined) {
      plantData.innerHTML = '<label>' + label + '</label>';
    }

    for (var i = 0; i < images.length; i++) {
      plantData.innerHTML += '<br/>' + images[i].getAttribute('title');
      console.log(images[i].getAttribute('src'), 'url');
    }
    modalContent.appendChild(plantData);
  }

  function putNewItemFromPfaf(docPfaf, idInPfaf, label) {
    var docCommonName = docPfaf.getElementById(idInPfaf).innerText;
    var plantData = document.createElement("p");
    if (label != undefined) {
      plantData.innerHTML = '<label>' + label + '</label> ' + docCommonName;
    } else {
      plantData.innerHTML = docCommonName;
    }
    modalContent.appendChild(plantData);
  }

  function putNewItem(item) {
    var plantData = document.createElement("h3");
    plantData.innerHTML = item;
    modalContent.appendChild(plantData);
  }

  function addLink(text, link) {
    var a = document.createElement('a');
    var linkText = document.createTextNode(text);
    a.appendChild(linkText);
    a.title = text;
    a.href = link;
    var p = document.createElement("p");
    p.appendChild(a);
    modalContent.appendChild(p);
  }
})();


// Sous le coude - Exemples
// https://gist.github.com/niikoo/391b11dc97be448cb068de76402c33e5
// https://userscripts-mirror.org/scripts/review/8421
// https://greasyfork.org/fr/scripts/16946-imdb-info-torrent-from-magnet/code