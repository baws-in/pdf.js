/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

//
// Basic node example that prints document metadata and text content.
//

// Run `gulp dist-install` to generate 'pdfjs-dist' npm package files.

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const fs = require('fs')

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

            while (matraslist.includes(chtr))
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

// Loading file from file system into typed array
const pdfPath =
  process.argv[2] || "../../web/compressed.tracemonkey-pldi-09.pdf";
const pdfName = process.argv[3];

// Will be using promises to load document, pages and misc data instead of
// callback.
const loadingTask = pdfjsLib.getDocument(pdfPath);
loadingTask.promise
  .then(function (doc) {
    const numPages = doc.numPages;
    console.log("# Document Loaded");
    console.log("Number of Pages: " + numPages);
    console.log();

    let lastPromise; // will be used to chain promises
    lastPromise = doc.getMetadata().then(function (data) {
      console.log("# Metadata Is Loaded");
      console.log("## Info");
      console.log(JSON.stringify(data.info, null, 2));
      console.log();
      if (data.metadata) {
        console.log("## Metadata");
        console.log(JSON.stringify(data.metadata.getAll(), null, 2));
        console.log();
      }
    });

    const loadPage = function (pageNum) {
      return doc.getPage(pageNum).then(function (page) {
        console.log("# Page " + pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        console.log("Size: " + viewport.width + "x" + viewport.height);
        console.log();
        return page
          .getTextContent()
          .then(function (content) {
            // Content contains lots of information about the text layout and
            // styles, but we need only strings at the moment
            const strings = content.items.map(function (item) {
              if(item.trueFont && (item.trueFont.includes("Kruti") || item.trueFont.includes("Chanakya"))){
	          return krutiunicode(item.str);
	      }
	      else {
                  return item.str;
	      }
            });
            console.log("## Text Content");
            var text = strings.join(" ");
            
            try { 
                fs.writeFileSync(".//"+pdfName+"//"+pageNum+".txt", text);
            } catch (err) {
              console.error(err);
            }

            console.log(text);
            page.cleanup();
          })
          .then(function () {
            console.log();
          });
      });
    };
    // Loading of the first page will wait on metadata and subsequent loadings
    // will wait on the previous pages.
    for (let i = 1; i <= numPages; i++) {
      lastPromise = lastPromise.then(loadPage.bind(null, i));
    }
    return lastPromise;
  })
  .then(
    function () {
      console.log("# End of Document");
    },
    function (err) {
      console.error("Error: " + err);
    }
  );
