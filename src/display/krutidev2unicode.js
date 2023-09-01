function regExpEscape(literal_string) {
    return literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

function replacements(search, replacement) {
    str = str.replace(new RegExp(search, 'g'), replacement);
    targetEl.value = str;
}

function convertNumbers(lang) {
    var e = document.getElementById("transl2");
    var txt = e.value;
    var roman_numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    if (lang == "gu") {
        var gu_numbers = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
        for (var i = 0; i < roman_numbers.length; i++) {
            txt = txt.replace(new RegExp(roman_numbers[i], 'g'), gu_numbers[i]);
        }
        e.value = txt;
        return;
    }

    if (lang == "hi" || lang == "sa") {
        var hi_numbers = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
        for (var i = 0; i < roman_numbers.length; i++) {
            txt = txt.replace(new RegExp(roman_numbers[i], 'g'), hi_numbers[i]);
        }
        e.value = txt;
        return;
    }

    if (lang == "pa") {
        var pa_numbers = ["੦", "੧", "੨", "੩", "੪", "੫", "੬", "੭", "੮", "੯"];
        for (var i = 0; i < roman_numbers.length; i++) {
            txt = txt.replace(new RegExp(roman_numbers[i], 'g'), pa_numbers[i]);
        }
        e.value = txt;
        return;
    }

    if (lang == "bn") {
        var bn_numbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        for (var i = 0; i <= roman_numbers.length; i++) {
            txt = txt.replace(new RegExp(roman_numbers[i], 'g'), bn_numbers[i]);
        }
        e.value = txt;
        return;
    }

}


export function kruti2unicode(str) {


    var array_one = new Array( //"kZsa", 
        // "(",")", 
        "ñ", "Q+Z", "sas", "aa", ")Z", "ZZ", "‘", "’", "“", "”",

        "å", "ƒ", "„", "…", "†", "‡", "ˆ", "‰", "Š", "‹",

        "¶+", "d+", "[+k", "[+", "x+", "T+", "t+", "M+", "<+", "Q+", ";+", "j+", "u+",
        "Ùk", "Ù", "ä", "–", "—", "é", "™", "=kk", "f=k",

        "à", "á", "â", "ã", "ºz", "º", "í", "{k", "{", "=", "«",
        "Nî", "Vî", "Bî", "Mî", "<î", "|", "K", "}",
        "J", "Vª", "Mª", "<ªª", "Nª", "Ø", "Ý", "nzZ", "æ", "ç", "Á", "xz", "#", ":",

        "v‚", "vks", "vkS", "vk", "v", "b±", "Ã", "bZ", "b", "m", "Å", ",s", ",", "_",

        "ô", "d", "Dk", "D", "£", "[k", "[", "x", "Xk", "X", "Ä", "?k", "?", "³",
        "p", "Pk", "P", "N", "t", "Tk", "T", ">", "÷", "¥",

        "ê", "ë", "V", "B", "ì", "ï", "M+", "<+", "M", "<", ".k", ".",
        "r", "Rk", "R", "Fk", "F", ")", "n", "/k", "èk", "/", "Ë", "è", "u", "Uk", "U",

        "i", "Ik", "I", "Q", "¶", "c", "Ck", "C", "Hk", "H", "e", "Ek", "E",
        ";", "¸", "j", "y", "Yk", "Y", "G", "o", "Ok", "O",
        "'k", "'", "\"k", "\"", "l", "Lk", "L", "g",

        "È", "z",
        "Ì", "Í", "Î", "Ï", "Ñ", "Ò", "Ó", "Ô", "Ö", "Ø", "Ù", "Ük", "Ü",

        "‚", "¨", "ks", "©", "kS", "k", "h", "q", "w", "`", "s", "¢", "S",
        "a", "¡", "%", "W", "•", "·", "∙", "·", "~j", "~", "\\", "+", " ः",
        "^", "*", "Þ", "ß", "(", "¼", "½", "¿", "À", "¾", "A", "-", "&", "&", "Œ", "]", "~ ", "@",
        "ाे", "ाॅ", "ंै", "े्र", "अौ", "अो", "आॅ")

    var array_two = new Array( //"ksaZ",
        //"¼","½", 
        "॰", "QZ+", "sa", "a", "र्द्ध", "Z", "\"", "\"", "'", "'",

        "०", "१", "२", "३", "४", "५", "६", "७", "८", "९",

        "फ़्", "क़", "ख़", "ख़्", "ग़", "ज़्", "ज़", "ड़", "ढ़", "फ़", "य़", "ऱ", "ऩ", // one-byte nukta varNas
        "त्त", "त्त्", "क्त", "दृ", "कृ", "न्न", "न्न्", "=k", "f=",

        "ह्न", "ह्य", "हृ", "ह्म", "ह्र", "ह्", "द्द", "क्ष", "क्ष्", "त्र", "त्र्",
        "छ्य", "ट्य", "ठ्य", "ड्य", "ढ्य", "द्य", "ज्ञ", "द्व",
        "श्र", "ट्र", "ड्र", "ढ्र", "छ्र", "क्र", "फ्र", "र्द्र", "द्र", "प्र", "प्र", "ग्र", "रु", "रू",

        "ऑ", "ओ", "औ", "आ", "अ", "ईं", "ई", "ई", "इ", "उ", "ऊ", "ऐ", "ए", "ऋ",

        "क्क", "क", "क", "क्", "ख", "ख", "ख्", "ग", "ग", "ग्", "घ", "घ", "घ्", "ङ",
        "च", "च", "च्", "छ", "ज", "ज", "ज्", "झ", "झ्", "ञ",

        "ट्ट", "ट्ठ", "ट", "ठ", "ड्ड", "ड्ढ", "ड़", "ढ़", "ड", "ढ", "ण", "ण्",
        "त", "त", "त्", "थ", "थ्", "द्ध", "द", "ध", "ध", "ध्", "ध्", "ध्", "न", "न", "न्",

        "प", "प", "प्", "फ", "फ्", "ब", "ब", "ब्", "भ", "भ्", "म", "म", "म्",
        "य", "य्", "र", "ल", "ल", "ल्", "ळ", "व", "व", "व्",
        "श", "श्", "ष", "ष्", "स", "स", "स्", "ह",

        "ीं", "्र",
        "द्द", "ट्ट", "ट्ठ", "ड्ड", "कृ", "भ", "्य", "ड्ढ", "झ्", "क्र", "त्त्", "श", "श्",

        "ॉ", "ो", "ो", "ौ", "ौ", "ा", "ी", "ु", "ू", "ृ", "े", "े", "ै",
        "ं", "ँ", "ः", "ॅ", "ऽ", "ऽ", "ऽ", "ऽ", "्र", "्", "?", "़", ":",
        "‘", "’", "“", "”", ";", "(", ")", "{", "}", "=", "।", ".", "-", "µ", "॰", ",", "् ", "/",
        "ो", "ॉ", "ैं", "्रे", "औ", "ओ", "ऑ")

    //Corrections for Spelling mistakes (see above under the first Array):
    // "sas","aa","ZZ","=kk","f=k",
    //
    // The following two characters are to be replaced through proper checking of locations:
    // "Z" )
    // "र्" (reph) 

    // "f" )
    // "ि"  

    if (str == '/eZa %') str = "/keZ%";


    var array_one_length = array_one.length;



    var modified_substring = str;


    //****************************************************************************************
    //  Break the long text into small bunches of max. max_text_size  characters each.
    //****************************************************************************************
    var text_size = str.length;



    var processed_text = ''; //blank

    var sthiti1 = 0;
    var sthiti2 = 0;
    var chale_chalo = 1;

    var max_text_size = 6000;


    while (chale_chalo == 1) {
        sthiti1 = sthiti2;

        if (sthiti2 < (text_size - max_text_size)) {
            sthiti2 += max_text_size;
            while (str.charAt(sthiti2) != ' ') {
                sthiti2--;
            }
        } else {
            sthiti2 = text_size;
            chale_chalo = 0
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

        if (modified_substring != "") // if stringto be converted is non-blank then no need of any processing.
        {
            for (var input_symbol_idx = 0; input_symbol_idx < array_one_length; input_symbol_idx++)

            {

                var idx = 0; // index of the symbol being searched for replacement

                while (idx != -1) //whie-00
                {

                    modified_substring = modified_substring.replace(array_one[input_symbol_idx], array_two[input_symbol_idx]);
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

            while (position_of_i != -1) //while-02
            {
                var character_next_to_i = modified_substring.charAt(position_of_i + 1);
                character_to_be_replaced = "f" + character_next_to_i;
                modified_substring = modified_substring.replace(character_to_be_replaced, character_next_to_i + "ि");
                position_of_i = modified_substring.search(/f/, position_of_i + 1) // search for i ahead of the current position.;

            } // end of while-02 loop

            //**********************************************************************************
            // Glyph3 & Glyph4: Ç  É
            // code for replacing "fa" with "िं"  and correcting its position too.(moving it two positions forward)
            //**********************************************************************************

            modified_substring = modified_substring.replace(/Ç/g, "fa"); // at some places  Ç  is  used eg  in "किंकर".
            modified_substring = modified_substring.replace(/É/g, "र्fa"); // at some places  É  is  used eg  in "शर्मिंदा"

            var position_of_i = modified_substring.indexOf("fa");

            while (position_of_i != -1) //while-02
            {
                var character_next_to_ip2 = modified_substring.charAt(position_of_i + 2);
                var character_to_be_replaced = "fa" + character_next_to_ip2;
                modified_substring = modified_substring.replace(character_to_be_replaced, character_next_to_ip2 + "िं")
                position_of_i = modified_substring.search(/fa/, position_of_i + 2) // search for i ahead of the current position.;

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

            while (position_of_wrong_ee != -1) //while-03

            {
                var consonent_next_to_wrong_ee = modified_substring.charAt(position_of_wrong_ee + 2);
                var character_to_be_replaced = "ि्" + consonent_next_to_wrong_ee;
                modified_substring = modified_substring.replace(character_to_be_replaced, "्" + consonent_next_to_wrong_ee + "ि");
                position_of_wrong_ee = modified_substring.search(/ि्/, position_of_wrong_ee + 2); // search for 'wrong ee' ahead of the current position. 

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

            while (position_of_R > 0) // while-04
            {
                var probable_position_of_half_r = position_of_R - 1;

                //alert(" 3. probable_position_of_half_r = "+probable_position_of_half_r );

                var character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);

                //alert(" 4. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );

                //************************************************************
                // trying to find non-maatra position left to current O (ie, half -r).
                //************************************************************

                while (set_of_matras.match(regExpEscape(character_at_probable_position_of_half_r)) != null) // while-05;
                // some vowel maatraa or anusvaar found, move to previous character
                {
                    probable_position_of_half_r = probable_position_of_half_r - 1;
                    character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);

                    //alert(" 5. probable_position_of_half_r = "+probable_position_of_half_r );
                    //alert(" 6. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );
                } // end of while-05

                //************************************************************
                // check if the previous character to the present character is a halant
                //************************************************************
                var previous_to_position_of_half_r = probable_position_of_half_r - 1;
                //alert(" 7. previous_to_position_of_half_r = "+previous_to_position_of_half_r );

                if (previous_to_position_of_half_r > 0) // if-03
                {
                    var character_previous_to_position_of_half_r = modified_substring.charAt(previous_to_position_of_half_r);
                    //alert(" 8. character_previous_to_position_of_half_r = "+character_previous_to_position_of_half_r );

                    while (character_previous_to_position_of_half_r && ("्".match(regExpEscape(character_previous_to_position_of_half_r)) != null)) // while-06
                    //    halant found, move to previous character
                    {
                        probable_position_of_half_r = previous_to_position_of_half_r - 1;
                        character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);

                        //alert(" 9. probable_position_of_half_r = "+probable_position_of_half_r );
                        //alert("10. character_at_probable_position_of_half_r = "+character_at_probable_position_of_half_r );

                        previous_to_position_of_half_r = probable_position_of_half_r - 1;
                        character_previous_to_position_of_half_r = modified_substring.charAt(previous_to_position_of_half_r);

                        //alert("11. previous_to_position_of_half_r = "+previous_to_position_of_half_r );
                        //alert("12. character_previous_to_position_of_half_r = "+character_previous_to_position_of_half_r );
                    } // end of while-06
                } // end of if-03

                //************************************************************

                character_to_be_replaced = modified_substring.substr(probable_position_of_half_r, (position_of_R - probable_position_of_half_r));
                var new_replacement_string = "र्" + character_to_be_replaced;
                character_to_be_replaced = character_to_be_replaced + "Z";
                modified_substring = modified_substring.replace(character_to_be_replaced, new_replacement_string);
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
        "ñ", "॰",
        "Q\+Z", "QZ\+",
        "sas", "sa",
        "aa", "a",
        "¼Z", "र्द्ध",
        "ZZ", "Z",

        "å", "०",
        "ƒ", "१",
        "\„", "२",
        "…", "३",
        "†", "४",
        "‡", "५",
        "\ˆ", "६",
        "‰", "७",
        "Š", "८",
        "\‹", "९",
        "¶+", "फ़्",
        "d+", "क़",
        "[+k", "ख़",
        "[+", "ख़्",
        "x+", "ग़",
        "T+", "ज़्",
        "t+", "ज़",
        "M+", "ड़",
        "\<+", "ढ़",
        "Q+", "फ़",
        "\;+", "य़",
        "j+", "ऱ",
        "u+", "ऩ",
        "Ùk", "त्त",
        "Ù", "त्त्",
        "ä", "क्त",
        "–", "दृ",
        "—", "कृ",
        "é", "न्न",
        "™", "न्न्",
        "\=kk", "\=k",
        "f\=k", "f\=",
        "à", "ह्न",
        "á", "ह्य",
        "â", "हृ",
        "ã", "ह्म",
        "ºz", "ह्र",
        "º", "ह्",
        "í", "द्द",
        "\{k", "क्ष",
        "\{", "क्ष्",
        "f\=", "त्रि",
        "\=k", "त्र",
        "\«", "त्र्",
        "Nî", "छ्य",
        "Vî", "ट्य",
        "Bî", "ठ्य",
        "Mî", "ड्य",
        "\<î", "ढ्य",
        "|", "द्य",
        "K", "ज्ञ",
        "}", "द्व",
        "J", "श्र",
        "Vª", "ट्र",
        "Mª", "ड्र",
        "\>ª", "ढ्र",
        "Nª", "छ्र",
        "Ø", "क्र",
        "Ý", "फ्र",
        "nzZ", "र्द्र",
        "æ", "द्र",
        "ç", "प्र",
        "Á", "प्र",
        "xz", "ग्र",
        "#", "रु",
        ":", "रू",
        "v‚", "ऑ",
        "vks", "ओ",
        "vkS", "औ",
        "vk", "आ",
        "v", "अ",
        "b±", "ईं",
        "Ã", "ई",
        "bZ", "ई",
        "b", "इ",
        "mQ", "ऊ",
        "m", "उ",
        "Å", "ऊ",
        "\,s", "ऐ",
        "\,", "ए",
        "½", "ऋ",
        "ô", "क्क",
        "d", "क",
        "Dk", "क",
        "D", "क्",
        "£", "र्f",
        "[k", "ख",
        "[", "ख्",
        "x", "ग",
        "Xk", "ग",
        "X", "ग्",
        "Ä", "घ",
        "?k", "घ",
        "?", "घ्",
        "³", "ङ",
        "p", "च",
        "Pk", "च",
        "P", "च्",

        "N", "छ",

        "\”k", "ज",
        "\”", "ज्",

        "t", "ज",
        "Tk", "ज",
        "T", "ज्",
        "\>", "झ",
        "÷", "झ्",
        "¥", "ञ",
        "ê", "ट्ट",
        "ë", "ट्ठ",
        "V", "ट",
        "B", "ठ",
        "ì", "ड्ड",
        "ï", "ड्ढ",
        "M+", "ड़",
        "\<+", "ढ़",
        "M", "ड",
        "\<", "ढ",
        "\.k", "ण",
        "\.", "ण्",
        "r", "त",
        "Rk", "त",
        "R", "त्",
        "Fk", "थ",
        "F", "थ्",
        "n", "द",
        "\/", "ध",
        "èk", "ध",
        "è", "ध्",
        "Ë  ", "ध्",
        "u", "न",
        "Uk", "न",
        "U", "न्",
        "iQ", "फ",
        "i", "प",
        "Ik", "प",
        "I", "प्",
        "¶", "फ्",
        "c", "ब",
        "Ck", "ब",
        "C", "ब्",
        "Hk", "भ",
        "H", "भ्",
        "e", "म",
        "Ek", "म",
        "E", "म्",
        "\;", "य",
        "\¸", "य्",
        "j", "र",
        "y", "ल",
        "Yk", "ल",
        "Y", "ल्",
        "G", "ळ",
        "oQ", "क",
        "o", "व",
        "Ok", "व",
        "O", "व्",

        "\'k", "श",
        "\'", "श्",

        "Ük", "श",
        "Ü", "श्",

        "\"k", "ष",
        "\"", "ष्",
        "l", "स",
        "Lk", "स",
        "L", "स्",
        "g", "ह",
        "È", "ीं",
        "z", "्र",
        "Ì", "द्द",
        "Í", "ट्ट",
        "Î", "ट्ठ",
        "Ï", "ड्ड",
        "Ñ", "कृ",
        "Ò", "भ",
        "Ó", "्य",
        "Ô", "ड्ढ",
        "Ö", "झ्",
        "Ø", "क्र",
        "Ù", "त्त्",
        "¼", "द्ध",
        "Ú", "फ्र",
        "É", "ह्न",

        "Ů", "त्त्",
        "Ľ", "द्ध",
        "˝", "ऋ",
        "Ř", "क्र",
        "Ń", "कृ",
        "Q", "फ़",
        "č", "ध्",
        "Ş", "्र",


        "\‚", "ॉ",
        "¨", "ो",
        "ks", "ो",
        "©", "ौ",
        "kS", "ौ",
        "k", "ा",
        "h", "ी",
        "q", "ु",
        "w", "ू",
        "\`", "ृ",
        "s", "े",
        "¢", "े",
        "S", "ै",
        "a", "ं",
        "¡", "ँ",
        "ˇ", "ँ",
        "%", "ः",
        "W", "ॅ",
        "•", "ऽ",
        "·", "ऽ",
        "∙", "ऽ",
        "·", "ऽ",
        "+", "़",
        "\\", "?",

        "\‘", "\"",
        "\’", "\"",
        "\“", "\'",
        // "\”" , "\'" ,

        "^", "\‘",
        "*", "\’",
        "Þ", "\“",
        "ß", "\”",
        "¾", "=",
        "&", "-",
        "μ", "-",
        "¿", "{",
        "À", "}",
        "A", "।",
        // "-" , "." ,
        "Œ", "॰",
        "]", "\,",
        "@", "\/",

        " ः", ":",
        "~", "्",
        "्ा", "",
        "ाे", "ो",
        "ाॅ", "ॉ",

        "अौ", "औ",
        "अो", "ओ",
        "आॅ", "ऑ")

    //**********************************************

    var array_one_length = array_one.length;

    var modified_substring = str;

    

    //****************************************************
    //  Break the long text into small bunches of chunk_size  characters each.
    //****************************************************
    var text_size = modified_substring.length;

    var processed_text = ''; //blank

    var sthiti1 = 0;
    var sthiti2 = 0;
    var chale_chalo = 1;

    var chunk_size = 6000; // this charecter long text will be processed in one go.
    var processed_text;
    while (chale_chalo == 1) {
        sthiti1 = sthiti2;

        if (sthiti2 < (text_size - chunk_size)) {
            sthiti2 += chunk_size;
            //      while (document.getElementById("legacy_text").value.charAt ( sthiti2 ) != ' ') {sthiti2--;} 
            //This was making problem if there is no 'space' in the whole document.
        } else {
            sthiti2 = text_size;
            chale_chalo = 0
        }

        var modified_substring = str.substring(sthiti1, sthiti2);

        Replace_Symbols_walk();

        processed_text = processed_text + modified_substring;

        
        return processed_text;

    }



    // --------------------------------------------------


    function Replace_Symbols_walk()

    {
        //substitute array_two elements in place of corresponding array_one elements

        if (modified_substring != "") // if stringto be converted is non-blank then no need of any processing.
        {

            modified_substring = modified_substring.replace(/([ZzsSqwa¡`]+)Q/g, "Q$1");

            for (var input_symbol_idx = 0; input_symbol_idx < array_one_length - 1; input_symbol_idx = input_symbol_idx + 2)

            {
                //******************************************************
                var idx = 0; // index of the symbol being searched for replacement

                while (idx != -1) //while-00
                {

                    modified_substring = modified_substring.replace(array_one[input_symbol_idx], array_one[input_symbol_idx + 1]);
                    idx = modified_substring.indexOf(array_one[input_symbol_idx]);

                } // end of while-00 loop

            } // end of for loop

            modified_substring = modified_substring.replace(/([ेैुूं]+)्र/g, "्र$1");
            modified_substring = modified_substring.replace(/ं([ाेैुू]+)/g, "$1ं");

            modified_substring = modified_substring.replace(/([ \n])ा/g, "$1श");


            modified_substring = modified_substring.replace(/¯/g, "f");
            modified_substring = modified_substring.replace(/Ł/g, "र्f");

            modified_substring = modified_substring.replace(/([fŻ])([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक्ष])/g, "$2$1");

            modified_substring = modified_substring.replace(/([fŻ])(्)([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक्ष])/g, "$2$3$1");

            modified_substring = modified_substring.replace(/([fŻ])(्)([कखगघङचछजझञटठडड़ढढ़णतथदधनपफबभमयरलवशषसहक्ष])/g, "$2$3$1");

            modified_substring = modified_substring.replace(/f/g, "ि");
            modified_substring = modified_substring.replace(/Ż/g, "िं");


            //following three statement for adjusting position of reph ie, half r .
            modified_substring = modified_substring.replace(/±/g, "Zं");

            modified_substring = modified_substring.replace(/([कखगघचछजझटठडड़ढढ़णतथदधनपफबभमयरलळवशषसहक्षज्ञ])([ािीुूृेैोौंँ]*)([Z])/g, "$3$1$2");

            modified_substring = modified_substring.replace(/([कखगघचछजझटठडड़ढढ़णतथदधनपफबभमयरलळवशषसहक्षज्ञ])([्])([Z])/g, "$3$1$2");

            modified_substring = modified_substring.replace(/Z/g, "र्");

        } // end of IF  statement  meant to  supress processing of  blank  string.

    } // end of the function  Replace_Symbols

} // end of chanakya2unicode function
