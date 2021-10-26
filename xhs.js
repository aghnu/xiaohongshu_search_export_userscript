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
    // https://pgy.xiaohongshu.com/solar/advertiser/patterns/kol

    // adjustiable variables
    var AUTO_PAGE_SPEED = 3;        // seconds
    var CONTENT_HEADER = [
        'name',
        'gender',
        'redId',

        'likeCollectCountInfo',
        'totalNoteCount',
        'fansCount',

        'lowerPrice',
        'personalTags',
        'type',

        'picturePrice',
        'videoPrice',
    ];
    var REQUIRE_DECRYPT = [
        "businessNoteCount",
        "fansCount",
        "lowerPrice",
        "pictureCpcBasePrice",
        "pictureCpcPerPrice",
        "picturePrice",
        "videoCpcBasePrice",
        "videoCpcPerPrice",
        "videoPrice",
    ];



    // set globals
    var ajaxFound = false;
    var autoPage = false;
    var autoPageButton = null;
    var decipherButtonRef = null;
    var content = [];
    var contentRecordCount = 0;
    var counterDisplayRef = null;
    var outterLayerRef = null;
    var decipherPanelShow = false;
    var decipherPanelRef = null;
    var decipherPanelInputRef = null;
    var decipherDictionary = null;
    var decipherLookUp = null;

    // helpers
    const updateCounter = () => {
        if (counterDisplayRef) {
            counterDisplayRef.innerHTML = contentRecordCount;
        }
    }

    // onclick events
    const clickDecipher = () => {
        decipherPanelShow = !decipherPanelShow;
        if ((decipherPanelShow)&&(decipherPanelRef)&&(outterLayerRef)&&(decipherPanelInputRef)) {
            decipherPanelInputRef.value = decipherDictionary;
            outterLayerRef.appendChild(decipherPanelRef);
            decipherButtonRef.setAttribute('style', buttonStylePressed);
        } else {
            try {
                if (decipherPanelInputRef.value) {
                    decipherLookUp = JSON.parse(decipherPanelInputRef.value);
                    decipherDictionary = decipherPanelInputRef.value;
                    decipherPanelInputRef.value = null;
                 
                } else {
                    decipherLookUp = null;
                    decipherDictionary = null;
                    decipherPanelInputRef.value = null;
                }
                outterLayerRef.removeChild(decipherPanelRef);
                decipherButtonRef.setAttribute('style', buttonStyle);   
            } catch (e) {
                decipherPanelShow = !decipherPanelShow;
                alert(e);
            }
        }
    }
    const clickErase = () => {
        // clear all records
        content = [];
        contentRecordCount = 0;
        updateCounter();
    }
    const clickStart = () => {
        autoPage = !autoPage;       // switch
        if ((autoPage)&&(autoPageButton)) {
            autoPageButton.setAttribute('style', buttonStylePressed);
        } else {
            autoPageButton.setAttribute('style', buttonStyle);
        }
    }
    const clickPrint = () => {
        // create workbook
        var wb = XLSX.utils.book_new();
        wb.props = {};
        wb.SheetNames.push("out");

        // construct sheet content
        var sheetContent = [];
        sheetContent.push(CONTENT_HEADER);
        content.forEach(users => {
            users.forEach(userRecord => {
                let rowTemp = [];
                CONTENT_HEADER.forEach(h => {
                    // decipher
                    if ((REQUIRE_DECRYPT.includes(h))&&(decipherLookUp)) {
                        let cipherStr = String(userRecord[h]);
                        Object.keys(decipherLookUp).forEach(k => {
                            cipherStr = cipherStr.split(k).join(decipherLookUp[k]);
                        });
                        rowTemp.push(cipherStr);
                        
                    } else {
                        rowTemp.push(String(userRecord[h]));
                    }
                });

                sheetContent.push(rowTemp);
            });
        });


        // create worksheet
        var ws = XLSX.utils.aoa_to_sheet(sheetContent);
        wb.Sheets["out"] = ws;

        // export
        XLSX.writeFile(wb, 'out.xlsb');
    }

    // filter AJAX call and store content
    let send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('readystatechange', function() {
            if (this.responseURL.includes("cooperator/blogger/v2") && this.readyState === 4) {
                let contentJSON = JSON.parse(this.responseText).data.kols;
                // contentJSON.data.kols.forEach(userRecord => {

                //     let rowTemp = [];
                //     CONTENT_HEADER.forEach(h => {
                //         rowTemp.push(String(userRecord[h]));
                //     });

                //     content.push(rowTemp);
                // });
                content.push(contentJSON);
                contentRecordCount += Object.keys(contentJSON).length;
                updateCounter();
                ajaxFound = true;
            }
        }, false);
        send.apply(this, arguments);
    };


    // attemp to click on next page every 3 seconds
    // will only fire:
    //      1. if previous targeted ajax call is received
    //      2. find the next button
    //      3. user turned on auto next page
    setInterval(() => {
        let nextButton = document.getElementsByClassName("pagination_cell")[8];
        if ((autoPage)&&(ajaxFound)&&(nextButton != null)) {
            ajaxFound = false;      // reset it to false.
            nextButton.click();     // going next page
        }
    }, AUTO_PAGE_SPEED * 1000);

    // user interface
    let buttonStyle = `
        background-color: #fffbf5;
        border: none;
        border-radius: 50%;
        box-shadow: 0pt 0pt 2pt rgb(0,0,0,0.2);
        cursor: pointer;
        width: 3.5em;
        height: 3.5em;
        margin: auto;
    `

    let buttonStylePressed = `
        background-color: #ffc6bd;
        border: none;
        border-radius: 50%;
        box-shadow: inset 0pt 0pt 2pt rgb(0,0,0,0.2);
        cursor: pointer;
        width: 3.5em;
        height: 3.5em;
        margin: auto;
    `

    let buttonNameStyle = `
        font-size: 0.7em;
        font-family: Arial, Helvetica, sans-serif;
        color: grey;
        text-align: center;
        margin-bottom: 1em;
    `

    let controlPanelStyle = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.5em;
        background-color: #FFF4E2;
        height: auto;
        width: min-content;
        height: min-content;
        overflow: hidden;
        border-radius: 0.8em;
        box-shadow: 0pt 0pt 2pt rgb(0,0,0,0.4);
    `

    let buttonPanelContainerStyle = `
        padding: 0.8em;

    `

    let counterDisplayStyle = `
        font-size: 0.7em;
        font-family: Arial, Helvetica, sans-serif;
        color: grey;
        width: 6em;
        overflow-wrap: break-word;
        text-align: center;
    `

    let counterDisplayContainerStyle = `
        display: flex;
        justify-content: center;
        background-color: white;
        box-shadow: 0pt 0pt 2pt rgb(0,0,0,0.2);
    `

    let outterLayerStyle = `
        display: flex;
        gap: 2em;
        position: fixed;
        bottom: 2em;
        left: 2em;
        z-index: 999;
    `

    let decipherPanelStyle = `
        display: flex;
        flex-direction: column;
        background-color: red;
        background-color: #FFF4E2;
        overflow: hidden;
        border-radius: 0.8em;
        box-shadow: 0pt 0pt 2pt rgb(0,0,0,0.4);
        height: min-content;
        width: min-content;
    `

    let decipherFormInputStyle = `
        width: 10em;
        height: 20em;
        margin: 0.3em;
        padding: 1em;
        text-align: left;
        overflow-wrap: break-word;
        overflow: hidden;
        border-radius: 0.8em;
        outline: none;
        border: none;
    `

    let triggerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2.2em" viewBox="0 0 350 350"><rect width="350" height="350" fill="none"/><g transform="translate(0.092 8.507)"><path d="M272.845,114.883H199.987V52.433A36.429,36.429,0,0,1,236.416,16h0a36.429,36.429,0,0,1,36.429,36.429Z" transform="translate(-61.508 -5.596)" fill="#fff"/><rect width="104.083" height="15.613" transform="translate(122.867 109.288)" fill="#fac15c"/><g transform="translate(29.189 26.02)"><circle cx="15.613" cy="15.613" r="15.613" transform="translate(260.214)" fill="#f9b233"/><circle cx="15.613" cy="15.613" r="15.613" fill="#f9b233"/></g><g transform="translate(102.047 119.697)"><rect width="15.613" height="26.017" transform="translate(114.492 109.288)" fill="#fac15c"/><rect width="15.613" height="31.225" transform="translate(130.107)" fill="#fac15c"/><rect width="15.613" height="31.225" fill="#fac15c"/><rect width="15.613" height="26.017" transform="translate(15.615 109.288)" fill="#fac15c"/></g><g transform="translate(76.03 281.026)"><rect width="31.225" height="46.837" transform="translate(166.534)" fill="#f9b233"/><rect width="31.225" height="46.837" fill="#f9b233"/></g><g transform="translate(50.008 307.045)"><path d="M89.974,492.931H63.953V482.523l26.021-10.409Z" transform="translate(-63.953 -472.114)" fill="#1d71b8"/><path d="M408.037,492.931h26.021V482.523l-26.021-10.409Z" transform="translate(-184.258 -472.114)" fill="#1d71b8"/></g><rect width="83.27" height="57.246" transform="translate(133.277 192.551)" fill="#77aad4"/><rect width="41.634" height="57.246" transform="translate(174.908 192.551)" fill="#1d71b8"/><rect width="114.492" height="67.656" transform="translate(117.662 124.902)" fill="#77aad4"/><rect width="57.246" height="67.656" transform="translate(174.908 124.902)" fill="#1d71b8"/><rect width="20.817" height="20.817" transform="translate(164.499 145.714)" fill="#fac15c"/><path d="M263.181,247.24H232.118V216.177h31.063Zm-20.817-10.246h10.572V226.423H242.364Z" transform="translate(-72.742 -75.584)" fill="#1d1d1b"/><g transform="translate(128.072 151.001)"><rect width="10.408" height="10.246" transform="translate(67.656)" fill="#fff"/><rect width="10.408" height="10.246" transform="translate(83.263)" fill="#fff"/><rect width="10.408" height="10.246" fill="#fff"/><rect width="10.408" height="10.246" transform="translate(15.615)" fill="#fff"/></g><g transform="translate(24.069)"><rect width="10.246" height="18.399" transform="translate(133.65 53.058) rotate(-135)" fill="#1d1d1b"/><rect width="10.246" height="51.515" transform="translate(133.656 84.28) rotate(-135)" fill="#1d1d1b"/><rect width="10.246" height="14.719" transform="translate(164.882 84.282) rotate(-135)" fill="#1d1d1b"/><path d="M410.441,182.353H400.027V172.108h10.414a20.771,20.771,0,0,0,8.01-1.588l3.93,9.461A30.96,30.96,0,0,1,410.441,182.353Zm22.123-9.223-7.277-7.212a20.767,20.767,0,0,0,6.052-14.708v-.327h10.246v.327A30.949,30.949,0,0,1,432.563,173.131Zm9.021-32.575H431.339V119.9h10.246Z" transform="translate(-155.518 -41.923)" fill="#1d1d1b"/><path d="M89.632,182.353H79.218a30.954,30.954,0,0,1-11.939-2.373l3.93-9.461a20.771,20.771,0,0,0,8.01,1.588H89.632v10.246ZM57.1,173.131a30.949,30.949,0,0,1-9.021-21.92v-.327H58.32v.327a20.766,20.766,0,0,0,6.052,14.708Zm1.225-32.575H48.074V119.9H58.32v20.653Z" transform="translate(-32.462 -41.923)" fill="#1d1d1b"/><path d="M284.839,262.07v-77.9H160.1v77.9h15.613v57.246h93.512V262.07h15.613ZM170.347,194.416H274.593v57.409H170.347ZM258.981,309.07H185.959v-47h73.021v47Z" transform="translate(-71.631 -64.393)" fill="#1d1d1b"/><path d="M280.063,104.165h-10.49V46.837a41.274,41.274,0,0,0-5.365-20.384V0H253.8V14.285a41.431,41.431,0,0,0-51.911.278V0H191.481V27.07a41.3,41.3,0,0,0-5.011,19.767v57.328H175.98V114.41H280.063V104.165ZM196.716,46.837a31.306,31.306,0,0,1,62.612,0v57.328H196.715V46.837Z" transform="translate(-77.183)" fill="#1d1d1b"/><path d="M419.64,475.673v-19l-25.647-10.259V418.59H372.8V408.1H362.557v10.49H352.149v57.083Zm-35.893-10.246H362.395V428.836h21.353Zm25.647-1.817v1.817h-15.4v-7.978Z" transform="translate(-138.778 -142.687)" fill="#1d1d1b"/><path d="M148.91,362.576h-.081a20.759,20.759,0,0,0-20.736,20.735h10.246a10.5,10.5,0,0,1,10.49-10.49h.081v5.285h10.246V352.086H148.91v10.49Z" transform="translate(-60.44 -123.102)" fill="#1d1d1b"/><path d="M123.568,475.673V418.59H113.16V408.1H102.914v10.49H81.723v27.824L56.076,456.673v19ZM66.322,465.427V463.61l15.4-6.161v7.978Zm47,0H91.969V428.836h21.353Z" transform="translate(-35.26 -142.687)" fill="#1d1d1b"/><path d="M356.962,383.311h10.246a20.759,20.759,0,0,0-20.735-20.736h-.081V352.086H336.145v26.021h10.246v-5.285h.081A10.5,10.5,0,0,1,356.962,383.311Z" transform="translate(-133.182 -123.102)" fill="#1d1d1b"/><path d="M370.4,204.78h5.285V194.535H370.4v-10.49H360.151V215.27H370.4Z" transform="translate(-141.576 -64.349)" fill="#1d1d1b"/><path d="M465.636,52.868a20.735,20.735,0,1,0-25.858,20.094v5.927h10.246V72.961A20.771,20.771,0,0,0,465.636,52.868ZM444.9,63.358a10.49,10.49,0,1,1,10.49-10.49A10.5,10.5,0,0,1,444.9,63.358Z" transform="translate(-163.958 -11.235)" fill="#1d1d1b"/><path d="M133.253,215.27H143.5V184.045H133.253v10.49h-5.285V204.78h5.285Z" transform="translate(-60.396 -64.349)" fill="#1d1d1b"/><path d="M49.927,78.89V72.962a20.736,20.736,0,1,0-10.245,0v5.927ZM34.315,52.868A10.489,10.489,0,1,1,44.8,63.358,10.5,10.5,0,0,1,34.315,52.868Z" transform="translate(-24.069 -11.235)" fill="#1d1d1b"/></g><rect width="10.246" height="36.427" transform="translate(169.785 202.961)" fill="#fff"/></g></svg>`;
    let printerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2.2em" viewBox="0 0 350 350"><rect width="350" height="350" fill="none"/><g transform="translate(8.334 16.179)"><rect width="189.427" height="152.204" transform="translate(71.952 6.618)" fill="#efefef"/><path d="M287.764,408.2H53.667a22.334,22.334,0,0,1-22.334-22.334V278.334A22.334,22.334,0,0,1,53.667,256h234.1A22.334,22.334,0,0,1,310.1,278.334V385.869A22.333,22.333,0,0,1,287.764,408.2Z" transform="translate(-4.049 -97.179)" fill="#f4ad47"/><path d="M243.386,287.434h-47.15c-19.644,0-35.569-11.789-35.569-31.434H278.956C278.955,275.644,263.031,287.434,243.386,287.434Z" transform="translate(-53.145 -97.179)" fill="#e8594f"/><g transform="translate(20.666)"><path d="M215.333,101.284a6.618,6.618,0,0,0,6.618,6.618h11.994V140.99a6.618,6.618,0,0,0,13.236,0V107.9h11.994a6.617,6.617,0,1,0,0-13.235H221.951A6.618,6.618,0,0,0,215.333,101.284Z" transform="translate(-94.562 -35.936)" fill="#231f20"/><path d="M291.284,62.569h12.408V75.8a6.618,6.618,0,1,0,13.236,0V55.951a6.618,6.618,0,0,0-6.618-6.618H291.284a6.618,6.618,0,1,0,0,13.236Z" transform="translate(-120.881 -18.727)" fill="#231f20"/><path d="M180.618,82.421a6.618,6.618,0,0,0,6.618-6.618V62.569h12.408a6.618,6.618,0,0,0,0-13.236H180.617A6.618,6.618,0,0,0,174,55.951V75.8A6.618,6.618,0,0,0,180.618,82.421Z" transform="translate(-78.872 -18.727)" fill="#231f20"/><path d="M180.618,194.421h19.026a6.618,6.618,0,1,0,0-13.236H187.236V167.951a6.618,6.618,0,1,0-13.236,0V187.8A6.618,6.618,0,0,0,180.618,194.421Z" transform="translate(-78.872 -61.243)" fill="#231f20"/><path d="M310.309,161.333a6.618,6.618,0,0,0-6.618,6.618v13.235H291.284a6.618,6.618,0,0,0,0,13.236h19.026a6.618,6.618,0,0,0,6.618-6.618V167.951A6.618,6.618,0,0,0,310.309,161.333Z" transform="translate(-120.881 -61.243)" fill="#231f20"/><path d="M283.715,152.2H268V104.227h12.408v13.235a6.618,6.618,0,0,0,13.236,0V77.756a6.618,6.618,0,0,0-13.236,0V90.991H268V6.617A6.619,6.619,0,0,0,261.38,0H71.952a6.618,6.618,0,0,0-6.618,6.618V90.992H53.754V77.757a6.618,6.618,0,0,0-13.236,0v39.705a6.618,6.618,0,1,0,13.236,0V104.227H65.335V152.2H49.618a28.985,28.985,0,0,0-28.952,28.952V288.691a28.985,28.985,0,0,0,28.952,28.952h234.1a28.985,28.985,0,0,0,28.952-28.952V181.156A28.985,28.985,0,0,0,283.715,152.2ZM78.57,13.235H254.763V152.2H78.57Zm139.816,152.2c-3.241,12.515-15.741,18.2-28.144,18.2h-47.15c-12.4,0-24.9-5.683-28.144-18.2Zm81.045,123.252a15.734,15.734,0,0,1-15.716,15.716H49.618A15.733,15.733,0,0,1,33.9,288.691V181.156a15.734,15.734,0,0,1,15.716-15.716h51.84a35.445,35.445,0,0,0,12.227,21.535c7.605,6.383,18.049,9.9,29.406,9.9h47.15c11.358,0,21.8-3.516,29.406-9.9a35.437,35.437,0,0,0,12.227-21.535h51.84a15.734,15.734,0,0,1,15.716,15.716Z" transform="translate(-20.666)" fill="#231f20"/><path d="M141.284,359.9H278.6a6.618,6.618,0,1,0,0-13.236H141.284a6.618,6.618,0,1,0,0,13.236Z" transform="translate(-63.941 -131.596)" fill="#231f20"/><path d="M278.6,432H141.284a6.618,6.618,0,1,0,0,13.236H278.6a6.618,6.618,0,0,0,0-13.236Z" transform="translate(-63.941 -163.989)" fill="#231f20"/><path d="M287.749,389.333H103.284a6.618,6.618,0,1,0,0,13.236H287.748a6.618,6.618,0,0,0,0-13.236Z" transform="translate(-49.516 -147.792)" fill="#231f20"/></g></g></svg>`;
    let eraserSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2.2em" viewBox="0 0 350 350"><rect width="350" height="350" fill="none"/><g transform="translate(-41.869 8.507)"><path d="M183.176,216.093H151.942V7.861h5.205l26.029,62.47Z" transform="translate(-2.749 -2.748)" fill="#889ebd"/><path d="M290.091,216.093H185.975V70.331L159.946,7.861H264.062l26.029,62.47Z" transform="translate(-5.547 -2.748)" fill="#6a86ac"/><rect width="31.235" height="114.526" transform="translate(149.195 213.346)" fill="#aacd4c"/><rect width="104.117" height="114.526" transform="translate(180.431 213.346)" fill="#95c11f"/><path d="M144.08,0V332.986H289.657V66.56L261.923,0ZM255.106,10.226,276.875,62.47H183.837L162.068,10.226ZM185.541,72.7h93.89V208.232h-93.89Zm-10.226-4.09V208.232H154.306V18.182ZM154.306,322.76v-104.3h21.009v104.3Zm31.235,0v-104.3h93.89v104.3Z" fill="#1d1d1b"/><g transform="translate(196.137 234.165)"><rect width="10.226" height="78.089" fill="#fff"/><rect width="10.226" height="10.412" transform="translate(20.826 67.679)" fill="#fff"/><rect width="10.226" height="10.412" transform="translate(20.826 46.853)" fill="#fff"/><rect width="10.226" height="10.412" transform="translate(20.826 26.034)" fill="#fff"/></g></g></svg>`;
    let decipherSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2.2em" viewBox="0 0 350 350"><rect width="350" height="350" fill="none"/><g transform="translate(-37.603 5.816)"><rect width="158.655" height="158.655" transform="translate(133.274 174.473)" fill="#d5c9b3"/><rect width="79.328" height="158.655" transform="translate(212.602 174.473)" fill="#cbbba0"/><circle cx="15.866" cy="15.866" r="15.866" transform="translate(196.736 216.777)" fill="#fff"/><rect width="158.655" height="21.151" transform="translate(133.274 311.97)" fill="#5ebae7"/><rect width="79.328" height="21.151" transform="translate(212.602 311.97)" fill="#36a9e1"/><g transform="translate(128.034)"><rect width="105.771" height="10.485" transform="translate(31.682 306.728)" fill="#1d1d1b"/><path d="M128.034,256.07V425.208H297.173V256.07Zm10.485,158.653V404.054h10.623V393.569H138.519V266.555H286.688V393.569H276.065v10.485h10.623v10.669Z" transform="translate(-128.034 -86.84)" fill="#1d1d1b"/><path d="M183.7,153.365H173.08V58.127a47.642,47.642,0,1,1,95.284,0V116.3h10.485V58.127a58.127,58.127,0,0,0-116.253,0v95.238H151.972V163.85H183.7V153.365Z" transform="translate(-136.152)" fill="#1d1d1b"/><rect width="31.734" height="10.485" transform="translate(121.586 153.364)" fill="#1d1d1b"/><path d="M245.169,320.087a21.109,21.109,0,0,0-5.242,41.556V383.5h10.485V361.643a21.109,21.109,0,0,0-5.243-41.556Zm0,31.731A10.623,10.623,0,1,1,255.792,341.2,10.635,10.635,0,0,1,245.169,351.818Z" transform="translate(-160.599 -108.549)" fill="#1d1d1b"/></g></g></svg>`;

    // create button and onclick listener
    let decipher = document.createElement('button');
    decipher.setAttribute('style',buttonStyle);
    decipher.addEventListener('click', clickDecipher);
    decipher.innerHTML = decipherSVG;
    decipherButtonRef = decipher;
    let decipherName = document.createElement('p');
    decipherName.setAttribute('style',buttonNameStyle);
    decipherName.innerHTML = "Decipher settings";

    let trigger = document.createElement('button');
    trigger.setAttribute('style',buttonStyle);
    trigger.addEventListener('click', clickStart);
    trigger.innerHTML = triggerSVG;
    autoPageButton = trigger;
    let triggerName = document.createElement('p');
    triggerName.setAttribute('style',buttonNameStyle);
    triggerName.innerHTML = "Auto next page";

    let printer = document.createElement('button');
    printer.setAttribute('style',buttonStyle);
    printer.addEventListener('click', clickPrint);
    printer.innerHTML = printerSVG;
    let printerName = document.createElement('p');
    printerName.setAttribute('style',buttonNameStyle);
    printerName.innerHTML = "Export to excel";

    let eraser = document.createElement('button');
    eraser.setAttribute('style', buttonStyle);
    eraser.addEventListener('click', clickErase);
    eraser.innerHTML = eraserSVG
    let eraserName = document.createElement('p');
    eraserName.setAttribute('style',buttonNameStyle);
    eraserName.innerHTML = "Clear current records";

    let buttonPanelContainer = document.createElement('div');
    buttonPanelContainer.setAttribute('style',buttonPanelContainerStyle)
    buttonPanelContainer.appendChild(decipher);
    buttonPanelContainer.appendChild(decipherName);
    buttonPanelContainer.appendChild(trigger);
    buttonPanelContainer.appendChild(triggerName);
    buttonPanelContainer.appendChild(printer);
    buttonPanelContainer.appendChild(printerName);
    buttonPanelContainer.appendChild(eraser);
    buttonPanelContainer.appendChild(eraserName);

    let counterDisplay = document.createElement('p');
    counterDisplay.setAttribute('style', counterDisplayStyle);
    counterDisplay.innerHTML = 0;
    counterDisplayRef = counterDisplay;

    let counterDisplayContainer = document.createElement('div');
    counterDisplayContainer.setAttribute('style', counterDisplayContainerStyle);
    counterDisplayContainer.appendChild(counterDisplay);

    let controlPanel = document.createElement('div');
    controlPanel.setAttribute('style',controlPanelStyle);
    controlPanel.appendChild(buttonPanelContainer);
    controlPanel.appendChild(counterDisplayContainer);

    let outterLayer = document.createElement('div');
    outterLayer.setAttribute('style', outterLayerStyle);
    outterLayer.appendChild(controlPanel);
    outterLayerRef = outterLayer;

    // decipher panel
    let decipherPanelInput = document.createElement('textarea');
    decipherPanelInput.setAttribute('style', decipherFormInputStyle);
    decipherPanelInput.setAttribute('placeholder', '{\n"&#xE080":0, \n"&#xE081":1, \n"&#xE082":2, \n"&#xE083":3, \n"&#xE084":4, \n"&#xE085":5, \n"&#xE086":6, \n"&#xE087":7, \n"&#xE088":8, \n"&#xE089":9\n}');
    decipherPanelInputRef = decipherPanelInput;

    let decipherPanel = document.createElement('div');
    decipherPanel.setAttribute('style', decipherPanelStyle);
    decipherPanelRef = decipherPanel;
    decipherPanel.appendChild(decipherPanelInput);

    
    
    

    document.body.appendChild(outterLayer);
})();