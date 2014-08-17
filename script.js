// ==UserScript==
// @name       Numista usefull tools
// @namespace  http://qmegas.info/numista
// @version    0.1
// @description  Adds some additional tools for Numista
// @include    http://en.numista.com/catalogue/*
// @copyright  Megas (qmegas.info)
//
// @require        http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
//
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
//
// ==/UserScript==

function NumistaTools() {
	var _settings = {
		filter_commemorative: false,
		filter_silver_gold: false
	};
	
	function init(){
		_settings.filter_commemorative = GM_getValue('filter_commemorative', false);
		_settings.filter_silver_gold = GM_getValue('filter_silver_gold', false);
		
		GM_addStyle('.qmegas_label { margin-left:10px; }');
	}
	
	function addFilterForm(){
		var $trs = $('#form_recherche tfoot tr');
		
		if ($trs.length == 0)
			return;
			
		var html, f1 = _settings.filter_commemorative ? 'checked' : '',
			f2 = _settings.filter_silver_gold ? 'checked' : '';
			
		html = '<br>Filters: ' + 
			'<label class="qmegas_label"><input type="checkbox" id="qmegas_filter_commemorative" data-var="filter_commemorative" '+f1+'> Hide commemorative</label>' + 
			'<label class="qmegas_label"><input type="checkbox" id="qmegas_filter_silver_gold" data-var="filter_silver_gold" '+f2+'> Hide gold and silver</label>';
			
		$trs.eq(1).find('td').append(html);
			
		$('#qmegas_filter_commemorative, #qmegas_filter_silver_gold').click(function(){
			var $this = $(this), param = $this.attr('data-var'), value = $this.is(':checked');
			GM_setValue(param, value);
			_settings[param] = value;
			applyFilter();
		});
	}
	
	function applyFilter(){
		$('.resultat_recherche').each(function(){
			var need_to_hide = false, $this = $(this);
			
			if (_settings.filter_commemorative) {
				var i, $em = $this.find('em');
				for (i=0; i<$em.length; ++i) {
					if ($em.eq(i).html() == 'Commemorative:') {
						need_to_hide = true;
					}
				}
			}
			
			if (_settings.filter_silver_gold) {
				var text = $this.text();
				if (text.indexOf('Silver') > -1) {
					need_to_hide = true;
				}
				if (text.indexOf('Gold') > -1) {
					need_to_hide = true;
				}
			}
			
			if (need_to_hide)
				$this.hide();
			else
				$this.show();
		});
	}
	
	this.initialize = function(){
		init();
		addFilterForm();
		applyFilter();
	};
}

$(function(){
	(new NumistaTools()).initialize();
});
