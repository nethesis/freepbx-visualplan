var currentDelta = 0;
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
    /**
     * @method
     * Called if the user drop the droppedDomNode onto the canvas.<br>
     * <br>
     * Draw2D use the jQuery draggable/droppable lib. Please inspect
     * http://jqueryui.com/demos/droppable/ for further information.
     * 
     * @param {HTMLElement} droppedDomNode The dropped DOM element.
     * @param {Number} x the x coordinate of the drop
     * @param {Number} y the y coordinate of the drop
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     * @private
     **/
    onDrop: function(droppedDomNode, x, y, shiftKey, ctrlKey)
    {
        var type = $(droppedDomNode).data("shape");
        var figure = eval("new "+type+"("+$(droppedDomNode).data("radius")+");");

        figure.onDrop(droppedDomNode, x, y);

        // create a command for the undo/redo support
        var command = new draw2d.command.CommandAdd(this, figure, x, y);
        this.getCommandStack().execute(command);
    }
});