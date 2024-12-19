function regExpEscape(literal_string) {
  return literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");
}

function replacements(search, replacement) {
  str = str.replace(new RegExp(search, "g"), replacement);
  targetEl.value = str;
}

function convertNumbers(lang) {
  var e = document.getElementById("transl2");
  var txt = e.value;
  var roman_numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  if (lang == "gu") {
    var gu_numbers = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
    for (var i = 0; i < roman_numbers.length; i++) {
      txt = txt.replace(new RegExp(roman_numbers[i], "g"), gu_numbers[i]);
    }
    e.value = txt;
    return;
  }

  if (lang == "hi" || lang == "sa") {
    var hi_numbers = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    for (var i = 0; i < roman_numbers.length; i++) {
      txt = txt.replace(new RegExp(roman_numbers[i], "g"), hi_numbers[i]);
    }
    e.value = txt;
    return;
  }

  if (lang == "pa") {
    var pa_numbers = ["੦", "੧", "੨", "੩", "੪", "੫", "੬", "੭", "੮", "੯"];
    for (var i = 0; i < roman_numbers.length; i++) {
      txt = txt.replace(new RegExp(roman_numbers[i], "g"), pa_numbers[i]);
    }
    e.value = txt;
    return;
  }

  if (lang == "bn") {
    var bn_numbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    for (var i = 0; i <= roman_numbers.length; i++) {
      txt = txt.replace(new RegExp(roman_numbers[i], "g"), bn_numbers[i]);
    }
    e.value = txt;
    return;
  }
}

