#!/usr/bin/env bash
#xvfb-run --server-num 37 --server-args='-screen 0, 1920x1080x24'
Xvfb :37 -screen 0 1920x1080x24 > /dev/null 2>&1 &
XPID=$!
export DISPLAY=:37.0
# ffmpeg -y -f x11grab -video_size 1920x1080 -i :37 \
# -codec:v libx264 -r 12 /tmp/screenshots/video.mp4 &
npm run test:e2e-single
EXITCODE=$?
# ffmpeg -nostdin -y -video_size 1920x1080 -framerate 30 -f x11grab -i :37.0 -c:v libx264rgb -crf 0 -preset ultrafast -color_range 2 /tmp/screenshots/output.mkv &
# ffmpeg -nostdin -y -r 30 -g 300 -f x11grab -s 1920x1080 -i "$DISPLAY" -vcodec qtrle /tmp/screenshots/out.mov &
kill $XPID
exit $EXITCODE
