//import * as QRCodeStyling from "qr-code-styling/lib/qr-code-styling";

//import { PDFViewerApplication } from "./app";

const switchMode = mode => {
  const switchButton = document.getElementById("view-switch");

  if (mode === "text") {
    switchButton.innerHTML = "&#x1F4F1;&#x1F449;&#x1F4BB;"; // Mobile to laptop icon
  } else {
    switchButton.innerHTML = "&#x1F4BB;&#x1F449;&#x1F4F1;"; // Laptop to Mobile icon
  }
  window.VIEW_MODE = mode;
  // Lets the CSS lay out "Fit to phone" as a reading column.
  document.documentElement.classList.toggle("text-mode", mode === "text");
  //PDFViewerApplication.pdfViewer.currentScaleValue = 'page-width';
  PDFViewerApplication.pdfViewer.refresh();
};

const toggleView = event => {
  const mode = window.VIEW_MODE;

  if (mode === "text") {
    switchMode("pdf");
  } else {
    //pdfViewerElement.style.display = "block";
    switchMode("text");
  }
};

// text | pdf
window.VIEW_MODE = "pdf";
window.switchMode = switchMode;
var isShareButtonHooked = false;
var selectedText = "";
const RENDER_SCALE = 1.5;
let storedHighlights = []; // This array will store our highlight coordinates
let viewer = null;
let highlightDrawSignal = 2;

var moreReadable = true;
var isBookLoaded = false;
var flexi_isFullscreen = false;
var scrolllerWatch;
var audioMeta = {
  voices: null,
  keepAlive: null,
  isSpeaking: false,
  currentPara: 0,
  totalReadItems: 0,
  itemsToRead: [],
  currentPage: 0,
  rate: 0.95,
};

const SPEECH_RATE_STORAGE_KEY = "userSpeechRate";
const SILENT_AUDIO_SRC = "https://baws.in/reader/silence.mp3";
let silentAudio = null;
var voicePanel = document.getElementById("voicePanel");

if ("speechSynthesis" in window) {
  var msg = new SpeechSynthesisUtterance();
  var synth = window.speechSynthesis;
  initializeSpeechRate();
} else {
  var msg = { volume: 1, rate: 0.95, pitch: 1, text: "", lang: "en-US" };
  var synth = null;
}

let wakeLock = null;

function onDomReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

onDomReady(function () {
  voicePanel = document.getElementById("voicePanel");

  // Moved message listener here for better reliability
  window.addEventListener("message", event => {
    let data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }
    if (!data) return;

    const action = data.action || data.type;
    const payload = data.data || data.payload;

    if (action === "loadHighlights") {
      const pdfDoc = PDFViewerApplication.pdfDocument;
      console.log("iframe: Received highlights from parent.");
      storedHighlights = payload || [];
      notifyHighlightsChanged();
      if (pdfDoc) {
        const current_pageNumber =
          PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber;
        drawHighlightsOnPage(current_pageNumber);
      }
    } else if (action === "nativeSpeechEnded" || action === "speechEnd") {
      if (speechUtteranceChunker.onSpeechEnd) {
        const cb = speechUtteranceChunker.onSpeechEnd;
        speechUtteranceChunker.onSpeechEnd = null;
        cb();
      }
    } else if (
      action === "getVoices" ||
      action === "setVoicesNative" ||
      action === "voicesLoaded"
    ) {
      const voicesArray = data.voices || payload;
      console.log("Received voices from parent:", voicesArray);
      audioMeta.voices = voicesArray;
      updateVoiceSelector();
    }
  });

  let scondsCount = 0;
  let loadPdfTimeOut;

  // Poll every 500ms for up to 2 minutes; large books on slow connections can
  // take well over 10 seconds to render their first page.
  function startWatching() {
    loadPdfTimeOut = setTimeout(loadPdfApp, 500);
  }
  function loadPdfApp() {
    scondsCount++;
    if (
      window.PDFViewerApplication &&
      window.PDFViewerApplication.eventBus &&
      window.PDFViewerApplication.initialized &&
      window.PDFViewerApplication.pdfViewer.onePageRendered
    ) {
      clearTimeout(loadPdfTimeOut);
      setVoices();
      isBookLoaded = true;

      const { onePageRendered } = PDFViewerApplication.pdfViewer;
      // 1. Find the element by its ID
      const elementToFocus = document.getElementById("viewer");

      // 2. Set focus on the element
      // Use optional chaining (?.) to avoid an error if the element isn't found
      elementToFocus?.focus();

      onePageRendered.then(data => {
        if (isOnMobile()) {
          document.getElementById("view-switch").style.display = "inline-block";
        }
      });
      window.parent.postMessage({ type: "iframeReady" }, "*");

      postBawsMsg("pageChanged");

      this._isPagesLoaded = true;
      viewer = document.getElementById("viewer");
      viewer.addEventListener("click", handleDeleteClick);
      setupResizeObserver();
      console.log(synth);
      /*PDFViewerApplication.eventBus._on("pagesloaded", evt => {
        isBookLoaded = true
        postBawsMsg("pageChanged");
        this._isPagesLoaded = !!evt.pagesCount;
        console.log(synth)
      });*/
      PDFViewerApplication.eventBus._on("pagerendered", evt => {
        postBawsMsg("pageRendered");
        setupResizeObserver();
      });
      PDFViewerApplication.eventBus._on("pagechanging", evt => {
        isBookLoaded = true;
        if (evt.pageNumber) postBawsMsg("pageChanged");
        setScrolling();
        if (scrolllerWatch) {
          clearInterval(scrolllerWatch);
        }
        scrolllerWatch = setInterval(storeScrolling, 5000, scrolllerWatch);
        this._isPagesLoaded = !!evt.pagesCount;
        if (!isOnMobile()) {
          const div = document.getElementsByClassName("page")[0];
          const span = document.getElementsByClassName("page_full_icon")[0];
          const rect = div.getBoundingClientRect();
          const position = window.innerWidth - rect.right;
          span.style.right = position * 1.1 + "px";
        }
      });
    } else {
      if (scondsCount <= 240) startWatching();
    }
  }

  document
    .getElementById("selectVoices")
    ?.addEventListener("change", function () {
      storeSelectedAudio(this.value);
    });

  startWatching();
});

window.addEventListener("load", () => {
  window.parent.postMessage({ type: "iframeReady" }, "*");
});

window.addEventListener("beforeunload", () => {
  window.parent.postMessage({ type: "iframeUnloading" }, "*");
});

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      console.log("Screen Wake Lock released:", wakeLock.released);
      //genericShowPanel('Screen Wake Lock released:'+ wakeLock.released, 2000);
    });
    console.log("Screen Wake Lock released:", wakeLock.released);
    //genericShowPanel('Screen Wake Lock released:'+ wakeLock.released, 2000);
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