export function kruti2unicodelegacy(str) {
  var array_one = new Array( //"kZsa",
    // "(",")",
    "ñ",
    "Q+Z",
    "sas",
    "aa",
    ")Z",
    "ZZ",
    "‘",
    "’",
    "“",
    "”",

    "å",
    "ƒ",
    "„",
    "…",
    "†",
    "‡",
    "ˆ",
    "‰",
    "Š",
    "‹",

    "¶+",
    "d+",
    "[+k",
    "[+",
    "x+",
    "T+",
    "t+",
    "M+",
    "<+",
    "Q+",
    ";+",
    "j+",
    "u+",
    "Ùk",
    "Ù",
    "ä",
    "–",
    "—",
    "é",
    "™",
    "=kk",
    "f=k",

    "à",
    "á",
    "â",
    "ã",
    "ºz",
    "º",
    "í",
    "{k",
    "{",
    "=",
    "«",
    "Nî",
    "Vî",
    "Bî",
    "Mî",
    "<î",
    "|",
    "K",
    "}",
    "J",
    "Vª",
    "Mª",
    "<ªª",
    "Nª",
    "Ø",
    "Ý",
    "nzZ",
    "æ",
    "ç",
    "Á",
    "xz",
    "#",
    ":",

    "v‚",
    "vks",
    "vkS",
    "vk",
    "v",
    "b±",
    "Ã",
    "bZ",
    "b",
    "m",
    "Å",
    ",s",
    ",",
    "_",

    "ô",
    "d",
    "Dk",
    "D",
    "£",
    "[k",
    "[",
    "x",
    "Xk",
    "X",
    "Ä",
    "?k",
    "?",
    "³",
    "p",
    "Pk",
    "P",
    "N",
    "t",
    "Tk",
    "T",
    ">",
    "÷",
    "¥",

    "ê",
    "ë",
    "V",
    "B",
    "ì",
    "ï",
    "M+",
    "<+",
    "M",
    "<",
    ".k",
    ".",
    "r",
    "Rk",
    "R",
    "Fk",
    "F",
    ")",
    "n",
    "/k",
    "èk",
    "/",
    "Ë",
    "è",
    "u",
    "Uk",
    "U",

    "i",
    "Ik",
    "I",
    "Q",
    "¶",
    "c",
    "Ck",
    "C",
    "Hk",
    "H",
    "e",
    "Ek",
    "E",
    ";",
    "¸",
    "j",
    "y",
    "Yk",
    "Y",
    "G",
    "o",
    "Ok",
    "O",
    "'k",
    "'",
    '"k',
    '"',
    "l",
    "Lk",
    "L",
    "g",

    "È",
    "z",
    "Ì",
    "Í",
    "Î",
    "Ï",
    "Ñ",
    "Ò",
    "Ó",
    "Ô",
    "Ö",
    "Ø",
    "Ù",
    "Ük",
    "Ü",

    "‚",
    "¨",
    "ks",
    "©",
    "kS",
    "k",
    "h",
    "q",
    "w",
    "`",
    "s",
    "¢",
    "S",
    "a",
    "¡",
    "%",
    "W",
    "•",
    "·",
    "∙",
    "·",
    "~j",
    "~",
    "\\",
    "+",
    " ः",
    "^",
    "*",
    "Þ",
    "ß",
    "(",
    "¼",
    "½",
    "¿",
    "À",
    "¾",
    "A",
    "-",
    "&",
    "&",
    "Œ",
    "]",
    "~ ",
    "@",
    "ाे",
    "ाॅ",
    "ंै",
    "े्र",
    "अौ",
    "अो",
    "आॅ"
  );

  var array_two = new Array( //"ksaZ",
    //"¼","½",
    "॰",
    "QZ+",
    "sa",
    "a",
    "र्द्ध",
    "Z",
    '"',
    '"',
    "'",
    "'",

    "०",
    "१",
    "२",
    "३",
    "४",
    "५",
    "६",
    "७",
    "८",
    "९",

    "फ़्",
    "क़",
    "ख़",
    "ख़्",
    "ग़",
    "ज़्",
    "ज़",
    "ड़",
    "ढ़",
    "फ़",
    "य़",
    "ऱ",
    "ऩ", // one-byte nukta varNas
    "त्त",
    "त्त्",
    "क्त",
    "दृ",
    "कृ",
    "न्न",
    "न्न्",
    "=k",
    "f=",

    "ह्न",
    "ह्य",
    "हृ",
    "ह्म",
    "ह्र",
    "ह्",
    "द्द",
    "क्ष",
    "क्ष्",
    "त्र",
    "त्र्",
    "छ्य",
    "ट्य",
    "ठ्य",
    "ड्य",
    "ढ्य",
    "द्य",
    "ज्ञ",
    "द्व",
    "श्र",
    "ट्र",
    "ड्र",
    "ढ्र",
    "छ्र",
    "क्र",
    "फ्र",
    "र्द्र",
    "द्र",
    "प्र",
    "प्र",
    "ग्र",
    "रु",
    "रू",

    "ऑ",
    "ओ",
    "औ",
    "आ",
    "अ",
    "ईं",
    "ई",
    "ई",
    "इ",
    "उ",
    "ऊ",
    "ऐ",
    "ए",
    "ऋ",

    "क्क",
    "क",
    "क",
    "क्",
    "ख",
    "ख",
    "ख्",
    "ग",
    "ग",
    "ग्",
    "घ",
    "घ",
    "घ्",
    "ङ",
    "च",
    "च",
    "च्",
    "छ",
    "ज",
    "ज",
    "ज्",
    "झ",
    "झ्",
    "ञ",

    "ट्ट",
    "ट्ठ",
    "ट",
    "ठ",
    "ड्ड",
    "ड्ढ",
    "ड़",
    "ढ़",
    "ड",
    "ढ",
    "ण",
    "ण्",
    "त",
    "त",
    "त्",
    "थ",
    "थ्",
    "द्ध",
    "द",
    "ध",
    "ध",
    "ध्",
    "ध्",
    "ध्",
    "न",
    "न",
    "न्",

    "प",
    "प",
    "प्",
    "फ",
    "फ्",
    "ब",
    "ब",
    "ब्",
    "भ",
    "भ्",
    "म",
    "म",
    "म्",
    "य",
    "य्",
    "र",
    "ल",
    "ल",
    "ल्",
    "ळ",
    "व",
    "व",
    "व्",
    "श",
    "श्",
    "ष",
    "ष्",
    "स",
    "स",
    "स्",
    "ह",

    "ीं",
    "्र",
    "द्द",
    "ट्ट",
    "ट्ठ",
    "ड्ड",
    "कृ",
    "भ",
    "्य",
    "ड्ढ",
    "झ्",
    "क्र",
    "त्त्",
    "श",
    "श्",

    "ॉ",
    "ो",
    "ो",
    "ौ",
    "ौ",
    "ा",
    "ी",
    "ु",
    "ू",
    "ृ",
    "े",
    "े",
    "ै",
    "ं",
    "ँ",
    "ः",
    "ॅ",
    "ऽ",
    "ऽ",
    "ऽ",
    "ऽ",
    "्र",
    "्",
    "?",
    "़",
    ":",
    "‘",
    "’",
    "“",
    "”",
    ";",
    "(",
    ")",
    "{",
    "}",
    "=",
    "।",
    ".",
    "-",
    "µ",
    "॰",
    ",",
    "् ",
    "/",
    "ो",
    "ॉ",
    "ैं",
    "्रे",
    "औ",
    "ओ",
    "ऑ"
  );

  //Corrections for Spelling mistakes (see above under the first Array):
  // "sas","aa","ZZ","=kk","f=k",
  //
  // The following two characters are to be replaced through proper checking of locations:
  // "Z" )
  // "र्" (reph)

  // "f" )
  // "ि"

  if (str == "/eZa %") str = "/keZ%";

  var array_one_length = array_one.length;

  var modified_substring = str;

  //****************************************************************************************
  //  Break the long text into small bunches of max. max_text_size  characters each.
  //****************************************************************************************
  var text_size = str.length;

  var processed_text = ""; //blank

  var sthiti1 = 0;
  var sthiti2 = 0;
  var chale_chalo = 1;

  var max_text_size = 6000;

  while (chale_chalo == 1) {
    sthiti1 = sthiti2;

    if (sthiti2 < text_size - max_text_size) {
      sthiti2 += max_text_size;
      while (str.charAt(sthiti2) != " ") {
        sthiti2--;
      }
    } else {
      sthiti2 = text_size;
      chale_chalo = 0;
    }

    var modified_substring = str.substring(sthiti1, sthiti2);
    modified_substring = modified_substring.replace(/’/g, "'");
    modified_substring = modified_substring.replace(/ ̈/g, "¨");
    Replace_Symbols();

    processed_text += modified_substring;

    //****************************************************************************************
    //  Breaking part code over
    //****************************************************************************************
    //  processed_text = processed_text.replace( /mangal/g , "Krutidev010" ) ;
    return processed_text;
  }

  // --------------------------------------------------

  function Replace_Symbols() {
    var character_to_be_replaced;

    //substitute array_two elements in place of corresponding array_one elements

    if (modified_substring != "") {
      // if stringto be converted is non-blank then no need of any processing.
      for (
        var input_symbol_idx = 0;
        input_symbol_idx < array_one_length;
        input_symbol_idx++
      ) {
        var idx = 0; // index of the symbol being searched for replacement

        while (idx != -1) {
          //whie-00
          modified_substring = modified_substring.replace(
            array_one[input_symbol_idx],
            array_two[input_symbol_idx]
          );
          idx = modified_substring.indexOf(array_one[input_symbol_idx]);
        } // end of while-00 loop
      } // end of for loop

      //**********************************************************************************
      // Code for Replacing five Special glyphs
      //**********************************************************************************

      //**********************************************************************************
      // Code for Glyph1 : ± (reph+anusvAr)
      //**********************************************************************************
      modified_substring = modified_substring.replace(/±/g, "Zं"); // at some places  ì  is  used eg  in "कर्कंधु,पूर्णांक".
      //
      //**********************************************************************************
      // Glyp2: Æ
      // code for replacing "f" with "ि" and correcting its position too. (moving it one position forward)
      //**********************************************************************************

      modified_substring = modified_substring.replace(/Æ/g, "र्f"); // at some places  Æ  is  used eg  in "धार्मिक".

      var position_of_i = modified_substring.indexOf("f");

      while (position_of_i != -1) {
        //while-02
        var character_next_to_i = modified_substring.charAt(position_of_i + 1);
        character_to_be_replaced = "f" + character_next_to_i;
        modified_substring = modified_substring.replace(
          character_to_be_replaced,
          character_next_to_i + "ि"
        );
        position_of_i = modified_substring.search(/f/, position_of_i + 1); // search for i ahead of the current position.;
      } // end of while-02 loop

      //**********************************************************************************
      // Glyph3 & Glyph4: Ç  É
      // code for replacing "fa" with "िं"  and correcting its position too.(moving it two positions forward)
      //**********************************************************************************

      modified_substring = modified_substring.replace(/Ç/g, "fa"); // at some places  Ç  is  used eg  in "किंकर".
      modified_substring = modified_substring.replace(/É/g, "र्fa"); // at some places  É  is  used eg  in "शर्मिंदा"

      var position_of_i = modified_substring.indexOf("fa");

      while (position_of_i != -1) {
        //while-02
        var character_next_to_ip2 = modified_substring.charAt(
          position_of_i + 2
        );
        var character_to_be_replaced = "fa" + character_next_to_ip2;
        modified_substring = modified_substring.replace(
          character_to_be_replaced,
          character_next_to_ip2 + "िं"
        );
        position_of_i = modified_substring.search(/fa/, position_of_i + 2); // search for i ahead of the current position.;
      } // end of while-02 loop

      //**********************************************************************************
      // Glyph5: Ê
      // code for replacing "h" with "ी"  and correcting its position too.(moving it one positions forward)
      //**********************************************************************************

      modified_substring = modified_substring.replace(/Ê/g, "ीZ"); // at some places  Ê  is  used eg  in "किंकर".

      /*
            var position_of_i = modified_substring.indexOf( "h" )

            while ( position_of_i != -1 )  //while-02
            {
            var character_next_to_i = modified_substring.charAt( position_of_i + 1 )
            var character_to_be_replaced = "h" + character_next_to_i
            modified_substring = modified_substring.replace( character_to_be_replaced , character_next_to_i + "ी" ) 
            position_of_i = modified_substring.search( /h/ , position_of_i + 1 ) // search for i ahead of the current position.

            } // end of while-02 loop
            */

      //**********************************************************************************
      // End of Code for Replacing four Special glyphs
      //**********************************************************************************

      // following loop to eliminate 'chhotee ee kee maatraa' on half-letters as a result of above transformation.

      var position_of_wrong_ee = modified_substring.indexOf("ि्");

      while (position_of_wrong_ee != -1) {
        //while-03

        var consonent_next_to_wrong_ee = modified_substring.charAt(
          position_of_wrong_ee + 2
        );
        var character_to_be_replaced = "ि्" + consonent_next_to_wrong_ee;
        modified_substring = modified_substring.replace(
          character_to_be_replaced,
          "्" + consonent_next_to_wrong_ee + "ि"
        );
        position_of_wrong_ee = modified_substring.search(
          /ि्/,
          position_of_wrong_ee + 2
        ); // search for 'wrong ee' ahead of the current position.
      } // end of while-03 loop

      //**************************************
      //
      //**************************************
      //   alert(modified_substring);
      //**************************************

      // Eliminating reph "Z" and putting 'half - r' at proper position for this.
      var set_of_matras = "अ आ इ ई उ ऊ ए ऐ ओ औ ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ";

      var position_of_R = modified_substring.indexOf("Z");

      // alert(" 1. modified_substring = "+modified_substring );
      // alert(" 2. position_of_R = "+position_of_R )

      while (position_of_R > 0) {
        // while-04
        var probable_position_of_half_r = position_of_R - 1;

        //alert(" 3. probable_position_of_half_r = "+probable_position_of_half_r );

        var character_at_probable_position_of_half_r =
          modified_substring.charAt(probable_position_of_half_r);

        //alert(" 4. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );

        //************************************************************
        // trying to find non-maatra position left to current O (ie, half -r).
        //************************************************************

        while (
          set_of_matras.match(
            regExpEscape(character_at_probable_position_of_half_r)
          ) != null
        ) {
          // while-05;
          // some vowel maatraa or anusvaar found, move to previous character
          probable_position_of_half_r = probable_position_of_half_r - 1;
          character_at_probable_position_of_half_r = modified_substring.charAt(
            probable_position_of_half_r
          );

          //alert(" 5. probable_position_of_half_r = "+probable_position_of_half_r );
          //alert(" 6. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );
        } // end of while-05

        //************************************************************
        // check if the previous character to the present character is a halant
        //************************************************************
        var previous_to_position_of_half_r = probable_position_of_half_r - 1;
        //alert(" 7. previous_to_position_of_half_r = "+previous_to_position_of_half_r );

        if (previous_to_position_of_half_r > 0) {
          // if-03
          var character_previous_to_position_of_half_r =
            modified_substring.charAt(previous_to_position_of_half_r);
          //alert(" 8. character_previous_to_position_of_half_r = "+character_previous_to_position_of_half_r );

          while (
            character_previous_to_position_of_half_r &&
            "्".match(regExpEscape(character_previous_to_position_of_half_r)) !=
              null
          ) {
            // while-06
            //    halant found, move to previous character
            probable_position_of_half_r = previous_to_position_of_half_r - 1;
            character_at_probable_position_of_half_r =
              modified_substring.charAt(probable_position_of_half_r);

            //alert(" 9. probable_position_of_half_r = "+probable_position_of_half_r );
            //alert("10. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );

            previous_to_position_of_half_r = probable_position_of_half_r - 1;
            character_previous_to_position_of_half_r =
              modified_substring.charAt(previous_to_position_of_half_r);

            //alert("11. previous_to_position_of_half_r = "+previous_to_position_of_half_r );
            //alert("12. character_previous_to_position_of_half_r = "+character_previous_to_position_of_half_r );
          } // end of while-06
        } // end of if-03

        //************************************************************

        character_to_be_replaced = modified_substring.substr(
          probable_position_of_half_r,
          position_of_R - probable_position_of_half_r
        );
        var new_replacement_string = "र्" + character_to_be_replaced;
        character_to_be_replaced = character_to_be_replaced + "Z";
        modified_substring = modified_substring.replace(
          character_to_be_replaced,
          new_replacement_string
        );
        position_of_R = modified_substring.indexOf("Z");

        //alert("13. character_to_be_replaced = "+character_to_be_replaced );
        //alert("14. modified_substring = "+modified_substring );
      } // end of while-04
    } // end of IF  statement  meant to  supress processing of  blank  string.

    //**************************************
    //   alert(modified_substring);
    //**************************************
  } // end of the function  Replace_Symbols
} // end of Krutidev_to_unicode function

