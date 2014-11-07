'use strict';

var _pdf;
var _index = 1;
var _totalPages;
var _chapter = 0;
var _chapters;

//
// Fetch the PDF document from the URL using promises
//
// http://cran.r-project.org/doc/manuals/R-intro.pdf

var init = function(url){

    PDFJS.getDocument(url).then(function(pdf) {

        _pdf = pdf;

        _totalPages = pdf.pdfInfo.numPages;

        generatePages(document.getElementById("pages"));

        document.getElementById('totalPages').innerHTML = _totalPages;

        pdf.getOutline().then( function (outline) { //console.log(outline);

                if(!outline) {
                    console.warn("No document outline available.");
                    document.getElementById('info').innerHTML = "No chapters data available in this document.";
                    showPage();
                    return;
                }

                pdf.getDestinations().then( function (destinations) { //console.log(destinations);

                        var pageIndexPromises = [];

                        for(var i=0; i< outline.length; i++){
                            var chapterDestination = destinations[outline[i].dest][0];
                            pageIndexPromises.push(pdf.getPageIndex(chapterDestination));
                        }

                        globalScope.Promise.all(pageIndexPromises).then(
                            function (results) {

                                _chapters = results.sort(function(a,b){return a-b});
                                for(var i = 0; i<_chapters.length; i++){
                                    _chapters[i]++;
                                }
                                if(_chapters[0]>1) {
                                    _chapters.unshift(1);
                                }
                                console.log(_chapters);

                                showPage();
                            },
                            function (cause) {
                                console.error(cause);
                                showPage();
                            }
                        );

                        /*pdf.getPageIndex(destinations["Dynamic graphics"][0]).then(
                         function (index) {
                         console.log(index);
                         _index = index+1;
                         showPage();
                         },
                         function () {
                         console.log("getPageIndex rejected");
                         }
                         )*/
                    },
                    function () {
                        console.log("dest rejected");
                        showPage();
                    }
                )

            },
            function (err) {
                console.log("Document outline error: " + err.toString());
                showPage();
            }
        );

    });

};

var _updateButtons = function () {

    if(_index<=1){
        _index = 1;
        document.getElementById('pp').disabled = true;
    }else{
        document.getElementById('pp').disabled = false;
    }

    if(_index>=_totalPages){
        _index = _totalPages;
        document.getElementById('np').disabled = true;
    }else{
        document.getElementById('np').disabled = false;
    }

    if(_chapters) {
        if (_chapter <= 0) {
            _chapter = 0;
            document.getElementById('pc').disabled = true;
        } else {
            document.getElementById('pc').disabled = false;
        }
        if (_chapter >= _chapters.length - 1) {
            _chapter = _chapters.length - 1;
            document.getElementById('nc').disabled = true;
        } else {
            document.getElementById('nc').disabled = false;
        }
    }else{
        document.getElementById('pc').disabled = true;
        document.getElementById('nc').disabled = true;
    }
};

var generatePages = function (container) {

    var pagesPromises = [];

    for(var i=1; i<=_totalPages; i++) {
        var p = _pdf.getPage(i);
        pagesPromises.push(p);
    }

    globalScope.Promise.all(pagesPromises).then(
        function (pages) {

            for(var i=0; i<pages.length; i++) {

                var page = pages[i];

                var scale = .4;
                var viewport = page.getViewport(scale);

                var section = document.createElement('section');

                //
                // Prepare canvas using PDF page dimensions
                //
                var canvas = document.createElement('canvas');
                canvas.id = "page" + (i+1);
                console.log(canvas.id);
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                section.appendChild(canvas);
                container.appendChild(section);

                //
                // Render PDF page into canvas context
                //
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext);
            }

            pageFlip();
        },
        function (cause) {
            console.error(cause);
        }
    );
};


var showPage = function () {

    return;

    // Using promise to fetch the page
    _pdf.getPage(_index).then(function(page) {

        document.getElementById('currPage').innerHTML = _index.toString();

        var scale = .1;
        var viewport = page.getViewport(scale);

        var loading = document.getElementById('loading');
        loading.style.display = "none";

        //
        // Prepare canvas using PDF page dimensions
        //
        var canvas = document.getElementById('the-canvas');
        var link = document.getElementById('link');
        canvas.style.display = link.style.display = "block";
        var context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        //
        // Render PDF page into canvas context
        //
        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext);

        _updateButtons();
    });
};

var nextPage = function () {

    if(_index>=_totalPages) return;

    _index++;

    if(_chapters && _chapters[_chapter]<_index){
        _chapter++;
    }

    showPage()
};
var prevPage = function () {

    if(_index<=1) return;

    _index--;
    if(_chapters &&_chapters[_chapter]>_index){
        _chapter--;
    }

    showPage()
};
var nextChap = function () {

    if(!_chapters || _chapter>=_chapters.length-1) return;

    _chapter++;
    _index = _chapters[_chapter];

    showPage()
};
var prevChap = function () {

    if(!_chapters || _chapter<=0) return;

    _chapter--;
    _index = _chapters[_chapter];

    showPage()
};

