example.Toolbar = Class.extend({
	
	init:function(elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		
		// register this class as event listener for the canvas
		// CommandStack. This is required to update the state of 
		// the Undo/Redo Buttons.
		//
		view.getCommandStack().addEventListener(this);

		// Register a Selection listener for the state hnadling
		// of the Delete Button
		//
        view.on("select", $.proxy(this.onSelectionChanged,this));

        this.zoomInButton  = $("<button  class='gray'><i class='fa fa-search-plus fa-lg'></i></button>");
		this.html.append(this.zoomInButton);
		this.zoomInButton.button().click($.proxy(function(){
			if(app.view.getZoom() > 1)
		      this.view.setZoom(this.view.getZoom()*0.75,true);
		},this));

		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
		this.html.append(this.delimiter);

		// Inject the DELETE Button
		//
		this.resetButton  = $("<button  class='gray'>1:1</button>");
		this.html.append(this.resetButton);
		this.resetButton.button().click($.proxy(function(){
		    this.view.setZoom(1.2, true);
		},this));

		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
		this.html.append(this.delimiter);
		
		// Inject the REDO Button and the callback
		//
		this.zoomOutButton  = $("<button  class='gray'><i class='fa fa-search-minus fa-lg'></i></button>");
		this.html.append(this.zoomOutButton);
		this.zoomOutButton.button().click($.proxy(function(){
            this.view.setZoom(this.view.getZoom()*1.25, true);
		},this));

		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
		this.html.append(this.delimiter);
		
		// Inject the UNDO Button and the callbacks
		//
		this.undoButton  = $("<button class='gray'><i class='fa fa-mail-reply fa-lg'></i></button>");
		this.html.append(this.undoButton);
		this.undoButton.click($.proxy(function(){
		       this.view.getCommandStack().undo();
		},this));

		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
		this.html.append(this.delimiter);

		// Inject the REDO Button and the callback
		//
		this.redoButton  = $("<button class='gray'><i class='fa fa-mail-forward fa-lg'></i></button>");
		this.html.append(this.redoButton);
		this.redoButton.click($.proxy(function(){
		    this.view.getCommandStack().redo();
		},this));
		
		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;</span>");
		this.html.append(this.delimiter);

		// Inject the DELETE Button
		//
		this.deleteButton  = $("<button class='gray'><i class='fa fa-close fa-lg'></i></button>");
		this.html.append(this.deleteButton);
		this.deleteButton.click($.proxy(function(){
			var node = this.view.getCurrentSelection();
			var command= new draw2d.command.CommandDelete(node);
			this.view.getCommandStack().execute(command);
		},this));

		this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
		this.html.append(this.delimiter);

		// Inject the Save Button
		//
		this.saveButton  = $("<button class='gray'><i class='fa fa-check fa-lg'></i></button>");
		this.html.append(this.saveButton);
		this.saveButton.click($.proxy(function(){

			console.clear();

			var writer = new draw2d.io.json.Writer();
			writer.marshal(this.view, function(json){

				//console.log(window.btoa(unescape(encodeURIComponent(JSON.stringify(json)))));

				$.ajax({
			      url: "/nethvoice/admin/nethvplan/create.php?jsonData="+window.btoa(unescape(encodeURIComponent(JSON.stringify(json)))),
			      context: document.body,
			      beforeSend: function( xhr ) {
			        //$('#loader').show();
			      }
			    }).done(function(c) {
			    	console.log(c);
			    });
			});
		},this));
		
        this.disableButton(this.undoButton, true);
        this.disableButton(this.redoButton, true);
        this.disableButton(this.deleteButton, true);

        this.html.append($("<div id='toolbar_hint'></div>"));
    },

	/**
	 * @method
	 * Called if the selection in the cnavas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
	 * @param {draw2d.Figure} figure
	 */
	onSelectionChanged : function(emitter, figure){
        this.disableButton(this.deleteButton,figure===null );
	},
	
	/**
	 * @method
	 * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 * @param {draw2d.command.CommandStackEvent} event
	 **/
	stackChanged:function(event)
	{
        this.disableButton(this.undoButton, !event.getStack().canUndo());
        this.disableButton(this.redoButton, !event.getStack().canRedo());
	},
	
	disableButton:function(button, flag)
	{
	   button.prop("disabled", flag);
       if(flag){
            button.addClass("disabled");
        }
        else{
            button.removeClass("disabled");
        }
	}
});