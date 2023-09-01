/* Copyright 2015 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AbortException,
  createPromiseCapability,
  Util,
} from "../shared/util.js";

import {kruti2unicode,chanakya2unicode} from './krutidev2unicode.js';
/**
 * Text layer render parameters.
 *
 * @typedef {Object} TextLayerRenderParameters
 * @property {import("./api").TextContent} [textContent] - Text content to
 *   render (the object is returned by the page's `getTextContent` method).
 * @property {ReadableStream} [textContentStream] - Text content stream to
 *   render (the stream is returned by the page's `streamTextContent` method).
 * @property {HTMLElement} container - HTML element that will contain text runs.
 * @property {import("./display_utils").PageViewport} viewport - The target
 *   viewport to properly layout the text runs.
 * @property {Array<HTMLElement>} [textDivs] - HTML elements that are correspond
 *   to the text items of the textContent input. This is output and shall be
 *   initially be set to empty array.
 * @property {Array<string>} [textContentItemsStr] - Strings that correspond to
 *    the `str` property of the text items of textContent input. This is output
 *   and shall be initially be set to empty array.
 * @property {number} [timeout] - Delay in milliseconds before rendering of the
 *   text runs occurs.
 * @property {boolean} [enhanceTextSelection] - Whether to turn on the text
 *   selection enhancement.
 */

const MAX_TEXT_DIVS_TO_RENDER = 100000;
const DEFAULT_FONT_SIZE = 30;
const DEFAULT_FONT_ASCENT = 0.8;
const ascentCache = new Map();
const AllWhitespaceRegexp = /^\s+$/g;

var mapping = {
    "C": "ಅ",
    "D": "ಆ",
    "E": "ಇ",
    "F": "ಈ",
    "G": "ಉ",
    "H": "ಊ",
    "IÄ": "ಋ",
    "J": "ಎ",
    "K": "ಏ",
    "L": "ಐ",
    "M": "ಒ",
    "N": "ಓ",
    "O": "ಔ",
    "A": "ಂ",
    "B": "ಃ",
    "Pï": "ಕ್",
    "PÀ": "ಕ",
    "PÁ": "ಕಾ", 
    "Q": "ಕಿ",
    "PÉ": "ಕೆ",
    "PË": "ಕೌ",
    "Sï": "ಖ್",
    "R": "ಖ",
    "SÁ": "ಖಾ",
    "T": "ಖಿ",
    "SÉ": "ಖೆ",
    "SË": "ಖೌ",
    "Uï": "ಗ್",
    "UÀ": "ಗ",
    "UÁ": "ಗಾ",
    "V": "ಗಿ",
    "UÉ": "ಗೆ",
    "UË": "ಗೌ",
    "Wï": "ಘ್",
    "WÀ": "ಘ",
    "WÁ": "ಘಾ",
    "X": "ಘಿ",
    "WÉ": "ಘೆ",
    "WË": "ಘೌ",
    "k": "ಞ",
    "Zï": "ಚ್",
    "ZÀ": "ಚ",
    "ZÁ": "ಚಾ",
    "a": "ಚಿ",
    "ZÉ": "ಚೆ",
    "ZË": "ಚೌ",
    "bï": "ಛ್",
    "bÀ": "ಛ",
    "bÁ": "ಛಾ",
    "c": "ಛಿ",
    "bÉ": "ಛೆ",
    "bË": "ಛೌ",
    "eï": "ಜ್",
    "d": "ಜ",
    "eÁ": "ಜಾ",
    "f": "ಜಿ",
    "eÉ": "ಜೆ",
    "eË": "ಜೌ",
    "gÀhiï": "ಝ್",
    "gÀhÄ": "ಝ",
    "gÀhiÁ": "ಝಾ",
    "jhÄ": "ಝಿ",
    "gÉhÄ": "ಝೆ",
    "gÉhÆ": "ಝೊ",
    "gÀhiË": "ಝೌ",
    "Y" : "ಙ",
    "mï": "ಟ್",
    "l": "ಟ",
    "mÁ": "ಟಾ",
    "n": "ಟಿ",
    "mÉ": "ಟೆ",
    "mË": "ಟೌ",
    "oï": "ಠ್",
    "oÀ": "ಠ",
    "oÁ": "ಠಾ",
    "p": "ಠಿ",
    "oÉ": "ಠೆ",
    "oË": "ಠೌ",
    "qï": "ಡ್",
    "qÀ": "ಡ",
    "qÁ": "ಡಾ",
    "r": "ಡಿ",
    "qÉ": "ಡೆ",
    "qË": "ಡೌ",
    "qsï": "ಢ್",
    "qsÀ": "ಢ",
    "qsÁ": "ಢಾ",
    "rü": "ಢಿ",
    "qsÉ": "ಢೆ",
    "qsË": "ಢೌ",
    "uï": "ಣ್",
    "t": "ಣ",
    "uÁ": "ಣಾ",
    "tÂ": "ಣಿ",
    "uÉ": "ಣೆ",
    "uË": "ಣೌ",
    "vï": "ತ್",
    "vÀ": "ತ",
    "vÁ": "ತಾ",
    "w": "ತಿ",
    "vÉ": "ತೆ",
    "vË": "ತೌ",
    "xï": "ಥ್",
    "xÀ": "ಥ",
    "xÁ": "ಥಾ",
    "y": "ಥಿ",
    "xÉ": "ಥೆ",
    "xË": "ಥೌ",
    "zï": "ದ್",
    "zÀ": "ದ",
    "zÁ": "ದಾ",
    "¢": "ದಿ",
    "zÉ": "ದೆ",
    "zË": "ದೌ",
    "zsï": "ಧ್",
    "zsÀ": "ಧ",
    "zsÁ": "ಧಾ",
    "¢ü": "ಧಿ",
    "zsÉ": "ಧೆ",
    "zsË": "ಧೌ",
    "£ï": "ನ್",
    "£À": "ನ",
    "£Á": "ನಾ",
    "¤": "ನಿ",
    "£É": "ನೆ",
    "£Ë": "ನೌ",
    "¥ï": "ಪ್",
    "¥À": "ಪ",
    "¥Á": "ಪಾ",
    "¦": "ಪಿ",
    "¥É": "ಪೆ",
    "¥Ë": "ಪೌ",
    "¥sï": "ಫ್",
    "¥sÀ": "ಫ",
    "¥sÁ": "ಫಾ",
    "¦ü": "ಫಿ",
    "¥sÉ": "ಫೆ",
    "¥sË": "ಫೌ",
    "¨ï": "ಬ್",
    "§": "ಬ",
    "¨Á": "ಬಾ",
    "©": "ಬಿ",
    "¨É": "ಬೆ",
    "¨Ë": "ಬೌ",
    "¨sï": "ಭ್",
    "¨sÀ": "ಭ",
    "¨sÁ": "ಭಾ",
    "©ü": "ಭಿ",
    "¨sÉ": "ಭೆ",
    "¨sË": "ಭೌ",
    "ªÀiï": "ಮ್",
    "ªÀÄ": "ಮ",
    "ªÀiÁ": "ಮಾ",
    "«Ä": "ಮಿ",
    "ªÉÄ": "ಮೆ",
    "ªÀiË": "ಮೌ",
    "AiÀiï": "ಯ್",
    "AiÀÄ": "ಯ",
    "0iÀÄ": "ಯ",
    "AiÀiÁ": "ಯಾ",
    "0iÀiÁ": "ಯಾ",
    "¬Ä": "ಯಿ",
    "0iÀÄÄ": "ಯು",
    "AiÉÄ": "ಯೆ",
    "0iÉÆ": "ಯೊ",
    "AiÉÆ": "ಯೊ",
    "AiÀiË": "ಯೌ",
    "gï": "ರ್",
    "gÀ": "ರ",
    "gÁ": "ರಾ",
    "j": "ರಿ",
    "gÉ": "ರೆ",
    "gË": "ರೌ",
    "¯ï": "ಲ್",
    "®": "ಲ",
    "¯Á": "ಲಾ",
    "°": "ಲಿ",
    "¯É": "ಲೆ",
    "¯Ë": "ಲೌ",
    "ªï": "ವ್",
    "ªÀ": "ವ",
    "ªÁ": "ವಾ",
    "«": "ವಿ",
    "ªÀÅ":"ವು",
    "ªÀÇ":"ವೂ",
    "ªÉ":"ವೆ",
    "ªÉÃ":"ವೇ",
    "ªÉÊ":"ವೈ",
    "ªÉÆ": "ಮೊ",
    "ªÉÆÃ": "ಮೋ",
    "ªÉÇ":"ವೊ",
    "ªÉÇÃ":"ವೋ",
    "ªÉ  ": "ವೆ",
    "¥ÀÅ": "ಪು",
    "¥ÀÇ" : "ಪೂ",
    "¥sÀÅ" : "ಫು", 
    "¥sÀÇ" : "ಫೂ",
    "ªË": "ವೌ",
    "±ï": "ಶ್",
    "±À": "ಶ",
    "±Á": "ಶಾ",
    "²": "ಶಿ",
    "±É": "ಶೆ",
    "±Ë": "ಶೌ",
    "µï": "ಷ್",
    "µÀ": "ಷ",
    "μÀ": "ಷ",
    "µÁ": "ಷಾ",
    "¶": "ಷಿ",
    "µÉ": "ಷೆ",
    "µË": "ಷೌ",
    "¸ï": "ಸ್",
    "¸À": "ಸ",
    "¸Á": "ಸಾ",
    "¹": "ಸಿ",
    "¸É": "ಸೆ",
    "¸Ë": "ಸೌ",
    "ºï": "ಹ್",
    "ºÀ": "ಹ",
    "ºÁ": "ಹಾ",
    "»": "ಹಿ",
    "ºÉ": "ಹೆ",
    "ºË": "ಹೌ",
    "¼ï": "ಳ್",
    "¼À": "ಳ",
    "¼Á": "ಳಾ",
    "½": "ಳಿ",
    "¼É": "ಳೆ",
    "¼Ë": "ಳೌ"
};