//*******************************************************************************

export function chanakya2unicode(str) {
  var array_one = new Array(
    // repeated maatraas and sequence change
    "aa",
    "a",
    "ZZ",
    "Z",
    "sas",
    "sa",
    "as",
    "sa",
    "Q+Z",
    "QZ+",

    "‘",
    '"',
    "’",
    '"',
    "“",
    "'",
    "”",
    "'",

    "ƒ",
    "१",
    "„",
    "२",
    "…",
    "३",
    "†",
    "४",
    "‡",
    "५",
    "ˆ",
    "६",
    "‰",
    "७",
    "Š",
    "८",
    "‹",
    "९",
    "Œ",
    "०",
    "å",
    "०",

    "v‚",
    "ऑ",
    "vks",
    "ओ",
    "vkS",
    "औ",
    "vk",
    "आ",
    "v",
    "अ",
    "b±",
    "ईं",
    "Ã",
    "ई",
    "bZ",
    "ई",
    "b",
    "इ",
    "mQ",
    "ऊ",
    "m",
    "उ",
    "Å",
    "ऊ",
    ",s",
    "ऐ",
    ",",
    "ए",
    "½",
    "ऋ",
    "˝",
    "ऋ",

    "d+",
    "क़",
    "[+",
    "ख़्",
    "x+",
    "ग़",
    "T+",
    "ज़्",
    "t+",
    "ज़",
    "M+",
    "ड़",
    "<+",
    "ढ़",
    "¶+",
    "फ़्",
    "I+kQ",
    "फ़",
    "i+Q",
    "फ़",
    ";+",
    "य़",
    "j+",
    "ऱ",
    "u+",
    "ऩ",
    "Â",
    "न्न",
    "d",
    "क",
    "D",
    "क्",
    "£",
    "र्f",
    "[",
    "ख्",
    "x",
    "ग",
    "X",
    "ग्",
    "Ä",
    "घ",
    "?",
    "घ्",
    "³",
    "ङ",
    "p",
    "च",
    "P",
    "च्",
    "N",
    "छ",
    "t",
    "ज",
    "T",
    "ज्",
    ">",
    "झ",
    "÷",
    "झ्",
    "Ö",
    "झ्",
    "¥",
    "ञ",
    "V",
    "ट",
    "B",
    "ठ",
    "M",
    "ड",
    "<",
    "ढ",
    ".",
    "ण्",
    "r",
    "त",
    "R",
    "त्",
    "F",
    "थ्",
    "n",
    "द",
    "/",
    "ध",
    "Ë",
    "ध्",
    "è",
    "ध्",
    "č",
    "ध्",
    "u",
    "न",
    "U",
    "न्",
    "IkQ",
    "फ",
    "iQ",
    "फ",
    "¶",
    "फ्",
    "i",
    "प",
    "I",
    "प्",
    "c",
    "ब",
    "C",
    "ब्",
    "Ò",
    "भ",
    "H",
    "भ्",
    "e",
    "म",
    "E",
    "म्",
    ";",
    "य",
    "¸",
    "य्",
    "Õ",
    "य्",
    "jQ",
    "रु",
    "j",
    "र",
    "y",
    "ल",
    "Y",
    "ल्",
    "G",
    "ळ",

    "o+Q",
    "क़",
    "oQ",
    "क",
    "OkQ",
    "क",
    "Ok",
    "व",
    "o",
    "व",
    "O",
    "व्",

    "Üo",
    "श्व",
    "Üz",
    "श्र्",
    "Ü",
    "श्", // as used in 'shringaal' etc
    "'",
    "श्",
    '"',
    "ष्",
    "l",
    "स",
    "L",
    "स्",
    "g",
    "ह",

    "Ń",
    "कृ",
    "Ñ",
    "कृ",
    "—",
    "कृ",
    "ô",
    "क्क",
    "äQ",
    "क्त",
    "ä",
    "त्त",
    "{",
    "क्ष्",
    "K",
    "ज्ञ",

    "ê",
    "ट्ट",
    "Í",
    "ट्ट",
    "ë",
    "ट्ठ",
    "Î",
    "ट्ठ",
    "ð",
    "ठ्ठ",
    "Ï",
    "ड्ड",
    "ì",
    "ड्ड",
    "ï",
    "ड्ढ",
    "Ô",
    "ड्ढ",

    "Ù",
    "त्त्",
    "Ú",
    "फ्र",
    "Ů",
    "त्त्",
    "=",
    "त्र्",
    "«",
    "त्र्",
    "–",
    "दृ",
    "Ì",
    "द्द",
    "í",
    "द्द",
    "Ľ",
    "द्ध",
    "¼",
    "द्ध",
    //"\)" ,	"द्ध" ,
    "˜",
    "द्भ",
    "ö",
    "द्भ",
    "|",
    "द्य",
    "}",
    "द्व",
    "é",
    "न्न",
    "™",
    "न्न्",

    "ó",
    "स्त्र",
    "â",
    "हृ",
    "à",
    "ह्न",
    "ã",
    "ह्म",
    "á",
    "ह्य",
    "º",
    "ह्",

    "J",
    "श्र",
    "Ø",
    "क्र",
    "Ř",
    "क्र",
    "Ý",
    "फ्र",

    "æ",
    "द्र",
    "ç",
    "प्र",
    "Á",
    "प्र",

    "प्रQ",
    "फ्र",
    "व्रQ",
    "क्र",

    "#",
    "रु",
    ":",
    "रू",

    "Ó",
    "्य",
    "î",
    "्य",
    "z",
    "्र",
    "ª",
    "्र",
    "Ş",
    "्र",

    // "Ż" ,	"िं",
    "È",
    "ीं",
    "Ê",
    "Zी",
    "›",
    "Zैं",
    "õ",
    "Zैं",
    "±",
    "Zं",
    "Æ",
    "र्f",
    "É",
    "र्Ż",

    "्k",
    "",

    "‚",
    "ॉ",
    "¨",
    "ो",
    "®",
    "ो",
    "ks",
    "ो",
    "©",
    "ौ",
    "kS",
    "ौ",
    "h",
    "ी",
    "q",
    "ु",
    "w",
    "ू",
    "`",
    "ृ",
    "s",
    "े",
    "¢",
    "े", //suitable for ka
    "S",
    "ै",
    "a",
    "ं",
    "¡",
    "ँ",
    "ˇ",
    "ँ",
    "%",
    "ः",
    "W",
    "ॅ",
    "•",
    "ख",
    "∙",
    "ऽ",
    "·",
    "ऽ",
    "~",
    "्",
    "+",
    "़",
    "k",
    "ा",

    "A",
    "।",
    "ñ",
    "॰", // laaghava

    "\\",
    "?",
    "^",
    "‘",
    "*",
    "’",
    "Þ",
    "“",
    "ß",
    "”",
    //"(" ,	";" , //13-12-2014
    //"¼" ,	"(" , //13-12-2014
    //"½" ,	")" , //13-12-2014
    "μ",
    "-",
    "¿",
    "{",
    "À",
    "}",
    "¾",
    "=",
    "-",
    ".", // full stop?
    "&",
    "-",
    //"&" ,	"µ" ,
    "]",
    ",",
    "@",
    "/",

    " ः",
    " :",

    // "े्र" ,	"्रे" ,  // implemented in more general form

    "अौ",
    "औ",
    "अो",
    "ओ",
    "आॅ",
    "ऑ",
    "आे",
    "ओ",
    "आै",
    "औ",
    "ाे",
    "ो",
    "ाॅ",
    "ॉ",
    "ाो",
    "ो"
  );

  var array_one_length = array_one.length;

  var modified_substring = str;

  //************************************************************
  //  Break the long text into small bunches of max. max_text_size  characters each.
  //*************************************************************
  var text_size = str.length;

  var processed_text = ""; //blank

  var sthiti1 = 0;
  var sthiti2 = 0;
  var chale_chalo = 1;

  var max_text_size = 6000;

  while (chale_chalo == 1) {
    sthiti1 = sthiti2;

    if (sthiti2 < text_size - max_text_size) {
      sthiti2 += max_text_size;
      while (
        (str.charAt(sthiti2) != "\n") &
        (str.charAt(sthiti2) != "\t") &
        (str.charAt(sthiti2) != " ")
      ) {
        sthiti2--;
      }
    } else {
      sthiti2 = text_size;
      chale_chalo = 0;
    }

    var modified_substring = str.substring(sthiti1, sthiti2);

    Replace_Symbols();

    processed_text += modified_substring;

    return processed_text;
  }

  // --------------------------------------------------

  function Replace_Symbols() {
    //substitute array_two elements in place of corresponding array_one elements

    if (modified_substring != "") {
      // if stringto be converted is non-blank then no need of any processing.
      modified_substring = modified_substring.replace(
        /([ ])([kzsSqwWa¡`±ZQ\+‚¨®sS©h¢ˇ%•∙·~ÈÊ\›õ])/g,
        "$2"
      );

      modified_substring = modified_substring.replace(
        /([ZzsSqwa¡`]+)Q/g,
        "Q$1"
      );
      modified_substring = modified_substring.replace(
        /([ZzsSqwa¡`]+)\+/g,
        "+$1"
      );
      modified_substring = modified_substring.replace(
        /([ZzsSqwa¡`]+)ª/g,
        "्र$1"
      );
      //modified_substring = modified_substring.replace( /([ेैुूं]+)्र/g , "्र$1" ) ;

      for (
        var input_symbol_idx = 0;
        input_symbol_idx < array_one_length - 1;
        input_symbol_idx = input_symbol_idx + 2
      ) {
        var idx = 0; // index of the symbol being searched for replacement

        while (idx != -1) {
          //whie-00
          modified_substring = modified_substring.replace(
            array_one[input_symbol_idx],
            array_one[input_symbol_idx + 1]
          );
          idx = modified_substring.indexOf(array_one[input_symbol_idx]);
        } // end of while-00 loop
      } // end of for loop

      //modified_substring = modified_substring.replace( /([\s])ा/g , "$1श" ) ;
      //modified_substring = modified_substring.replace( /([ ])([ािीुूृेैोौंँ±Z])/g , "$2" ) ;

      // following statements for adjusting postion of i maatraas.

      modified_substring = modified_substring.replace(/¯/g, "Ż");
      modified_substring = modified_substring.replace(/Ł/g, "र्f");

      modified_substring = modified_substring.replace(
        /([fŻ])([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])/g,
        "$2$1"
      );

      modified_substring = modified_substring.replace(
        /([fŻ])((्[कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])+)/g,
        "$2$1"
      );

      modified_substring = modified_substring.replace(/f/g, "ि");
      modified_substring = modified_substring.replace(/Ż/g, "िं");

      //following three statement for adjusting position of reph ie, half r .
      modified_substring = modified_substring.replace(/±/g, "Zं");

      modified_substring = modified_substring.replace(
        /([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ])([ािीुूृेैोौंँ]*)([Z])/g,
        "$3$1$2"
      );

      modified_substring = modified_substring.replace(
        /(([कखगघङचछजझञटठडढणतथदधनपफबभमयरलळवशषसहक़ख़ग़ज़ड़ढ़फ़य़ऱऩ][्])+)(Z)/g,
        "$3$1"
      );
      // Z is $3 here, NOT $2.

      modified_substring = modified_substring.replace(/Z/g, "र्");

      // remove maatras typed wrongly
      modified_substring = modified_substring.replace(
        /([ंँ॰])([ािीुूृेैोौ])/g,
        "$2$1"
      );

      modified_substring = modified_substring.replace(
        /([ािीुूृेैोौंँ])([ािीुूृेैोौ])/g,
        "$1"
      );

      modified_substring = modified_substring.replace(/([0-9])ण्/g, "$1.");
      modified_substring = modified_substring.replace(/ण्([0-9])/g, ".$1");
    } // end of IF  statement  meant to  supress processing of  blank  string.
  } // end of the function  Replace_Symbols
} // end of Convert_Walkman-Chanakya905_to_Unicode function



