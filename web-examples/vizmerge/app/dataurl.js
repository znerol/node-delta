define(function() {
    /**
     * Encode a UTF-8 string into base64
     * https://developer.mozilla.org/en/DOM/window.btoa
     *
     * Does not work in internet explorer (lack of btoa). Would neet to
     * implement that in plain JavaScript.
     */
    function utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    function dataurl(mime, content) {
        return 'data:' + mime + ';charset=UTF-8;base64,' + utf8_to_b64(content);
    }

    return dataurl;
});
