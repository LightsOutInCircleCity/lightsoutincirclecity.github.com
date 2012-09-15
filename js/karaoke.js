(function() {
  if ($.browser.msie || $.browser.opera || $.browser.mozilla) {
    window.location.href =
        'http://triggerman.bandcamp.com/album/lights-out-in-circle-city';
    return;
  }

  var albumId = '3614467309';
  var k = (function() {
    var _0x132d=["\x67","\x79","\x72","\x64","\x69","\x6C","\x6C","\x6B",
      "\x6C","\x69","\x66","\x72","\x61","\x6D","\x61","\x6B","\x74","\x68",
      "\x61","\x73","\x6C","\x61","\x73","\x65","\x64","\x75"];
    return _0x132d.join('');
  }());

  var trackOrder = [
    "01_TooNice",
    "02_AmenitiesExtremities",
    "03_BluntTrauma",
    "04_CircleCity",
    "05_Fusebox",
    "06_WanderingAndWondering"
  ];

  var controller = new BCAlbumController({
    k: k,
    albumId: albumId
  });
  $('title').text('(Loading) Lights Out in Circle City');

  $('#menu').delegate('#prev', 'click', function() {
    controller.prev();
    return false;
  });

  $('#menu').delegate('#next', 'click', function() {
    controller.next();
    return false;
  });

  $('#menu').delegate('#pp', 'click', function() {
    controller.playPause();
    return false;
  });

  $('#menu').delegate('#more_menu', 'click', function(e) {
    var $link = $(e.currentTarget);
    $link.toggleClass('open');
    $('#extended_menu').toggleClass('hidden');
    return false;
  });

  $('#extended_menu').delegate('a.seekToTrack', 'click', function(e) {
    var index = $('a.seekToTrack').index($(e.currentTarget));
    var $track = $('audio').eq(index);
    controller.seekTo($track);
    return false;
  });

  $(window).bind('keypress', function(e) {
    if (e.keyCode !== 32) return;
    e.preventDefault();
    controller.playPause();
  });

  var pendingStep;
  $(window).bind('paused.bc', function() {
    $('#menu #pp').attr('class', 'play');
    clearTimeout(pendingStep);
    pendingStep = null;
  });

  $(window).bind('playing.bc', function() {
    $('#menu #pp').attr('class', 'pause');
  });

  $(window).bind('gotAudio.bc', function() {
    var needsLoad = $('audio').length;
    var hasLoaded = 0;
    $('audio').bind('canplaythrough', function() {
      hasLoaded++;
      $('#cover p').html('Preloaded ' + hasLoaded + ' of 6 songs. Click to continue&hellip;');
      if (hasLoaded >= needsLoad) {
        $('#cover p').html('Click to continue&hellip;');
        $('title').text('Lights Out in Circle City');
      }
    });
  });

  $('#songs').delegate('h1', 'click', function(e) {
    var index = $(this).parent('li').index();
    var trackClicked = $(this).parent('li').attr('id').replace('T', '');
    var $audio = $('audio').eq(index);
    controller.seekTo($audio);
  });

  $('#songs').delegate('.word', 'click', function() {
    var index = $(this).parents('li').index();
    var $audio = $('audio').eq(index);

    var wordIndex = $(this).attr('class').split(' ')[0];
    var offset = $(this).attr('data-start') / 1000;

    controller.seekTo($audio, offset);
  });

  var songs = [];
  var stanzas = [];
  var lines = [];
  var str = '';
  var words = [];

  // Best var name
  var song$words = [];

  var build = function() {
    $.each(trackOrder, function(i) {
      var track = trackOrder[i];
      var song = lyrics[track];
      var timings = song.timings;
      var numWords = 0;
      $.each(timings, function(i) {
        str += '<span class="'+i+' word" data-start="'+timings[i].start+'">'+
            timings[i].word+'</span> ';
        if (timings[i].line) {
          lines.push(str);
          str = '';
        }
        if (timings[i].end) {
          stanzas.push(lines);
          lines = [];
        }
      });
      songs.push(stanzas);
      stanzas = [];
      numWords++;
    });

    for (var i = 0; i < songs.length; i++) {
      var song = songs[i];
      var line;
      for (var j = 0; j < song.length; j++) {
        var stanza = song[j];
        line = stanza.join('<br>');
        $('li#T'+trackOrder[i]+'').append('<p>'+line+'</p>');
      }
      song$words.push($('li#T'+trackOrder[i]+' .word'));
    }
  };

  var audio = null;
  var currentTrack = null;
  var currentTrackIndex = null;
  var $currentTrack = null;
  var $currentWord = null;
  var $lastWord = null;

  var triggerLine = false;
  var stepWord = function(desiredWordIndex, offset, wordStart) {
    $currentWord = song$words[currentTrackIndex].eq(wordIndex);
    if ($lastWord) $lastWord.removeClass('active');
    if (triggerLine) {
      $(window).trigger('newLine.karaoke', $currentWord);
      triggerLine = false;
    }
    var delta = Math.round(wordStart - offset);
    if (delta > 10) return;

    $currentWord.addClass('active');
    wordIndex++;
    $lastWord = $currentWord;
    $currentWord = song$words[currentTrackIndex].eq(wordIndex);
    if (currentTrack.timings[wordIndex - 1].line) {
      triggerLine = true;
    }
  };

  var wordIndex = 0;
  $(window).bind('seekedTo.bc', function(e, opts) {
    var $audio = opts.audio;
    var offset = opts.offset;

    if ($currentWord) $currentWord.removeClass('active');
    if ($lastWord) $lastWord.removeClass('active');
    $currentWord = null;
    $lastWord = null;

    clearTimeout(pendingStep);
    pendingStep = null;

    wordIndex = 0;
    var audio = $audio;
    var currentMs = offset * 1000;
    var trackIndex = $('audio').index($audio);
    $currentTrack = $('#songs li').eq(trackIndex);
    var trackSlug = $currentTrack.attr('id').replace('T', '');
    $('#song_container').attr('class', null).addClass($currentTrack.attr('id'));

    currentTrack = lyrics[trackSlug];
    currentTrackIndex = trackIndex;

    while (currentTrack.timings[wordIndex].start <= currentMs) {
      wordIndex++;
    }

    wordIndex = Math.max(wordIndex - 1, 0);

    $currentWord = song$words[trackIndex].eq(wordIndex);
    triggerLine = true;
    stepWord(wordIndex, currentMs, currentTrack.timings[wordIndex].start);
  });

  $(window).bind('timeupdate.bc', function(e, audio) {
    var $audio = $(audio);
    if (!currentTrack) return;
    if (wordIndex > currentTrack.timings.length - 1) return;
    var currentMs = audio.currentTime * 1000;
    var nextWordStart = currentTrack.timings[wordIndex].start;
    var delta = Math.round(nextWordStart - currentMs);
    if (nextWordStart <= currentMs) {
      clearTimeout(pendingStep);
      pendingStep = null;
      stepWord(wordIndex, currentMs, nextWordStart);
    } else if (nextWordStart > currentMs && delta < 250) {
      clearTimeout(pendingStep);
      pendingStep = setTimeout(function() { stepWord(wordIndex, currentMs + delta, nextWordStart); }, delta);
    }
  });

  var $container = $('ul#songs');
  $(window).bind('newLine.karaoke', function(e, currentWord) {
    var $currentWord = $(currentWord);
    var currentMargin = $container.css('-webkit-transform');
    var fromTop = $currentWord.position().top;
    var normalizedY = ($container.data('transforms') || {}).translateY || 0;
    fromTop += normalizedY;
    var threshold = 100;
    if (fromTop !== threshold) {
      var newTranslate = Math.min(0, normalizedY - (fromTop - threshold));
      $container.css('translateY', newTranslate);
    }
  });

  build();
}());