// These when joined will be broken as per unicode 
var broken_cases = {
    "Ã":{
        "value": "ೀ",
        "mapping": {
            "ಿ": "ೀ",
            "ೆ": "ೇ",
            "ೊ": "ೋ"
            }
        }, 
    "Ä":{
        "value": "ು",
        "mapping": {
            
            }
        }, 
    "Æ":{
        "value": "ೂ",
        "mapping": {
            "ೆ":"ೊ"
            }
        }, 
    "È":{
        "value": "ೃ",
        "mapping": {
            
            }
        }, 
    "Ê":{
        "value": "ೈ",
        "mapping": {
            "ೆ":"ೈ"
            }
        }  
    };

var dependent_vowels = ["್", "ಾ", "ಿ", "ೀ", "ು", "ೂ", "ೃ", "ೆ", "ೇ", "ೈ", "ೊ", "ೋ", "ೌ"];
var ignore_list = {"ö": "", "÷": ""};

var vattaksharagalu = {
    "Ì": "ಕ",
    "Í": "ಖ",
    "Î": "ಗ",
    "Ï": "ಘ",
    "Õ": "ಞ",
    "Ñ": "ಚ",
    "Ò": "ಛ",
    "Ó": "ಜ",
    "Ô": "ಝ",
    "Ö": "ಟ",
    "×": "ಠ",
    "Ø": "ಡ",
    "Ù": "ಢ",
    "Ú": "ಣ",
    "Û": "ತ",
    "Ü": "ಥ",
    "Ý": "ದ",
    "Þ": "ಧ",
    "ß": "ನ",
    "à": "ಪ",
    "á": "ಫ",
    "â": "ಬ",
    "ã": "ಭ",
    "ä": "ಮ",
    "å": "ಯ",
    "æ": "ರ",
    "è": "ಲ",
    "é": "ವ",
    "ê": "ಶ",
    "ë": "ಷ",
    "ì": "ಸ",
    "í": "ಹ",
    "î": "ಳ",
    "ç": "ರ"
};

var ascii_arkavattu = {
    "ð": "ರ"
};