// Fullscreen holds its own wake lock (released on exiting fullscreen), so
// stopping the audio reader shouldn't let the screen sleep while fullscreen.
const releaseWakeLock = async () => {
  if (!wakeLock || flexi_isFullscreen) {
    return;
  }
  try {
    await wakeLock.release();
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
  wakeLock = null;
};

async function fullScreen() {
  let mainContainer = document.getElementById("outerContainer");

  if (!mainContainer.requestFullscreen) {
    return false;
  }

  if (flexi_isFullscreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      flexi_isFullscreen = false;
      return;
    }
  }

  mainContainer.addEventListener("fullscreenchange", event => {
    if (!document.fullscreenElement) {
      if (wakeLock) {
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
  setPdfMeta({
    horizantalScroll: viewContainer.scrollLeft,
    verticalScroll: viewContainer.scrollTop,
  });
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch);
  }
}
function setScrolling() {
  let viewContainer = document.getElementById("viewerContainer");

  let stickyPdf = getPdfMeta();
  if (stickyPdf) {
    if (stickyPdf.horizantalScroll)
      viewContainer.scrollLeft = stickyPdf.horizantalScroll;
    if (stickyPdf.verticalScroll)
      viewContainer.scrollTop = stickyPdf.verticalScroll;
  }
}
function isPageDiff() {
  let pdfMeta = localStorage.getItem("pdfMeta");
  //pdfMeta=JSON.parse(pdfMeta);
  if (pdfMeta && pdfMeta.pageNo) {
    if (
      pdfMeta.pageNo !==
      PDFViewerApplication.pdfLinkService.pdfHistory._destination.page
    ) {
      setPageNo();
      return true;
    }
  } else {
    setPageNo();
    return true;
  }
  return false;
}
function setPageNo() {
  let pdfMeta = localStorage.getItem("pdfMeta");
  var pageNo = PDFViewerApplication.pdfLinkService.pdfHistory._destination.page;
  var mergeObj = { pageNo };
  if (pdfMeta) {
    pdfMeta = JSON.parse(pdfMeta);
    mergeObj = { ...mergeObj, ...pdfMeta };
  }
  // JSON.parse(pdfMeta)
  //if(PDFViewerApplication.pdfLinkService.pdfHistory._fingerprint)
  //localStorage.setItem("pdfMeta",JSON.stringify(mergeObj))
  //localStorage.setItem("pdfMeta",pdfMeta)
}
function onCopy() {
  if (window.getSelection() && window) {
    console.log(PDFViewerApplication);
    console.log(window.location.origin);
    let sel = window.getSelection();

    if (sel && sel.toString().length > 4) {
      selectedText = sel.toString().replace(/(\r\n|\n|\r)/gm, " ");
      navigator.clipboard.writeText(selectedText);
    }
  }
}

function onBookClick() {
  if (isOnMobile()) {
    if (PDFViewerApplication.pdfSidebar.isOpen) {
      PDFViewerApplication.pdfSidebar.toggle();
    }
  }

  if (
    window &&
    window.getSelection() &&
    window.getSelection().toString().length > 4
  ) {
    console.log(PDFViewerApplication);
    console.log(window.location.origin);
    let strSelectedTest = window.getSelection().toString();
    selectedText = strSelectedTest.replace(/(\r\n|\n|\r)/gm, " ");
    //disabled
    //clearTextSelection()
    //$('#textShareModal').modal('show')

    let check_one_word = selectedText.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, "");
    if (
      window.parent.dictionary &&
      check_one_word.indexOf(" ") <= -1 &&
      check_one_word.length >= 4
    ) {
      let result = window.parent.dictionary(check_one_word);
      console.log(result);
      setTimeout(function () {
        showDictionary(result, check_one_word);
      }, 1000);
    }
  }
}
function shareOnTwitter() {
  if (selectedText) {
    window.open(
      "https://twitter.com/intent/tweet?url=" +
        getCurrenPageUrl() +
        "&text=" +
        selectedText,
      "_blank"
    );
    // window.open('https://twitter.com')
  }
}

function shareOnFacebook() {
  if (selectedText) {
    window.open(
      "https://www.facebook.com/sharer.php?href=" + getCurrenPageUrl(),
      "_blank"
    );
  }
}

function shareOnWhatsup() {
  if (selectedText) {
    window.open(
      "https://api.whatsapp.com/send?text=" +
        selectedText +
        " , url = " +
        getCurrenPageUrl(),
      "_blank"
    );
  }
}
function getCurrenPageUrl() {
  return encodeURIComponent(
    window.location.origin +
      "/web/viewer.html?file=" +
      PDFViewerApplication.baseUrl +
      "?#page=" +
      PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber
  );
}
function clearTextSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {
      // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {
    // IE?
    document.selection.empty();
  }
}
function copyText() {
  if (selectedText) {
    navigator.clipboard.writeText(selectedText);
  }
}
function openNextPage() {
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch);
  }
  audioMeta.isSpeaking = false;
  PDFViewerApplication.pdfViewer.nextPage();
  //pageFlipTransform();
  //PDFViewerApplication.pdfViewer.scrollMode=3
  //  PDFViewerApplication.pdfViewer.spreadMode=1
  // PDFViewerApplication.eventBus.dispatch("scrollmodechanged", { source: PDFViewerApplication.pdfViewer, mode:3 });
  //PDFViewerApplication.eventBus.dispatch("spreadmodechanged", { source: PDFViewerApplication.pdfViewer, mode:2});
}
function pageFlipTransform() {
  let viewContainer = document.getElementById("viewerContainer");
  if (isBookLoaded) {
    viewContainer.style.transform = "rotateY(90deg)";
  }
  setTimeout(clearTransform, 200);
  // new Audio("page-flip-sound.mp3").play();
}
function clearTransform() {
  let viewContainer = document.getElementById("viewerContainer");
  viewContainer.style.transform = "none";
}
function openPrevPage() {
  audioMeta.isSpeaking = false;
  if (scrolllerWatch) {
    clearInterval(scrolllerWatch);
  }
  PDFViewerApplication.pdfViewer.previousPage();
  //pageFlipTransform();
}
function isOnMobile() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
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
    let i = startIndex ? startIndex : 0;
    for (; i < contentNode.length; ) {
      if (audioMeta.isSpeaking) {
        audioMeta.currentPara = i;
        await startReading(contentNode[i]);
        if (i == contentNode.length - 1) {
          openPageForReading("NEXT");
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
function readFlippedPage() {
  let locSpreadMode = PDFViewerApplication.pdfViewer.spreadMode;

  if (locSpreadMode <= 0) {
    audioMeta.itemsToRead = [];
    audioMeta.totalReadItems = 0;
    audioMeta.currentPara = 0;
    //make it appear like play on new page
    stopReading();
    setPlayIcon();
    setTimeout(selectRangeForReading, 1000);
  }
}
function openPageForReading(directionType) {
  if (PDFViewerApplication) {
    let count = 0;
    audioMeta.isSpeaking = false;
    PDFViewerApplication.eventBus._off("pagechanging", readFlippedPage);
    PDFViewerApplication.eventBus._on("pagechanging", readFlippedPage);
    if (directionType === "PREV") openPrevPage();
    else openNextPage();
  }
}
function getChildNodeLenght(contentNode) {
  let no =
    contentNode && contentNode.childNodes && contentNode.childNodes.length > 0
      ? 1
      : 0;
  return no;
}
function cleanTextForSpeech(str) {
  if (!str) return "";
  str = str.replace(/\*/g, "");
  str = str.replace(/ Manusmriti /g, " मनुस्मृति ");
  str = str.replace(/ Smriti /g, " स्मृति ");
  str = str.replace(/ Smritis /g, " स्मृति ");
  str = str.replace(/ Shudras /g, " Shoodras ");
  str = str.replace(/ Shudra /g, " Shoodra ");
  str = str.replace(/ B.C. /g, " BC ");
  str = str.replace(/ A.D. /g, " AD ");
  str = str.replace(/ Dr. /g, " doctor ");
  str = str.replace(/ Mr. /g, " mister ");
  str = str.replace(/ pp. /g, " page ");
  str = str.replace(/ Mrs. /g, " Missus ");
  str = str.replace(/ Prof. /g, " Professor ");
  str = str.replace(/ i.e. /g, " ,that is, ");
  if (str === str.toUpperCase()) {
    str = str.toLowerCase();
  }
  return str;
}

function updateVoiceSelector() {
  const selectVoices = document.getElementById("selectVoices");
  if (selectVoices) {
    selectVoices.replaceChildren(); // Clear the dropdown
  }

  if (!audioMeta.voices || audioMeta.voices.length === 0) return;

  let lang_hint1 = "English";
  let lang_hint2 = "India";
  let lang_set = null;
  let lang_set_backup = null;

  if (PDFViewerApplication.baseUrl.includes("/HI/")) {
    lang_hint1 = " हिन्दी";
    lang_hint2 = "Hindi";
  } else if (PDFViewerApplication.baseUrl.includes("/EN/")) {
    lang_hint1 = "English";
    lang_hint2 = "India";
  }

  const storedVoiceName = getPdfMeta().voiceName;
  let lang_stored = null;

  const seenNames = new Set();
  Array.from(audioMeta.voices).forEach(function (voice, index) {
    if (!voice || !voice.name || seenNames.has(voice.name)) return;
    seenNames.add(voice.name);

    if (voice.name === storedVoiceName) {
      lang_stored = index;
    }
    if (voice.name.includes(lang_hint1) && voice.name.includes(lang_hint2)) {
      lang_set = index;
    } else if (
      lang_set_backup === null &&
      (voice.name.includes(lang_hint1) || voice.name.includes(lang_hint2))
    ) {
      lang_set_backup = index;
    }
    if (selectVoices) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = voice.name;
      selectVoices.append(option);
    }
  });

  const voiceToSelect =
    lang_stored !== null
      ? lang_stored
      : lang_set !== null
        ? lang_set
        : lang_set_backup;
  if (voiceToSelect !== null && audioMeta.voices[voiceToSelect]) {
    if (selectVoices) {
      selectVoices.value = voiceToSelect;
    }
    setMsgVoice(audioMeta.voices[voiceToSelect]);
  }
  document.dispatchEvent(new CustomEvent("baws:voiceschange"));
}

// Incremented on every stop/start so "end" events from a cancelled utterance
// (which can fire after the next one has started) are ignored.
var speechSession = 0;

function stopReading() {
  audioMeta.isSpeaking = false;
  speechUtteranceChunker.cancel = true;
  speechSession++;

  if (window.parent && window.parent.isNativeApp) {
    window.parent.postMessage(
      JSON.stringify({ action: "stopSpeechNative" }),
      "*"
    );
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

var speechUtteranceChunker = function (utt, settings, callback) {
  settings = settings || {};

  if (speechUtteranceChunker.cancel || settings.session !== speechSession) {
    speechUtteranceChunker.cancel = false;
    return;
  }

  var txt =
    settings.offset !== undefined
      ? utt.text.substring(settings.offset)
      : utt.text;
  var chunkLength = settings.chunkLength || 160;

  if (!txt || txt.length <= 1) {
    if (callback) callback();
    return;
  }

  var pattRegex = new RegExp(
    "^[\\s\\S]{" +
      Math.floor(chunkLength / 2) +
      "," +
      chunkLength +
      "}[$]{1}|^[\\s\\S]{1," +
      chunkLength +
      "}$|^[\\s\\S]{1," +
      chunkLength +
      "} "
  );
  var chunkArr = txt.match(pattRegex);

  if (!chunkArr || !chunkArr[0]) {
    if (callback) callback();
    return;
  }

  var chunk = chunkArr[0];

  var onEnd = function () {
    if (speechUtteranceChunker.cancel || settings.session !== speechSession) {
      speechUtteranceChunker.cancel = false;
      return;
    }
    settings.offset = (settings.offset || 0) + chunk.length - 1;
    speechUtteranceChunker(utt, settings, callback);
  };

  if (window.parent && window.parent.isNativeApp) {
    console.log("Native speaking chunk:", chunk);
    speechUtteranceChunker.onSpeechEnd = onEnd;
    window.parent.postMessage(
      JSON.stringify({
        action: "speakTextNative",
        data: {
          text: chunk,
          rate: utt.rate || 1,
          volume: utt.volume || 1,
          pitch: utt.pitch || 1,
          lang: utt.lang || "en-US",
        },
      }),
      "*"
    );
  } else {
    var newUtt = new SpeechSynthesisUtterance(chunk);

    // Copy properties from original utterance
    ["lang", "voice", "volume", "pitch", "rate"].forEach(prop => {
      if (utt[prop] !== undefined) newUtt[prop] = utt[prop];
    });

    newUtt.addEventListener("end", onEnd);

    if (settings.modifier) {
      settings.modifier(newUtt);
    }

    console.log("Speaking chunk:", chunk);
    window.speechSynthesis.speak(newUtt);
  }
};

async function startReading(paramText) {
  const isNative = window.parent && window.parent.isNativeApp;
  if (!("speechSynthesis" in window) && !isNative) return;

  stopReading();
  audioMeta.isSpeaking = true; // Ensure flag remains true during sequence
  speechUtteranceChunker.cancel = false;

  msg.volume = 1;
  msg.rate = audioMeta.rate || 0.95;
  msg.pitch = 1;
  msg.text = cleanTextForSpeech(paramText);

  console.log("Starting reading: " + msg.text);

  const session = ++speechSession;
  return new Promise(resolve => {
    speechUtteranceChunker(msg, { chunkLength: 160, session }, () => {
      resolve();
    });
  });
}
function setVoices() {
  if (window.parent && window.parent.isNativeApp) {
    window.parent.postMessage(JSON.stringify({ action: "getVoices" }), "*");
    return;
  }

  if (typeof synth === "undefined" || !synth) return;

  var timer = setInterval(function () {
    const voices = synth.getVoices();
    if (voices && voices.length !== 0) {
      audioMeta.voices = voices;
      updateVoiceSelector();
      clearInterval(timer);
    }
  }, 2000);
}
async function startNodeReading(contentNode, startIndex) {
  if (contentNode && contentNode.length > 0) {
    let i = startIndex ? startIndex : 0;
    var garbage_regex = /[\p{N}\p{L}]/u;
    for (; i < contentNode.length; ) {
      if (audioMeta.isSpeaking) {
        audioMeta.currentPara = i;
        // Lets the new reader UI (reader-ui.js) show reading progress.
        document.dispatchEvent(
          new CustomEvent("baws:readingprogress", {
            detail: {
              page: audioMeta.currentPage,
              index: i,
              total: contentNode.length,
            },
          })
        );

        var toRead = contentNode[i];
        let currentReadIndex = i;

        if (toRead.match(garbage_regex)) {
          PDFViewerApplication.eventBus.dispatch("find", {
            source: this,
            type: " ",
            query: toRead,
            caseSensitive: true,
            entireWord: true,
            highlightAll: true,
            findPrevious: false,
            matchDiacritics: false,
          });
          await startReading(toRead);
        }
        if (i == contentNode.length - 1) {
          setTimeout(() => openPageForReading("NEXT"), 1000);
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
function compareItems(a, b) {
  if (a.transform[5] - b.transform[5] < -5) {
    return 1;
  }
  if (a.transform[5] - b.transform[5] > 5) {
    return -1;
  }
  if (a.transform[4] < b.transform[4]) {
    return -1;
  }
  if (a.transform[4] > b.transform[4]) {
    return 1;
  }

  return 0;
}

async function selectRangeForReading() {
  if (audioMeta.isSpeaking) {
    stopReading();
    setPlayIcon();
    PDFViewerApplication.eventBus._off("pagechanging", readFlippedPage);
    disableBackgroundPlayback(); // We are done
    return;
  }
  if (!audioMeta.isSpeaking) {
    // We are about to start speaking
    await enableBackgroundPlayback();
  }
  PDFViewerApplication.eventBus._off("pagechanging", readFlippedPage);
  PDFViewerApplication.eventBus._on("pagechanging", readFlippedPage);

  if (
    audioMeta.itemsToRead.length > 0 &&
    audioMeta.currentPage ==
      PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber
  ) {
    audioMeta.isSpeaking = !audioMeta.isSpeaking;
    setPlayIcon();
    startNodeReading(audioMeta.itemsToRead, audioMeta.currentPara);
    return;
  }
  const textOptions = { disableNormalization: true };
  return new Promise(() => {
    setTimeout(hideVoicePanel, 15000);

    PDFViewerApplication.pdfDocument
      .getPage(PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber)
      .then(pdfPage => {
        return pdfPage.getTextContent(textOptions);
      })
      .then(
        textContent => {
          return new Promise(() => {
            const strBuf = [];

            textContent.items.sort(compareItems);
            let prevItem = null;
            let prevHeight = 0;

            for (const textItem of textContent.items) {
              var first_element_height = textContent.items[0].transform[5];
              var final_str = textItem.str;
              if (
                prevItem &&
                prevItem.str == textItem.str &&
                Math.abs(prevItem.transform[4] - textItem.transform[4]) < 1 &&
                Math.abs(prevItem.transform[5] - textItem.transform[5]) < 1
              )
                continue;

              //convert the encodings, take hint from the truefont
              if (textItem.trueFont && textItem.trueFont.includes("Kruti")) {
                final_str = kruti2unicodeEx(final_str);
              } else if (
                textItem.trueFont &&
                textItem.trueFont.includes("Chanakya")
              ) {
                final_str = chanakya2unicodeEx(final_str);
              }
              var ignore_height = 600;
              var heightTolerance = 0.05;
              if (PDFViewerApplication.baseUrl.includes("/MR/")) {
                ignore_height = 2840;
                heightTolerance = 0.13;
                if (
                  first_element_height > 2700 &&
                  first_element_height < 2840
                ) {
                  ignore_height = 2700;
                }
              }

              if (
                textItem.height > 0 &&
                textItem.height > 0 &&
                Math.abs(textItem.height - prevHeight) / prevHeight >=
                  heightTolerance
              ) {
                strBuf.push("\n ");
              }
              if (textItem.transform[5] < ignore_height) strBuf.push(final_str);
              if (textItem.hasEOL) {
                strBuf.push(" ");
              }
              if (textItem.height > 0) {
                prevHeight = textItem.height;
              }
              prevItem = textItem;
            }
            const regex = new RegExp(
              "(?<!\\w\\.\\w.)" +
                "(?<!\\s\\p{Lu}\\p{L}.)" +
                "(?<!\\s\\p{L}.)" +
                "(?<!\\s\\p{N}\\p{N}.)" +
                "(?<!\\s\\p{Lu}\\p{L}\\p{L}.)" +
                "(?<=\\.|\\?|।|\\\\'|\"|’|!|”|,|;|—|\\\\:|\\\\;|-|\\n)\\s",
              "gmu"
            );

            var textArr = strBuf.join("").split(regex);

            audioMeta.currentPara = 0;
            audioMeta.currentPage =
              PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber;
            if (textArr && textArr.length > 0) {
              audioMeta.isSpeaking = true;
              setPlayIcon();
              {
                audioMeta.itemsToRead = textArr;
                audioMeta.totalReadItems = textArr.length;
                startNodeReading(audioMeta.itemsToRead, audioMeta.currentPara);
              }
            } else {
              audioMeta.currentPara = 0;
              setTimeout(() => openPageForReading("NEXT"), 1000);
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
  setTimeout(hideVoicePanel, 5000);
  let markedContent = document.getElementsByClassName("markedContent");
  let textLayer = document.getElementsByClassName("textLayer");
  let textArr = document.querySelectorAll("[role='presentation']");
  let contentNode;
  audioMeta.currentPara = 0;
  if (textArr && textArr.length > 0) {
    audioMeta.isSpeaking = !audioMeta.isSpeaking;
    setPlayIcon();
    if (!audioMeta.isSpeaking) {
      stopReading();
    } else {
      await startNodeReading(textArr, null);
    }
  } else {
    openPageForReading("NEXT");
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
  setTimeout(hideVoicePanel, 15000);

  if (audioMeta.totalReadItems > 0) {
    let nextParaIndex = audioMeta.currentPara + 1;
    if (nextParaIndex >= audioMeta.totalReadItems) {
      openPageForReading("NEXT");
    } else {
      stopReading();
      setPlayIcon();
      audioMeta.isSpeaking = true;
      setPlayIcon();
      startNodeReading(audioMeta.itemsToRead, nextParaIndex);
    }
  } else {
    openPageForReading("NEXT");
  }
}
function prevParagraph() {
  setTimeout(hideVoicePanel, 15000);
  if (audioMeta.totalReadItems > 0) {
    let prevParaIndex = audioMeta.currentPara - 1;
    if (prevParaIndex < 0) {
      openPageForReading("PREV");
    } else {
      stopReading();
      setPlayIcon();
      audioMeta.isSpeaking = true;
      setPlayIcon();
      startNodeReading(audioMeta.itemsToRead, prevParaIndex);
    }
  } else {
    openPageForReading("PREV");
  }
}
function storeSelectedAudio(voiceNo) {
  const voice = audioMeta.voices && audioMeta.voices[voiceNo];
  if (voice) {
    setMsgVoice(voice);
    // Store the name, not the index: the voice list order is not stable.
    setPdfMeta({ voiceName: voice.name });
  }
}
// Native-app voices are plain objects; assigning one to a real
// SpeechSynthesisUtterance.voice throws, so only set it for real voices.
function setMsgVoice(voice) {
  msg.lang = voice.lang;
  if (
    typeof SpeechSynthesisVoice === "undefined" ||
    voice instanceof SpeechSynthesisVoice
  ) {
    msg.voice = voice;
  }
}
// Reader state (scroll position, voice) is stored per book.
function getPdfMetaKey() {
  const baseUrl = window.PDFViewerApplication?.baseUrl;
  return baseUrl ? "pdfMeta:" + baseUrl : "pdfMeta";
}
function setPdfMeta(pdfMetaParam) {
  const mergeObj = { ...getPdfMeta(), ...pdfMetaParam };
  localStorage.setItem(getPdfMetaKey(), JSON.stringify(mergeObj));
}
function getPdfMeta() {
  try {
    return JSON.parse(localStorage.getItem(getPdfMetaKey())) || {};
  } catch (e) {
    return {};
  }
}
function setPlayIcon() {
  const playIcon = document.getElementById("audioPlayIcon");
  if (playIcon) {
    playIcon.className = audioMeta.isSpeaking
      ? "far fa-stop fa-3x"
      : "far fa-play fa-3x";
  }
  if ("mediaSession" in navigator && navigator.mediaSession.metadata) {
    navigator.mediaSession.playbackState = audioMeta.isSpeaking
      ? "playing"
      : "paused";
  }
  // Lets the new reader UI (reader-ui.js) reflect the reading state.
  document.dispatchEvent(
    new CustomEvent("baws:speakingchange", {
      detail: { speaking: audioMeta.isSpeaking },
    })
  );
}
// --- Function to HIDE the panel ---
function hideVoicePanel() {
  voicePanel.classList.add("hidden");
}

// --- Function to SHOW the panel ---
// Call this from the button that opens your reader controls
function showVoicePanel() {
  voicePanel.classList.remove("hidden");
}
document.addEventListener("mousedown", function (event) {
  // Don't do anything if the panel is already hidden
  if (voicePanel.classList.contains("hidden")) {
    return;
  }

  // Check if the click was outside the voicePanel
  // and also not on a button that is MEANT to open the panel
  // (You should add a class like 'opens-voice-panel' to your trigger button)
  if (
    !voicePanel.contains(event.target) &&
    !event.target.closest(".opens-voice-panel")
  ) {
    hideVoicePanel();
  }
});

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
  if (flexi_isFullscreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  window.parent.postMessage(
    JSON.stringify({
      action: "loadSearchPage",
    }),
    "*"
  );
}
function loadNotesPage() {
  window.parent.postMessage(
    JSON.stringify({
      action: "loadNotesPage",
    }),
    "*"
  );
}
function postBawsMsg(action) {
  try {
    window.parent.postMessage(
      JSON.stringify({
        action: action,
        data: getBookUrlData(),
      }),
      "*"
    );
  } catch (error) {
    console.log("postBawsMsg", error);
  }
}

function showDictionary(result, searchText) {
  if (
    window &&
    window.getSelection() &&
    window.getSelection().toString().length > 4
  ) {
    var selectedText = window.getSelection().toString();
    let check_one_word = selectedText.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, "");
    if (check_one_word.indexOf(" ") > 0) return;
  }
  // The new reader UI shows its own definition card (no Bootstrap).
  if (window.BAWS_READER_UI === 2 && window.BawsReaderUI) {
    window.BawsReaderUI.showDefinition(searchText, result);
    return;
  }
  let panelBody = document.getElementById("dictionaryPanelBody");
  panelBody.innerHTML = "";
  if (result) {
    panelBody.innerHTML = result;
  } else {
    panelBody.innerHTML = "We don't have this term currently please check ";
    let aTag = document.createElement("a");
    let link = "https://www.google.com/search?q=" + searchText;
    aTag.setAttribute("href", link);
    aTag.setAttribute("target", "_blank");
    aTag.innerText = "here";
    panelBody.appendChild(aTag);
  }
  showDictionaryPanel();
}
function showDictionaryPanel() {
  var myOffcanvas = document.getElementById("dictionaryPanel");
  var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
  bsOffcanvas.show();
  setTimeout(hideDictionaryPanel, 5000);
}
function hideDictionaryPanel() {
  var myOffcanvas = document.getElementById("dictionaryPanel");
  let openedCanvas = bootstrap.Offcanvas.getInstance(myOffcanvas);
  openedCanvas.hide();
}

function genericShowPanel(result, timeout) {
  // The new reader UI shows notices as toasts (no Bootstrap).
  if (window.BAWS_READER_UI === 2 && window.BawsReaderUI) {
    window.BawsReaderUI.toast(String(result || ""), { timeout });
    return;
  }
  let panelBody = document.getElementById("genericPanelBody");
  panelBody.innerHTML = "";
  if (result) {
    panelBody.innerHTML = result;
  }
  showGenericPanel(timeout);
}
function showGenericPanel(timeout) {
  var myOffcanvas = document.getElementById("genericPanel");
  var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
  bsOffcanvas.show();
  setTimeout(hideGenericPanel, timeout);
}
function hideGenericPanel() {
  var myOffcanvas = document.getElementById("genericPanel");
  let openedCanvas = bootstrap.Offcanvas.getInstance(myOffcanvas);
  openedCanvas.hide();
}

function getParentTitles(tree, number) {
  const titles = [];

  function traverse(node, depth = 0) {
    if (number >= node.dest && number <= node.end) {
      titles.push(node.title);

      for (const item of node.items) {
        traverse(item, depth + 1);
      }
    }
  }

  traverse(tree);
  return titles;
}

function detectMobileOS() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }

  return "Unknown";
}

function isWindowsDesktop() {
  const platform =
    navigator.userAgentData?.platform || navigator.platform || "";
  return /^win/i.test(platform);
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

// Draws the share image straight from the current page's canvas: the page,
// its saved highlights, the selection in yellow and a QR code linking to the
// page. Copying the page's HTML instead (html2canvas) could take longer than
// the few seconds a browser allows between the tap and navigator.share(),
// and the share was then refused.
async function makeSharePageImage(pageUrl) {
  const pageView = PDFViewerApplication.pdfViewer.getPageView(
    PDFViewerApplication.page - 1
  );
  const source = pageView?.canvas;
  if (!source?.width) {
    return null;
  }
  // Start the QR code first: its logo image loads over the network.
  const qrSize = Math.round(source.height * 0.07);
  const qrData = Promise.race([
    getQRCode(pageUrl, qrSize).getRawData("png"),
    sleep(2000).then(() => null), // share without it rather than wait
  ]).catch(() => null);

  const image = document.createElement("canvas");
  image.width = source.width;
  image.height = source.height;
  const ctx = image.getContext("2d");
  ctx.drawImage(source, 0, 0);

  // Screen rectangles to canvas pixels.
  const box = source.getBoundingClientRect();
  const scale = source.width / box.width;
  const fill = (rect, color) => {
    if (rect.right <= box.left || rect.left >= box.right) {
      return;
    }
    if (rect.bottom <= box.top || rect.top >= box.bottom) {
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(
      (rect.left - box.left) * scale,
      (rect.top - box.top) * scale,
      rect.width * scale,
      rect.height * scale
    );
  };
  // "multiply" tints like a highlighter pen and keeps the text readable.
  ctx.globalCompositeOperation = "multiply";
  for (const layer of pageView.div.querySelectorAll(".highlight-layer")) {
    fill(
      layer.getBoundingClientRect(),
      getComputedStyle(layer).backgroundColor
    );
  }
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    for (const rect of selection.getRangeAt(0).getClientRects()) {
      fill(rect, "rgb(255, 240, 0)");
    }
  }
  ctx.globalCompositeOperation = "source-over";

  const qrBlob = await qrData;
  if (qrBlob) {
    const qr = await createImageBitmap(qrBlob);
    const margin = Math.round(source.height * 0.001);
    ctx.drawImage(
      qr,
      image.width - qrSize - margin,
      image.height - qrSize - margin,
      qrSize,
      qrSize
    );
  }
  return new Promise(resolve => {
    image.toBlob(resolve, "image/png");
  });
}

async function shareBookPageContent(
  selectedText,
  title,
  pageUrl,
  isLongPressShare
) {
  let imageBlob = null;
  try {
    if (window.VIEW_MODE === "pdf" && isLongPressShare) {
      // Long press: download a large QR code for the page.
      getQRCode(
        pageUrl,
        600,
        "https://baws.in/baws_social_logo.png",
        50
      ).download({ name: uuidv4(), extension: "png" });
      return;
    }
    imageBlob =
      window.VIEW_MODE === "pdf" ? await makeSharePageImage(pageUrl) : null;
    window.getSelection()?.removeAllRanges();

    if (!imageBlob) {
      // Reflowed text mode has no page image; share the text and link only.
      if (navigator.share) {
        await navigator.share({ title, text: selectedText, url: pageUrl });
      }
      return;
    }

    // Windows' share window often fails for images from Chrome, and only
    // after a long wait ("AbortError: Share failed"), so on Windows the
    // image is downloaded straight away; the text and link are already in
    // the clipboard.
    if (!window.parent?.isNativeApp && isWindowsDesktop()) {
      saveShareImage(imageBlob);
      genericShowPanel(
        "Page image downloaded. The text and link are copied, please paste to share",
        4000
      );
      return;
    }

    if (
      !navigator.canShare ||
      !navigator.canShare({ files: [new File([], "")] })
    ) {
      const reader = new FileReader();
      reader.onloadend = function() {
        const base64data = reader.result;
        
        // If we are embedded in the Capacitor App, send the image up to be shared natively
        if (window.parent && window.parent.isNativeApp) {
          window.parent.postMessage(JSON.stringify({
            action: "shareImageNative",
            data: {
              title: title,
              url: pageUrl,
              base64: base64data
            }
          }), "*");
        } else {
          // Standard web fallback (download the image locally)
          saveShareImage(imageBlob);
        }
      };
      reader.readAsDataURL(imageBlob);
      return;
    }

    // Create a file object from the image blob
    const imageFile = new File([imageBlob], uuidv4() + ".png", {
      type: "image/png",
    });

    // Share the content using the Web Share API
    if (detectMobileOS() === "Android") {
      await navigator.share({
        title: title,
        url: pageUrl,
        files: [imageFile],
      });
    } else {
      await navigator.share({
        files: [imageFile],
      });
    }
  } catch (error) {
    console.error("Error sharing content:", error);
    // Closing the share window ("Share canceled") stays cancelled. Any other
    // failure, e.g. Chrome on Windows "AbortError: Share failed", saves the
    // image instead; the text and link are already in the clipboard.
    if (imageBlob && !/cancel/i.test(error?.message || "")) {
      saveShareImage(imageBlob);
      genericShowPanel(
        "Couldn't open the share window, so the page image was downloaded. The text and link are copied, please paste to share",
        5000
      );
      return;
    }
  }
  genericShowPanel(
    "Selected text and address to current page copied to clipboard, please paste to share",
    3000
  );
}

/** Downloads the share image (when the browser can't share files). */
function saveShareImage(imageBlob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(imageBlob);
  a.download = uuidv4() + ".png";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
document.addEventListener("DOMContentLoaded", event => {
  const shareButton = document.getElementById("shareButton");

  // The new reader UI (reader-ui.js) wires its own share button.
  if (isShareButtonHooked || !shareButton || window.BAWS_READER_UI === 2) {
    return;
  }
  let pressTimer;
  let isLongPress = false;
  let isPressing = false;

  const startPress = () => {
    console.log(isPressing);
    if (isPressing) return;
    isLongPress = false;
    isPressing = true;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      //onLongPress();
    }, 1000); // 1000ms = 1 second
  };

  const endPress = () => {
    console.log(isPressing);
    if (!isPressing) return;
    isPressing = false;
    clearTimeout(pressTimer);
    {
      shareButtonClick(isLongPress);
    }
  };

  shareButton.addEventListener("mousedown", startPress);
  shareButton.addEventListener("touchstart", startPress);

  shareButton.addEventListener("mouseup", endPress);
  shareButton.addEventListener("touchend", endPress);

  shareButton.addEventListener("mouseleave", () => {
    clearTimeout(pressTimer);
    isPressing = false;
  });

  shareButton.addEventListener("touchcancel", () => {
    clearTimeout(pressTimer);
    isPressing = false;
  });

  function onLongPress() {
    console.log("Long press detected");
    // Add your long press logic here
  }
  isShareButtonHooked = true;
});
async function shareButtonClick(isLongPressShare) {
  if (window.getSelection() && window) {
    console.log(PDFViewerApplication);
    console.log(window.location.origin);
    let sel = window.getSelection();

    if (true) {
      let urlData = getBookUrlData();
      let shortUrl =
        window.location.protocol +
        "//" +
        ("localhost" === window.location.hostname
          ? "baws.in"
          : window.location.hostname) +
        "/books/" +
        urlData.bookParent +
        "/" +
        urlData.language +
        "/" +
        urlData.bookName +
        "/pdf/" +
        urlData.pageNo;

      selectedText = sel.toString().replace(/(\r\n|\n|\r)/gm, " ");

      var outline = PDFViewerApplication.outline;
      var title = "From Dr Ambedkar's writings and speeches";
      if (outline) {
        var titles = getParentTitles(outline, urlData.pageNo);
        title = titles[titles.length - 1] || title;
        selectedText =
          "In " + titles.slice(1).join(">") + "\n\n" + selectedText;
      }

      var panelMessageForText =
        "Selected text and address to current page copied, please paste to share";
      var panelMessageForUrl =
        "Address to current page copied, please paste to share";

      if (detectMobileOS() === "Android") {
        panelMessageForText =
          "Please wait while we prepare to share image and text together";
        panelMessageForUrl =
          "Please wait while we prepare to share image and text together";
      }
      if (
        window &&
        window.getSelection() &&
        window.getSelection().toString().length > 0
      ) {
        selectedText =
          "From Dr Ambedkar's writings and speeches:\n" +
          selectedText +
          "\n\nto read more please go to " +
          shortUrl;
        navigator.clipboard.writeText(selectedText);
        genericShowPanel(panelMessageForText, 3000);
      } else {
        selectedText = shortUrl;
        navigator.clipboard.writeText(selectedText);
        genericShowPanel(panelMessageForUrl, 3000);
      }

      await shareBookPageContent(
        selectedText,
        title,
        shortUrl,
        isLongPressShare
      );
    }
  }
}

// Highlight colours are stored by name in the optional `color` field;
// highlights without one (all older bookmarks) are yellow.
const HIGHLIGHT_COLORS = ["yellow", "blue", "green", "pink"];

/** Lets the new reader UI (Notebook, page slider) follow the highlights. */
function notifyHighlightsChanged() {
  document.dispatchEvent(
    new CustomEvent("baws:highlightschange", {
      detail: { highlights: storedHighlights },
    })
  );
}

/** Deletes a highlight here and tells the app to delete it too. */
function removeHighlight(id) {
  deleteHighlight(id);
  window.parent.postMessage({ type: "deleteHighlight", payload: id }, "*");
}

function highlightColorOf(highlight) {
  return HIGHLIGHT_COLORS.includes(highlight?.color)
    ? highlight.color
    : "yellow";
}

async function saveSelection(color) {
  const pdfDoc = PDFViewerApplication.pdfDocument;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    console.log("No text selected.");
    return;
  }

  const range = selection.getRangeAt(0);
  // Read the text from the live selection; the global `selectedText` may be
  // stale or already rewritten by the share flow.
  const highlightText = selection.toString().replace(/(\r\n|\n|\r)/gm, " ");
  // In reflowed text mode the page box is not the PDF page, so screen
  // coordinates would be drawn in the wrong place in PDF mode. Save text only.
  const isReflow = window.VIEW_MODE === "text";

  const startElement =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer.parentElement;
  const pageContainer = startElement?.closest(".page");
  if (!pageContainer) {
    console.error("Selection is not within a PDF page.");
    return;
  }

  // Use the page the selection is on, which can differ from the "current"
  // page when several pages are visible.
  const pageNum = parseInt(pageContainer.dataset.pageNumber);
  const pageRect = pageContainer.getBoundingClientRect();

  let urlData = getBookUrlData();
  let shortUrl =
    ("localhost" === window.location.hostname ? "" : window.location.hostname) +
    "/books/" +
    urlData.bookParent +
    "/" +
    urlData.language +
    "/" +
    urlData.bookName +
    "/pdf/" +
    pageNum;

  /* --- OPTIMIZATION LOGIC ADDED --- */
  // This logic merges adjacent rectangles on the same line to reduce data size.
  const selectionRects = Array.from(range.getClientRects());

  // 1. Group rects by line (using the 'top' coordinate with a tolerance)
  const lines = new Map();
  var V_TOLERANCE = 5; // Vertical tolerance in pixels
  if (PDFViewerApplication.baseUrl.includes("/MR/")) {
    V_TOLERANCE = 20;
  }

  for (const rect of selectionRects) {
    if (rect.width <= 1) continue; // Filter out tiny or zero-width rects

    let added = false;
    for (const top of lines.keys()) {
      if (Math.abs(rect.top - top) < V_TOLERANCE) {
        lines.get(top).push(rect);
        added = true;
        break;
      }
    }
    if (!added) {
      lines.set(rect.top, [rect]);
    }
  }

  // 2. Merge rects within each line
  const mergedRects = [];
  var H_TOLERANCE = 5; // Horizontal tolerance in pixels

  if (PDFViewerApplication.baseUrl.includes("/MR/")) {
    H_TOLERANCE = 50;
  }

  for (const lineRects of lines.values()) {
    lineRects.sort((a, b) => a.left - b.left);
    if (lineRects.length === 0) continue;

    let currentMergedRect = lineRects[0];
    for (let i = 1; i < lineRects.length; i++) {
      const nextRect = lineRects[i];
      const gap = nextRect.left - currentMergedRect.right;

      if (gap <= H_TOLERANCE) {
        // Check if they are adjacent enough to merge
        const newRight = Math.max(currentMergedRect.right, nextRect.right);
        currentMergedRect = new DOMRect(
          currentMergedRect.left,
          Math.min(currentMergedRect.top, nextRect.top),
          newRight - currentMergedRect.left,
          Math.max(currentMergedRect.height, nextRect.height)
        );
      } else {
        mergedRects.push(currentMergedRect);
        currentMergedRect = nextRect;
      }
    }
    mergedRects.push(currentMergedRect);
  }
  /* --- END OPTIMIZATION LOGIC --- */

  const relativeRects = isReflow
    ? []
    : mergedRects.map(rect => ({
        topPercent: ((rect.top - pageRect.top) / pageRect.height) * 100,
        leftPercent: ((rect.left - pageRect.left) / pageRect.width) * 100,
        widthPercent: (rect.width / pageRect.width) * 100,
        heightPercent: (rect.height / pageRect.height) * 100,
      }));

  // If filtering removed all rectangles, do not proceed.
  if (!isReflow && relativeRects.length === 0) {
    console.log(
      "Selection resulted in no valid highlight rectangles after filtering."
    );
    selection.removeAllRanges();
    return;
  }
  if (!highlightText.trim()) {
    return;
  }

  const newHighlight = {
    id: crypto.randomUUID(),
    rects: relativeRects,
    url: shortUrl,
    text: highlightText,
    pageNo: pageNum,
    context: [],
    title: urlData.bookName,
    baseUrl: PDFViewerApplication.baseUrl,
    shared: false,
  };
  if (HIGHLIGHT_COLORS.includes(color)) {
    newHighlight.color = color;
  }
  window.parent.postMessage(
    { type: "saveHighlight", payload: newHighlight },
    "*"
  );
  addHighlights([newHighlight]);
}

/**
 * Adds an array of highlight objects to the current document.
 * @param {Array<Object>} newHighlights - An array of highlight objects to add.
 */
function addHighlights(newHighlights) {
  const pdfDoc = PDFViewerApplication.pdfDocument;
  if (!pdfDoc) {
    console.error("Cannot add highlights: No PDF is loaded.");
    return;
  }
  if (!Array.isArray(newHighlights) || newHighlights.length === 0) {
    console.log("No new highlights to add.");
    return;
  }

  storedHighlights.push(...newHighlights);
  notifyHighlightsChanged();

  console.log(`${newHighlights.length} new highlight(s) added and saved.`);

  const pagesToUpdate = [...new Set(newHighlights.map(h => h.pageNo))];
  pagesToUpdate.forEach(pageNum => {
    drawHighlightsOnPage(pageNum);
  });
}

/**
 * Draws all stored highlights for a specific page.
 * @param {number} pageNum The page number to draw highlights on.
 */
async function drawHighlightsOnPage(pageNum) {
  const pdfDoc = PDFViewerApplication.pdfDocument;
  clearHighlightsOnPage(pageNum);

  const pageContainer = document.querySelector(
    `.page[data-page-number='${pageNum}']`
  );
  if (!pageContainer) return;

  pageContainer
    .querySelectorAll(".highlight-group")
    .forEach(group => group.remove());

  // Stored rectangles are relative to the PDF page; they don't line up with
  // the reflowed text, so don't draw them in text mode.
  if (window.VIEW_MODE === "text") return;

  // Get the page and its current viewport to calculate absolute positions
  const page = await pdfDoc.getPage(pageNum);
  const pageRect = pageContainer.getBoundingClientRect(); // Get current on-screen size
  let urlData = getBookUrlData();
  // Files outside the /<parent>/<language>/<book>.pdf layout (e.g. local
  // test files) have no book address, so no highlights can belong to them.
  if (!urlData) return;
  let shortUrl =
    "/books/" +
    urlData.bookParent +
    "/" +
    urlData.language +
    "/" +
    urlData.bookName +
    "/pdf/" +
    pageNum;

  const highlightsToDraw = storedHighlights.filter(
    h => h.pageNo === pageNum && h.url && h.url.includes(shortUrl)
  );

  highlightsToDraw.forEach(highlight => {
    if (!highlight.rects || highlight.rects.length === 0) return;

    // 1. Create the group container. It's for logical grouping only.
    const group = document.createElement("div");
    group.className = "highlight-group";
    group.dataset.highlightId = highlight.id;

    // 2. Create and position the visual highlight layers.
    highlight.rects.forEach(rect => {
      const el = document.createElement("div");
      el.className = `highlight-layer highlight-${highlightColorOf(highlight)}`;

      // Position absolutely within the page container
      el.style.top = `${(rect.topPercent / 100) * pageRect.height}px`;
      el.style.left = `${(rect.leftPercent / 100) * pageRect.width}px`;
      el.style.width = `${(rect.widthPercent / 100) * pageRect.width}px`;
      el.style.height = `${(rect.heightPercent / 100) * pageRect.height}px`;

      group.appendChild(el);
    });

    // 3. Calculate the absolute position for the delete button.
    const topPercents = highlight.rects.map(r => r.topPercent);
    const rightPercents = highlight.rects.map(
      r => r.leftPercent + r.widthPercent
    );

    const minTopPercent = Math.min(...topPercents);
    const maxRightPercent = Math.max(...rightPercents);

    // 4. Create and position the delete button.
    const deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-highlight-btn";
    deleteBtn.textContent = "×";
    deleteBtn.dataset.highlightId = highlight.id;

    // Position it absolutely on the page, at the top-right of the highlight's bounding box.
    // The offsets (-10px) are to center the button on the corner.
    deleteBtn.style.top = `${(minTopPercent / 100) * pageRect.height - 10}px`;
    deleteBtn.style.left = `${(maxRightPercent / 100) * pageRect.width}px`;

    group.appendChild(deleteBtn);

    pageContainer.appendChild(group);
  });
}

/**
 * Removes highlight elements from a specific page.
 * @param {number} pageNum The page to clear.
 */
function clearHighlightsOnPage(pageNum) {
  const pdfDoc = PDFViewerApplication.pdfDocument;
  if (!pdfDoc) {
    console.error("Cannot clear highlights: No PDF is loaded.");
    return;
  }
  const pageContainer = document.querySelector(
    `.page[data-page-number='${pageNum}']`
  );
  if (pageContainer) {
    const oldHighlights = pageContainer.querySelectorAll(".highlight-group");
    oldHighlights.forEach(h => h.remove());
  }
}

function handleDeleteClick(event) {
  const target = event.target;
  if (target.classList.contains("delete-highlight-btn")) {
    event.stopPropagation();
    const highlightId = target.dataset.highlightId;
    if (highlightId) {
      deleteHighlight(highlightId);
      window.parent.postMessage(
        { type: "deleteHighlight", payload: highlightId },
        "*"
      );
    }
  }
}

function deleteHighlight(id) {
  // Remove from the stored array
  const index = storedHighlights.findIndex(h => h.id === id);
  if (index > -1) {
    storedHighlights.splice(index, 1);
    notifyHighlightsChanged();

    // Remove from the DOM
    const groupElement = viewer.querySelector(
      `.highlight-group[data-highlight-id='${id}']`
    );
    if (groupElement) {
      groupElement.remove();
    }
    console.log(`Deleted highlight ${id}`);
  }
}

async function setupResizeObserver() {
  console.log("Resizing detected, redrawing highlights...");
  const pdfDoc = PDFViewerApplication.pdfDocument;
  if (!pdfDoc) return;
  const current_pageNumber =
    PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber;
  await drawHighlightsOnPage(current_pageNumber);
}

async function disableBookMarkButtonFor10Seconds() {
  // 1. Get the button element by its ID
  const bookmarkButton = document.getElementById("bookMark");

  // Return early if the button doesn't exist to avoid errors
  if (!bookmarkButton) {
    console.error("Button with id 'bookMark' not found.");
    return;
  }

  // 2. Disable the button
  bookmarkButton.disabled = true;

  // 3. Set a timer to re-enable the button after 30 seconds (30000 milliseconds)
  setTimeout(() => {
    // 4. Re-enable the button
    bookmarkButton.disabled = false;
  }, 10000);
}

async function addBookMark(color) {
  // first disable the bookmark button
  disableBookMarkButtonFor10Seconds();
  saveSelection(color);
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    // For older versions of IE
    document.selection.empty();
  }
}
function getBookUrlData() {
  let text = PDFViewerApplication.baseUrl;
  text = text.slice(0, -4);
  const urlArr = text.split("/");
  if (urlArr.length > 3) {
    return {
      pageNo: PDFViewerApplication.pdfLinkService.pdfViewer._currentPageNumber,
      bookParent: urlArr[urlArr.length - 3],
      language: urlArr[urlArr.length - 2],
      bookName: urlArr[urlArr.length - 1],
    };
  }
}

async function enableBackgroundPlayback() {
  if (silentAudio) {
    console.log("Background playback is already enabled.");
    return;
  }
  await requestWakeLock();
  console.log("Enabling background playback...");
  silentAudio = new Audio();
  silentAudio.src = SILENT_AUDIO_SRC;
  silentAudio.loop = true; // Loop the silent audio to keep the session active

  // We must wait for user interaction before playing audio.
  // The button click that calls this function serves as that interaction.
  silentAudio
    .play()
    .then(() => {
      console.log("Silent audio is now playing.");
      setupMediaSession();
    })
    .catch(error => {
      console.error("Could not play silent audio:", error);
      // In case of error, reset the state.
      silentAudio = null;
    });
}

/**
 * Disables background audio playback by stopping the silent audio
 * and clearing the Media Session.
 */
async function disableBackgroundPlayback() {
  if (!silentAudio) {
    console.log("Background playback is not enabled.");
    return;
  }
  await releaseWakeLock();
  console.log("Disabling background playback...");
  silentAudio.pause();
  silentAudio.src = ""; // Release the audio source
  silentAudio = null;

  clearMediaSession();
}

/**
 * Sets up the Media Session metadata to make the browser treat this
 * page as a media-playing app. This is what shows up in the phone's
 * notification shade.
 */
function setupMediaSession() {
  if ("mediaSession" in navigator) {
    console.log("Setting up Media Session...");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: parent.document.title,
      artist: "BAWS.in",
      album: "Dr. Babasaheb Ambedkar Writings and Speeches",
      artwork: [
        // Add a placeholder image for the media notification
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "128x128",
          type: "image/png",
        },
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "256x256",
          type: "image/png",
        },
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "384x384",
          type: "image/png",
        },
        {
          src: "https://baws.in/baws_social_logo.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    // Set up action handlers for media keys (play/pause from notification)
    navigator.mediaSession.setActionHandler("play", () => {
      console.log("Media Session: Play action received.");
      if (!audioMeta.isSpeaking) {
        // Resumes from the current sentence when still on the same page.
        selectRangeForReading();
      }
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      console.log("Media Session: Pause action received.");
      // Keep the background session alive so "play" stays available.
      stopReading();
      setPlayIcon();
      PDFViewerApplication.eventBus._off("pagechanging", readFlippedPage);
    });
  }
}

/**
 * Clears the Media Session metadata.
 */
function clearMediaSession() {
  if ("mediaSession" in navigator) {
    console.log("Clearing Media Session...");
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler("play", null);
    navigator.mediaSession.setActionHandler("pause", null);
  }
}

// Clean up when the user navigates away from the page
window.addEventListener("beforeunload", async () => {
  await disableBackgroundPlayback();
  if (window.speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
});

/**
 * Initializes the speech rate from localStorage.
 * This function should be called when your application or audio player loads.
 */
function initializeSpeechRate() {
  const savedRate = localStorage.getItem(SPEECH_RATE_STORAGE_KEY);
  if (savedRate) {
    // If a rate is found in storage, parse it and set it.
    audioMeta.rate = parseFloat(savedRate);
  } else {
    // Otherwise, use the default rate of 1.
    audioMeta.rate = 0.95;
  }
  console.log("Speech rate initialized to:", audioMeta.rate);
  // You might want to update a UI element to show the current rate here.
}

/**
 * Increases the speech rate by 0.1, with a maximum limit of 10.
 * It persists the new rate to localStorage.
 */
function speedIncrease() {
  // Set a maximum rate of 10.
  const maxRate = 10;
  // Use 0.1 as the increment step.
  const newRate = Math.min(
    maxRate,
    parseFloat((audioMeta.rate + 0.1).toFixed(2))
  );

  if (audioMeta.rate !== newRate) {
    audioMeta.rate = newRate;
    localStorage.setItem(SPEECH_RATE_STORAGE_KEY, audioMeta.rate);
    console.log("Speech rate increased to:", audioMeta.rate);
    restartCurrentSentence();
  }
}

/**
 * Re-reads the current sentence so a new speech rate takes effect right away.
 */
function restartCurrentSentence() {
  if (!audioMeta.isSpeaking || audioMeta.itemsToRead.length === 0) {
    return;
  }
  stopReading();
  audioMeta.isSpeaking = true;
  startNodeReading(audioMeta.itemsToRead, audioMeta.currentPara);
}

/**
 * Decreases the speech rate by 0.1, with a minimum limit of 0.1.
 * It persists the new rate to localStorage.
 */
function speedDecrease() {
  // Set a minimum rate of 0.1.
  const minRate = 0.1;
  // Use 0.1 as the decrement step.
  const newRate = Math.max(
    minRate,
    parseFloat((audioMeta.rate - 0.1).toFixed(2))
  );

  if (audioMeta.rate !== newRate) {
    audioMeta.rate = newRate;
    localStorage.setItem(SPEECH_RATE_STORAGE_KEY, audioMeta.rate);
    console.log("Speech rate decreased to:", audioMeta.rate);
    restartCurrentSentence();
  }
}

