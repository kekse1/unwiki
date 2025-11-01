#!/usr/bin/env bash

# 
# Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
# https://kekse.biz/
#

#
# only to test this script!!1
# ... set to (0) for real production phase.. ^_^
#
_SIMULATE=0

#
_input="test.xml"
_output="test.txt"
# these are passed 'as is'..
_html=yes
_special=yes
_separator=10
_buffer=$((1024*64))
_encoding="utf8"
_round=1

#
real="$(realpath "$0")"
dir="$(dirname "$real")"
test="$(realpath "${dir}/test")"

#
custom=""; for i in "$@"; do
	ext="${i,,}"; [[ "${ext: -4}" == ".xml" ]] || i+=".xml"
	[[ "${i::1}" != "/" && "${i::2}" != "./" && "${i::3}" != "../" ]] \
		&& i="${test}/${i}"
	if [[ -f "$i" ]]; then
		custom="$(basename "$i" .xml)"
		_input="$i"
		_output="${custom}.txt"
		_custom=1
	fi
done

[[ $_SIMULATE -eq 0 ]] || echo -e "We're JUST SIMULATING all operations! ^_^\n"

[[ -z "$custom" ]] || echo -e "Using custom I/O files:"
_input="${test}/${_input}"
_output="${test}/${_output}"
echo -e " Input: '${_input}'"
echo -e "Output: '${_output}'"
echo

#
exists=0; [[ -e "$_output" ]] && exists=1

#
if [[ $# -eq 0 ]]; then
	if [[ $exists -eq 0 ]]; then
		echo -e "Test will start \`unwiki\` routine (no previous result stored)."
		echo -e "\n\tNext operation:\tTEST\n"
	else
		echo -e "Running this one will \`rm\` previous test output file (it exists)."
		echo -e "\n\tNext operation:\tDELETE\n"
	fi
	echo -e "To continue, argue with arbitrary argument(s)!\n"
	echo -e "If(!) one argument is a valid file path, it'll be used for in/out files."
	echo -e "Absolute paths and relatives './' and '../' will be resolved from \`pwd\`,"
	echo -e "all other paths will be resolved from: '${test}'"
	exit
fi

#
if [[ $exists -ne 0 ]]; then
	echo -e "\nPrevious output file already exists, so we're only deleting it here/now!"

	if [[ $_SIMULATE -eq 0 ]]; then
		rm "$_output" 2>/dev/null

		if [[ $? -eq 0 ]]; then
			echo -e "DONE! :-)"
		else
			echo -e "FAILED! :-("
			exit 1
		fi
	fi
	
	exit
fi


cmd="$(which node) '${dir}/main.js' '${_input}' '${_output}' --html ${_html} --special ${_special} --separator '${_separator}' --buffer ${_buffer} --encoding '${_encoding}' --round ${_round}"
echo -e "\t\`${cmd}\`\n"; [[ $_SIMULATE -eq 0 ]] && eval "$cmd"

