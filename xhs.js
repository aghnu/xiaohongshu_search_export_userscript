// ==UserScript==
// @name         xhs downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://pgy.xiaohongshu.com/solar/advertiser/patterns/kol
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // set constants
    let targetURL = "cooperator/blogger/v2"

    // set information process function
    const processor = (responseBodyText) => {
        let jsonResponse = JSON.parse(responseBodyText);
        console.log(jsonResponse);
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
        let nextButton = document.getElementsByClassName("pagination_cell")[8];
        
        nextButton.click();
    });

    document.body.appendChild(trigger);
    // document.body.appendChild(inject);
})();