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

        this.setScrollArea("#"+id);
	},

    // onClick: function(the, mouseX, mouseY, shiftKey, ctrlKey) {
    //     if(shiftKey) {
    //         var policy = new draw2d.policy.canvas.BoundingboxSelectionPolicy;
    //         app.view.installEditPolicy(policy);
    //     } else {
    //         var policy = new draw2d.policy.canvas.PanningSelectionPolicy;
    //         app.view.installEditPolicy(policy);
    //     }
    // },

    onDoubleClick: function( the, mouseX, mouseY, shiftKey, ctrlKey) {
        var e = document.getElementById('canvasPolicy');
        var currentBtn = e.attributes.currentBtn.value;
        var canvas = document.getElementById("canvas");

        if(currentBtn === "pan") {
            e.attributes.currentBtn.value = "box";
            $(e.children[0]).removeAttr('class');
            $(e.children[0]).attr('class', 'fa fa-chain-broken fa-lg');
            canvas.style.cursor = "cell";
            $('#typer').children().html("&nbsp;&nbsp;"+languages[browserLang]["toolbar_select_string"]);
            $('#typer').children().attr('class', 'fa fa-crosshairs fa-3x typing-icon');
            $('#typer').fadeIn("slow");
            setTimeout(function(){
                $('#typer').fadeOut("slow");    
            }, 1000);
            var policy = new draw2d.policy.canvas.BoundingboxSelectionPolicy;
            app.view.installEditPolicy(policy);
        } else {
            e.attributes.currentBtn.value = "pan";
            $(e.children[0]).removeAttr('class');
            $(e.children[0]).attr('class', 'fa fa-arrows-alt fa-lg');
            canvas.style.cursor = "move";
            $('#typer').children().html("&nbsp;&nbsp;"+languages[browserLang]["toolbar_pan_string"]);
            $('#typer').children().attr('class', 'fa fa-arrows-alt fa-3x typing-icon');
            $('#typer').fadeIn("slow");
            setTimeout(function(){
                $('#typer').fadeOut("slow");    
            }, 1000);
            var policy = new draw2d.policy.canvas.PanningSelectionPolicy;
            app.view.installEditPolicy(policy);
        }
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
                            var data = {};
                            data.x = event.x;
                            data.y = event.y;
                            data.context = event.context;
                            data.dropped = event.dropped;

                            event.context.createDialog(data);
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
                                console.log(containerData);
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
                                        title: $(event.dropped[0]).text() + " "+languages[browserLang]["view_selection_string"]
                                    });
                                $(".ui-dialog-titlebar").css("background", event.dropped.css("backgroundColor"));

                                // inject html
                                dialog.html(event.context.switchDescription(containerData, event.dropped[0].id));

                                // bind click on buttons
                                $('.button-elem-list').bind('click', function(el) {
                                    var elemId = el.target.attributes.elemId.value;
                                    var getChildId = window.btoa(unescape(encodeURIComponent(containerData[elemId].id)));

                                    var childDestStr = "";
                                    for(ent in containerData[elemId].entities) {
                                        if(containerData[elemId].entities[ent].type === "output") {
                                            childDestStr += containerData[elemId].entities[ent].destination+"|";
                                        }
                                    }
                                    var getChildDest = window.btoa(unescape(encodeURIComponent(childDestStr)));

                                    $.ajax({
                                      url: "/nethvoice/admin/nethvplan/visualize.php?getChild="+getChildId+"&getChildDest="+getChildDest,
                                      context: document.body,
                                      beforeSend: function( xhr ) {
                                        $('#loader').show();
                                      }
                                    }).done(function(c) {
                                        dialog.dialog('destroy').remove();

                                        // dropped obj
                                        var obj1 = {};
                                        var num = containerData[elemId].id;
                                        obj1[num] = containerData[elemId];

                                        // childs
                                        var obj3 = JSON.parse(c);

                                        var jsonMarshal = $.extend({}, obj1, obj3);

                                        var g = new dagre.graphlib.Graph();
                                        g.setGraph({});
                                        g.setDefaultEdgeLabel(function() { return {}; });
                                        g.graph().rankdir = "LR";

                                        for (var i in jsonMarshal) {
                                          if(jsonMarshal[i].type === "Base") {
                                            g.setNode(jsonMarshal[i].id, { width: 500, height: 200 });
                                          }

                                          if(jsonMarshal[i].type === "MyConnection") {
                                            g.setEdge(jsonMarshal[i].source.node, jsonMarshal[i].target.node);
                                          }
                                        };

                                        dagre.layout(g);

                                        g.nodes().forEach(function(v) {
                                            jsonMarshal[v].x = event.x+g.node(v).x;
                                            jsonMarshal[v].y = event.y+g.node(v).y;
                                        });

                                        var reader = new draw2d.io.json.Reader();
                                        reader.unmarshal(app.view, jsonMarshal);
                                        $('#loader').hide();

                                    });
                                });

                                // show dialog
                                dialog.dialog("open");
                                $('.ui-widget-overlay').bind('click',function(){
                                    dialog.dialog('destroy').remove();
                                });
                            });

                        break;
                        default:
                        break;
                    }
                },this),
                position: function(opt, x, y){
                    var scrollTopVal = app.view.getScrollArea().scrollTop();
                    var scrollLeftVal = app.view.getScrollArea().scrollLeft();
                    opt.$menu.css({ top: event.y/app.view.getZoom()+25-scrollTopVal, left: event.x/app.view.getZoom()+95-scrollLeftVal });
                },
                items: 
                {
                    "add": { name: languages[browserLang]["view_add_new_string"] },
                    "select": { name: languages[browserLang]["view_select_exis_string"] }
                }
            });
        });
    },

    createDialog: function(event) {
        var dialog = $('<div id="modalCreation"></div>')
            .dialog({
                position: 'center',
                autoOpen: false,
                resizable: false,
                width: 500,
                modal: true,
                close: function(ev, ui) {
                    $(this).dialog('destroy').remove();
                },
                buttons: {
                    Cancel: function() {
                        $(this).dialog('destroy').remove();
                    },
                    Save: function() {
                        var usableElem = event.context.getElemByAttr("usable");

                        // check existing data
                        var result = event.context.checkData(usableElem, event.dropped[0].id, event);
                    }
                },
                title: $(event.dropped[0]).text() + " " + languages[browserLang]["view_creation_string"]
            });
        $(".ui-dialog-titlebar").css("background", $(event.dropped[0]).css("backgroundColor"));

        // inject html
        dialog.html(event.context.modalCreate(event.dropped[0]));

        // show dialog
        dialog.dialog("open");
        $('.ui-widget-overlay').bind('click',function(){
            dialog.dialog('destroy').remove();
        });
    },

    getElemByAttr: function(attr) {
        var matchingElements = [];
        var allElements = $("#modalCreation").children();
        for (var i = 0, n = allElements.length; i < n; i++){
            if (allElements[i].getAttribute(attr) !== null){
                matchingElements.push(allElements[i]);
            }
        }
        return matchingElements;
    },

    checkData: function(elem, type, event) {
        var number = elem[0].value;
        if(type === "incoming") {
            var sufx = elem[1].value;
            if(sufx.slice(-1) !== ".") sufx = sufx+".";
            number = elem[0].value + " / " + sufx;
        }

        $.ajax({
          url: "/nethvoice/admin/nethvplan/visualize.php?readData="+type,
          context: document.body,
          beforeSend: function( xhr ) {
            $('#loader').show();
          }
        }).done(function(c) {
            $('#loader').hide();
            var data = JSON.parse(c);
            var missing = false;

            if(data) {
                if(type !== "ext-local" && !(number in data)) {
                    missing = true;
                } else {
                    $(".error-message").html("");
                    $(elem[0]).css("border", "1px solid rgb(255, 97, 97)");
                    $('#modalCreation').append('<p class="error-message">'+languages[browserLang]["view_error_inserted_string"]+'</p>');
                }
            } else {
                missing = true;
            }

            if(type === "ext-local") {
                missing = true;
            }

            if(missing) {
                var typeFig = $(event.dropped).data("shape");
                var figure = eval("new "+typeFig+"();");

                figure.onDrop(event.dropped, event.x, event.y, elem);

                var command = new draw2d.command.CommandAdd(event.context, figure, event.x-figure.width-75, event.y-25);
                event.context.getCommandStack().execute(command);

                $('#modalCreation').dialog('destroy').remove();
            }
        });
    },

    modalCreate: function(elem) {
        var html = "";
        switch (elem.id) {
            case "incoming":
                html += '<label class="label-creation">'+languages[browserLang]["view_number_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-number" class="input-creation-mini"></input>';
                html += ' / ';
                html += '<input usable id="'+elem.id+'-cidnum" class="input-creation-mini"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_description_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-description" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["base_night_service_string"]+': </label>';
                html += '<select usable id="'+elem.id+'-nightService" class="input-creation"><option value="1">'+languages[browserLang]["base_active_string"]+'</option><option value="0">'+languages[browserLang]["base_not_active_string"]+'</option></select>';
            break;
            case "night":
                html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_manual_act_string"]+': </label>';
                html += '<select usable onchange="if(this.selectedIndex==2)$(\'#calGroup\').show();else $(\'#calGroup\').hide();" id="'+elem.id+'-activation" class="input-creation"><option value="1">'+languages[browserLang]["base_active_string"]+'</option><option value="0">'+languages[browserLang]["base_not_active_string"]+'</option><option value="period">'+languages[browserLang]["base_period_string"]+'</option></select>';
                html += '<div usable id="calGroup" style="display:none;"><label class="label-creation">'+languages[browserLang]["base_period_from_string"]+': </label><input placeholder="dd/mm/yyyy" usable id="'+elem.id+'-fromperiod" class="input-creation"></input><label class="label-creation">'+languages[browserLang]["base_period_to_string"]+': </label><input placeholder="dd/mm/yyyy" usable id="'+elem.id+'-toperiod" class="input-creation"></input></div>';
            break;

            case "from-did-direct":
                html += '<label class="label-creation">'+languages[browserLang]["view_number_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-number" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
            break;

            case "ext-local":
                $.ajax({
                  url: "/nethvoice/admin/nethvplan/visualize.php?readData=from-did-direct",
                  context: document.body,
                  beforeSend: function( xhr ) {
                    $('#loader').show();
                  }
                }).done(function(c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for(e in data) {
                        if(data[e].voicemail === "novm")
                            htmlSelect += '<option value="'+data[e].name +' ( '+e+' )">'+data[e].name+' ( '+e+' )</option>';
                    }
                    html += '<label class="label-creation">'+languages[browserLang]["view_enable_voicemail_string"]+': </label>';
                    html += '<select usable id="'+elem.id+'-voicenum" class="input-creation">'+htmlSelect+'</select>';

                    $("#modalCreation").html(html);
                });
            break;

            case "ext-group":
                html += '<label class="label-creation">'+languages[browserLang]["view_number_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-number" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_description_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-description" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["base_ext_list_string"]+': </label>';
                html += '<textarea usable id="'+elem.id+'-extensionList" class="input-creation"></textarea>';
            break;

            case "ext-queues":
                html += '<label class="label-creation">'+languages[browserLang]["view_number_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-number" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["base_static_memb_string"]+': </label>';
                html += '<textarea usable id="'+elem.id+'-staticMem" class="input-creation"></textarea>';
                html += '<label class="label-creation">'+languages[browserLang]["base_dyn_memb_string"]+': </label>';
                html += '<textarea usable id="'+elem.id+'-dynamicMem" class="input-creation"></textarea>';
            break;

            case "ivr":
                $.ajax({
                  url: "/nethvoice/admin/nethvplan/visualize.php?readData=recordings",
                  context: document.body,
                  beforeSend: function( xhr ) {
                    $('#loader').show();
                  }
                }).done(function(c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for(e in data) {
                        htmlSelect += '<option value="'+data[e].name +' ( '+e+' )">'+data[e].name+'</option>';
                    }
                    html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                    html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                    html += '<label class="label-creation">'+languages[browserLang]["view_description_string"]+': </label>';
                    html += '<input usable id="'+elem.id+'-description" class="input-creation"></input>';
                    html += '<label class="label-creation">'+languages[browserLang]["view_recording_string"]+': </label>';
                    html += '<select usable id="'+elem.id+'-recording" class="input-creation">'+htmlSelect+'</select>';

                    $("#modalCreation").html(html);
                });
            break;

            case "app-announcement":
                $.ajax({
                  url: "/nethvoice/admin/nethvplan/visualize.php?readData=recordings",
                  context: document.body,
                  beforeSend: function( xhr ) {
                    $('#loader').show();
                  }
                }).done(function(c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for(e in data) {
                        htmlSelect += '<option value="'+data[e].name +' ( '+e+' )">'+data[e].name+'</option>';
                    }
                    html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                    html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                    html += '<label class="label-creation">'+languages[browserLang]["view_recording_string"]+': </label>';
                    html += '<select usable id="'+elem.id+'-recording" class="input-creation">'+htmlSelect+'</select>';

                    $("#modalCreation").html(html);
                });
                
            break;

            case "timeconditions":
                $.ajax({
                    url: "/nethvoice/admin/nethvplan/visualize.php?readData=timegroups",
                    context: document.body,
                    beforeSend: function( xhr ) {
                        $('#loader').show();
                    }
                }).done(function(c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for(e in data) {
                        htmlSelect += '<option value="'+data[e].description +' ( '+e+' )">'+data[e].description+'</option>';
                    }
                    html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                    html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                    html += '<label class="label-creation">'+languages[browserLang]["view_timegroup_string"]+': </label>';
                    html += '<select usable id="'+elem.id+'-timegroup" class="input-creation">'+htmlSelect+'</select>';

                    $("#modalCreation").html(html);
                });
            break;

            case "app-daynight":
                $.ajax({
                    url: "/nethvoice/admin/nethvplan/visualize.php?readData=codeavailable",
                    context: document.body,
                    beforeSend: function( xhr ) {
                        $('#loader').show();
                    }
                }).done(function(c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for(e in data) {
                        htmlSelect += '<option value="'+data[e]+'">'+data[e]+'</option>';
                    }
                    html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                    html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
                    html += '<label class="label-creation">'+languages[browserLang]["view_control_code_string"]+': </label>';
                    html += '<select usable id="'+elem.id+'-controlcode" class="input-creation">'+htmlSelect+'</select>';

                    $("#modalCreation").html(html);
                });
            break;

            case "ext-meetme":
                html += '<label class="label-creation">'+languages[browserLang]["view_number_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-number" class="input-creation"></input>';
                html += '<label class="label-creation">'+languages[browserLang]["view_name_string"]+': </label>';
                html += '<input usable id="'+elem.id+'-name" class="input-creation"></input>';
            break;
        }

        return html;
    },

    getDestination: function(destination) {
        var values, dests, dest, id, idlong, ids = null;

        if(destination.match(/ivr-*/)) {
            values = destination.split(",");
            dests = values[0].split("-");
            dest = dests[0];
            id = dests[1];
        } else if(destination.match('/app-announcement-*/')) {
            values = destination.split(",");
            dests = values[0].split("-");
            dest = dests[0]+"-"+dests[1];
            id = dests[2];
        } else if(destination.match('/^night/')) {
            values = destination.split(",");
            idlong = values[1];
            dest = values[0];
            ids = str_split(idlong);
            id = ids[1];
        } else {
            values = destination.split(",");
            dest = values[0];
            id = values[1];
        }

        return [dest, id];
    },

    switchDescription: function(dataArray, type) {
        var htmlInj = "";
        for(elem in dataArray) {
            var text = dataArray[elem].entities[0].text;
            if(type === "ext-local") {
                text = dataArray[elem].entities[0].text.split("-")[0];
            }
            htmlInj += '<div><button elemDest="'+dataArray[elem].entities[dataArray[elem].entities.length-1].destination+'" elemId="'+elem+'" class="button-elem-list">'+elem+' - '+text+'</button></div>';
        }
        if(htmlInj === "") htmlInj = languages[browserLang]["base_no_elements_string"];
        return htmlInj;
    },
    
    onDrop: function(droppedDomNode, x, y, shiftKey, ctrlKey)
    {
        if(droppedDomNode[0].id !== "app-blackhole" && droppedDomNode[0].id !== "incoming") {
            // add context menu
            this.contextMenu();

            $('#container').trigger('contextmenu', { x: x, y: y, context: this, dropped: droppedDomNode });
        } else {
            if(droppedDomNode[0].id == "incoming") {
               var data = {};
                data.x = x;
                data.y = y;
                data.context = this;
                data.dropped = droppedDomNode;

                this.createDialog(data); 
            } else {
                var type = $(droppedDomNode[0]).data("shape");
                var figure = eval("new "+type+"();");

                figure.onDrop(droppedDomNode, x, y, []);

                var command = new draw2d.command.CommandAdd(this, figure, x-figure.width-75, y-25);
                this.getCommandStack().execute(command);
            }
            
        }
        
    }
});