#!/bin/sh
# (Re)start the production server of this worktree on a port (default 3301).
PORT=${1:-3301}
DIR=$(cd "$(dirname "$0")/../.." && pwd)
PID=$(lsof -tiTCP:$PORT -sTCP:LISTEN)
[ -n "$PID" ] && kill $PID && sleep 1
cd "$DIR" && nohup node node_modules/next/dist/bin/next start -p $PORT > /tmp/claude-501/webgl-$PORT.log 2>&1 &
for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null localhost:$PORT/ && break; sleep 0.5; done
echo "serving $DIR on $PORT"
