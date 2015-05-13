Base = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "Base",
	
    init : function(attr)
    {
        var _this = this;

        this.tooltip = null;

        this._super($.extend({
            stroke: 0
        }, attr));

        this.classLabel = new draw2d.shape.basic.Label({
            text:"ClassName",
            stroke:0,
            padding:10,
            resizeable:true,
            bold: true,
            fontColor: "#ffffff",
            fontSize: 14
        });

        this.add(this.classLabel);
    },

    // onDragStart: function() {
    //     this._super();
    //     this.showTooltip();
    //     // var canvas = document.getElementById('canvas');
    //     // $(canvas).panzoom("disable");
    // },

    // onDragEnd: function() {
    //     // var canvas = document.getElementById('canvas');
    //     // $(canvas).panzoom("enable");
    //     this.hideTooltip();
    // },

    addEntity: function(txt, type, optionalIndex)
    {
        var padding = { left:30, top:5, right:30, bottom:5 };
        var bgColor = "#f7f7f7";

        if(type == "input") {
            padding = { left:10, top:5, right:50, bottom:5 };
        }
        if(type == "output") {
            padding = { left:50, top:5, right:10, bottom:5 };
        }

        if(type === "list") {
            if(txt && txt !== "") {
                var members = txt.match(/-?\d+/g).filter(Number);
                txt = members.join(",");
            } else {
                txt = "No elements found";
            }

            padding = { left:40, top:5, right:10, bottom:5 };
            bgColor = "#ffffff";
        } 

        // create label
        var label = new draw2d.shape.basic.Label({
            text:txt,
            stroke:0,
            bgColor:bgColor,
            padding:padding,
            fontColor:"#4a4a4a",
            resizeable:true
        });

        // create port
        if(type === "input" || type == "output") {
            var port = label.createPort(type);
            port.setName(type+"_"+label.id);
            if(type == "output") {
                port.setMaxFanOut(1);
            }
        }

        // add context menu
        this.contextMenu(label, this);
        
        if($.isNumeric(optionalIndex)){
            this.add(label, null, optionalIndex+1);
        }
        else{
            this.add(label);
        }

        return label;
    },

    contextMenu: function(label, table)
    {
        var idType = table.id.split("%")[0];

        switch(idType) {
            case "incoming":
                label.on("contextmenu", function(emitter, event){
                    if(table.children.data.length > 2) {
                        $.contextMenu({
                            selector: 'body', 
                            events:
                            {  
                                hide:function(){ $.contextMenu( 'destroy' ); }
                            },
                            callback: $.proxy(function(key, options) 
                            {
                                switch(key){
                                    case "delete":
                                        var cmd = new draw2d.command.CommandDelete(table.children.data[2].figure);
                                        emitter.getCanvas().getCommandStack().execute(cmd);
                                    break;
                                    default:
                                    break;
                                }
                            },this),
                            x: event.x,
                            y: event.y,
                            items: 
                            {
                                "delete": { name: "Delete Night Service" }
                            }
                        });
                    } else {
                        $.contextMenu({
                            selector: 'body', 
                            events:
                            {  
                                hide:function(){ $.contextMenu( 'destroy' ); }
                            },
                            callback: $.proxy(function(key, options) 
                            {
                                switch(key){
                                    case "action":
                                        setTimeout(function(){
                                                 table.addEntity("Night Service", "output", "false");
                                             },10);
                                    break;
                                    default:
                                    break;
                                }
                            },this),
                            x: event.x,
                            y: event.y,
                            items: 
                            {
                                "action": { name: "Add Night Service" }
                            }
                        });
                    }
                });
            break;
            case "ivr":
                label.on("contextmenu", function(emitter, event) {
                    $.contextMenu({
                        selector: 'body', 
                        events:
                        {  
                            hide:function(){ $.contextMenu( 'destroy' ); }
                        },
                        callback: $.proxy(function(key, options) 
                        {
                            switch(key){
                                case "add":
                                    var cNum = table.children.data.length-5;
                                    setTimeout(function(){
                                        table.addEntity(cNum, "output", "false");
                                    },10);
                                break;
                                case "delete":
                                    var cmd = new draw2d.command.CommandDelete(table.children.data[table.children.data.length-1].figure);
                                    emitter.getCanvas().getCommandStack().execute(cmd);
                                break;
                                default:
                                break;
                            }
                        },this),
                        x: event.x,
                        y: event.y,
                        items: 
                        {
                            "add": { name: "Add new selection"},
                            "delete": { name: "Delete selection" }
                        }
                    });
                });
            break;
        }
    },
    
    onDrop: function(droppedDomNode, x, y, elements)
    {
        this.creationSwitch(elements, droppedDomNode[0].id, droppedDomNode[0].innerText);
    },

    creationSwitch: function(elem, type, title) {
        var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        var id = randLetter + Date.now();

        var templateObj = {
            bgColor: "#dbddde",
            name: title,
            type: "Base",
            userData: []
        };

        switch (type) {
            case "app-blackhole":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#cf000f";
                templateObj.radius = 20;
                templateObj.entities = [
                    {
                        text: "Hangup",
                        id: "hangup_dest%"+id,
                        type: "input"
                    }
                ];
            break;
            case "incoming":
                templateObj.id = type+"%"+elem[0].value+" / "+elem[1].value;
                templateObj.bgColor = "#87d37c";
                templateObj.radius = 20;
                templateObj.entities = [
                    {
                        text: elem[0].value+" / "+elem[1].value+" ( "+elem[2].value +" )",
                        id: "incoming_route-num%"+id,
                        type: "output"
                    }
                ];

                if(parseInt(elem[3].value)) {
                    templateObj.entities.push({
                        text: "Night service",
                        id: "night_service%"+id,
                        type: "output"
                    });
                }
            break;

            case "night":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#34495e";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[0].value,
                        id: "night-service_name%"+id,
                        type: "input"
                    }
                ];

                if(parseInt(elem[1].value)) text = "Active";
                if(!parseInt(elem[1].value)) text = "Not Active";
                if(elem[1].value == "period") {
                    var from = elem[2].children[1].value;
                    var to = elem[2].children[3].value;
                    text = from +" - "+ to;
                }
                templateObj.entities.push({
                    text: text,
                    id: "night-service_state%"+id,
                    type: "text"
                });

                templateObj.entities.push({
                    text: "Destination",
                    id: "night-service_destination%"+id,
                    type: "output"
                });
            break;

            case "from-did-direct":
                templateObj.id = type+"%"+elem[0].value;
                templateObj.bgColor = "#27ae60";
                templateObj.radius = 20;
                templateObj.entities = [
                    {
                        text: elem[1].value + " ( "+elem[0].value+" )",
                        id: "from-did-direct_dest%"+id,
                        type: "input"
                    }
                ];
            break;

            case "ext-local":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#16a085";
                templateObj.radius = 20;
                var dynId = (elem[0].value.split("(")[1]).split(")")[0].trim();
                templateObj.entities = [
                    {
                        text: elem[0].value +" - Busy",
                        id: "ext-local%vmb"+dynId,
                        type: "input"
                    },
                    {
                        text: elem[0].value +" - No Message",
                        id: "ext-local%vms"+dynId,
                        type: "input"
                    },
                    {
                        text: elem[0].value +" - Unavailable",
                        id: "ext-local%vmu"+dynId,
                        type: "input"
                    }
                ];
            break;

            case "ext-group":
                templateObj.id = type+"%"+elem[0].value;
                templateObj.bgColor = "#2980b9";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[1].value + " ( "+elem[0].value+" )",
                        id: "groups_name%"+id,
                        type: "input"
                    },
                    {
                        text: "Extensions list",
                        id: "groups_listtext%"+id,
                        type: "text"
                    },
                    {
                        text: elem[2].value,
                        id: "groups_lists%"+id,
                        type: "list"
                    },
                    {
                        text: "Fail destination",
                        id: "groups_output%"+id,
                        type: "output"
                    }
                ];
            break;

            case "ext-queues":
                templateObj.id = type+"%"+elem[0].value;
                templateObj.bgColor = "#9b59b6";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[1].value + " ( "+elem[0].value+" )",
                        id: "queues_name%"+id,
                        type: "input"
                    },
                    {
                        text: "Static members",
                        id: "queues_statictext%"+id,
                        type: "text"
                    },
                    {
                        text: elem[2].value,
                        id: "queues_staticlist%"+id,
                        type: "list"
                    },
                    {
                        text: "Dynamic members",
                        id: "queues_dynamictext%"+id,
                        type: "text"
                    },
                    {
                        text: elem[3].value,
                        id: "queues_dynamiclist%"+id,
                        type: "list"
                    },
                    {
                        text: "Fail destination",
                        id: "queues_output%"+id,
                        type: "output"
                    }
                ];
            break;

            case "ivr":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#7f8c8d";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[0].value + " ( "+elem[1].value+" )",
                        id: "ivr_name%"+id,
                        type: "input"
                    },
                    {
                        text: "Announcement: "+elem[2].value,
                        id: "ivr_announc%"+id,
                        type: "text"
                    },
                    {
                        text: "Invalid destination",
                        id: "ivr_invalid-dest%"+id,
                        type: "output"
                    },
                    {
                        text: "Timeout destination",
                        id: "ivr_timeout-dest%"+id,
                        type: "output"
                    }
                ];
            break;

            case "app-announcement":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#f4b350";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[0].value,
                        id: "announcement_name%"+id,
                        type: "input"
                    },
                    {
                        text: elem[1].value,
                        id: "announcement_record%"+id,
                        type: "text"
                    },
                    {
                        text: "Destination",
                        id: "announcement_output%"+id,
                        type: "output"
                    }
                ];
            break;

            case "timeconditions":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#D35400";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[0].value,
                        id: "timeconditions_name%"+id,
                        type: "input"
                    },
                    {
                        text: elem[1].value,
                        id: "timeconditions_record%"+id,
                        type: "text"
                    },
                    {
                        text: "True condition",
                        id: "timeconditions_truegoto%"+id,
                        type: "output"
                    },
                    {
                        text: "False condition",
                        id: "timeconditions_falsegoto%"+id,
                        type: "output"
                    }
                ];
            break;

            case "app-daynight":
                templateObj.id = type+"%"+id;
                templateObj.bgColor = "#2c3e50";
                templateObj.radius = 0;
                templateObj.entities = [
                    {
                        text: elem[0].value +" ( *28"+elem[1].value+" )",
                        id: "app-daynight_name%"+id,
                        type: "input"
                    },
                    {
                        text: "Normal flow (green)",
                        id: "app-daynight_truegoto%"+id,
                        type: "output"
                    },
                    {
                        text: "Alternative flow (red)",
                        id: "app-daynight_falsegoto%"+id,
                        type: "output"
                    }
                ];
            break;

            case "ext-meetme":
                templateObj.id = type+"%"+elem[0].value;
                templateObj.bgColor = "#65c6bb";
                templateObj.radius = 20;
                templateObj.entities = [
                    {
                        text: elem[1].value + " ( "+elem[0].value+" )",
                        id: "ext-meetme_dest%"+id,
                        type: "input"
                    }
                ];
            break;
        }
        this.setPersistentAttributes(templateObj);
    },

    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },

    setName: function(name)
    {
        this.classLabel.setText(name);

        return this;
    },

    getPersistentAttributes : function()
    {
        var memento = this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){

            if(i>0){
                    memento.entities.push({
                    text:e.figure.getText(),
                    id: e.figure.id
                    });
                }
        });

        return memento;
    },

    setPersistentAttributes : function(memento)
    {
        this._super(memento);

        this.setName(memento.name);

        if(typeof memento.entities !== "undefined"){
            $.each(memento.entities, $.proxy(function(i,e){
                var entity = this.addEntity(e.text, e.type);
                entity.id = e.id;

                // entity.onMouseEnter = function() {
                //     this.tooltip = $('<div class="tooltip">Tooltip</div>').appendTo('body');
                //     if( this.tooltip===null){
                //         return;
                //     }
                    
                //     var width =  this.tooltip.outerWidth(true);
                //     var tPosX = entity.getAbsoluteX()+entity.getWidth()/2-width/2+8;
                //     var tPosY = entity.getAbsoluteY()+entity.getHeight() + 20;
                //     this.tooltip.css({'top': tPosY, 'left': tPosX});
                // }
                // entity.onMouseLeave = function() {
                //     this.tooltip.remove();   
                //     this.tooltip = null;
                // }

                if(e.type == "output")
                    entity.getOutputPort(0).setName("output_"+e.id);

                if(e.type == "input")
                    entity.getInputPort(0).setName("input_"+e.id);

            },this));
        }

        return this;
    }
});

MyConnection = draw2d.Connection.extend({
    NAME: "MyConnection",

    init: function (attr) {
        this._super(attr);
    },

    getPersistentAttributes: function () {
        var memento = this._super();

        if (this.sourceDecorator !== null) {
            memento.source.decoration = this.sourceDecorator.NAME;
        }

        if (this.targetDecorator !== null) {
            memento.target.decoration = this.targetDecorator.NAME;
        }

        return memento;
    },

    setPersistentAttributes: function (memento) {
        this._super(memento);

        if (typeof memento.target.decoration !== "undefined" && memento.target.decoration != null) {
            this.setTargetDecorator(eval("new " + memento.target.decoration));
            this.targetDecorator.setDimension(10,10);
            this.targetDecorator.setBackgroundColor("#4caf50");
        }

        // if (typeof memento.source.decoration !== "undefined" && memento.source.decoration != null) {
        //     this.setSourceDecorator(eval("new " + memento.source.decoration));
        // }
    }
});