export function kruti2unicode(str)
{

var array_one = new Array( 

"aa" ,	"a" ,
"ZZ" ,	"Z" ,
"=kk" ,	"=k" ,
"f=k" ,	"f=" ,

"Q+Z" ,	"QZ+" ,
"sas" ,	"sa" ,

"‘" ,	"\"" ,
"’" ,	"\"" ,
"“" ,	"'" ,
"”" ,	"'" ,

"ƒ" ,	"१" ,
"„" ,	"२" ,
"…" ,	"३" ,
"†" ,	"४" ,
"‡" ,	"५" ,
"ˆ" ,	"६" ,
"‰" ,	"७" ,
"Š" ,	"८" ,
"‹" ,	"९" ,
"Œ" ,	"०" ,
"å" ,	"०" ,

"v‚" ,	"ऑ" ,
"vks" ,	"ओ" ,
"vkS" ,	"औ" ,
"vk" ,	"आ" ,
"v" ,	"अ" ,
"b±" ,	"ईं" ,
"Ã" ,	"ई" ,
"bZ" ,	"ई" ,
"b" ,	"इ" ,
"m" ,	"उ" ,
"Å" ,	"ऊ" ,
",s" ,	"ऐ" ,
"," ,	"ए" ,
"_" ,	"ऋ" ,


"d+" ,	"क़" ,
"[+" ,	"ख़्" ,
"x+" ,	"ग़" ,
"T+" ,	"ज़्" ,
"t+" ,	"ज़" ,
"M+" ,	"ड़" ,
"<+" ,	"ढ़" ,
"¶+" ,	"फ़्" ,
"Q+" ,	"फ़" ,
";+" ,	"य़" ,
"j+" ,	"ऱ" ,
"u+" ,	"ऩ" ,

"d" ,	"क" ,
"D" ,	"क्" ,
"£" ,	"ख्र" ,
"[" ,	"ख्" ,
"x" ,	"ग" ,
"X" ,	"ग्" ,
"Ä" ,	"घ" ,
"?" ,	"घ्" ,
"³" ,	"ङ" ,
"p" ,	"च" ,
"P" ,	"च्" ,
"N" ,	"छ" ,
"t" ,	"ज" ,
"T" ,	"ज्" ,
">" ,	"झ" ,
"÷" ,	"झ्" ,
"Ö" ,	"झ्" ,
"¥" ,	"ञ" ,
"V" ,	"ट" ,
"B" ,	"ठ" ,
"M" ,	"ड" ,
"<" ,	"ढ" ,
"." ,	"ण्" ,
"r" ,	"त" ,
"R" ,	"त्" ,
"F" ,	"थ्" ,
"n" ,	"द" ,
"/" ,	"ध्" ,
"Ë" ,	"ध्" ,
"è" ,	"ध्" ,
"u" ,	"न" ,
"U" ,	"न्" ,
"i" ,	"प" ,
"I" ,	"प्" ,
"Q" ,	"फ" ,
"¶" ,	"फ्" ,
"c" ,	"ब" ,
"C" ,	"ब्" ,
"Ò" ,	"भ" ,
"H" ,	"भ्" ,
"e" ,	"म" ,
"E" ,	"म्" ,
";" ,	"य" ,
"¸" ,	"य्" ,
"j" ,	"र" ,
"y" ,	"ल" ,
"Y" ,	"ल्" ,
"G" ,	"ळ" ,
"Üo" ,	"श्व" ,
"Ük" ,	"श" , // as used in 'shringaal' etc
"Üz" ,	"श्र्" ,
"o" ,	"व" ,
"O" ,	"व्" ,

"'" ,	"श्" ,
"\"" ,	"ष्" ,
"l" ,	"स" ,
"L" ,	"स्" ,
"g" ,	"ह" ,

"Ñ" ,	"कृ" ,
"—" ,	"कृ" ,
"ô" ,	"क्क" ,
"ä" ,	"क्त" ,
"{" ,	"क्ष्" ,
"K" ,	"ज्ञ" ,

"ê" ,	"ट्ट" ,
"Í" ,	"ट्ट" ,
"ë" ,	"ट्ठ" ,
"Î" ,	"ट्ठ" ,
"ð" ,	"ठ्ठ" ,
"Ï" ,	"ड्ड" ,
"ì" ,	"ड्ड" ,
"ï" ,	"ड्ढ" ,
"Ô" ,	"ड्ढ" ,

"Ù" ,	"त्त्" ,
"=" ,	"त्र" ,
"«" ,	"त्र्" ,
"–" ,	"दृ" ,
"Ì" ,	"द्द" ,
"í" ,	"द्द" ,
"\)" ,	"द्ध" ,
"˜" ,	"द्भ" ,
"ö" ,	"द्भ" ,
"|" ,	"द्य" ,
"}" ,	"द्व" ,
"é" ,	"न्न" ,
"™" ,	"न्न्" ,

"ó" ,	"स्त्र" ,
"â" ,	"हृ" ,
"à" ,	"ह्न" ,
"ã" ,	"ह्म" ,
"á" ,	"ह्य" ,
"º" ,	"ह्" ,

"J" ,	"श्र" ,
"Ø" ,	"क्र" ,
"Ý" ,	"फ्र" ,
"æ" ,	"द्र" ,
"ç" ,	"प्र" ,
"Á" ,	"प्र" ,
"#" ,	"रु" ,
":" ,	"रू" ,

"Ó" ,	"्य" ,
"î" ,	"्य" ,
"z" ,	"्र" ,
"ª" ,	"्र" ,

// "Ç" ,	"िं", 
"È" ,	"ीं" ,
"Ê" ,	"Zी" ,
"\›" ,	"Zैं" ,
"õ" ,	"Zैं" ,
"±"  ,	"Zं" ,
"Æ" ,	"र्f" ,
"É" ,	"र्Ç" ,

"्k" ,	"" , 

"‚" ,	"ॉ" ,
"¨" ,	"ो" ,
"®" ,	"ो" ,
"ks" ,	"ो" ,
"©" ,	"ौ" ,
"kS" ,	"ौ" ,
"h" ,	"ी" ,
"q" ,	"ु" ,
"w" ,	"ू" ,
"`" ,	"ृ" , 
"s" ,	"े" ,
"¢" ,	"े" , //suitable for ka
"S" ,	"ै" ,
"a" ,	"ं" ,
"¡" ,	"ँ" ,
"%" ,	"ः" ,
"W" ,	"ॅ" ,
"•" ,	"ऽ" ,
"·" ,	"ऽ" ,
"∙" ,	"ऽ" ,
"·" ,	"ऽ" ,
"~" ,	"्" ,
"+" ,	"़" ,
"k" ,	"ा" ,

"A" ,	"।" ,
"ñ" ,	"॰" ,  // laaghava

"\\" ,	"?" ,
" ः" ,	" :" ,
"^" ,	"‘" ,
"*" ,	"’" ,
"Þ" ,	"“" ,
"ß" ,	"”" ,
"(" ,	";" ,
"¼" ,	"(" ,
"½" ,	")" ,
"¿" ,	"{" ,
"À" ,	"}" ,
"¾" ,	"=" ,
"-" ,	"." , // full stop?
"&" ,	"-" ,
//"&" ,	"µ" ,
"]" ,	"," ,
"@" ,	"/" ,

"~ " ,	"् " ,
"ाे" ,	"ो" ,
"ाॅ" ,	"ॉ" ,
"े्र" ,	"्रे" ,
"अौ" ,	"औ" ,
"अो" ,	"ओ" ,
"आॅ" ,	"ऑ" 		)


var array_one_length = array_one.length ;

var modified_substring = str  ;

//************************************************************
//  Break the long text into small bunches of max. max_text_size  characters each.
//*************************************************************
    var text_size = str.length ;

    var processed_text = '' ;  //blank

    var sthiti1 = 0 ;  var sthiti2 = 0 ;  var chale_chalo = 1 ;
 
    var max_text_size = 6000;

    while ( chale_chalo == 1 ) 
    {
     sthiti1 = sthiti2 ;

     if ( sthiti2 < ( text_size - max_text_size ) )  
     { 
      sthiti2 +=  max_text_size ;
	  while ( (str.charAt( sthiti2 ) != '\n')&(str.charAt( sthiti2 ) != '\t')&(str.charAt( sthiti2 ) != ' ') )   {sthiti2-- ;}
     } 
     else  { sthiti2 = text_size  ;  chale_chalo = 0 }

     var modified_substring = str.substring ( sthiti1, sthiti2 )  ;

    Replace_Symbols( ) ;

    processed_text += modified_substring ;

//***************************************************************
//  Breaking part code over
//***************************************************************
 

    return processed_text  ;
   }


// --------------------------------------------------

function Replace_Symbols( )
{

//substitute array_two elements in place of corresponding array_one elements

if ( modified_substring != "" )  // if stringto be converted is non-blank then no need of any processing.
{
for ( var input_symbol_idx = 0;   input_symbol_idx < array_one_length-1;    input_symbol_idx=input_symbol_idx+2 )

{

var idx = 0  ;  // index of the symbol being searched for replacement

while (idx != -1 ) //whie-00
{

modified_substring = modified_substring.replace( array_one[ input_symbol_idx ] , array_one[input_symbol_idx+1] )
idx = modified_substring.indexOf( array_one[input_symbol_idx] )

} // end of while-00 loop
} // end of for loop


// following statements for adjusting postion of i maatraas.

modified_substring = modified_substring.replace(   /([fÇ])([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])/g , "$2$1" ) ;

modified_substring = modified_substring.replace(   /([fÇ])(्)([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])/g , "$2$3$1" ) ;

modified_substring = modified_substring.replace(   /([fÇ])(्)([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])/g , "$2$3$1" ) ;

modified_substring = modified_substring.replace( /f/g , "ि" ) ;
modified_substring = modified_substring.replace( /Ç/g , "िं" ) ;


//following three statement for adjusting position of reph ie, half r .
modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([ािीुूृेैोौंँ]*)([Z])/g , "$3$1$2" ) ;

modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([्])([Z])/g , "$3$1$2" ) ;

modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([्])([Z])/g , "$3$1$2" ) ;

