#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )"

dist=uprok-`date +%Y-%m-%d`

rm -rf $dist
mkdir $dist 

cd ..

cp index.html publish/$dist/
cp -r scripts publish/$dist/
cp -r css publish/$dist/
cp -r fonts publish/$dist/
cp -r settings publish/$dist/
mkdir publish/$dist/sounds
mkdir publish/$dist/sounds/js
cp sounds/*.ogg publish/$dist/sounds/
cp sounds/js/* publish/$dist/sounds/js/

cd publish

zip -r $dist.zip $dist 

rsync -r -a -v -e "ssh" $dist/* joeba.in:/var/www/joeba.in/node/public/subs/uprok/
