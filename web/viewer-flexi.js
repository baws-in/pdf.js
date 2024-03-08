//import { PDFViewerApplication } from "./app";

var selectedText = "";
var moreReadable = true;
var isBookLoaded = false;
var flexi_isFullscreen = false;
var scrolllerWatch;

if ('speechSynthesis' in window ) {
  var msg = new SpeechSynthesisUtterance();
  var synth = window.speechSynthesis;
  var audioMeta = { voices: null,keepAlive: null, isSpeaking: false, currentPara: 0 , totalReadItems:0, itemsToRead: [], currentPage: 0 }
  setVoices()
}

let wakeLock = null;



$(document).ready(function () {



  $(".moreReadable").click(function (event) {
    // moreReadable = !moreReadable;
    // if (moreReadable) {
    //   $(".canvasWrapper").attr("display", "none");
    //   $(".markedContent").attr("color", "black");
    //   $(".textLayer").attr("opacity", 1);

    //   //$(".textLayer span").attr("color", "black");
    // }
    // var cols = document.getElementsByClassName('canvasWrapper');
    // for(i = 0; i < cols.length; i++) {
    //      cols[i].style.display = 'none';
    //   }
    //   var markedContent = document.getElementsByClassName('markedContent');
    // for(i = 0; i < markedContent.length; i++) {
    //   markedContent[i].style.color = 'black';
    //   }
    //   var textLayer = document.getElementsByClassName('textLayer');
    // for(i = 0; i < textLayer.length; i++) {
    //   //textLayer span, also need to make black
    //   textLayer[i].style.opacity = 1;
    //   }
    // var textLayerSpan = document.getElementsByClassName('textLayer span');
    // for(i = 0; i < textLayerSpan.length; i++) {
    //   //textLayer span, also need to make black
    //   textLayerSpan[i].style.color = 'black';
    //   }
  });

  //actual id=viewerContainer, this is used to capture page left right bottom event
  $("#temp").click(function (event) {

    //console.log(event)

    var win = window,
      doc = document,
      docElem = doc.documentElement,
      body = doc.getElementsByTagName('body')[0],
      x = win.innerWidth || docElem.clientWidth || body.clientWidth,
      y = win.innerHeight || docElem.clientHeight || body.clientHeight;
    //console.log(x + ' × ' + y);
    var yBottom = y * 0.75, xLeftBottom = x * 0.25, xRightBottom = x * 0.75;
    if (event.clientY >= yBottom) {
      var textContent =
        "clientX: " + event.clientX +
        " - clientY: " + event.clientY;
      // console.log(textContent)
      if (event.clientX <= xLeftBottom) {
        PDFViewerApplication.pdfViewer.previousPage();

      }
      else if (event.clientX >= xRightBottom) {

        PDFViewerApplication.pdfViewer.nextPage();

      }


    }
  });

  $(window).resize(function () {
    //resizePdf()
  });

  $("#viewerContainer").on("scroll", function (e) {
    // if(PDFViewerApplication.pdfLinkService.pdfHistory._fingerprint){
    //   if(!localStorage.getItem("pdfMeta")){
    //     localStorage.setItem("pdfMeta",JSON.stringify({"defaultScrolling":{"horizantalScroll": e.currentTarget.scrollLeft, "verticalScroll":e.currentTarget.scrollTop}}))
    //   }else{
    //     if(!isDefaultScrolling(e.currentTarget.scrollTop,e.currentTarget.scrollLeft)){
    //         localStorage.setItem("pdfMeta",JSON.stringify({"defaultScrolling":{"horizantalScroll": e.currentTarget.scrollLeft, "verticalScroll":e.currentTarget.scrollTop}}))
    //     }

    //   }

    // }

    // if(PDFViewerApplication.pdfLinkService.pdfHistory){
    //     if(!isPageDiff())
    //     var currentScrolling={"horizantalScroll": e.currentTarget.scrollLeft, "verticalScroll":e.currentTarget.scrollTop};

    //     if(PDFViewerApplication){
    //     let pdfMeta=localStorage.getItem("pdfMeta")
    //     let mergeObj={currentScrolling}
    //     if(pdfMeta){
    //     pdfMeta= JSON.parse(pdfMeta)
    //       mergeObj ={...mergeObj,...pdfMeta};
    //     }

    //      localStorage.setItem("pdfMeta",JSON.stringify(mergeObj))
    //     }
    // }
  });

  let scondsCount = 0;
  let loadPdfTimeOut


  function startWatching() {
    loadPdfTimeOut = setTimeout(loadPdfApp, 1000);
  }
  function loadPdfApp() {
    scondsCount++;
    if (PDFViewerApplication && PDFViewerApplication.eventBus) {
        isBookLoaded = true
        postBawsMsg("pageChanged");
        this._isPagesLoaded = true;
        console.log(synth)
      /*PDFViewerApplication.eventBus._on("pagesloaded", evt => {
        isBookLoaded = true
        postBawsMsg("pageChanged");
        this._isPagesLoaded = !!evt.pagesCount;
        console.log(synth)
      });*/
      PDFViewerApplication.eventBus._on("pagechanging", evt => {
        isBookLoaded = true;
        if (evt.pageNumber)
          postBawsMsg("pageChanged");
        setScrolling();
        if (scrolllerWatch) {
          clearInterval(scrolllerWatch)
        }
        scrolllerWatch = setInterval(storeScrolling, 5000, scrolllerWatch);
        this._isPagesLoaded = !!evt.pagesCount;
        if (!isOnMobile()){
          const div = document.getElementsByClassName('page')[0];
          const span = document.getElementsByClassName('page_full_icon')[0];
          const rect = div.getBoundingClientRect();
          const position = window.innerWidth - rect.right ;
          span.style.right = position*1.1 + 'px';
        }
      });
      clearTimeout(loadPdfTimeOut)
    }
    else {
      if (scondsCount <= 10)
        startWatching()
    }

  }

  $("#selectVoices").change(function (event) {
    console.log(this.value)
    //if (synth.speaking) {
    //synth.pause();
    msg.voice = audioMeta.voices[this.value]
    msg.lang = msg.voice.lang;
    storeSelectedAudio(this.value)
    //  setTimeout(synth.resume(), 1000);
    //}

    // stopReading()
    //prevParagraph()


    /*let textArr=document.querySelectorAll("[role='presentation']");
    if(textArr && textArr.length > 0){
      
          stopReading();
          audioMeta.isSpeaking=true;
          startNodeReading(textArr,audioMeta.currentPara)
        
    }*/

  });


  startWatching()

});

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock released:', wakeLock.released);
        //genericShowPanel('Screen Wake Lock released:'+ wakeLock.released, 2000);
      });
      console.log('Screen Wake Lock released:', wakeLock.released);
      //genericShowPanel('Screen Wake Lock released:'+ wakeLock.released, 2000);
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

