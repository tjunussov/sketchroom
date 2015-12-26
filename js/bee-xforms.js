/*
 * BEE XForms 0.0.1 - JavaScript
 *
 * Copyright (c) 2012 Timur Junussov (http://www.bee.kz/)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
 
 
var XForms = {
	overlay : null,
	prop : null,
	show : function(xml_data)
	{	
		dialog.show();
		$("#dialog-content").html(this.toForm(xml_data));
	},
	xml_data : null,
	toForm : function (xml_data)
	{
		this.xml_data = xml_data;
		var context = "<form id='XFormsForm' class='forms'><h3>" + xml_data.nodeName + '-' + xml_data.xsd.getAttribute('title')+ "</h3>";
		
		for(var a=0; a < xml_data.attributes.length; a++ ) 
			if(xml_data.attributes[a]){
				var name = xml_data.attributes[a].name;
				if(name=="id") continue;
				
				var xsdAttr = $(xml_data.xsd).find('attribute[name="'+name+'"]')[0];
					title = $(xsdAttr).attr('title') ? $(xsdAttr).attr('title') : name ;
					
				var type = "";
				
				switch($(xsdAttr).attr('type')){
					case "xs:integer" : type = "number"; break;
					case "xs:date" : type = "date"; break;
					default : type = "text";	
				}
				
				context += "<label>" + title + "</label><input name='" + name + "' type='"+type+"' value='" + xml_data.attributes[a].value + "'/><br/>";
			}
		
		/*if(xml_data.hasChildNodes)
		{
			context += "&gt;";
			for(var i=0; i < xml_data.childNodes.length; i++ ) 
			{
				var n = xml_data.childNodes[i];
				if(n.nodeType == 1 ) context += this.toHtml(n);
				else if(n.nodeType == 3) context += "<b style='color:black'>"+n.nodeValue+"</b>";
			}
			context += "&lt;/" + xml_data.tagName + "&gt;</div>";
		}
		else*/ context += "<label></label><a class='button' onclick='XForms.save();'>Сохранить</a><a class='button' onclick='dialog.hide();'>Отмена</a></form>";
		
		return context;
	},
	save : function ()
	{

		$($("#XFormsForm").serializeArray()).each(function(index, element){
			console.log(element.name + ":" + element.value);
			XForms.xml_data.setAttribute(element.name,element.value);
			if(XForms.xml_data.div) XForms.xml_data.div.node.setAttribute(element.name,element.value);
		});
		DV.updateNodez(this.xml_data); // Cross refernece
		dialog.hide();
	},
	toHtml : function (xml_data)
	{
	
		var context = "<div style='padding-left:10px;'>&lt;" + xml_data.nodeName;
		
		for(var a=0; a < xml_data.attributes.length; a++ ) 
			if(xml_data.attributes[a]) 
				context += "&nbsp;" + xml_data.attributes[a].name + "=\"" + xml_data.attributes[a].value + "\"";
		
		if(xml_data.hasChildNodes)
		{
			context += "&gt;";
			for(var i=0; i < xml_data.childNodes.length; i++ ) 
			{
				var n = xml_data.childNodes[i];
				if(n.nodeType == 1 ) context += this.toHtml(n);
				else if(n.nodeType == 3) context += "<b style='color:black'>"+n.nodeValue+"</b>";
			}
			context += "&lt;/" + xml_data.tagName + "&gt;</div>";
		}
		else context += "/&gt;</div>";
		
		return context;
	}
};

var dialog = { 
	base : null,
	init : function (){
		this.base = 
		'<div id="dialog" class="wx-dv prop-outer">'+
        '	<div class="wx-dv prop-middle">'+
		'		<div class="wx-dv prop-inner">'+
		'			<span class="closeBut" onclick="dialog.hide();">Закрыть</span>'+
		'			<div id="dialog-content"></div>'+
		'		<div>'+
		'	</div>'+
		'</div>';
		
		$(document.body).append(this.base);
	},
	show : function (){
		if(!this.base)
			this.init();
		$("#dialog").css("display","table");
	},
	hide : function (){
		$("#dialog").css("display","none");
	}
};