if ( !Array.prototype.forEach ) {

    Array.prototype.forEach = function( callback, thisArg ) {

        var T, k;

        if ( this == null ) {
            throw new TypeError( " this is null or not defined" );
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0; // Hack to convert O.length to a UInt32

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if ( {}.toString.call(callback) != "[object Function]" ) {
            throw new TypeError( callback + " is not a function" );
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if ( thisArg ) {
            T = thisArg;
        }

        // 6. Let k be 0
        k = 0;

        // 7. Repeat, while k < len
        while( k < len ) {

            var kValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if ( k in O ) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[ k ];

                // ii. Call the Call internal method of callback with T as the this value and
                // argument list containing kValue, k, and O.
                callback.call( T, kValue, k, O );
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined
    };
}




function process_vattakshara(letters, t){
    // Current char is t, which is ASCII code of vattakshara
    // Rearrangement of string needed, If prev char is dependent vowel
    // then it has to be moved after vattakshara
    // If no dependent vowel then it is "ಅ" kaara, Ex: ಕ, ಗ
    // Vattakshara shares same code as of base letter, but halant is added before
    // Ex: ತಿಮ್ಮಿ in ASCII: ತಿ + ಮಿ + ma_vattu
    // in Unicode: ತ + dependent vowel ಇ + ಮ + halant + ಮ + dependent vowel ಇ 

    // Default values
    var last_letter = "";
    var second_last = "";
    var op = "";

    // If atleast one letter in letters, to find the last letter value
    if (letters.length > 0){
        last_letter = letters[letters.length-1];
    }

    // If atleast two letters in letters, to find the second last letter value
    if (letters.length > 1){
        second_last = letters[letters.length-2];
    }

    if (dependent_vowels[last_letter]){
        // If last letter/prev letter to vattakshara is dependent vowel
        // add dependent vowel at the end, after halant + base letter(=vattakshara)
        letters[letters.length-1] = "್";
        letters.push(vattaksharagalu[t]);
        letters.push(last_letter);
    }
    else{
        // If "ಅ" kaara, just append halant + base letter
        // No worry about rearranging
        letters.push("್");
        letters.push(vattaksharagalu[t]);
    }

    // Return converted
    return letters;
}

function process_arkavattu(letters, t){
    // Example: ವರ್ಷ in ASCII ವ + ಷ + arkavattu
    // in Unicode ವ + ರ + halant + ಷ 
    var last_letter = "";
    var second_last = "";

    // If atleast one letter in letters, to find the last letter value    
    if(letters.length > 0){
        last_letter = letters[letters.length-1];
    }

    // If atleast two letters in letters, to find the second last letter value        
    if(letters.length > 1){
        second_last = letters[letters.length-2];
    }

    // Rearrangement according to above example
    if (dependent_vowels[last_letter]){    
        letters[letters.length-2] = ascii_arkavattu[t];
        letters[letters.length-1] = "್";
        letters.push(second_last);
        letters.push(last_letter);
    }
    else{
        letters[letters.length-1] = ascii_arkavattu[t];
        letters.push("್");
        letters.push(last_letter);
    }
    // Return converted
    return letters;
}

function process_broken_cases(letters, t){
    // Since ASCII mapping are based on shapes some of the shapes
    // give trouble with direct conversion
    // Ex: ಕೀರ್ತಿ and ಕೇಳಿ In ASCII: deerga has same code in both but in
    // Unicode both are different, So if prev char is "ಇ" kaara then
    // behave differently and also with "ಎ" kaara
    // Look at the prev char and also current char t and decide on the single unicode
    // dependent vowel and substitute.
    // Note prev char + current char = new char (Except ಉ kaara, ಕು = ಕ + ಉ kaara)
    // since prev char is not dependent vowel


    // Defaults
    var last_letter = "";
    var second_last = "";

    // If atleast one letter in letters, to find the last letter value    
    if(letters.length > 0){
        last_letter = letters[letters.length-1];
    }
        

    // Get dependent vowel mapping with respect to input "t"
    var broken_case_mapping = broken_cases[t]["mapping"];


    if(broken_case_mapping[last_letter]){
        // If mapping exists
        letters[letters.length-1] = broken_case_mapping[last_letter];
    }
    else{
        // For ಉ kaara, no mapping, substitute the value
        letters.push(broken_cases[t]["value"]);
    }
    // Return the converted
    return letters;
}   

function find_mapping(op, txt, current_pos){
    // Finds mapping in reverse order, For Example if input string
    // is abcde then itteration will be for abcde, abcd, abc, ab, a
    // Only when mapping available the index jumps, say if mapping availabale for ab
    // then subtract length of ab while processing next
    
    // Combination length, if length remaining is less than max len then
    // Consider length remaining as max length
    // remaining length = len(txt) - current_pos
    var max_len = 4;
    var remaining = txt.length-current_pos;
    if (remaining < 5){
        max_len = (remaining - 1);
    }

    // Number of letters found mapping, will be returned to caller and
    // used to jump the index (Zero if one char found mapping)
    var n = 0;

    // Loop 4 to 0 or max to 0
    // Controller which checks direct mapping,
    // arkavattu, vattaksharagalu and broken cases
    for(var i = max_len; i >= 0; i--) {
        var substr_till = current_pos + i + 1;
        var t = txt.substring(current_pos, substr_till);
       
        if(mapping[t]){
            // If prev char is halant and current char is not vattakshara?
            // then it must be seperated using ZWJ, so that it will not
            // mix with prev char. 
            if (op[op.length -1] && op[op.length -1 ].match(/್$/)){
                var zwj =  "‍";
                op.push(zwj); 
            }
            // Direct mapping case
            op.push(mapping[t]);

            // Update Jump by number
            n = i;
            
            // Break and return to caller since we found the mapping
            // for given input
            break;
        }
        else{
            // Try without processing till reaches to last char 
            if (i > 0){
                continue;
            }
            var letters = op.join('').split('');
            // If Last in this batch
            if(ascii_arkavattu[t]){
                // Arkavattu
                op = process_arkavattu(letters, t);
            }
            else if(vattaksharagalu[t]){
                // Vattakshara
                op = process_vattakshara(letters, t);
            }
            else if(broken_cases[t]){
                // Broken cases
                op = process_broken_cases(letters, t);
            }
            else{
                // No match
                op.push(t);
            }
        }
    }    
    return [n, op];
}

function process_word(word){
    // Main program to process the word letter by letter
    
    // Initiate and output Array
    var i = 0;
    var max_len = word.length;
    var op = [];

    while (i < max_len){
        // For each letter in word, jump if data[0] is more than zero

        // If additional chars used in ASCII to improve readability,
        // which doesn't have any significant in Unicode
        if (word[i] in ignore_list){
            i += 1;
            continue;
        }
        // Find the mapping data
        var data = find_mapping(op, word, i);

        // Add to final list
        op = data[1];

        // Jump if data[0]>0 which means found a match for more than
        // one letter combination
        i += (1 + data[0]);
    }

    // Return processed
    return op.join('');
}    

function kn_ascii2unicode(text){
    text = text.replace(/̧/g,"¸");
    text = text.replace(/̈/g,"¨");
    text = text.replace(/̄/g,"¯");      
    text = text.replace(/μ/g,"µ");  
    var words = text.split(' ');

    // To stote converted words
    var op_words = [];

    // Process and append to main array
    words.forEach(function(word, k, arr){
                      op_words.push(process_word(word));                      
                  });

    // Return converted line
    return op_words.join(' ');
}


function converter_init(){
    // Convert array to dict
    var dependent_vowels_temp = dependent_vowels;
    for(var i in dependent_vowels_temp){
        dependent_vowels[dependent_vowels_temp[i]] = dependent_vowels_temp[i];
    }

}

function convert_to_english_numbers(text_input){
    return text_input
        .replace(/೦/g, 0)
        .replace(/೧/g, 1)
        .replace(/೨/g, 2)
        .replace(/೩/g, 3)
        .replace(/೪/g, 4)
        .replace(/೫/g, 5)
        .replace(/೬/g, 6)
        .replace(/೭/g, 7)
        .replace(/೮/g, 8)
        .replace(/೯/g, 9);
}

converter_init();

var kruti_array = new Array("ñ","Q+Z","sas","aa",")Z","ZZ","‘","’","“","”","å",  "ƒ",  "„",   "…",   "†",   "‡",   "ˆ",   "‰",   "Š",   "‹", "¶+",   "d+", "[+k","[+", "x+",  "T+",  "t+", "M+", "<+", "Q+", ";+", "j+", "u+","Ùk", "Ù", "ä", "–", "—","é","™","=kk","f=k",  "à",   "á",    "â",   "ã",   "ºz",  "º",   "í", "{k", "{", "=",  "«", "Nî",   "Vî",    "Bî",   "Mî",   "<î", "|", "K", "}","J",   "Vª",   "Mª",  "<ªª",  "Nª",   "Ø",  "Ý", "nzZ",  "æ", "ç", "Á", "xz", "#", ":", "v‚","vks",  "vkS",  "vk",    "v",  "b±", "Ã",  "bZ",  "b",  "m",  "Å",  ",s",  ",",   "_","ô",  "d", "Dk", "D", "[k", "[", "x","Xk", "X", "Ä", "?k", "?",   "³", "pkS",  "p", "Pk", "P",  "N",  "t", "Tk", "T",  ">", "÷", "¥","ê",  "ë",   "V",  "B",   "ì",   "ï", "M+", "<+", "M",  "<", ".k", ".", "r",  "Rk", "R",   "Fk", "F",  ")", "n", "/k", "èk",  "/", "Ë", "è", "u", "Uk", "U",   "i",  "Ik", "I",   "Q",    "¶",  "c", "Ck",  "C",  "Hk",  "H", "e", "Ek",  "E", ";",  "¸",   "j",    "y", "Yk",  "Y",  "G",  "o", "Ok", "O", "'k", "'",   "\"k",  "\"",  "l", "Lk",  "L",   "g",  "È", "z", "Ì", "Í", "Î",  "Ï",  "Ñ",  "Ò",  "Ó",  "Ô",   "Ö",  "Ø",  "Ù","Ük", "Ü","‚",    "ks",   "kS",   "k",  "h",    "q",   "w",   "`",    "s",    "S", "a",    "¡",    "%",     "W",  "•", "·", "∙", "·", "~j",  "~", "\\","+"," ः","^", "*",  "Þ", "ß", "(", "¼", "½", "¿", "À", "¾", "A", "-", "&", "&", "Œ", "]","~ ","@");

var unicode_array = new Array("॰","QZ+","sa","a","र्द्ध","Z","\"","\"","'","'", "०",  "१",  "२",  "३",     "४",   "५",  "६",   "७",   "८",   "९",  "फ़्",  "क़",  "ख़", "ख़्",  "ग़", "ज़्", "ज़",  "ड़",  "ढ़",   "फ़",  "य़",  "ऱ",  "ऩ",  "त्त", "त्त्", "क्त",  "दृ",  "कृ","न्न","न्न्","=k","f=", "ह्न",  "ह्य",  "हृ",  "ह्म",  "ह्र",  "ह्",   "द्द",  "क्ष", "क्ष्", "त्र", "त्र्",  "छ्य",  "ट्य",  "ठ्य",  "ड्य",  "ढ्य", "द्य", "ज्ञ", "द्व", "श्र",  "ट्र",    "ड्र",    "ढ्र",    "छ्र",   "क्र",  "फ्र", "र्द्र",  "द्र",   "प्र", "प्र",  "ग्र", "रु",  "रू", "ऑ",   "ओ",  "औ",  "आ",   "अ", "ईं", "ई",  "ई",   "इ",  "उ",   "ऊ",  "ऐ",  "ए", "ऋ", "क्क", "क", "क", "क्", "ख", "ख्", "ग", "ग", "ग्", "घ", "घ", "घ्", "ङ", "चै",  "च", "च", "च्", "छ", "ज", "ज", "ज्",  "झ",  "झ्", "ञ", "ट्ट",   "ट्ठ",   "ट",   "ठ",   "ड्ड",   "ड्ढ",  "ड़", "ढ़", "ड",   "ढ", "ण", "ण्", "त", "त", "त्", "थ", "थ्",  "द्ध",  "द", "ध", "ध", "ध्", "ध्", "ध्", "न", "न", "न्",    "प", "प", "प्",  "फ", "फ्",  "ब", "ब", "ब्",  "भ", "भ्",  "म",  "म", "म्", "य", "य्",  "र", "ल", "ल", "ल्",  "ळ",  "व", "व", "व्", "श", "श्",  "ष", "ष्", "स", "स", "स्", "ह", "ीं", "्र", "द्द", "ट्ट","ट्ठ","ड्ड","कृ","भ","्य","ड्ढ","झ्","क्र","त्त्","श","श्","ॉ",  "ो",   "ौ",   "ा",   "ी",   "ु",   "ू",   "ृ",   "े",   "ै", "ं",   "ँ",   "ः",   "ॅ",  "ऽ", "ऽ", "ऽ", "ऽ", "्र",  "्", "?", "़",":", "‘",   "’",   "“",   "”",  ";",  "(",    ")",   "{",    "}",   "=", "।", ".", "-",  "µ", "॰", ",","् ","/");

function krutiunicode(str) {

    var text_size = str.length;
    var kruti_array_length = kruti_array.length;
    var kruti_text = str;

    var processed_text = '';

    var n = 0;
    var o = 0;
    var r = 1;

    var max_text_size = 7000;

    while (r == 1) {
        n = o;

        if (o < (text_size - max_text_size)) {
            o += max_text_size;
            while (str.charAt(o) != ' ') {
                o--;
            }
        } else {
            o = text_size;
            r = 0
        }

        var kruti_text = str.substring(n, o);

        replsym();

        processed_text += kruti_text;

        return  processed_text;
    }

    function replsym()
    {

        if (kruti_text != "")
            for (let input_symbol_idx = 0; input_symbol_idx < kruti_array_length; input_symbol_idx++)
            {

                let idx = 0;

                while (idx != -1) {

                    kruti_text = kruti_text.replace(kruti_array[input_symbol_idx], unicode_array[input_symbol_idx])
                    idx = kruti_text.indexOf(kruti_array[input_symbol_idx])

                }
            }
        kruti_text = kruti_text.replace(/±/g, "Zं");

        kruti_text = kruti_text.replace(/Æ/g, "र्f");

        var pi = kruti_text.indexOf("f")

        while (pi != -1) {
            var cni = kruti_text.charAt(pi + 1)
            var ctbr = "f" + cni
            kruti_text = kruti_text.replace(ctbr, cni + "ि")
            pi = kruti_text.search(/f/, pi + 1)

        }

        kruti_text = kruti_text.replace(/Ç/g, "fa");
        kruti_text = kruti_text.replace(/É/g, "र्fa");

        var pi = kruti_text.indexOf("fa")

        while (pi != -1) {
            var cntip2 = kruti_text.charAt(pi + 2)
            var ctbr = "fa" + cntip2
            kruti_text = kruti_text.replace(ctbr, cntip2 + "िं")
            pi = kruti_text.search(/fa/, pi + 2)

        }

        kruti_text = kruti_text.replace(/Ê/g, "ीZ");

        var powe = kruti_text.indexOf("ि्")

        while (powe != -1)
        {
            var cntwe = kruti_text.charAt(powe + 2)
            var ctbr = "ि्" + cntwe
            kruti_text = kruti_text.replace(ctbr, "्" + cntwe + "ि")
            powe = kruti_text.search(/ि्/, powe + 2)

        }
        var matraslist = "अ आ इ ई उ ऊ ए ऐ ओ औ ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ"
	    var rpos = kruti_text.indexOf("Z")

        while (rpos > 0) {
            var pphr = rpos - 1;
            var chtr = kruti_text.charAt(pphr)

            while (matraslist.match(chtr) != null)
            {
                pphr = pphr - 1;
                if (pphr < 0) return ;
                chtr = kruti_text.charAt(pphr);

            }

            ctbr = kruti_text.substr(pphr, (rpos - pphr));
            let  rstr = "र्" + ctbr;
            ctbr = ctbr + "Z";
            kruti_text = kruti_text.replace(ctbr, rstr);
            rpos = kruti_text.indexOf("Z");

        }

    }

}

function getAscent(fontFamily, ctx) {
  const cachedAscent = ascentCache.get(fontFamily);
  if (cachedAscent) {
    return cachedAscent;
  }

  ctx.save();
  ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
  const metrics = ctx.measureText("");

  // Both properties aren't available by default in Firefox.
  let ascent = metrics.fontBoundingBoxAscent;
  let descent = Math.abs(metrics.fontBoundingBoxDescent);
  if (ascent) {
    ctx.restore();
    const ratio = ascent / (ascent + descent);
    ascentCache.set(fontFamily, ratio);
    return ratio;
  }

  // Try basic heuristic to guess ascent/descent.
  // Draw a g with baseline at 0,0 and then get the line
  // number where a pixel has non-null red component (starting
  // from bottom).
  ctx.strokeStyle = "red";
  ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
  ctx.strokeText("g", 0, 0);
  let pixels = ctx.getImageData(
    0,
    0,
    DEFAULT_FONT_SIZE,
    DEFAULT_FONT_SIZE
  ).data;
  descent = 0;
  for (let i = pixels.length - 1 - 3; i >= 0; i -= 4) {
    if (pixels[i] > 0) {
      descent = Math.ceil(i / 4 / DEFAULT_FONT_SIZE);
      break;
    }
  }

  // Draw an A with baseline at 0,DEFAULT_FONT_SIZE and then get the line
  // number where a pixel has non-null red component (starting
  // from top).
  ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
  ctx.strokeText("A", 0, DEFAULT_FONT_SIZE);
  pixels = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data;
  ascent = 0;
  for (let i = 0, ii = pixels.length; i < ii; i += 4) {
    if (pixels[i] > 0) {
      ascent = DEFAULT_FONT_SIZE - Math.floor(i / 4 / DEFAULT_FONT_SIZE);
      break;
    }
  }

  ctx.restore();

  if (ascent) {
    const ratio = ascent / (ascent + descent);
    ascentCache.set(fontFamily, ratio);
    return ratio;
  }

  ascentCache.set(fontFamily, DEFAULT_FONT_ASCENT);
  return DEFAULT_FONT_ASCENT;
}

function appendText(task, geom, styles, ctx) {
  // Initialize all used properties to keep the caches monomorphic.
  const textDiv = document.createElement("span");
  const textDivProperties = task._enhanceTextSelection
    ? {
        angle: 0,
        canvasWidth: 0,
        hasText: geom.str !== "",
        hasEOL: geom.hasEOL,
        originalTransform: null,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
        scale: 1,
      }
    : {
        angle: 0,
        canvasWidth: 0,
        hasText: geom.str !== "",
        hasEOL: geom.hasEOL,
      };

  task._textDivs.push(textDiv);

  const tx = Util.transform(task._viewport.transform, geom.transform);
  let angle = Math.atan2(tx[1], tx[0]);
  const style = styles[geom.fontName];
  if (style.vertical) {
    angle += Math.PI / 2;
  }
  const fontHeight = Math.hypot(tx[2], tx[3]);
  const fontAscent = fontHeight * getAscent(style.fontFamily, ctx);

  let left, top;
  if (angle === 0) {
    left = tx[4];
    top = tx[5] - fontAscent;
  } else {
    left = tx[4] + fontAscent * Math.sin(angle);
    top = tx[5] - fontAscent * Math.cos(angle);
  }
  // Setting the style properties individually, rather than all at once,
  // should be OK since the `textDiv` isn't appended to the document yet.
  textDiv.style.left = `${left}px`;
  textDiv.style.top = `${top}px`;
  textDiv.style.fontSize = `${fontHeight}px`;
  textDiv.style.fontFamily = style.fontFamily;

  // Keeps screen readers from pausing on every new text span.
  textDiv.setAttribute("role", "presentation");
  
  //convert the encodings, take hint from the truefont
  if(geom.trueFont && (geom.trueFont.includes("Kruti"))) {
    textDiv.textContent = kruti2unicode(geom.str);
  }
  else if(geom.trueFont && ( geom.trueFont.includes("Chanakya"))) {
    textDiv.textContent = chanakya2unicode(geom.str);
  }	
  else if (geom.trueFont && (geom.trueFont.includes("+TT")|| geom.trueFont.includes("Nudi"))){
    textDiv.textContent = kn_ascii2unicode(geom.str);
  }
  else {
    textDiv.textContent = geom.str;
  }
  
  // geom.dir may be 'ttb' for vertical texts.
  textDiv.dir = geom.dir;

  // `fontName` is only used by the FontInspector, and we only use `dataset`
  // here to make the font name available in the debugger.
  if (task._fontInspectorEnabled) {
    textDiv.dataset.fontName = geom.fontName;
  }
  if (angle !== 0) {
    textDivProperties.angle = angle * (180 / Math.PI);
  }
  // We don't bother scaling single-char text divs, because it has very
  // little effect on text highlighting. This makes scrolling on docs with
  // lots of such divs a lot faster.
  let shouldScaleText = false;
  if (
    geom.str.length > 1 ||
    (task._enhanceTextSelection && AllWhitespaceRegexp.test(geom.str))
  ) {
    shouldScaleText = true;
  } else if (geom.str !== " " && geom.transform[0] !== geom.transform[3]) {
    const absScaleX = Math.abs(geom.transform[0]),
      absScaleY = Math.abs(geom.transform[3]);
    // When the horizontal/vertical scaling differs significantly, also scale
    // even single-char text to improve highlighting (fixes issue11713.pdf).
    if (
      absScaleX !== absScaleY &&
      Math.max(absScaleX, absScaleY) / Math.min(absScaleX, absScaleY) > 1.5
    ) {
      shouldScaleText = true;
    }
  }
  if (shouldScaleText) {
    if (style.vertical) {
      textDivProperties.canvasWidth = geom.height * task._viewport.scale;
    } else {
      textDivProperties.canvasWidth = geom.width * task._viewport.scale;
    }
  }
  task._textDivProperties.set(textDiv, textDivProperties);
  if (task._textContentStream) {
    task._layoutText(textDiv);
  }

  if (task._enhanceTextSelection && textDivProperties.hasText) {
    let angleCos = 1,
      angleSin = 0;
    if (angle !== 0) {
      angleCos = Math.cos(angle);
      angleSin = Math.sin(angle);
    }
    const divWidth =
      (style.vertical ? geom.height : geom.width) * task._viewport.scale;
    const divHeight = fontHeight;

    let m, b;
    if (angle !== 0) {
      m = [angleCos, angleSin, -angleSin, angleCos, left, top];
      b = Util.getAxialAlignedBoundingBox([0, 0, divWidth, divHeight], m);
    } else {
      b = [left, top, left + divWidth, top + divHeight];
    }

    task._bounds.push({
      left: b[0],
      top: b[1],
      right: b[2],
      bottom: b[3],
      div: textDiv,
      size: [divWidth, divHeight],
      m,
    });
  }
}

function render(task) {
  if (task._canceled) {
    return;
  }
  const textDivs = task._textDivs;
  const capability = task._capability;
  const textDivsLength = textDivs.length;

  // No point in rendering many divs as it would make the browser
  // unusable even after the divs are rendered.
  if (textDivsLength > MAX_TEXT_DIVS_TO_RENDER) {
    task._renderingDone = true;
    capability.resolve();
    return;
  }

  if (!task._textContentStream) {
    for (let i = 0; i < textDivsLength; i++) {
      task._layoutText(textDivs[i]);
    }
  }

  task._renderingDone = true;
  capability.resolve();
}

function findPositiveMin(ts, offset, count) {
  let result = 0;
  for (let i = 0; i < count; i++) {
    const t = ts[offset++];
    if (t > 0) {
      result = result ? Math.min(t, result) : t;
    }
  }
  return result;
}

function expand(task) {
  const bounds = task._bounds;
  const viewport = task._viewport;

  const expanded = expandBounds(viewport.width, viewport.height, bounds);
  for (let i = 0; i < expanded.length; i++) {
    const div = bounds[i].div;
    const divProperties = task._textDivProperties.get(div);
    if (divProperties.angle === 0) {
      divProperties.paddingLeft = bounds[i].left - expanded[i].left;
      divProperties.paddingTop = bounds[i].top - expanded[i].top;
      divProperties.paddingRight = expanded[i].right - bounds[i].right;
      divProperties.paddingBottom = expanded[i].bottom - bounds[i].bottom;
      task._textDivProperties.set(div, divProperties);
      continue;
    }
    // Box is rotated -- trying to find padding so rotated div will not
    // exceed its expanded bounds.
    const e = expanded[i],
      b = bounds[i];
    const m = b.m,
      c = m[0],
      s = m[1];
    // Finding intersections with expanded box.
    const points = [[0, 0], [0, b.size[1]], [b.size[0], 0], b.size];
    const ts = new Float64Array(64);
    for (let j = 0, jj = points.length; j < jj; j++) {
      const t = Util.applyTransform(points[j], m);
      ts[j + 0] = c && (e.left - t[0]) / c;
      ts[j + 4] = s && (e.top - t[1]) / s;
      ts[j + 8] = c && (e.right - t[0]) / c;
      ts[j + 12] = s && (e.bottom - t[1]) / s;

      ts[j + 16] = s && (e.left - t[0]) / -s;
      ts[j + 20] = c && (e.top - t[1]) / c;
      ts[j + 24] = s && (e.right - t[0]) / -s;
      ts[j + 28] = c && (e.bottom - t[1]) / c;

      ts[j + 32] = c && (e.left - t[0]) / -c;
      ts[j + 36] = s && (e.top - t[1]) / -s;
      ts[j + 40] = c && (e.right - t[0]) / -c;
      ts[j + 44] = s && (e.bottom - t[1]) / -s;

      ts[j + 48] = s && (e.left - t[0]) / s;
      ts[j + 52] = c && (e.top - t[1]) / -c;
      ts[j + 56] = s && (e.right - t[0]) / s;
      ts[j + 60] = c && (e.bottom - t[1]) / -c;
    }
    // Not based on math, but to simplify calculations, using cos and sin
    // absolute values to not exceed the box (it can but insignificantly).
    const boxScale = 1 + Math.min(Math.abs(c), Math.abs(s));
    divProperties.paddingLeft = findPositiveMin(ts, 32, 16) / boxScale;
    divProperties.paddingTop = findPositiveMin(ts, 48, 16) / boxScale;
    divProperties.paddingRight = findPositiveMin(ts, 0, 16) / boxScale;
    divProperties.paddingBottom = findPositiveMin(ts, 16, 16) / boxScale;
    task._textDivProperties.set(div, divProperties);
  }
}

function expandBounds(width, height, boxes) {
  const bounds = boxes.map(function (box, i) {
    return {
      x1: box.left,
      y1: box.top,
      x2: box.right,
      y2: box.bottom,
      index: i,
      x1New: undefined,
      x2New: undefined,
    };
  });
  expandBoundsLTR(width, bounds);

  const expanded = new Array(boxes.length);
  for (const b of bounds) {
    const i = b.index;
    expanded[i] = {
      left: b.x1New,
      top: 0,
      right: b.x2New,
      bottom: 0,
    };
  }

  // Rotating on 90 degrees and extending extended boxes. Reusing the bounds
  // array and objects.
  boxes.map(function (box, i) {
    const e = expanded[i],
      b = bounds[i];
    b.x1 = box.top;
    b.y1 = width - e.right;
    b.x2 = box.bottom;
    b.y2 = width - e.left;
    b.index = i;
    b.x1New = undefined;
    b.x2New = undefined;
  });
  expandBoundsLTR(height, bounds);

  for (const b of bounds) {
    const i = b.index;
    expanded[i].top = b.x1New;
    expanded[i].bottom = b.x2New;
  }
  return expanded;
}

function expandBoundsLTR(width, bounds) {
  // Sorting by x1 coordinate and walk by the bounds in the same order.
  bounds.sort(function (a, b) {
    return a.x1 - b.x1 || a.index - b.index;
  });

  // First we see on the horizon is a fake boundary.
  const fakeBoundary = {
    x1: -Infinity,
    y1: -Infinity,
    x2: 0,
    y2: Infinity,
    index: -1,
    x1New: 0,
    x2New: 0,
  };
  const horizon = [
    {
      start: -Infinity,
      end: Infinity,
      boundary: fakeBoundary,
    },
  ];

  for (const boundary of bounds) {
    // Searching for the affected part of horizon.
    // TODO red-black tree or simple binary search
    let i = 0;
    while (i < horizon.length && horizon[i].end <= boundary.y1) {
      i++;
    }
    let j = horizon.length - 1;
    while (j >= 0 && horizon[j].start >= boundary.y2) {
      j--;
    }

    let horizonPart, affectedBoundary;
    let q,
      k,
      maxXNew = -Infinity;
    for (q = i; q <= j; q++) {
      horizonPart = horizon[q];
      affectedBoundary = horizonPart.boundary;
      let xNew;
      if (affectedBoundary.x2 > boundary.x1) {
        // In the middle of the previous element, new x shall be at the
        // boundary start. Extending if further if the affected boundary
        // placed on top of the current one.
        xNew =
          affectedBoundary.index > boundary.index
            ? affectedBoundary.x1New
            : boundary.x1;
      } else if (affectedBoundary.x2New === undefined) {
        // We have some space in between, new x in middle will be a fair
        // choice.
        xNew = (affectedBoundary.x2 + boundary.x1) / 2;
      } else {
        // Affected boundary has x2new set, using it as new x.
        xNew = affectedBoundary.x2New;
      }
      if (xNew > maxXNew) {
        maxXNew = xNew;
      }
    }

    // Set new x1 for current boundary.
    boundary.x1New = maxXNew;

    // Adjusts new x2 for the affected boundaries.
    for (q = i; q <= j; q++) {
      horizonPart = horizon[q];
      affectedBoundary = horizonPart.boundary;
      if (affectedBoundary.x2New === undefined) {
        // Was not set yet, choosing new x if possible.
        if (affectedBoundary.x2 > boundary.x1) {
          // Current and affected boundaries intersect. If affected boundary
          // is placed on top of the current, shrinking the affected.
          if (affectedBoundary.index > boundary.index) {
            affectedBoundary.x2New = affectedBoundary.x2;
          }
        } else {
          affectedBoundary.x2New = maxXNew;
        }
      } else if (affectedBoundary.x2New > maxXNew) {
        // Affected boundary is touching new x, pushing it back.
        affectedBoundary.x2New = Math.max(maxXNew, affectedBoundary.x2);
      }
    }

    // Fixing the horizon.
    const changedHorizon = [];
    let lastBoundary = null;
    for (q = i; q <= j; q++) {
      horizonPart = horizon[q];
      affectedBoundary = horizonPart.boundary;
      // Checking which boundary will be visible.
      const useBoundary =
        affectedBoundary.x2 > boundary.x2 ? affectedBoundary : boundary;
      if (lastBoundary === useBoundary) {
        // Merging with previous.
        changedHorizon[changedHorizon.length - 1].end = horizonPart.end;
      } else {
        changedHorizon.push({
          start: horizonPart.start,
          end: horizonPart.end,
          boundary: useBoundary,
        });
        lastBoundary = useBoundary;
      }
    }
    if (horizon[i].start < boundary.y1) {
      changedHorizon[0].start = boundary.y1;
      changedHorizon.unshift({
        start: horizon[i].start,
        end: boundary.y1,
        boundary: horizon[i].boundary,
      });
    }
    if (boundary.y2 < horizon[j].end) {
      changedHorizon[changedHorizon.length - 1].end = boundary.y2;
      changedHorizon.push({
        start: boundary.y2,
        end: horizon[j].end,
        boundary: horizon[j].boundary,
      });
    }

    // Set x2 new of boundary that is no longer visible (see overlapping case
    // above).
    // TODO more efficient, e.g. via reference counting.
    for (q = i; q <= j; q++) {
      horizonPart = horizon[q];
      affectedBoundary = horizonPart.boundary;
      if (affectedBoundary.x2New !== undefined) {
        continue;
      }
      let used = false;
      for (
        k = i - 1;
        !used && k >= 0 && horizon[k].start >= affectedBoundary.y1;
        k--
      ) {
        used = horizon[k].boundary === affectedBoundary;
      }
      for (
        k = j + 1;
        !used && k < horizon.length && horizon[k].end <= affectedBoundary.y2;
        k++
      ) {
        used = horizon[k].boundary === affectedBoundary;
      }
      for (k = 0; !used && k < changedHorizon.length; k++) {
        used = changedHorizon[k].boundary === affectedBoundary;
      }
      if (!used) {
        affectedBoundary.x2New = maxXNew;
      }
    }

    Array.prototype.splice.apply(
      horizon,
      [i, j - i + 1].concat(changedHorizon)
    );
  }

  // Set new x2 for all unset boundaries.
  for (const horizonPart of horizon) {
    const affectedBoundary = horizonPart.boundary;
    if (affectedBoundary.x2New === undefined) {
      affectedBoundary.x2New = Math.max(width, affectedBoundary.x2);
    }
  }
}

class TextLayerRenderTask {
  constructor({
    textContent,
    textContentStream,
    container,
    viewport,
    textDivs,
    textContentItemsStr,
    enhanceTextSelection,
  }) {
    this._textContent = textContent;
    this._textContentStream = textContentStream;
    this._container = container;
    this._document = container.ownerDocument;
    this._viewport = viewport;
    this._textDivs = textDivs || [];
    this._textContentItemsStr = textContentItemsStr || [];
    this._enhanceTextSelection = !!enhanceTextSelection;
    this._fontInspectorEnabled = !!globalThis.FontInspector?.enabled;

    this._reader = null;
    this._layoutTextLastFontSize = null;
    this._layoutTextLastFontFamily = null;
    this._layoutTextCtx = null;
    this._textDivProperties = new WeakMap();
    this._renderingDone = false;
    this._canceled = false;
    this._capability = createPromiseCapability();
    this._renderTimer = null;
    this._bounds = [];

    // Always clean-up the temporary canvas once rendering is no longer pending.
    this._capability.promise
      .finally(() => {
        if (!this._enhanceTextSelection) {
          // The `textDiv` properties are no longer needed.
          this._textDivProperties = null;
        }

        if (this._layoutTextCtx) {
          // Zeroing the width and height cause Firefox to release graphics
          // resources immediately, which can greatly reduce memory consumption.
          this._layoutTextCtx.canvas.width = 0;
          this._layoutTextCtx.canvas.height = 0;
          this._layoutTextCtx = null;
        }
      })
      .catch(() => {
        // Avoid "Uncaught promise" messages in the console.
      });
  }

  /**
   * Promise for textLayer rendering task completion.
   * @type {Promise<void>}
   */
  get promise() {
    return this._capability.promise;
  }

  /**
   * Cancel rendering of the textLayer.
   */
  cancel() {
    this._canceled = true;
    if (this._reader) {
      this._reader
        .cancel(new AbortException("TextLayer task cancelled."))
        .catch(() => {
          // Avoid "Uncaught promise" messages in the console.
        });
      this._reader = null;
    }
    if (this._renderTimer !== null) {
      clearTimeout(this._renderTimer);
      this._renderTimer = null;
    }
    this._capability.reject(new Error("TextLayer task cancelled."));
  }

  /**
   * @private
   */
  _processItems(items, styleCache) {
    for (let i = 0, len = items.length; i < len; i++) {
      if (items[i].str === undefined) {
        if (
          items[i].type === "beginMarkedContentProps" ||
          items[i].type === "beginMarkedContent"
        ) {
          const parent = this._container;
          this._container = document.createElement("span");
          this._container.classList.add("markedContent");
          if (items[i].id !== null) {
            this._container.setAttribute("id", `${items[i].id}`);
          }
          parent.appendChild(this._container);
        } else if (items[i].type === "endMarkedContent") {
          this._container = this._container.parentNode;
        }
        continue;
      }
      this._textContentItemsStr.push(items[i].str);
      appendText(this, items[i], styleCache, this._layoutTextCtx);
    }
  }

  /**
   * @private
   */
  _layoutText(textDiv) {
    const textDivProperties = this._textDivProperties.get(textDiv);

    let transform = "";
    if (textDivProperties.canvasWidth !== 0 && textDivProperties.hasText) {
      const { fontSize, fontFamily } = textDiv.style;

      // Only build font string and set to context if different from last.
      if (
        fontSize !== this._layoutTextLastFontSize ||
        fontFamily !== this._layoutTextLastFontFamily
      ) {
        this._layoutTextCtx.font = `${fontSize} ${fontFamily}`;
        this._layoutTextLastFontSize = fontSize;
        this._layoutTextLastFontFamily = fontFamily;
      }
      // Only measure the width for multi-char text divs, see `appendText`.
      const { width } = this._layoutTextCtx.measureText(textDiv.textContent);

      if (width > 0) {
        const scale = textDivProperties.canvasWidth / width;
        if (this._enhanceTextSelection) {
          textDivProperties.scale = scale;
        }
        transform = `scaleX(${scale})`;
      }
    }
    if (textDivProperties.angle !== 0) {
      transform = `rotate(${textDivProperties.angle}deg) ${transform}`;
    }
    if (transform.length > 0) {
      if (this._enhanceTextSelection) {
        textDivProperties.originalTransform = transform;
      }
      textDiv.style.transform = transform;
    }

    if (textDivProperties.hasText) {
      this._container.appendChild(textDiv);
    }
    if (textDivProperties.hasEOL) {
      const br = document.createElement("br");
      br.setAttribute("role", "presentation");
      this._container.appendChild(br);
    }
  }

  /**
   * @private
   */
  _render(timeout = 0) {
    const capability = createPromiseCapability();
    let styleCache = Object.create(null);

    // The temporary canvas is used to measure text length in the DOM.
    const canvas = this._document.createElement("canvas");
    canvas.height = canvas.width = DEFAULT_FONT_SIZE;

    if (
      typeof PDFJSDev === "undefined" ||
      PDFJSDev.test("MOZCENTRAL || GENERIC")
    ) {
      canvas.mozOpaque = true;
    }
    this._layoutTextCtx = canvas.getContext("2d", { alpha: false });

    if (this._textContent) {
      const textItems = this._textContent.items;
      const textStyles = this._textContent.styles;
      this._processItems(textItems, textStyles);
      capability.resolve();
    } else if (this._textContentStream) {
      const pump = () => {
        this._reader.read().then(({ value, done }) => {
          if (done) {
            capability.resolve();
            return;
          }

          Object.assign(styleCache, value.styles);
          this._processItems(value.items, styleCache);
          pump();
        }, capability.reject);
      };

      this._reader = this._textContentStream.getReader();
      pump();
    } else {
      throw new Error(
        'Neither "textContent" nor "textContentStream" parameters specified.'
      );
    }

    capability.promise.then(() => {
      styleCache = null;
      if (!timeout) {
        // Render right away
        render(this);
      } else {
        // Schedule
        this._renderTimer = setTimeout(() => {
          render(this);
          this._renderTimer = null;
        }, timeout);
      }
    }, this._capability.reject);
  }

  /**
   * @param {boolean} [expandDivs]
   */
  expandTextDivs(expandDivs = false) {
    if (!this._enhanceTextSelection || !this._renderingDone) {
      return;
    }
    if (this._bounds !== null) {
      expand(this);
      this._bounds = null;
    }
    const transformBuf = [],
      paddingBuf = [];

    for (let i = 0, ii = this._textDivs.length; i < ii; i++) {
      const div = this._textDivs[i];
      const divProps = this._textDivProperties.get(div);

      if (!divProps.hasText) {
        continue;
      }
      if (expandDivs) {
        transformBuf.length = 0;
        paddingBuf.length = 0;

        if (divProps.originalTransform) {
          transformBuf.push(divProps.originalTransform);
        }
        if (divProps.paddingTop > 0) {
          paddingBuf.push(`${divProps.paddingTop}px`);
          transformBuf.push(`translateY(${-divProps.paddingTop}px)`);
        } else {
          paddingBuf.push(0);
        }
        if (divProps.paddingRight > 0) {
          paddingBuf.push(`${divProps.paddingRight / divProps.scale}px`);
        } else {
          paddingBuf.push(0);
        }
        if (divProps.paddingBottom > 0) {
          paddingBuf.push(`${divProps.paddingBottom}px`);
        } else {
          paddingBuf.push(0);
        }
        if (divProps.paddingLeft > 0) {
          paddingBuf.push(`${divProps.paddingLeft / divProps.scale}px`);
          transformBuf.push(
            `translateX(${-divProps.paddingLeft / divProps.scale}px)`
          );
        } else {
          paddingBuf.push(0);
        }

        div.style.padding = paddingBuf.join(" ");
        if (transformBuf.length) {
          div.style.transform = transformBuf.join(" ");
        }
      } else {
        div.style.padding = null;
        div.style.transform = divProps.originalTransform;
      }
    }
  }
}

/**
 * @param {TextLayerRenderParameters} renderParameters
 * @returns {TextLayerRenderTask}
 */
function renderTextLayer(renderParameters) {
  const task = new TextLayerRenderTask({
    textContent: renderParameters.textContent,
    textContentStream: renderParameters.textContentStream,
    container: renderParameters.container,
    viewport: renderParameters.viewport,
    textDivs: renderParameters.textDivs,
    textContentItemsStr: renderParameters.textContentItemsStr,
    enhanceTextSelection: renderParameters.enhanceTextSelection,
  });
  task._render(renderParameters.timeout);
  return task;
}

export { renderTextLayer };
