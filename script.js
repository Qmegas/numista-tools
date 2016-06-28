// ==UserScript==
// @name       Numista usefull tools
// @namespace  http://qmegas.info/numista
// @version    0.4
// @description  Adds some additional tools for Numista
// @include    http://en.numista.com/catalogue/*
// @include    http://en.numista.com/echanges/*
// @copyright  Megas (qmegas.info)
//
// @require    http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
//
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
//
// ==/UserScript==

(function ($) {
	var loading_image = '<img width="16" height="11" alt="Loading..." src="data:image/gif;base64,R0lGODlhEAALAPQAAP///xmr1t3y+NTu9uv3+h6s1hmr1kK63Y7V6m/K5cDn8ze221vD4ZXY63PL5cTp8zu32xys1l/E4uj2+tvx+PT6/Eu93t/y+PP6/L3m8qnf78/t9e/4+wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7AAAAAAAAAAAA" />';
	
	var _settings = {
        filter_commemorative: false,
        filter_silver_gold: false
    };
	
	var settings = (function(){
		function initSettings() {
			_settings.filter_silver = GM_getValue("filter_silver", false);
			_settings.filter_gold = GM_getValue("filter_gold", false);
			GM_addStyle(".qmegas-label { margin-left:10px; }");
			GM_addStyle(".qmegas-filter-box { margin-top:10px; }");

			GM_addStyle("#echanges tr:not(.en_tete_doubles):not(.cochee):nth-child(even) { background-color: #eee; }");
			GM_addStyle("#echanges tr:not(.en_tete_doubles):hover { background-color: #E0E0FF; }");

			GM_addStyle(".collection { border-collapse: collapse; }");
			GM_addStyle(".collection tr { border-bottom: 1px dashed #999; }");
			GM_addStyle(".collection tr:nth-child(even) { background-color: #eee; }");
			GM_addStyle(".collection tr:hover { background-color: #E0E0FF }");
			GM_addStyle(".collection tr td { padding: 3px; vertical-align: initial;	}");
		}
		
		function setOption(key, value) {
			GM_setValue(key, value);
			_settings[key] = value;
		}
	
		return {
			init: initSettings,
			set: setOption
		};
	})();
	
	var searchFilter = (function(){
		function init(){
			drawFilters();
			applyFilters();
		}
		
		function applyFilters() {
			$(".resultat_recherche").each(function() {
				var found = false, $this = $(this);

				if (_settings.filter_silver) {
					var s = $this.text();
					if (s.indexOf("Silver") > -1) {
						found = true;
					}
				}

				if (!found && _settings.filter_gold) {
					var s = $this.text();
					if (s.indexOf("Gold") > -1) {
						found = true;
					}
				}

				if (found) {
					$this.hide();
				} else {
					$this.show();
				}
			});
		}
		
		function drawFilters() {
			var $form = $("#form_recherche tfoot tr");

			if ($form.length == 0) {
				return;
			}

			var html, f_silver = _settings.filter_silver ? "checked" : "",
				f_gold = _settings.filter_gold ? "checked" : "";

			html = '<div class="qmegas-filter-box">Filters: ' + 
					'<label class="qmegas-label"><input type="checkbox" id="qmegas_filter_silver" data-var="filter_silver" ' + f_silver + 
					'> Hide silver coins</label>' + 
					'<label class="qmegas-label"><input type="checkbox" id="qmegas_filter_gold" data-var="filter_gold" ' + f_gold + 
					'> Hide gold coins</label>' +
					'</div>';
			$form.eq(1).find("td").append(html);

			$("#qmegas_filter_silver, #qmegas_filter_gold").click(function() {
				var $this = $(this),
					type = $this.attr("data-var"),
					val = $this.is(":checked");
				settings.set(type, val)
				applyFilters();
			});
		}
		
		return {
			init: init
		};
	})();
	
	var coinInfo = (function(){
		var coin_info;
		
		function init(){
			var str = localStorage.getItem('qmegas_coins_db');
			
			if (str) {
				coin_info = JSON.parse(str);
			} else {
				coin_info = {};
			}
			
			$('.thumbnail_opener').each(function(){
				var $this = $(this), id = $this.attr('data-thumb-id').trim(), html = '';
				
				if (id == '') {
					return;
				}
				
				if (coin_info[id]) {
					html = drawInfo(id);
				} else {
					html = '<a href="#" class="qmegas-coin-info" data-id="' + id + '"> i </a>';
				}
				
				$this.after(' (<span class="qmegas-info-box">' + html + '</span>)');
			});
			
			$('.qmegas-coin-info').click(requestInfo);
		}
		
		function drawInfo(id){
			var str = coin_info[id].index;
			if (coin_info[id].metal != '') {
				str += '; ' + coin_info[id].metal;
			}
			return str;
		}
		
		function requestInfo() {
			var $this = $(this), id = $this.attr('data-id');
			var $parent = $this.parents('.qmegas-info-box');
			
			$.post('http://qmegas.info/numista-api/coin/' + id + '/', function(data){
				var metal = data.metal || '', index = '?';
				if (data.rarity_index) {
					index = data.rarity_index;
				}
				metal = metal.trim().toLowerCase();
				if (metal.indexOf('gold') == -1 && metal.indexOf('silver') == -1) {
					metal = '';
				}
				
				coin_info[id] = {
					index: index,
					metal: metal
				};
				localStorage.setItem('qmegas_coins_db', JSON.stringify(coin_info));
				
				$parent.text(drawInfo(id));
			}, 'json');
			
			$parent.html(loading_image);
			
			return false;
		}
		
		return {
			init: init
		};
	})();
	
	$(function() {
		settings.init();
        searchFilter.init();
		coinInfo.init();
	});
})(jQuery);
