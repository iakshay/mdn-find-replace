var fs = require('fs'),
    system = require('system');

var urls = [];
/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};



// http://stackoverflow.com/a/8260383/1173425
function youtube_parser(url){
  var regExp =  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
  var match = url.match(regExp);
  if (match && match[1].length == 11) {
    return match[1];
  }
}



function follow(url, callback) {
    var page = require('webpage').create();
    console.log('Loading', url);
    page.open(url, function(status) {
        if ( status === 'success' ) {
                console.log($('.user-state-profile').text());
                var content = CKEDITOR.instances['id_content'].getData();
                var $content = $('<div></div>').html(content);
                var $iframes = $content.find('iframe');
                $iframes.each(function() {
                  var src = $(this).attr('src');
                  var vid = youtube_parser(src)
                  if(vid) {
                    $(this).before("{{ EmbedYouTube('" + vid +"') }}");
                    $(this).remove();
                  }
                });
                CKEDITOR.instances['id_content'].setData($content.html());
                $content.remove();
                $('.btn-save-and-edit').first().click();
                waitFor(function() {
                // wait for success notification
                return page.evaluate(function() {
                  return $('.notification.success').length;
                });
                }, function() {
                  console.log('Done', url);
                  phantom.exit();
                });
        }else {
          console.log(status);
        }
    });
}

function process() {
    if (urls.length > 0) {
        var url = urls[0] + '$edit';
        urls.splice(0, 1);
        follow(url, process);
    } else {
        phantom.exit();
    }
}

function run() {
  phantom.addCookie({
    'name': 'sessionid',
    'value': 'c5f351c2d6f7f8aa104243e9f000e6ba',
    'domain': 'developer.mozilla.org'
  });
  try {
    var content = fs.read('urls.txt');
    urls = content.split('\n');
    process();
  } catch(e) {
    console.log(e);
  }
}

run();
