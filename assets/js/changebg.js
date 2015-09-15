"use strict";
function search_array(data, value) {
	var result;
	if (data.skins) {
		if (data.skins.length > 0) {
			for (var i=0;i<=data.skins.length;i++) {
				if (data.skins[i].name.toLowerCase() == value.toLowerCase()) {
					return data.skins[i].backgroundBlurred;
				}
			}
		}
	}
}

$(document).ready(function(){

	$.extend({
		getUrlVars: function(){
			var vars = [], hash;
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			for(var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
			}
			return vars;
		},
		getUrlVar: function(name){
			return $.getUrlVars()[name];
		}
	});

	var search = $.getUrlVar('s');

	$.getJSON( 'skins.json', {
		tags: "skins",
		tagmode: "any",
		format: "json"
	}).done(function( data ) {
		
		var bg = search_array(data, search);

		if (bg != "") 
			$('body').css("background-image", "url('"+bg+"')");

	});


	

});