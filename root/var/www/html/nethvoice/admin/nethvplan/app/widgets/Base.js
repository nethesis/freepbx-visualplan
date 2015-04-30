Base = draw2d.shape.layout.VerticalLayout.extend({

	NAME: "Base",
	
    init : function(attr)
    {
        this.tooltip = null;
        
        this._super($.extend({
            bgColor: "#dbddde",
            stroke: 0
        }, attr));

        this.classLabel = new draw2d.shape.basic.Label({
            text:"ClassName",
            stroke:0,
            bgColor:"#f7f7f7",
            padding:10,
            resizeable:true,
            bold: true
        });

        this.add(this.classLabel);
    },

    addEntity: function(txt, port, editable, optionalIndex)
    {
        var padding = { left:30, top:5, right:10, bottom:5 };

        if(port == "input") {
            padding = { left:10, top:5, right:10, bottom:5 };
        }

        // create label
        var label = new draw2d.shape.basic.Label({
            text:txt,
            stroke:0,
            radius:0,
            bgColor:null,
            padding:padding,
            fontColor:"#4a4a4a",
            resizeable:true
        });

        if(editable == "true") {
            label.installEditor(new draw2d.ui.LabelInplaceEditor());
        }

        // create port
        if(port === "input" || port == "output") {
            var port = label.createPort(port);
            port.setName(port+"_"+label.id);
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
        }
    },

    onMouseEnter: function(){
        this.showTooltip();
    },
    
    onMouseLeave: function(){
        this.hideTooltip();
    },
    
    setPosition: function(x,y){
        this._super(x,y);
        this.positionTooltip();
    },
    
    hideTooltip:function(){          
        this.tooltip.remove();   
        this.tooltip = null;
    },
    
    
    showTooltip:function(){          
        this.tooltip= $('<div class="tooltip">Tooltip</div>').appendTo('body');
        this.positionTooltip();        
    },
    
    positionTooltip: function(){
        if( this.tooltip===null){
            return;
        }
        
        var width =  this.tooltip.outerWidth(true);
        var tPosX = this.getAbsoluteX()+this.getWidth()/2-width/2+8;
        var tPosY = this.getAbsoluteY()+this.getHeight() + 20;
        this.tooltip.css({'top': tPosY, 'left': tPosX});
    },

    onDrop: function(droppedDomNode, x, y)
    {
        // var type = $(droppedDomNode).data("shape");
        // var figure = eval("new "+type+"();");

        console.log(droppedDomNode);

        var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        var id = randLetter + Date.now();

        var templateObj = {
            bgColor: "#dbddde",
            name: droppedDomNode[0].innerText,
            type: "Base",
            userData: [],
            id: "incoming%"+id

        };

        switch (droppedDomNode[0].id) {

            case "incoming":
                templateObj.entities = [{
                    text: "num / call_num.",
                    id: "route_num-incoming%"+id,
                    type: "output"
                }];
            break;

            case "night":

            break;

            case "from-did-direct":

            break;

            case "ext-local":

            break;

            case "ext-group":

            break;

            case "ext-queues":

            break;

            case "ivr":

            break;

            case "app-announcement":

            break;

            case "timeconditions":

            break;

            case "app-daynight":

            break;

            case "ext-meetme":

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
                var entity = this.addEntity(e.text, e.type, e.editable);
                entity.id = e.id;

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

        if (typeof memento.source.decoration !== "undefined" && memento.source.decoration != null) {
            this.setSourceDecorator(eval("new " + memento.source.decoration));
        }
    }
});