modified_substring = modified_substring.replace( /Z/g , "र्" ) ;

// remove maatras typed wrongly
modified_substring = modified_substring.replace( /([ंँ॰])([ािीुूृेैोौ])/g , "$2$1" );

modified_substring = modified_substring.replace( /([ािीुूृेैोौंँ])([ािीुूृेैोौ])/g , "$1" ) ;

} // end of IF  statement  meant to  supress processing of  blank  string.

} // end of the function  Replace_Symbols
 
} // end of Krutidev_to_unicode function


//************************************************************************
function Convert_to_Krutidev_010()
{

var array_one = new Array(

"'" ,	"\*" ,
"\"" ,	"Þ" ,
"‘" ,	"\^" ,
"’" ,	"\*" ,
"“" ,	"Þ" ,
"”" ,	"ß" ,
"\(" ,	"¼" ,
"\)" ,	"½" ,
"\{" ,	"¿" ,
"\}" ,	"À" ,
"\[" ,	"¼" , // there is no symbol for [ in Krutidev.
"\]" ,	"½" , // there is no symbol for ] in Krutidev.

"_" ,	"\&" ,
"-" ,	"\&" ,
"x" ,	"Û" ,
"\+" ,	"$" ,
"\=" ,	"¾" ,

"।" ,		"A" ,
"॰" ,		"ñ" , // laaghava
"." ,	"-" , // Full stop
"?" ,	"\\" ,
"\," ,	"\]" ,
"%" ,	"þ" , // Kaamachalaaoo.
"\:" ,	"%" , 
"\;" ,	"\(" ,
"\/" ,	"@" ,
// There is no symbol in Krutidev for hash (#).
"#" , "ü" , // Kaamachalaaoo.

// ú û ü ý þ ÿ  remain unchanged in Krutidev.


"०" ,		"å" ,
"१" ,		"ƒ" ,
"२" ,		"„" ,
"३" ,		"…" ,
"४" ,		"†" ,
"५" ,		"‡" ,
"६" ,		"ˆ" ,
"७" ,		"‰" ,
"८" ,		"Š" ,
"९" ,		"\‹" ,

"क़्" ,	"D\+" ,
"ख़्" ,	"\[\+" ,
"ग़्" ,	"X+" ,
"ज़्" ,	"T\+" ,
"ऩ्" ,	"U\+" ,
"फ़्" ,	"¶\+" ,
"य़्" ,	"¸\+" ,

"क़" ,	"d\+" ,
"ख़" ,	"[k\+" ,
"ग़" ,	"x\+" ,
"ज़" ,	"t\+" ,
"ड़" ,		"M\+" ,
"ढ़" ,		"<\+" ,
"ऩ" ,	"u\+" ,
"फ़" ,	"Q\+" ,
"य़" ,	";\+" ,
"ऱ" ,		"j\+" ,

"कृ" ,	"—" ,
"क्क" ,	"ô" ,
"क्त" ,	"ä" ,
"क्ष्" ,	"\{" ,
"क्ष" ,	"\{k" ,
"ज्ञ्" ,	"K~" ,
"ज्ञ" ,	"K" ,

"ट्ट" ,	"ê" ,
"ट्ठ" ,	"ë" ,
"ड्ड" ,	"ì" ,
"ड्ढ" ,	"ï" ,

"त्त्" ,	"Ù" ,
"त्त" ,	"Ùk" ,
"त्र्" ,	"«" ,
"त्र" ,	"\=" ,

"दृ" ,	"–" ,
"द्द" ,	"í" ,
"द्ध" ,	"\)" ,
"द्य" ,	"\|" ,
"द्व" ,	"\}" ,

"छ्य" ,	"Nî" ,
"ट्य" ,	"Vî" ,
"ठ्य" ,	"Bî" ,
"ड्य" ,	"Mî" ,
"ढ्य" ,	"\<î" ,

"छ्र" ,	"Nª" ,
"ट्र" ,	"Vª" ,
"ठ्र" ,	"Bª" ,
"ड्र" ,	"Mª" ,
"ढ्र" ,	"<ª" ,

"क्र" ,	"Ø" ,
"द्र" ,	"æ" ,
"प्र" ,	"ç" ,
"फ्र" ,	"Ý" ,
"श्र्" ,	"Üz" ,
"श्र" ,	"J" ,

"शृ" ,	"Ük`" , // spacial form
"श्व" ,	"Üo" , // spacial form

"हृ" ,	"â" ,
"ह्न" ,	"à" ,
"ह्म" ,	"ã" ,
"ह्य" ,	"á" ,
"ह्र" ,	"ºz" ,
"ह्" ,	"º" ,

"्र" ,	"z" ,

"रु" ,	"\#" ,
"रू" ,	"\:" ,

"ओ" ,	"vks" ,
"औ" ,	"vkS" ,
"ऑ" ,	"v‚" ,
"आ" ,	"vk" ,
"अ" ,	"v" ,
"ईं" ,	"b±" ,
"ई" ,	"Ã" ,
//"ई" ,		"bZ" ,
"इ" ,	"b" ,
"उ" ,	"m" ,
"ऊ" ,	"Å" ,
"ऐ" ,	"\,s" ,
"ए" ,	"\," ,
"ऋ" ,	"_" ,

"क्" ,	"D" ,
"क" ,	"d" ,
"ख्" ,	"\[" ,
"ख" ,	"\[k" ,
"ग्" ,	"X" ,
"ग" ,	"x" ,
"घ्" ,	"\?" ,
"घ" ,	"\?k" ,
"ङ" ,		"³" ,

"च्" ,	"P" ,
"च" ,	"p" ,
"छ" ,	"N" ,
"ज्" ,	"T" ,
"ज" ,	"t" ,
"झ्" ,	"÷" ,
"झ" ,	"\>" ,
"ञ" ,	"¥" ,
"ट" ,	"V" ,
"ठ" ,	"B" ,
"ड" ,	"M" ,
"ढ" ,	"\<" ,
"ण्" ,	"." ,
"ण" ,	".k" ,
"त्" ,	"R" ,
"त" ,	"r" ,
"थ्" ,	"F" ,
"थ" ,	"Fk" ,
"द" ,	"n" ,
"ध्" ,	"è" ,
"ध" ,	"èk" ,
"न्" ,	"U" ,
"न" ,	"u" ,
"प्" ,	"I" ,
"प" ,	"i" ,
"फ्" ,	"¶" ,
"फ" ,	"Q" ,
"ब्" ,	"C" ,
"ब" ,	"c" ,
"भ्" ,	"H" ,
"भ" ,	"Hk" ,
"म्" ,	"E" ,
"म" ,	"e" ,
"य्" ,	"¸" ,
"य" ,	"\;" ,
"र" ,	"j" ,
"ल्" ,	"Y" ,
"ल" ,	"y" ,
"ळ" ,	"G" ,
"व्" ,	"O" ,
"व" ,	"o" ,
"श्" ,	"\'" ,
"श" ,	"\'k" ,
"ष्" ,	"\"" ,
"ष" ,	"\"k" ,
"स्" ,	"L" ,
"स" ,	"l" ,
"ह" ,	"g" ,

"ॉ" ,	"\‚" ,
"ॅ" ,	"W" ,
"ो" ,	"ks" ,
"ौ" ,	"kS" ,
"ा" ,	"k" ,
"ीं" ,	"È" ,
"ी" ,	"h" ,
"ु" ,	"q" ,
"ू" ,	"w" ,
"ृ" ,	"`" ,
"े" ,	"s" ,
"ै" ,	"S" ,
"ं" ,	"a" ,
"ँ" ,	"¡" ,
"ः" ,	"%" ,
"ऽ" ,	"·" ,
"्" ,	"~" ,
"़" ,	"\+" 	 );
  
var array_one_length = array_one.length ;

var modified_substring = document.getElementById("unicode_text").value + " " ;	// an space added to help recognise halant at the end of file

document.getElementById("legacy_text").value = "Conversion in progress.."  ;  

//*************************************************************
//  Break the long text into small bunches of max. max_text_size  characters each.
//*************************************************************
    var text_size = modified_substring.length ;	
	
    var processed_text = '' ;  //blank

    var sthiti1 = 0 ;  var sthiti2 = 0 ;  var chale_chalo = 1 ;
 
    var max_text_size = 6000;


    while ( chale_chalo == 1 ) 
    {
     sthiti1 = sthiti2 ;

     if ( sthiti2 < ( text_size - max_text_size ) )  
     { 
      sthiti2 +=  max_text_size ;
	  while ( (document.getElementById("unicode_text").value.charAt( sthiti2 ) != '\n')&(document.getElementById("unicode_text").value.charAt( sthiti2 ) != '\t')&(document.getElementById("unicode_text").value.charAt( sthiti2 ) != ' ') )   {sthiti2-- ;}
     } 
     else  { sthiti2 = text_size  ;  chale_chalo = 0 }

     var modified_substring = document.getElementById("unicode_text").value.substring ( sthiti1, sthiti2 )  ;

//**********************************************************
//  Breaking part code over
//**********************************************************

	 Replace_Symbols( ) ;

    processed_text += modified_substring ;

    document.getElementById("legacy_text").value = processed_text  ;
   }


//**************************************************

function Replace_Symbols( )
   {

    // if string to be converted is non-blank then no need of any processing.
    if (modified_substring != "" )  
       {

// replace the two-byte nukta_varNa with corresponding one-byte nukta varNas.
modified_substring = modified_substring.replace ( /क़/g , "क़" )  ; 
modified_substring = modified_substring.replace ( /ख़‌/g , "ख़" )  ;
modified_substring = modified_substring.replace ( /ग़/g , "ग़" )  ;
modified_substring = modified_substring.replace ( /ज़/g , "ज़" )  ;
modified_substring = modified_substring.replace( 'ज' + '्' + '़' , 'ज़्' ) ;
modified_substring = modified_substring.replace ( /ड़/g , "ड़" )  ;
modified_substring = modified_substring.replace ( /ढ़/g , "ढ़" )  ;
modified_substring = modified_substring.replace ( /ऩ/g , "ऩ" )  ;
modified_substring = modified_substring.replace ( /फ़/g , "फ़" )  ;
modified_substring = modified_substring.replace ( /य़/g , "य़" )  ;
modified_substring = modified_substring.replace ( /ऱ/g , "ऱ" )  ;


//"िं",	"Ç" ,

// "ीं" ,	"È" ,

// "ीZ" ,	"Ê" ,
// "ैंZ" ,	"\›" ,
// "ैंZ" ,	"õ" ,
// "ंZ" ,	"±"  ,
// "Æ" ,	"र्f" ,
// "É" ,	"र्Ç" ,


// These two to avoid conversion of र् into Z.
modified_substring = modified_substring.replace ( /त्र्/g , "«" )  ; 
modified_substring = modified_substring.replace ( /श्र्/g , "Üz" )  ;
 
modified_substring = modified_substring.replace( /र्/g , "Z" ) ;

modified_substring = modified_substring.replace ( /«/g , "त्र्" )  ; 
modified_substring = modified_substring.replace ( /Üz/g , "श्र्" )  ; 

// following statements for adjusting postion of i maatraas.

modified_substring = modified_substring.replace( /िं/g , "Ç" ) ;
modified_substring = modified_substring.replace( /ि/g , "f" ) ;

modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([Çf])/g , "$2$1" ) ;

modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])(्)([Çf])/g , "$3$1$2" ) ;

