example.View = draw2d.Canvas.extend({
	
	init: function(id)
    {
		this._super(id, 5000,5000);

        var canvas = document.getElementById(id);
        var svgElem = canvas.children[0];

        if (canvas.addEventListener) {
            canvas.addEventListener("mousewheel", this.MouseWheelHandler, false);
            canvas.addEventListener("DOMMouseScroll", this.MouseWheelHandler, false);
        }
        else canvas.attachEvent("onmousewheel", this.MouseWheelHandler);
        	this.setScrollArea("#"+id);

        
	},

    MouseWheelHandler: function(e)
    {
        var e = window.event || e;
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        var canvas = document.getElementById("canvas");
        var svgElem = canvas.children[0];
        
        if(delta > 0)
            app.view.setZoom(app.view.getZoom()*0.75, true);
        if(delta < 0)
            app.view.setZoom(app.view.getZoom()*1.25, true);

        setTimeout(function(){
            if(svgElem.viewBox.baseVal.width < 5000) {
                app.view.setZoom(1, true);
            }
        },10);

        return false;
    },

    contextMenu: function() {
        $('#container').on("contextmenu", function(emitter, event) {
            $.contextMenu({
                selector: 'body',
                trigger: 'none',
                events:
                {  
                    hide: function(){ $('#container').unbind("contextmenu"); $.contextMenu( 'destroy' ); $('.context-menu-list').remove(); }
                }, 
                callback: $.proxy(function(key, options) 
                {
                    switch(key){
                        case "add":
                            var type = $(event.dropped).data("shape");
                            var figure = eval("new "+type+"("+$(event.dropped).data("radius")+");");

                            figure.onDrop(event.dropped, event.x, event.y);

                            var command = new draw2d.command.CommandAdd(event.context, figure, event.x-figure.width-75, event.y-25);
                            event.context.getCommandStack().execute(command);
                        break;
                        case "select":
                            var containerData = null;
                            var htmlInj = "";
                            // get data
                            $.ajax({
                              url: "/nethvoice/admin/nethvplan/visualize.php?getAll="+event.dropped[0].id,
                              context: document.body,
                              beforeSend: function( xhr ) {
                                $('#loader').show();
                              }
                            }).done(function(c) {
                                $('#loader').hide();
                                containerData = JSON.parse(c);

                                // populate dialog
                                var dialog = $('<div id="elementList"></div>')
                                    .dialog({
                                        position: 'center',
                                        autoOpen: false,
                                        resizable: false,
                                        width: 500,
                                        modal: true,
                                        close: function(ev, ui) {
                                            $(this).dialog('destroy').remove();
                                        },
                                        title: event.dropped[0].innerText + " selection"
                                    });
                                $(".ui-dialog-titlebar").css("background", event.dropped.css("backgroundColor"));

                                // inject html
                                dialog.html(event.context.switchDescription(containerData, event.dropped[0].id));

                                // bind click on buttons
                                $('.button-elem-list').bind('click', function(el) {
                                    var elemId = el.target.attributes.elemId.value;
                                });

                                // show dialog
                                dialog.dialog("open");
                                $('.ui-widget-overlay').bind('click',function(){
                                    dialog.dialog('destroy').remove();
                                })
                            });

                        break;
                        default:
                        break;
                    }
                },this),
                position: function(opt, x, y){
                    opt.$menu.css({top: event.y/app.view.getZoom()+25, left: event.x/app.view.getZoom()+95});
                },
                items: 
                {
                    "add": { name: "Add new" },
                    "select": { name: "Select existing" }
                }
            });
        });
    },

    switchDescription: function(dataArray, type) {
        var htmlInj = "";
        switch(type) {
            case "incoming":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].description+'</button></div>';
                }
            break;
            case "night":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].name+'</button></div>';
                }
            break;
            case "from-did-direct":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].name+'</button></div>';
                }
            break;
            case "ivr":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].name+' ( '+dataArray[elem].description+' )</button></div>';
                }
            break;
            case "timeconditions":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].displayname+'</button></div>';
                }
            break;
            case "app-announcement":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].description+'</button></div>';
                }
            break;
            case "ext-group":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].description+'</button></div>';
                }
            break;
            case "ext-meetme":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].description+'</button></div>';
                }
            break;
            case "ext-queues":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].descr+'</button></div>';
                }
            break;
            case "app-daynight":
                for(elem in dataArray) {
                    htmlInj += '<div><button elemId="'+elem+'" class="button-elem-list">'+elem+' - '+dataArray[elem].name+'</button></div>';
                }
            break;
        }

        return htmlInj;
    },
    
    onDrop: function(droppedDomNode, x, y, shiftKey, ctrlKey)
    {
        if(droppedDomNode[0].id !== "app-blackhole") {
            // add context menu
            this.contextMenu();

            $('#container').trigger('contextmenu', { x: x, y: y, context: this, dropped: droppedDomNode });
        } else {

        }
        
    }
});