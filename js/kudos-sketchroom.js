/*
 * KUDOS SKETCHROOM 0.0.1 - JavaScript
 *
 * Copyright (c) 2012 Timur Junussov (http://www.bee.kz/)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
 
 
var DV = {
	overlay : null,
	readOnly : false,
	prop : null,
	canvas:null,
	notepad:null,
	ctx:null,
	container:null,
	offsetY:0,
	offsetX:0,
	GRID_SIZE:20,
	pH:0,
	pW:0,
	pointer:null,
	pointerAfterDrag:false,
	setup : function(canvasName)
	{	
		this.notepad = document.getElementById(canvasName);		
		this.container = document.createElement("DIV");
		this.container.className="wx-dv container";
		this.container.style.position = "relative";
		$(this.notepad).append($('<process-title id="inputProcessName" class="wx-dv-processname"></<process-title>'));
		this.notepad.appendChild(this.container);
		
		this.canvas = document.createElement("canvas");
		this.canvas.className="wx-dv-canvas";
		this.canvas.style.position = "absolute";
		this.canvas.style.zIndex = "0";
		this.canvas.oncontextmenu = function(){return false;}
		//this.canvas.onselectstart = function () { return false; }
		this.ctx = this.canvas.getContext('2d');

		$(document).keyup(function (event) {
			if(event.keyCode == 46 && DV.selectedNode) {
				DV.deleteNode(DV.selectedNode);
				DV.selectedNode = null;
			}
		});
		
		$(document.body).click(function (e) {
			if(!e.originalEvent.isNode) DV.selectNode(null);
		});
		
		this.loadSettings(); 
		this.toolSnapToGrid(); // toggle SnapToGrid Function
	},
	initFromXMLString : function (xmlStr){
		DV.parse(new DOMParser().parseFromString(xmlStr,"application/xml"));
	},
    init : function (url) {
		if(!this.config.DEPLOY_URL) this.config.DEPLOY_URL = url;
		$.ajax({type: "GET",url: url,dataType:"xml",success:function(xml){DV.parse(xml)}});
    },
	
	/*-------PARSING---------*/
	
	nodes : new Array(),
	wall : new Array(),
	processName : "",
	ga : function (node,name){
		if(node.attributes.getNamedItem(name))
			return node.attributes.getNamedItem(name).nodeValue;
		return "";
	},
	roomXsdSchema : null,
	roomDefinition : null,
	parse : function (xml){
		this.roomDefinition = xml;
		var pd = xml.documentElement;
			pd.xsd = $(this.roomXsdSchema).find('element[name="room-definition"]')[0];
		
		this.container.innerHTML = "";
		this.container.appendChild(this.canvas);
		
		DV.parseEmbededPupils();
		
		document.getElementById('inputProcessName').innerHTML = this.ga(pd,"title");
		
		var nodes = new Array();
		this.nodes = nodes;
		
		this.pW =Number(this.ga(pd,"width"));
		this.pH =Number(this.ga(pd,"height"));
		
		if(pd.childNodes)
			for(var n=0; n < pd.childNodes.length; n++){
				var node = pd.childNodes[n];
				var nodeName = node.tagName;
				
				if(nodeName == null || nodeName == 'pupil' || nodeName == 'variable' || nodeName == 'event' || nodeName == 'expression') continue;
				else if(nodeName == 'wall' && this.ga(node,"geometry")) continue;
				
				node.xsd = $(this.roomXsdSchema).find('element[name="'+nodeName+'"]')[0];
				nodes.push(node);
				
				this.pW = Math.max( Number(this.ga(node,"x")) + Number(this.ga(node,"width")),this.pW);
				this.pH =  Math.max( Number(this.ga(node,"y"))+ Number(this.ga(node,"height")),this.pH);
				
			}
		
		this.processName = this.ga(pd,"name");
		
		for(var n=0; n < nodes.length; n++){
			this.drawNode(nodes[n]);
		}
		
		this.canvas.width = this.pW - 3;
		this.canvas.height = this.pH;
		
		this.notepad.style.height = this.pH + 60 +'px'; // adding 60 is heigh of procss Label
		this.notepad.style.width = this.pW + this.offsetX + 'px';
		
		// loading pupils to toolbox
		
		
	},
	getNodeByName : function (name){
		for(var n=0; n < this.nodes.length; n++){
			var node = this.nodes[n];
			var nodeName = this.ga(node,"name");
			if(nodeName == name) return node;
		}
		return;
	},	
	getNodeById : function (id){
		for(var n=0; n < this.nodes.length; n++){
			var node = this.nodes[n];
			var nodeId = this.ga(node,"id");
			if(nodeId == id) return node;
		}
		return;
	}, 
	selectedNode : null,
	selectNode : function (node){
		if(this.selectNode) {
			$(this.selectedNode).removeClass("selected");
		}
		
		this.selectedNode = node;
		$(this.selectedNode).addClass("selected");
		
	},
	deleteNode : function (node){
		DV.roomDefinition.documentElement.removeChild(node.node);
		node.parentElement.removeChild(node);
		
		$(node).find("ui-pupil").each(function(index, element) {
			$(element).data("ptxBut").removeClass("disabled");    
		});
	},
	drawWall : function(){
		var ctx = this.ctx;
		
		ctx.beginPath();
		
		
		var l = this.wall[0];
		ctx.moveTo(l[0],l[1]);
		
		for(var i = 1; i < this.wall.length; i++){
			l = this.wall[i];	
			ctx.lineTo(l[0],l[1]);
		}
		
		// final closing line
		l = this.wall[0];
		ctx.lineTo(l[0],l[1]);
		
		ctx.lineWidth=3;
		ctx.strokeStyle= '#ccc';
		//ctx.fillStyle= '#00000';
		//ctx.fill();*/
		ctx.stroke();
	},
	drawNode : function (node){
		var div = document.createElement(node.nodeName);
			div.className = "node";
			
		var icon = document.createElement("div");
			icon.className = "node-icon";
			div.appendChild(icon);
			/*div.style.top = (Number(this.ga(node,"y")) + this.offsetY ) + 'px';
			div.style.left = (Number(this.ga(node,"x")) + this.offsetX ) + 'px';*/
			div.style.top = Number(this.ga(node,"y")) + 'px';
			div.style.left = Number(this.ga(node,"x")) + 'px';
			
			// hangling borders for special nodes
			
			var height = Number(this.ga(node,"height"));
			var width = Number(this.ga(node,"width"));
			var rotate = Number(this.ga(node,"rotate"));
			var length = Number(this.ga(node,"length"));
			
			div.node = node;
			div.icon = icon;
			div.ondblclick = DV.showNode;
			div.setAttribute("tabindex","");
			
			if(height && height > 0)
				icon.style.height = height + 'px';
			if(width && width > 0)
				icon.style.width = width + 'px';
			if(length && length >0){
				icon.style.height = length + 'px';
				height = length;
			}
			
			//div.style.height = div.style.width = Math.max(height,width) + 'px';
			div.style.position = "absolute";
			
			if(rotate && rotate>0)
				DV.rotateNode(div);
			
			div.onclick = function(e){
			   if(DV.readOnly) return false;
			   DV.selectNode(this);
			   e.isNode = true;
			   return e;
			   //e.stopPropagation(); //maybe we should cancel buble
			}
			
			// Right button hangling
			$(div).contextMenu(function(e) {
			   if(DV.readOnly) return;
			   if($(this.target).hasClass('selected')){
					var rotate = Number(this.target.node.getAttribute("rotate"));
					if(!rotate) rotate = 0;
					rotate = ( rotate == 270 ? 0 : rotate+=90 );
					this.target.node.setAttribute("rotate",rotate);
					DV.rotateNode(this.target);
			   }
			});
		   
			$(div).draggable({distance: 5, zIndex: 2700,/*scroll:true,scrollSensitivity:40,*/grid:[this.snapGridSize,this.snapGridSize],
				//stop:function(event,ui){
				start: function(event, ui) {
					if(DV.readOnly) return false;
				},
				drag:function(event,ui){
					// align small offsets occurance
					var ttop = parseInt(ui.helper.css('top'));
					var left = parseInt(ui.helper.css('left'));
					
					ui.helper.css({
						top: (ttop - (ttop % DV.snapGridSize))+'px',
						left: (left - (left % DV.snapGridSize))+'px'
					});
					//
					
					DV.updateNode(ui);
				}
			})
			
			$(icon).droppable({
				accept: "ui-seat",
				drop: function(event,ui){
					if($(this).children().length < 3){ // checking for already placed student
						var desk = $(this).parent()[0].node;
						var seat = DV.roomDefinition.createElement("seat");
							desk.appendChild(seat);
						var $seat = DV.addSeat(seat);
							$seat.appendTo(this);
					}
				}
			});
							
			// Resizable nodes
			//$(div).resizable({grid:[this.snapGridSize,this.snapGridSize]});
			
			
		var title = this.ga(node,"title");
			title = ( title == "" ? this.ga(node,"name") : title );
			div.title = title;

			icon.innerHTML = '';
			icon.innerHTML = '<span class="wx-dv-icon" style="background-image: url(node-types/'+node.tagName.toUpperCase()+'.png)"></span>';
			/*'<span style="text-overflow: ellipsis; white-space: nowrap; display:inline-block; width:'+(Number(this.ga(node,"width"))-55)+'px; overflow-x:hidden">'+title+'</span>';*/
			
			if(node.nodeName.toLowerCase() == "desk"){
				var seats = node.getElementsByTagName("seat");
				for(var p=0; p < seats.length; p++){
					var pupilId = this.ga(seats[p],"pupil-id");
					
					var $seat = this.addSeat(seats[p]);

					if(pupilId){
						try {
							this.addPupilToSeat(this.getPupilToolboxBut(pupilId),$seat);
						} catch(e){
							console.error(e.message);
						}
					}
					
					$seat.appendTo(icon);
				}
			}
			
			this.container.appendChild(div);
			
			node.div = div;
			
			return div;
	},
	getPupilToolboxBut : function (pid){
		var a = $("#ptx-"+pid);
		if(a.length > 0) 
			return a.addClass('disabled');
		else
			throw {message:'Pupil with id '+pid+' notfound in toolbox'}
	},
	addPupilToSeat : function (ptxBut,$seat){
		
		var pupil = $("<ui-pupil title='"+ptxBut.data("pupil").attr("name")+"' style='background-image:url(img/ava/"+ptxBut.data("pupil").attr("user")+"-small.jpg)'></ui-pupil>");
			pupil.data("ptxBut",ptxBut);
			
			pupil.on("click",function (e){
				var _pupil = $(this).data("ptxBut").data("pupil");
				DV.onPupilClick(_pupil.attr("id"),_pupil);
			});
			
			pupil.on('contextmenu', function(e){
				if(DV.readOnly) return;
				$(this).data("ptxBut").removeClass("disabled");
				$(this).parent().data("seat").removeAttribute("pupil-id");
				$(this).detach();
				return false;
			});
			
			$seat.data("seat").setAttribute("pupil-id",ptxBut.data("pupil").attr("id"));	
			
			$seat.append(pupil);
		
		return pupil;
	},
	addSeat : function (seatDataNode){
	var uiseat = $("<ui-seat></ui-seat>");
		uiseat.data("seat",seatDataNode);
		uiseat.droppable({
			accept: "ui-pupil",
			drop: function(event,ui){
				if($(this).children().length < 1){ // checking for already placed student
					DV.addPupilToSeat(ui.draggable,$(this));
					$(ui.draggable).addClass('disabled'); // disabling icon
				}
			}
		}).on('contextmenu', function(e){
			if(DV.readOnly) return;
			$(this).children().each(function(index, element) {
	            $(element).data("ptxBut").removeClass("disabled");    
            });
			
			var seat = $(this).data("seat"); seat.parentNode.removeChild(seat);
			$(this).detach();
			return false;
		});
			
		return uiseat;
	},
	onPupilClick : function(){
		console.log("onPupilClick not implemented, please override ");
	},
	getPupil : function (id){
		var pd = this.roomDefinition.documentElement;
		var pnodes = pd.getElementsByTagName("pupil");
		for(var n=0; n < pnodes.length; n++){
			var node = pnodes[n];
			var nodeId = this.ga(node,"id");
			if(nodeId == id) return node;
		}
		return;
	},
	showNode : function (){
		if(DV.readOnly) return;
		XForms.show(this.node);
	},
	rotateNode  : function (node){
		var rotate = node.node.getAttribute("rotate");
		if(!rotate) rotate = 0;
		node.node.setAttribute("rotate",rotate);
	
		if(rotate == 90){
			node.icon.style.WebkitTransform = 'rotate('+rotate+'deg)';
			$(node).addClass('deg90');
		}
		else if(rotate == 180){
			node.icon.style.WebkitTransform = 'rotate('+rotate+'deg)';
			$(node).removeClass('deg90');
			$(node).addClass('deg180');
		}
		else if(rotate == 270){
			node.icon.style.WebkitTransform = 'rotate('+rotate+'deg)';
			$(node).removeClass('deg180');
			$(node).addClass('deg270');
		}
		else {
			node.icon.style.WebkitTransform = 'rotate('+rotate+'deg)';
			$(node).removeClass('deg270');
		}
	},
	updateNode : function(ui){
		var node = ui.helper[0].node;
		node.setAttribute("x",ui.position.left );
		node.setAttribute("y",ui.position.top);
	},
	updateNodez : function(node){
		console.log(node.nodeName);
		if(node.nodeName=='room-definition'){
			this.canvas.style.height = this.ga(node,"height")+'px';
			this.canvas.style.width = Number(this.ga(node,"width")) - 3+'px';
			this.notepad.style.width = this.ga(node,"width")+'px';
			this.notepad.style.height = Number(this.ga(node,"height")) + 60 +'px';
			$("#inputProcessName").text(this.ga(node,"title"));
			
		} else {
			node.div.style.top = this.ga(node,"y")+'px';
			node.div.style.left = this.ga(node,"x")+'px';
			node.div.icon.style.height = (this.ga(node,"length") ? this.ga(node,"length") : this.ga(node,"height"))+'px';
			node.div.icon.style.width =  this.ga(node,"length") ? '' : this.ga(node,"width")+'px';
			node.div.icon.title = this.ga(node,"title");
			
			if(this.ga(node,"rotate")) this.rotateNode(node.div);
		}
	},
	isPupilsLoaded : false,
	loadPupils : function(_xmlORurl,container){
		
		if(typeof(_xmlORurl)=='string' && _xmlORurl.indexOf('#') != 0 ){
			try {
				DV.buildPupilToolbox($.parseXML(_xmlORurl),container); // parsing as xml string
			} catch(e){
				$.ajax({type: "GET",url: _xmlORurl,dataType:"xml",success:function(xml){ // loading from url
					DV.buildPupilToolbox(xml,container);
				}});
			}
		} else {
			DV.buildPupilToolbox($.parseXML($(_xmlORurl).text()),container); // parsing xml island by id or reference
		}
		DV.isPupilsLoaded = true;
	},
	parseEmbededPupils : function (){
		if(!DV.isPupilsLoaded) {
			console.log("loading embeded xml");
			DV.buildPupilToolbox(DV.roomDefinition.documentElement);
		}
	},
	buildPupilToolbox  : function (_xml,container){
		container = container||"#pupilsToolbox";
		console.log("pupil toolbox : building");
		$(_xml).find('pupil').each(
			function(){
				
			var but = $("<ui-pupil></ui-pupil>");
				but.attr("id","ptx-"+$(this).attr("id"));
				but.css("background-image","url(img/ava/"+$(this).attr("user")+"-small.jpg)");
				but.attr("title",$(this).attr("name"));
				but.data({"pupil":$(this)});
				
				// dragging
				but.draggable({helper:"clone",distance: 5, zIndex: 2700,
					start: function(event, ui) {
						if($(this).hasClass("disabled")) return false;
					}
				});
				
				$(container).append(but);
				
			}
		);
	},
	toolbox : function (container){
		
		$.ajax({type: "GET",url: this.config.SCHEMA_URL,dataType:"xml",success:function(xml){
			console.log("toolbox : loaded");
			DV.roomXsdSchema = xml.documentElement;
			$(xml).children().children().each(
				function(){
					//console.log("toolbox : " + this.nodeName);
					if( this.nodeName == "xs:element" && $(this).attr("name") && !$(this).attr("wx:abstract")){
						
						// toolbox buttons
						var but = document.createElement("ui-"+$(this).attr("name"));
							but.className = "wx-bpm-tool-node";
							but.style.backgroundImage = "url(node-types/"+$(this).attr("name").toUpperCase()+".png)";
							but.nodeDef = this;
							but.title = $(this).attr("title") ? $(this).attr("title") : $(this).attr("name");
							
							$(container).append(but);
							
							// dragging
							$(but).draggable({helper:"clone",cursor: 'crosshair',distance: 5, zIndex: 2700,grid:[DV.snapGridSize,DV.snapGridSize],
								stop:function(event,ui){
									
									var xsdNode = ui.helper.context.nodeDef;
									
									if(xsdNode.getAttribute("name") == "seat"){
										return;
									}
									
									var node = DV.roomDefinition.createElement(xsdNode.getAttribute("name"));
										node.xsd = ui.helper.context.nodeDef;
									
									var x = ui.position.left - DV.notepad.offsetLeft - 40 + DV.notepad.scrollLeft;
									var y = ui.position.top - DV.notepad.offsetTop - 60 + DV.notepad.scrollTop;
									
									node.setAttribute("name",node.nodeName);
									node.setAttribute("x", x - x%DV.GRID_SIZE);
									node.setAttribute("y", y - y%DV.GRID_SIZE);
									
									//node.setAttribute("x",ui.position.left - DV.notepad.offsetLeft - DV.offsetX + DV.notepad.scrollLeft );
									//node.setAttribute("y",ui.position.top - DV.notepad.offsetTop - DV.offsetY + DV.notepad.scrollTop);
									node.setAttribute("height",xsdNode.getAttribute("wx:default-height"));
									node.setAttribute("width",xsdNode.getAttribute("wx:default-width"));
									
									
									//node.appendChild(xsdNode.cloneNode(true)); // Could transfer xsd nodes to defintion
									
									DV.roomDefinition.documentElement.appendChild(node);
									
									var xn = DV.drawNode(node);
										$(xn).addClass("initial");
										setTimeout(function(){
											$(xn).removeClass("initial");
										},1);
									DV.selectNode(xn);
								} 
							});
					}
				}
			);
		}});
		
	},
	toolCreate : function(){
		var xml = document.implementation.createDocument("process-definition");
		var pd = xml.documentElement;
		var procName = prompt("Enter process name","Untitled");
			if(!procName) return;
			pd.setAttribute("name",procName);
			pd.setAttribute("height",this.notepad.offsetHeight - 30);
			pd.setAttribute("width",this.notepad.offsetWidth-240);
		this.loaded(xml);
	},
	snapGridSize : 1,
	toolSnapToGrid : function(){
		if(DV.snapGridSize == 1) {
			DV.snapGridSize = DV.GRID_SIZE;
			$('#snapBut').addClass('selected');
		}
		else {
			DV.snapGridSize = 1;
			$('#snapBut').removeClass('selected');
		}
	},
	toolOpen : function(procFile){
		if(!procFile) procFile = prompt("Enter file","data/definition.xml");
		if(!procFile) return;
		DV.init(procFile);
	},
	config:{
		SCHEMA_URL : "data/sketchroom-1.0.xsd",
		DEPLOY_URL : null
	},
	toolDeploy : function(){
		//var pd = this.roomDefinition.documentElement;
		console.log(this.roomDefinition);
		$.ajax({type: "POST",url:this.config.DEPLOY_URL,dataType:"xml",processData:false,contentType: "text/xml",data:this.roomDefinition,
			success:function(xml){
				alert("Сохранено!");
			},
			error:function(){
				alert("Ошибка! " + arguments[2] );
			}
		});
																					 
		
	},
	serverURL:null,
	toolSettings : function(){
		if(DV.readOnly) return;
		console.log();
		XForms.show(DV.roomDefinition.documentElement);
	},
	loadSettings : function(){	
		try { this.deployURL = localStorage.getItem("WX-DVB:SERVER_URL"); } catch(e){}	
	}
};

function nvl(a,b){
	return (a) ? a : b;
}

function parseAngle(str){
//	return str.substring(str.indexOf('('),str.indexOf(')'));
	return str.substring(str.indexOf('(')+1,str.indexOf(')')-3);
	
}