modified_substring = modified_substring.replace( /([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])(्)([Çf])/g , "$3$1$2" ) ;

modified_substring = modified_substring.replace( /Zf/g , "Æ" ) ;
modified_substring = modified_substring.replace( /ZÇ/g , "É" ) ;


// **************

//following three statement for adjusting position of reph ie, half r .


modified_substring = modified_substring.replace( /Z([कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([्])/g , "$1$2Z" ) ;

modified_substring = modified_substring.replace( /Z([कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([्])/g , "$1$2Z" ) ;

modified_substring = modified_substring.replace( /Z([कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़])([ाॅीुूृेैोौंँ]*)/g , "$1$2Z" ) ;

modified_substring = modified_substring.replace( /ीZ/g , "Ê" ) ;
modified_substring = modified_substring.replace( /ैंZ/g , "õ" ) ;
modified_substring = modified_substring.replace( /ंZ/g , "±" ) ;

/*

//rem changing व to क  and प to फ etc

modified_substring = modified_substring.replace( /क([ुूृॄेैं&ँ]*)/g , "ke$1À" );

modified_substring = modified_substring.replace( /क्र([ुूृॄेैं&ँ]*)/g , "ke´$1À" );

modified_substring = modified_substring.replace( /फ([ुूृॄेैं&ँ]*)/g , "He$1À" );

modified_substring = modified_substring.replace( /फ्र([ुूृॄेैं&ँ]*)/g , "He´$1À" );
*/

// Halanta after which there is no constant but space, hypen, comma or full-stop etc
modified_substring = modified_substring.replace ( /[्]([ \,\;\.।\n\-\:])/g , "~$1" ) ;	   


// Now substitute Roman symbols for corresponding Devanagari symbols given in array_one.

        for( input_symbol_idx = 0; input_symbol_idx < array_one_length; input_symbol_idx = input_symbol_idx + 2 )
           {
            idx = 0  ;  // index of the symbol being searched for replacement

            while (idx != -1 ) //whie-00
               {
                modified_substring = modified_substring.replace( array_one[ input_symbol_idx ] , array_one[input_symbol_idx + 1] )
                idx = modified_substring.indexOf( array_one[input_symbol_idx] )
               } // end of while-00 loop
           } // end of for loop

        } // end of IF  statement  meant to  supress processing of  blank  string.
		
modified_substring = modified_substring.replace( /Zks/g , "ksZ" ) ; 
modified_substring = modified_substring.replace( /~ Z/g , "Z~" ) ; 
modified_substring = modified_substring.replace( /Zk/g , "kZ" ) ; 

    } // end of the function  Replace_Symbols( )

  } // end of Convert_Unicode_to_Krutidev010 function