async function fullScreen()
{
  let mainContainer = document.getElementById("outerContainer");

  if (!mainContainer.requestFullscreen) {
    return false;
  }

  if (flexi_isFullscreen){
    if (document.exitFullscreen) {
      document.exitFullscreen();
      flexi_isFullscreen = false;
      return;
    }
  }
  
  mainContainer.addEventListener("fullscreenchange", (event) => {
    if (!document.fullscreenElement) {
      if (wakeLock){ 
        wakeLock.release();
      }
      wakeLock = null;
    }
  });
  mainContainer.requestFullscreen();
  flexi_isFullscreen = true;
  await requestWakeLock();

}
function storeScrolling(scrolllerWatch) {
  let viewContainer = document.getElementById("viewerContainer");
  let pdfMeta = localStorage.getItem("pdfMeta")
  if (pdfMeta) {
    pdfMeta = JSON.parse(pdfMeta)
    pdfMeta.horizantalScroll = viewContainer.scrollLeft
    pdfMeta.verticalScroll = viewContainer.scrollTop
    setPdfMeta(pdfMeta)
  } else {
    setPdfMeta({ "horizantalScroll": viewContainer.scrollLeft, "verticalScroll": viewContainer.scrollTop })
  }
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch)
  }
}
function setScrolling() {
  let viewContainer = document.getElementById("viewerContainer");

  let stickyPdf = localStorage.getItem("pdfMeta")
  if (stickyPdf) {
    stickyPdf = JSON.parse(stickyPdf);
    if (stickyPdf.horizantalScroll)
      viewContainer.scrollLeft = stickyPdf.horizantalScroll
    if (stickyPdf.verticalScroll)
      viewContainer.scrollTop = stickyPdf.verticalScroll
  }
}
function isPageDiff() {
  let pdfMeta = localStorage.getItem("pdfMeta")
  //pdfMeta=JSON.parse(pdfMeta);
  if (pdfMeta && pdfMeta.pageNo) {
    if (pdfMeta.pageNo !== PDFViewerApplication.pdfLinkService.pdfHistory._destination.page) {
      setPageNo()
      return true
    }
  } else {
    setPageNo()
    return true
  }
  return false
}
function setPageNo() {
  let pdfMeta = localStorage.getItem("pdfMeta")
  var pageNo = PDFViewerApplication.pdfLinkService.pdfHistory._destination.page
  var mergeObj = { pageNo }
  if (pdfMeta) {
    pdfMeta = JSON.parse(pdfMeta)
    mergeObj = { ...mergeObj, ...pdfMeta }
  }
  // JSON.parse(pdfMeta)
  //if(PDFViewerApplication.pdfLinkService.pdfHistory._fingerprint)
  //localStorage.setItem("pdfMeta",JSON.stringify(mergeObj))
  //localStorage.setItem("pdfMeta",pdfMeta)


}
function onCopy() {

  if (window.getSelection() && window) {
    console.log(PDFViewerApplication)
    console.log(window.location.origin)
    let sel = window.getSelection();


    if (sel && sel.toString().length > 4) {
      selectedText = sel.toString().replace(/(\r\n|\n|\r)/gm, " ");
      navigator.clipboard.writeText(selectedText);
    }
  }
}


