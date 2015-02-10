$(window).resize(function(){ responder.resized(); });
window.onorientationchange = function (event){ responder.resized(); }

$(document)
.ready(function(){
	responder.setFrameWidths();
	setTimeout(function(){ responder.setFrameWidths(); }, 1000);
})
.on("click", "#nav-toggle", function(){
	//Toggle Mobile Slide Menu
	responder.openDeviceMenu();
	return false;	
})
;

var responder = {
	openwidth:-68,
	isopen:true,
	action:false,
	curZindex:1,
	resizeCallbacks:[function(){ responder.setFrameWidths() }],
	resized:function(){
		var thisobj = this;
		if(thisobj.resizeCallbacks.length > 0){
			for(i=0; i < thisobj.resizeCallbacks.length; i++){
				try {
					responder.resizeCallbacks[i]();
				}
				catch(err){
					if(console){ console.log('Function does not exist'); }	
				}
			}
		}
	},
	setFrameWidths:function(){
		$("body").css('width', '100%');
		var curzindex = parseInt($("#responder").css('z-index'));
		this.curZindex = curzindex;
		switch(curzindex){
			case 1:
			this.closeDeviceMenu();
			break;
			case 5:
			this.closeDeviceMenu();
			break;
			case 10:
			//
			break;
		}
	},
	openDeviceMenu:function(){
		var thisobj = this;
		this.action = true;
		$("#wrapper").stop(true, true).animate({'margin-left':thisobj.openwidth+'%'}, 600, function(){
			$("#wrapper").bind("click", function(){
				thisobj.closeDeviceMenu();
				$("#wrapper").css('cursor','pointer');
				return false;
			});
			$("#nav-toggle").addClass("active");
			thisobj.isopen = true;
			thisobj.action = false;
		});
	},
	closeDeviceMenu:function(){
		//Closes menu for tablets and phones.
		this.action = true;
		$("#wrapper").stop(true, true).animate({'margin-left':'0'}, 600, function(){
			$("#wrapper").unbind("click");
			$("#wrapper").css('cursor','default');
			$("#nav-toggle").removeClass("active");
			this.isopen = false;
			this.action = false;
		});
	},
	closeAllMenus:function(){
		if(this.isopen){
			this.closeDeviceMenu();
		}
	}
}