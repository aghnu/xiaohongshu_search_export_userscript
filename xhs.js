// ==UserScript==
// @name         xhs downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Gengyuan Huang
// @match        https://pgy.xiaohongshu.com/solar/advertiser/patterns/kol
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // set globals
    var targetURL = "cooperator/blogger/v2";
	var sheetName = "Test Sheet";
    var ifstart = false;
    var content = [];
	var nextPage = () => {};
	var workbook = createWorkBook(sheetName);


    // set information process function
    const processor = (responseBodyText) => {
		if (!ifstart) {
			content = [responseBodyText];
		} else {
			content = content.push(responseBodyText);
			nextPage();
		}
    }

	const createWorkBook = (sheetname, props={}) => {
		var wb = XLSX.utils.book_new();
		wb.Props = {};
		wb.SheetNames.push(sheetname)
		return wb;
	}

	const addNewRowToWB = (wb) => {

	}

    // injection
    // intercepting AJAX responses
    // looking for given url
    let send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('readystatechange', function() {
        if (this.responseURL.includes(targetURL) && this.readyState === 4) {
          processor(this.responseText);
        }
      }, false);
      send.apply(this, arguments);
    };

    // create button and onclick listener
    let trigger = document.createElement('button');
    trigger.setAttribute(
        'style',
        `
            position: fixed;
            bottom: 2em;
            right: 2em;
            z-index: 999;
            background-color: black;
            color: white;
            padding: 0.5em;
            font-size: 1.5em;
            font-weight: bolder;
            border-radius: 0.5em;
        `
    );
    trigger.innerHTML = "Click here to start";
    trigger.addEventListener('click', () => {

		if (!ifstart) {
			let nextButton = document.getElementsByClassName("pagination_cell")[8];
			ifstart = true;
			nextPage = nextButton.click;
		}

    });

    document.body.appendChild(trigger);
    // document.body.appendChild(inject);
})();