function onBookClick() {
  if (window && window.getSelection() && window.getSelection().toString().length > 4) {
    console.log(PDFViewerApplication)
    console.log(window.location.origin)
    let strSelectedTest= window.getSelection().toString()
      selectedText = strSelectedTest.replace(/(\r\n|\n|\r)/gm, " ");
      //disabled
      //clearTextSelection()
      //$('#textShareModal').modal('show')

      let check_one_word = strSelectedTest.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
      if (parent.dictionary && check_one_word.indexOf(' ') <= -1) {
        let result = parent.dictionary(check_one_word);
        console.log(result);
        showDictionary(result, check_one_word);
      }
  }
}
function shareOnTwitter() {
  if (selectedText) {
    window.open('https://twitter.com/intent/tweet?url=' + getCurrenPageUrl() + '&text=' + selectedText, '_blank')
    // window.open('https://twitter.com')
  }
}

function shareOnFacebook() {
  if (selectedText) {
    window.open('https://www.facebook.com/sharer.php?href=' + getCurrenPageUrl(), '_blank')
  }
}

function shareOnWhatsup() {
  if (selectedText) {
    window.open('https://api.whatsapp.com/send?text=' + selectedText + " , url = " + getCurrenPageUrl(), '_blank')
  }
}
function getCurrenPageUrl() {
  $('#textShareModal').modal('hide')
  return encodeURIComponent(window.location.origin + "/web/viewer.html?file=" + PDFViewerApplication.baseUrl + "?#page=" + PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber)
}
function clearTextSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {  // IE?
    document.selection.empty();
  }
}
function copyText() {
  if (selectedText) {
    $('#textShareModal').modal('hide')
    navigator.clipboard.writeText(selectedText);
  }
}
function openNextPage() {
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch)
  }
  audioMeta.isSpeaking = false;
  PDFViewerApplication.pdfViewer.nextPage();
  pageFlipTransform()
  //PDFViewerApplication.pdfViewer.scrollMode=3
  //  PDFViewerApplication.pdfViewer.spreadMode=1
  // PDFViewerApplication.eventBus.dispatch("scrollmodechanged", { source: PDFViewerApplication.pdfViewer, mode:3 });
  //PDFViewerApplication.eventBus.dispatch("spreadmodechanged", { source: PDFViewerApplication.pdfViewer, mode:2});
}
function pageFlipTransform() {
  let viewContainer = document.getElementById("viewerContainer");
  if (isBookLoaded) {
    viewContainer.style.transform = "rotateY(90deg)"
  }
  setTimeout(clearTransform, 200);
  // new Audio("page-flip-sound.mp3").play();
}
function clearTransform() {
  let viewContainer = document.getElementById("viewerContainer");
  viewContainer.style.transform = "none"
}
function openPrevPage() {
  audioMeta.isSpeaking = false;
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch)
  }
  PDFViewerApplication.pdfViewer.previousPage();
  pageFlipTransform()
}
function isOnMobile() {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};
//audio start
async function startNodeReadingLegacy(contentNode, startIndex) {
  if (contentNode && contentNode.length > 0) {
    // for (let i = 0; i < contentNode.childNodes.length;) {
    //   clearTextSelection();
    //   let range = new Range();
    //   range.setStart(contentNode, i);
    //   let endNode=i + 5;
    //   i=i+5;
    //   if(endNode > contentNode.childNodes.length)
    //   {
    //     endNode= contentNode.childNodes.length
    //   }
    //  range.setEnd(contentNode, endNode);
    //  document.getSelection().addRange(range);
    //  await startReading(range,msg)
    // }
    let i = startIndex ? startIndex : 0
    for (; i < contentNode.length;) {
           
      if (audioMeta.isSpeaking) {
        audioMeta.currentPara = i;
        await startReading(contentNode[i])
        if (i == contentNode.length - 1) {
          openPageForReading('NEXT')
        }
      } else {
        break;
      }
    }
    return new Promise((resolve, reject) => {
      resolve("done");
    });

  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function readFlippedPage(){
  let locSpreadMode = PDFViewerApplication.pdfViewer.spreadMode;
    
  if (locSpreadMode <= 0) {
    audioMeta.itemsToRead = []
    audioMeta.totalReadItems = 0;
    audioMeta.currentPara = 0;
    //make it appear like play on new page
    stopReading();
    setPlayIcon()
    setTimeout(1000,selectRangeForReading())
  } 
}
function openPageForReading(directionType) {
  if (PDFViewerApplication) {
    let count = 0;
    audioMeta.isSpeaking = false;
    PDFViewerApplication.eventBus._off("pagechanging",readFlippedPage);
    PDFViewerApplication.eventBus._on("pagechanging", readFlippedPage );
    if (directionType === 'PREV')
      openPrevPage()
    else
      openNextPage()
  }
}
function getChildNodeLenght(contentNode) {
  let no = contentNode && contentNode.childNodes && contentNode.childNodes.length > 0 ? 1 : 0
  return no;
}
function stopReading() {
  console.log(synth.speaking)
  audioMeta.isSpeaking = false;
  synth.pause()
  synth.cancel()
  console.log(synth.speaking)

}
async function startReading(paramText) {
  if ('speechSynthesis' in window) {
    synth.cancel()
    console.log(synth.speaking)
    // msg.voice = audioMeta.voices[10]; // Note: some voices don't support altering params
    //msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 0.95; // 0.1 to 10
    msg.pitch = 1; //0 to 2

    let str = paramText.replace(/\*/g, '');
    msg.text = str;
    console.log("Speaking "+ str)
    //msg.lang = 'en-US';
    synth.speak(msg);

    return new Promise(resolve => {
      msg.onend = function (event){
        resolve();
      };
      msg.onerror = msg.onend;
      
      
    });


  }
}
function setVoices() {
  var timer
  try {
    timer = setInterval(function () {
      audioMeta.voices = synth.getVoices();
      console.log(audioMeta.voices);
      let lang_hint1 = "English"
      let lang_hint2 = "India"
      let lang_set = null;
      let lang_set_backup = null;
      if (PDFViewerApplication.baseUrl.includes("/HI/")){
        lang_hint1 = " हिन्दी"
        lang_hint2 = "Hindi"

      }
      if (PDFViewerApplication.baseUrl.includes("/EN/")){
        lang_hint1 = "English"
        lang_hint2 = "India"
      }
      
      $.each(audioMeta.voices, function (index, voice) {
        if (voice.name.includes(lang_hint1) && ( voice.name.includes(lang_hint2)))
        {
          lang_set = index
        }
        if (voice.name.includes(lang_hint1))
        {
          lang_set_backup = index
        }
        if (voice.name.includes(lang_hint2))
        {
          lang_set_backup = index
        }
        $('#selectVoices').append(
          $('<option></option>').val(index).html(voice.name)
        );
      });
      if (audioMeta.voices.length !== 0 ) {
        //assignSelectedAudioFromStore()
        if (timer) clearInterval(timer);
      }
      if (lang_set){
        $("#selectVoices").val(lang_set)
        msg.voice = audioMeta.voices[lang_set]
        msg.lang = msg.voice.lang;
      }
      else if (lang_set_backup){
        $("#selectVoices").val(lang_set_backup)
        msg.voice = audioMeta.voices[lang_set_backup]
        msg.lang = msg.voice.lang;
      }
    }, 2000);
  } catch (err) {
    if (timer) clearInterval(timer);
  }
}
async function startNodeReading(contentNode, startIndex) {
  if (contentNode && contentNode.length > 0) {
    // for (let i = 0; i < contentNode.childNodes.length;) {
    //   clearTextSelection();
    //   let range = new Range();
    //   range.setStart(contentNode, i);
    //   let endNode=i + 5;
    //   i=i+5;
    //   if(endNode > contentNode.childNodes.length)
    //   {
    //     endNode= contentNode.childNodes.length
    //   }
    //  range.setEnd(contentNode, endNode);
    //  document.getSelection().addRange(range);
    //  await startReading(range,msg)
    // }
    let i = startIndex ? startIndex : 0
    var garbage_regex = /[\p{N}\p{L}]/u;
    for (; i < contentNode.length;) {
      
      
      if (audioMeta.isSpeaking) {
        audioMeta.currentPara = i;
        
        var toRead = contentNode[i];
        currentReadIndex = i;

        if (toRead.match(garbage_regex)){
          PDFViewerApplication.eventBus.dispatch("find", {
              source: this,
              type:" ",
              query: toRead,
              caseSensitive: true,
              entireWord: true,
              highlightAll: true,
              findPrevious: false,
              matchDiacritics: true,
            });
          await startReading(toRead)
        }
        if (i == contentNode.length - 1) {
          setTimeout(openPageForReading('NEXT'), 2000);
        }
        i++;
      } else {
        break;
      }
    }
    return new Promise((resolve, reject) => {
      resolve("done");
    });

  }
}
function compareItems( a, b ) {
  if ( (a.transform[5] - b.transform[5]) < -5 ){
    return 1;
  }
  if ( (a.transform[5] - b.transform[5]) > 5 ){
    return -1;
  }
  if ( a.transform[4] < b.transform[4] ){
    return -1;
  }
  if ( a.transform[4] > b.transform[4] ){
    return 1;
  }

  return 0;
}


async function selectRangeForReading()
{
  if (audioMeta.isSpeaking) {
    stopReading();
    setPlayIcon()
    PDFViewerApplication.eventBus._off("pagechanging",readFlippedPage);
    return;
  }
  PDFViewerApplication.eventBus._off("pagechanging",readFlippedPage);
  PDFViewerApplication.eventBus._on("pagechanging", readFlippedPage );

  if (audioMeta.itemsToRead.length > 0 && 
    audioMeta.currentPage == PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber){
    audioMeta.isSpeaking = !audioMeta.isSpeaking;
    setPlayIcon()
    startNodeReading(audioMeta.itemsToRead, audioMeta.currentPara)
    return
  }
  const textOptions = { disableNormalization: true };
  return new Promise(() => {

    setTimeout(hideVoicePanel, 15000)

    PDFViewerApplication.pdfDocument.getPage(PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber)
    .then(pdfPage => {
      return pdfPage.getTextContent(textOptions);
    }).then(
      textContent => {
        return new Promise(() => {
          const strBuf = [];
          
          textContent.items.sort(compareItems);
          let prevItem = null;
          let prevHeight = 0;
          
          for (const textItem of textContent.items) {
            var final_str = textItem.str ;
            if (prevItem 
              && prevItem.str == textItem.str
              && (Math.abs(prevItem.transform[4]-textItem.transform[4]) < 1)
              && (Math.abs(prevItem.transform[5]-textItem.transform[5]) < 1)
              ) continue;
            
            //convert the encodings, take hint from the truefont
            if(textItem.trueFont && (textItem.trueFont.includes("Kruti"))) {
              final_str = kruti2unicodeEx(final_str);
            }
            else if(textItem.trueFont && ( textItem.trueFont.includes("Chanakya"))) {
              final_str = chanakya2unicodeEx(final_str);
            }
            var ignore_height = 600
            if (PDFViewerApplication.baseUrl.includes("/MR/")){
              ignore_height = 860
            }
            if (Math.abs(textItem.height-prevHeight) >= 1 
                && textItem.height > 0)
            { 
              strBuf.push("\n ")
            }
            if(textItem.transform[5] < ignore_height)
              strBuf.push(final_str);
            if (textItem.hasEOL) {
              strBuf.push(" ");
            }
            if (textItem.height > 0 ) 
            {
              prevHeight = textItem.height
            }
            prevItem = textItem;
          } 
          const regex = new RegExp("(?<!\\w\\.\\w\.)"
                          +"(?<!\\s\\p{Lu}\\p{L}\.)"
                         +"(?<!\\s\\p{L}\.)"
                         +"(?<!\\s\\p{N}\\p{N}\.)"
                         +"(?<!\\s\\p{Lu}\\p{L}\\p{L}\.)"
                        +"(?<=\\.|\\?|।|\\\\'|\"|’|\!|”|,|;|—|\\\\:|\\\\;|-|\\n)\\s", 'gmu')

          var textArr = strBuf.join("").split(regex);

          audioMeta.currentPara = 0;
          audioMeta.currentPage = PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber;
          if (textArr && textArr.length > 0) {
            audioMeta.isSpeaking = true;
            setPlayIcon()
            {
              audioMeta.itemsToRead = textArr;
              audioMeta.totalReadItems = textArr.length;
              startNodeReading(audioMeta.itemsToRead, audioMeta.currentPara)
            }
        
          } else {
            audioMeta.currentPara = 0
            setTimeout(openPageForReading('NEXT'), 1000);
          }
          
          
        });
      },
      reason => {
          console.error(
            `Unable to get text content for page ${PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber}`,
            reason
          );
          // Page error -- assuming no text content. TODO clean array
          
        }
    );
    

  });




}

async function selectRangeForReadingLegacy() {
  setTimeout(hideVoicePanel, 5000)
  let markedContent = document.getElementsByClassName("markedContent");
  let textLayer = document.getElementsByClassName("textLayer");
  let textArr = document.querySelectorAll("[role='presentation']");
  let contentNode;
  audioMeta.currentPara = 0
  if (textArr && textArr.length > 0) {
    audioMeta.isSpeaking = !audioMeta.isSpeaking;
    setPlayIcon()
    if (!audioMeta.isSpeaking) {
      stopReading()
    } else {
      await startNodeReading(textArr, null)
    }

  } else {
    openPageForReading('NEXT')
  }
  // if(markedContent.length>0){
  //   for(let i=1;i<markedContent.length;){
  //     await startNodeReading(markedContent[i])
  //     i=i+2
  //   }
  // }else if(textLayer.length>0){
  //   for(let i=0;i<textLayer.length; i++){
  //     await startNodeReading(textLayer[i])
  //   }
  // }


}
function nextParagraph() {
  setTimeout(hideVoicePanel, 15000)
  
  if ( audioMeta.totalReadItems > 0) {
    let nextParaIndex = audioMeta.currentPara+1;
    if (nextParaIndex > audioMeta.totalReadItems) {
      openPageForReading('NEXT')
    } else {
      stopReading();
      setPlayIcon()
      audioMeta.isSpeaking = true;
      setPlayIcon()
      startNodeReading(audioMeta.itemsToRead, nextParaIndex)
    }
  } else {
    openPageForReading('NEXT')
  }

}
function prevParagraph() {
  setTimeout(hideVoicePanel, 15000)
  if ( audioMeta.totalReadItems > 0) {
    let prevParaIndex = audioMeta.currentPara-1;
    if (prevParaIndex < 1) {
      openPageForReading('PREV')
    } else {
      stopReading();
      setPlayIcon()
      audioMeta.isSpeaking = true;
      setPlayIcon()
      startNodeReading(audioMeta.itemsToRead, prevParaIndex)
    }
  } else {
    openPageForReading('PREV')
  }

}
function storeSelectedAudio(voiceNo) {
  if (voiceNo) {
    let pdfMeta = localStorage.getItem("pdfMeta")
    msg.voice = audioMeta.voices[voiceNo]
    if (msg.voice) {
      pdfMeta = JSON.parse(pdfMeta)
      pdfMeta.voiceNo = voiceNo
      setPdfMeta(pdfMeta)
    }
  }
}
function assignSelectedAudioFromStore() {
  let pdfMeta = getPdfMeta()
  pdfMeta = JSON.parse(pdfMeta)
  if (pdfMeta && audioMeta.voices.length > 0 && pdfMeta.voiceNo) {
    msg.voice = audioMeta.voices[pdfMeta.voiceNo]
    msg.lang = msg.voice.lang;
    $("#selectVoices").val(pdfMeta.voiceNo)
    //.change();
  }
}
function setPdfMeta(pdfMetaParam) {
  let pdfMeta = getPdfMeta()
  pdfMeta = JSON.parse(pdfMeta)
  var mergeObj = { ...pdfMeta, ...pdfMetaParam }
  localStorage.setItem("pdfMeta", JSON.stringify(mergeObj))
}
function getPdfMeta() {
  return localStorage.getItem("pdfMeta");
}
function setPlayIcon() {
  $("#audioPlayIcon").removeClass()
  if (audioMeta.isSpeaking) {
    $("#audioPlayIcon").addClass("far fa-stop fa-3x")
    audioMeta.keepAlive = setInterval(() => {
        synth.pause();
        synth.resume();
    }, 13000);
  } else {
    $("#audioPlayIcon").addClass("far fa-play fa-3x")
    if (audioMeta.keepAlive) 
    {  
       clearInterval(audioMeta.keepAlive);
       audioMeta.keepAlive = null; 
    }
  }
}
function hideVoicePanel() {
  var myOffcanvas = document.getElementById('voicePanel');
  let openedCanvas = bootstrap.Offcanvas.getInstance(myOffcanvas);
  openedCanvas.hide();
}

//audio end

// class BookUrl{
//   static bookMap = new Map();

//  static getBookUrl(bookKey) {
//    let  bookRemoteUrl = "https://assets.studyring.org/assets/books/"
//   BookUrl.bookMap.set("bev1", "baws/EN/Volume_01.pdf")
//   BookUrl.bookMap.set("bev2", "baws/EN/Volume_02.pdf")

//   if (bookKey) {
//     let arr = bookKey.split("_")
//     if (BookUrl.bookMap.has(arr[0])) {
//       let url = bookRemoteUrl + BookUrl.bookMap.get(arr[0]);
//       if (arr.length > 1) {
//         url = url + "?page" + arr[1]
//       }
//       return url;
//     }

//   }
//   return "";
// }
// }
// export {BookUrl};

//postMessage Events start
function loadSearchPage() {
  if (flexi_isFullscreen){
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  window.parent.postMessage(JSON.stringify({
    action: "loadSearchPage"
  }), "*");

}
function loadNotesPage() {
  window.parent.postMessage(JSON.stringify({
    action: "loadNotesPage"
  }), "*");
}
  function postBawsMsg(action) {
    try {
      window.parent.postMessage(JSON.stringify({
        action: action, data: getBookUrlData()
      }), "*");
    }
    catch (error) {
      console.log("postBawsMsg", error)
    }
  }

  function showDictionary(result, searchText) {
    let panelBody = document.getElementById("dictionaryPanelBody");
    panelBody.innerHTML = '';
    if (result) {
      panelBody.innerHTML = result
    } else {
      panelBody.innerHTML = "We don't have this term currently please check ";
      let aTag = document.createElement('a');
      let link = "https://www.google.com/search?q=" + searchText;
      aTag.setAttribute('href', link);
      aTag.setAttribute('target', '_blank');
      aTag.innerText = "here";
      panelBody.appendChild(aTag);
    }
    showDictionaryPanel();
  }
  function showDictionaryPanel() {
    var myOffcanvas = document.getElementById('dictionaryPanel');
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas)
    bsOffcanvas.show();
    setTimeout(hideDictionaryPanel, 10000);
  }
  function hideDictionaryPanel() {
    var myOffcanvas = document.getElementById('dictionaryPanel');
    let openedCanvas = bootstrap.Offcanvas.getInstance(myOffcanvas);
    openedCanvas.hide();
  }

  function genericShowPanel(result, timeout) {
    let panelBody = document.getElementById("genericPanelBody");
    panelBody.innerHTML = '';
    if (result) {
      panelBody.innerHTML = result
    }
    showGenericPanel(timeout);
  }
  function showGenericPanel(timeout) {
    var myOffcanvas = document.getElementById('genericPanel');
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas)
    bsOffcanvas.show();
    setTimeout(hideGenericPanel, timeout);
  }
  function hideGenericPanel() {
    var myOffcanvas = document.getElementById('genericPanel');
    let openedCanvas = bootstrap.Offcanvas.getInstance(myOffcanvas);
    openedCanvas.hide();
  }

  function shareButtonClick(){

    if (window.getSelection() && window) {
      console.log(PDFViewerApplication)
      console.log(window.location.origin)
      let sel = window.getSelection();
  
  
      if (true) {
        let urlData = getBookUrlData();
        let shortUrl = window.location.protocol + '//' 
                      + ('localhost' === window.location.hostname ? 'baws.in' : window.location.hostname) 
                      +"/books/" + urlData.bookParent + "/" + urlData.language + "/" + urlData.bookName 
                      + "/pdf/" + urlData.pageNo ;

        selectedText = sel.toString().replace(/(\r\n|\n|\r)/gm, " ");
        
        if(window && window.getSelection() && window.getSelection().toString().length > 0){
          selectedText = "From Dr Ambedkar's writings and speeches:\n" + selectedText + "\n\nto read more please go to " + shortUrl;
          navigator.clipboard.writeText(selectedText);
          genericShowPanel("Selected text and address to current page copied, please paste to share",3000);
        }
        else{
          selectedText = shortUrl;
          navigator.clipboard.writeText(selectedText);
          genericShowPanel("Address to current page copied, please paste to share",3000);
        }

      }
    }

  }


  function addBookMark() {
    let bookMarksStr = localStorage.getItem('bookMarks');
    let bookMarks = [];
    if (bookMarksStr) {
      bookMarks = JSON.parse(bookMarksStr);
      if (bookMarks.length >= 30) {
        // bookMarks.shift()
      }
    }  
    let urlData = getBookUrlData();
    let shortUrl = ('localhost' === window.location.hostname ? '' : window.location.hostname) +"/books/" + urlData.bookParent + "/" + urlData.language + "/" + urlData.bookName + "/pdf/" + urlData.pageNo
    let bookMark = {
      "url": shortUrl,
      "text": selectedText,
      "pageNo": urlData.pageNo,
      "context": [],
      "title": urlData.bookName,
      "baseUrl" : PDFViewerApplication.baseUrl
    };
    bookMarks.push(bookMark)
    localStorage.setItem('bookMarks', JSON.stringify(bookMarks));
    genericShowPanel("Selected text and current page saved as BookMark",3000);
  };
  function getBookUrlData() {
    let text = PDFViewerApplication.baseUrl;
    text = text.slice(0, -4)
    const urlArr = text.split("/");
    if (urlArr.length > 3) {
      return {
        pageNo: PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber, bookParent: urlArr[urlArr.length - 3],
        language: urlArr[urlArr.length - 2], bookName: urlArr[urlArr.length - 1]
      }
    }
  }
