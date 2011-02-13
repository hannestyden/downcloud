# DownCloud

Zip a SoundCloud set.

# Setup

## Requirements

- node v0.4.0
- nginx v0.8.53
- nginx mod\_zip v1.1.6

Get the code, and everything in its right place.

    $ cd ~/code
    $ git clone git://github.com/hannestyden/downcloud.git

Edit line 6 of `downcloud.js` to contain your consumer key.

    var consumerKey = 'YOUR_CONSUMER_KEY';

Get downcloud.com into your /etc/hosts

    $ sudo echo -e "# DownCloud\n127.0.0.1 downcloud.com" >> /etc/hosts

Start the servers. Needs to sudo since it binds to port 80.

    $ sudo /tmp/nginx/sbin/nginx -c ~/code/downcloud/nginx.conf.default
    $ node downcloud.js

# Usage

- Navigate to your favorite SoundCloud set.
- Change the host from `soundcloud.com` to `downcloud.com`.
- Unzip.
- Enjoy.

# Bookmarklet

Use this bookmarklet (couldn't get the link to work with GitHub README):

    javascript:location.href=location.href.replace\('soundcloud.com','downcloud.com'\);

# Credits

This would not have been possible without the help I got from Sebastian Ohm and Alexander Simmerl. Thanks guys!

# Questions

hannes at soundcloud.com
