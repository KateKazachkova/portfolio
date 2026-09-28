#!/bin/zsh
# The whole regression (HANDOFF §8), one script after another, against the
# running build on :3301 (rebuild first): logs and summary.txt under
# ~/portfolio-test-output/regression. ≈75 min.  zsh scripts/room/regression.sh
cd ~/Documents/portfolio-webgl
L=${ROOM_TESTS:-$HOME/portfolio-test-output}/regression; mkdir -p $L; rm -f $L/summary.txt
S=http://localhost:3301
pkill -f 'user-data-dir=/tmp/cdp-room-'
run() { local n=$1; shift; echo "== $n $(date +%H:%M:%S) load $(sysctl -n vm.loadavg)" >> $L/summary.txt; caffeinate -dims "$@" > $L/$n.log 2>&1; echo "   rc=$?" >> $L/summary.txt; }
run hits node scripts/room/hits-test.mjs $S
run nav node scripts/room/nav-test.mjs $S
run stops node scripts/room/check-stops.mjs $S
run stops1280 node scripts/room/check-stops.mjs $S 1280x800
run flight-dom node scripts/room/flight-dom.mjs $S
run flash-day node scripts/room/flash.mjs $S gl
python3 scripts/room/flashes.py ~/portfolio-test-output/webgl-m1/flash-gl > $L/flash-day.json
NIGHT=1 run flash-night node scripts/room/flash.mjs $S gl
python3 scripts/room/flashes.py ~/portfolio-test-output/webgl-m1/flash-gl-night > $L/flash-night.json
NIGHT=1 LAMP=off run flash-torch node scripts/room/flash.mjs $S gl
python3 scripts/room/flashes.py ~/portfolio-test-output/webgl-m1/flash-gl-night > $L/flash-torch.json
run bench2 node scripts/room/bench.mjs $S gl 2
run bench15 node scripts/room/bench.mjs $S gl 1.5
run bench1 node scripts/room/bench.mjs $S gl 1
run cold node scripts/room/cold.mjs $S gl 2
run compare-day node scripts/room/compare.mjs $S $L/compare-day 1512x860 2
NIGHT=1 run compare-night node scripts/room/compare.mjs $S $L/compare-night 1512x860 2 --night
run mem node scripts/room/mem.mjs $S
run profile-edge node scripts/room/profile-edge.mjs $S
run offduty-edge node scripts/room/offduty-edge.mjs $S
run u15-edge node scripts/room/u15-edge.mjs $S
run stacks-edge node scripts/room/stacks-edge.mjs $S
run bud-edge node scripts/room/bud-edge.mjs $S
run resident node scripts/room/resident.mjs $S
run turn-leave node scripts/room/turn-leave.mjs $S
run ribbons-gl node scripts/room/ribbons-gl.mjs $S
run od-gl node scripts/room/od-gl.mjs $S
run stacks-hover node scripts/room/stacks-hover.mjs $S
run binder-turn node scripts/room/binder-turn.mjs $S
run clock-return node scripts/room/clock-return.mjs $S
echo "DONE $(date +%H:%M:%S)" >> $L/summary.txt
