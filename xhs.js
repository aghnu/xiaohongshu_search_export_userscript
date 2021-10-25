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
    var gotinfo = false;
    var content = [];
    var autoPage = null;
	// var workbook = createWorkBook(sheetName);


    // set information process function
    const processor = (responseBodyText) => {
		if (autoPage == null) {
			content = [responseBodyText];
            gotinfo = true;
		} else {
			content.push(responseBodyText);
			gotinfo = true;
		}
    }

    const clickStart = () => {
        console.log("clicked");
        waitsForNext();     // set auto next page
    }

    const clickPrint = () => {
        console.log("start printing");

        // create workbook
        var wb = XLSX.utils.book_new();
        var sheetContent = [['name', 'gender', 'likeCollectCountInfo', 'totalNoteCount']]
        wb.props = {};
        wb.SheetNames.push("out");
        

        window.clearInterval(autoPage);
        autoPage = null;
        content.forEach(pageRecord => {
            let jsonPageRecord = JSON.parse(pageRecord);
            jsonPageRecord.data.kols.forEach(userRecord => {
                sheetContent.push(
                    [
                        userRecord.name,
                        userRecord.gender,
                        userRecord.likeCollectCountInfo,
                        userRecord.totalNoteCount,
                    ]
                );
            });
        });

        var ws = XLSX.utils.aoa_to_sheet(sheetContent);
        wb.Sheets["out"] = ws;
        XLSX.writeFile(wb, 'out.xlsb');
    }

	// const createWorkBook = (sheetname, props={}) => {
	// 	var wb = XLSX.utils.book_new();
	// 	wb.Props = {};
	// 	wb.SheetNames.push(sheetname)
	// 	return wb;
	// }

	// const addNewRowToWB = (wb) => {

	// }

    const waitsForNext = () => {
        // this function looking for the next button, when next button open, click the button
        autoPage = setInterval(() => {

            let nextButton = document.getElementsByClassName("pagination_cell")[8];
            console.log("next");
            console.log(gotinfo);
            console.log(nextButton);
            if ((gotinfo)&&(nextButton != null)) {
                gotinfo = false;
                nextButton.click();
            }
        }, 3000);
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



    let buttonStyle = `
        z-index: 999;
        background-color: white;
        border: solid;
        border-color: black;
        color: black;
        padding: 0.3em;
        font-size: 1.2em;
        font-weight: bold;
        border-radius: 0.3em;
    `

    // create button and onclick listener
    let trigger = document.createElement('button');
    trigger.setAttribute('style',buttonStyle);
    trigger.innerHTML = "Click here to start";
    trigger.addEventListener('click', clickStart);

    let printer = document.createElement('button');
    printer.setAttribute('style',buttonStyle);
    printer.innerHTML = "Click here to download";
    printer.addEventListener('click', clickPrint);

    let controlPanel = document.createElement('div');
    controlPanel.setAttribute(
        'style',
        `
            display: flex;
            gap: 1em;
            position: fixed;
            bottom: 2em;
            left: 2em;
        `
    )

    controlPanel.appendChild(trigger);
    controlPanel.appendChild(printer);

    document.body.appendChild(controlPanel);
    // document.body.appendChild(inject);
})();