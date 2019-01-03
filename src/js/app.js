import $ from 'jquery';
import {parseCode} from './code-analyzer';
import * as flowchart from 'flowchart.js';

let settings ={

    'x': 80, 'y': 0,

    'line-width': 4, 'line-length': 50,

    'text-margin': 15,

    'font-size': 14, 'font-color': 'black',

    'line-color': 'black', 'element-color': 'black',

    'fill': '',

    'yes-text': 'T', 'no-text': 'F',

    'arrow-end': 'block', 'scale': 1.1,

    'symbols': { // style symbol types

        'start': { 'font-color': 'black', 'element-color': 'green', 'fill': 'white', 'font-size': '0' }

    },

    'flowstate': { 'feasible': {'fill': '#A8D18D', 'font-size': 13} }

};

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let params = $('#paramsPlaceHolder').val();
        let parsedCode = parseCode(codeToParse,params);
        console.log(JSON.stringify(parsedCode,null,2));
        $('#cfg').text('');
        flowchart.parse(parsedCode).drawSVG('diagram',settings);
    });
});
