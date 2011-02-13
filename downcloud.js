var http = require('http'),
    url  = require('url'),
    util  = require('util'),
    qs   = require('querystring');

var consumerKey = 'YOUR_CONSUMER_KEY';

var server = new http.Server();
var resolverUrl = 'http://api.soundcloud.com/resolve?consumer_key=' + consumerKey + '&url='

function request(method, uri, callback, errback) {
  var uri = url.parse(uri);

  var pathname = uri.pathname;
  if (uri.search) {
    pathname += uri.search;
  }

  var req = http.request({
      method: method,
      port: 80,
      host: uri.host,
      path: pathname,
      headers: {
        accept: 'application/json'
      }
    }, function (res) {
      var body = "";
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        callback(res, body);
      });
    }).on('error', errback);
  req.end();
};

function realrequest(method, uri, callback, errback) {
  var uri = url.parse(uri);

  var pathname = uri.pathname;
  if (uri.search) {
    pathname += uri.search;
  }

  var req = http.request({
      method: method,
      port: 80,
      host: uri.host,
      path: pathname,
      headers: {
        accept: 'application/json'
      }
    }, function (res) {
      callback(res);
    }).on('error', errback);
  req.end();
};

function get(path, callback, errback) {
  request('GET', path, callback, errback);
}

function head(path, callback, errback) {
  request('HEAD', path, callback, errback);
}

function redirector(method, path, callback, errback) {
  request(method, path, function(res, body) {
    if (res.headers['location']) {
      redirector(method, res.headers['location'], callback, errback);
    } else {
      callback(path, res, body);
    }
  }, errback);
}

function onedirect(method, path, callback, errback) {
  request(method, path, function(res, body) {
    if (res.headers['location']) {
      callback(res.headers['location']);
    }
  }, errback);
}

function downloadableTracks(tracks) {
  return tracks.filter(function (track) {
    return track['downloadable'];
  });
}

function tracksDownloadUris(tracks) {
  return tracks.map(function (track) {
    return downloadUri(track);
  });
}

function downloadUri(track) {
  return track['uri'] + '/download?consumer_key=' + consumerKey;
}

function playlistDownloadUris(playlist) {
  return tracksDownloadUris(downloadableTracks(playlist['tracks']));
}

function addFileInfo(track, callback) {
  var dl = downloadUri(track);
  redirector('HEAD', dl,
    function(url, res, body) {
      if (res.headers['content-disposition']) {
        track['original_filename'] = res.headers['content-disposition'].match(/"(.*)"/)[1];
      } else {
        track['original_filename'] = track['title'] + '.' + track['original_format'];
      }
      track['content-length'] = res.headers['content-length'];
      track['url'] = url;
      callback(track);
    },
    function(e) {
      console.log(e);
    });
}

function resourceLength(uri) {
  return 808;
}

function augmentTracks(playlist, callback, errback) {
  var tracks = playlist['tracks'] || [];
  if (tracks.length === 0) {
    errback(playlist);
  } else {
    var tracks = downloadableTracks(tracks);

    var output = [];

    tracks.map(function (track) {
      addFileInfo(track, function (augmented) {
        output.push(augmented);
        if (output.length == tracks.length) {
          callback(output);
        }
      });
    });
  }
}

function manifesto(tracks) {
  return tracks.map(function (track) {
    var dlUri = track['download_url'].replace(/http\:\/\/api\.soundcloud\.com/, '/-');
    return [ '-', track['content-length'], dlUri, track['original_filename'] ].join(' ');
  }).join('\n');
}

server.on('request', function (request, response) {
  if (request.url.match(/^\/-\//)) {
    var u = request.url.replace(/^\/-\//, "http://api.soundcloud.com/") + '?consumer_key=' + consumerKey;

    response.writeHead(200, {});
    onedirect('GET', u, function(url) {
      realrequest('GET', url, function (res) {
      util.pump(res, response, function (e) {
        response.end();
      });
      }, function (e) {
        console.log(e);
      });
    }, function (e) {
      console.log(e);
    });
  } else {
    var playlistUrl = url.parse(request.url, true);
        playlistUrl.host     = 'soundcloud.com';
        playlistUrl.protocol = 'http';

    resolvePlaylistPath = resolverUrl + qs.escape(url.format(playlistUrl));

    redirector('GET', resolvePlaylistPath, function(url, res, body) {
        var playlist = JSON.parse(body);
        augmentTracks(playlist, function (augTracks) {
          var body = manifesto(augTracks);
          // response.writeHead(200, {'Content-Length': body.length});
          response.writeHead(200, {
            'X-Archive-Files': 'zip',
            'Content-Disposition': 'attachment; filename=' + playlist['title'].replace(/\W+/g, '') + '.zip;',
            'Content-Length': body.length
          });
          response.end(body + '\n');
        },
        function (playlist) {
          console.log(playlist);
          if (!playlist || playlist['error']) {
            var body = 'There is no set.';
            response.writeHead(200, {'Content-Length': body.length});
            response.end(body + '\n');
          } else {
            var body = 'Set has no downloadable tracks. Sorry about that!';
            response.writeHead(200, {'Content-Length': body.length});
            response.end(body + '\n');
          }
        });
      },
      function (e) {
        response.writeHead(200, {'content-length': body.length});
        response.end(body);
      });
  }
}).listen(1234);
