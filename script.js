// ==UserScript==
// @name       Numista usefull tools
// @namespace  http://qmegas.info/numista
// @version    0.6
// @description  Adds some additional tools for Numista
// @include    https://en.numista.com/catalogue/*
// @include    https://en.numista.com/echanges/*
// @include    https://en.numista.com/echanges/echange.php?id=
// @copyright  Megas (qmegas.info)
//
// @require    https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
//
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
//
// ==/UserScript==

(function ($) {
	var loadingImage = '<img width="16" height="11" alt="Loading..." src="data:image/gif;base64,R0lGODlhEAALAPQAAP///xmr1t3y+NTu9uv3+h6s1hmr1kK63Y7V6m/K5cDn8ze221vD4ZXY63PL5cTp8zu32xys1l/E4uj2+tvx+PT6/Eu93t/y+PP6/L3m8qnf78/t9e/4+wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27ifDgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeRvsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjothLOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAsAAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00kj5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpyHCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAABS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7AAAAAAAAAAAA" />';

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

			GM_addStyle(".qmegas-price { background-color: #fbb; padding: 0 5px; margin-left: 10px; }");
			GM_addStyle(".qmegas-price sup { font-size: 9px; color: blue; }");
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
			if (drawFilters()) {
				applyFilters();
			}
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
			var $form = $("#search_type_option");

			if ($form.length === 0) {
				return false;
			}

			var html, f_silver = _settings.filter_silver ? "checked" : "",
				f_gold = _settings.filter_gold ? "checked" : "";

			html = '<div class="qmegas-filter-box">Filters: ' +
				'<label class="qmegas-label"><input type="checkbox" id="qmegas_filter_silver" data-var="filter_silver" ' + f_silver +
				'> Hide silver coins</label>' +
				'<label class="qmegas-label"><input type="checkbox" id="qmegas_filter_gold" data-var="filter_gold" ' + f_gold +
				'> Hide gold coins</label>' +
				'</div>';
			$form.append(html);

			$("#qmegas_filter_silver, #qmegas_filter_gold").click(function() {
				var $this = $(this),
					type = $this.attr("data-var"),
					val = $this.is(":checked");
				settings.set(type, val);
				applyFilters();
			});

			return true;
		}

		return {
			init: init
		};
	})();

	var coinInfo = (function(){
		var coinInfo;

		function init(){
			var str = localStorage.getItem('qmegas_coins_db');

			if (str) {
				coinInfo = JSON.parse(str);
			} else {
				coinInfo = {};
			}

			$('.thumbnail_opener').each(function(){
				var $this = $(this), id = $this.attr('data-thumb-id').trim(), html = '';

				if (id == '') {
					return;
				}

				if (coinInfo[id]) {
					html = drawInfo(id);
				} else {
					html = '<a href="#" class="qmegas-coin-info" data-id="' + id + '"> i </a>';
				}

				$this.after(' (<span class="qmegas-info-box">' + html + '</span>)');
			});

			$('.qmegas-coin-info').click(requestInfo);
		}

		function drawInfo(id){
			var str = coinInfo[id].index;
			if (coinInfo[id].metal != '') {
				str += '; ' + coinInfo[id].metal;
			}
			return str;
		}

		function requestInfo() {
			var $this = $(this), id = $this.attr('data-id');
			var $parent = $this.parents('.qmegas-info-box');

			$.post('https://qmegas.info/numista-api/coin/' + id + '/', function(data){
				var metal = data.metal || '', index = '?';
				if (data.rarity_index) {
					index = data.rarity_index;
				}
				metal = metal.trim().toLowerCase();
				if (metal.indexOf('gold') == -1 && metal.indexOf('silver') == -1) {
					metal = '';
				}

				coinInfo[id] = {
					index: index,
					metal: metal
				};
				localStorage.setItem('qmegas_coins_db', JSON.stringify(coinInfo));

				$parent.text(drawInfo(id));
			}, 'json');

			$parent.html(loadingImage);

			return false;
		}

		return {
			init: init
		};
	})();

	var swapPrice = (function(){
		var pricesInfo, storageKey = 'qmegas_price_db';

		function init() {
			if (isSwapPage()) {
				initPrices();
			}
		}

		function isSwapPage() {
			return (document.location.href.indexOf('numista.com/echanges/echange.php?id=') > -1);
		}

		function initPrices() {
			var str = localStorage.getItem(storageKey);

			if (str) {
				pricesInfo = JSON.parse(str);
			} else {
				pricesInfo = {};
			}

			$('.recap_echange').each(function(){
				var $trs = $(this).find('tr:not(.collec)'), sum = $trs.length - 1;
				$trs.each(function(i){
					if (i === 0 || i === sum) {
						return;
					}
					var $a = $(this).find('.infos_piece a');
					if ($a.length === 1) {
						$a.parent()
							.find('br')
							.before('<span class="qmegas-price">' + getPriceCaption(getCoinIdByLink($a.attr('href'))) + '</span>');
					}
				});
			});

			$('.qmegas-price-get').click(function(){
				var $parent = $(this).parent(), coinId = this.dataset.id;
				$parent.html(loadingImage);
				$.post('https://qmegas.info/numista-api/coin/prices/', {
					coin_id: coinId
				}, function(data) {
					pricesInfo[coinId] = data;
					$parent.html(getPriceCaption(coinId));
					localStorage.setItem(storageKey, JSON.stringify(pricesInfo));
				}, 'json');
				return false;
			});
		}

		function getPriceCaption(coinId) {
			if (pricesInfo[coinId]) {
				if (pricesInfo[coinId].error) {
					return '?';
				}
				var item = pricesInfo[coinId].prices[0];
				return '$' + item.median + '<sup>' + item.count + '</sup>';
			}

			return '<a href="#" class="qmegas-price-get" data-id="' + coinId + '">Get price</a>';
		}

		function getCoinIdByLink(url) {
			return url.match(/pieces(\d+)\./)[1];
		}

		return {
			init: init
		};
	})();

	$(function() {
		settings.init();
		searchFilter.init();
		coinInfo.init();
		swapPrice.init();
	});
})(jQuery);
