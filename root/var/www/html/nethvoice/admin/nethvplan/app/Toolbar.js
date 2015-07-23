example.Toolbar = Class.extend({

    init: function(elementId, view) {
        this.html = $("#" + elementId);
        this.view = view;

        // register this class as event listener for the canvas
        // CommandStack. This is required to update the state of 
        // the Undo/Redo Buttons.
        //
        view.getCommandStack().addEventListener(this);

        // Register a Selection listener for the state hnadling
        // of the Delete Button
        //
        view.on("select", $.proxy(this.onSelectionChanged, this));

        this.zoomInButton = $("<button  class='gray'><i class='fa fa-search-plus fa-lg'></i></button>");
        this.html.append(this.zoomInButton);
        this.zoomInButton.button().click($.proxy(function() {
            if (app.view.getZoom() > 1)
                this.view.setZoom(this.view.getZoom() * 0.75, true);
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the DELETE Button
        //
        this.resetButton = $("<button  class='gray'>1:1</button>");
        this.html.append(this.resetButton);
        this.resetButton.button().click($.proxy(function() {
            this.view.setZoom(1.2, true);
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the REDO Button and the callback
        //
        this.zoomOutButton = $("<button  class='gray'><i class='fa fa-search-minus fa-lg'></i></button>");
        this.html.append(this.zoomOutButton);
        this.zoomOutButton.button().click($.proxy(function() {
            this.view.setZoom(this.view.getZoom() * 1.25, true);
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
        this.html.append(this.delimiter);

        this.panButton = $("<button id='canvasPolicy' currentBtn='pan' class='gray'><i class='fa fa-arrows-alt fa-lg'></i></button>");
        this.html.append(this.panButton);
        this.panButton.click($.proxy(function(e) {
            var currentBtn = e.currentTarget.attributes.currentBtn.value;
            var canvas = document.getElementById("canvas");

            if (currentBtn === "pan") {
                e.currentTarget.attributes.currentBtn.value = "box";
                $(e.currentTarget.children[0]).removeAttr('class');
                $(e.currentTarget.children[0]).attr('class', 'fa fa-crosshairs fa-lg');
                canvas.style.cursor = "cell";
                var policy = new draw2d.policy.canvas.BoundingboxSelectionPolicy;
                this.view.installEditPolicy(policy);

                $('#typer').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_select_string"]);
                $('#typer').children().attr('class', 'fa fa-crosshairs fa-3x typing-icon');
                $('#typer').fadeIn("slow");
                setTimeout(function() {
                    $('#typer').fadeOut("slow");
                }, 1000);

            } else {
                e.currentTarget.attributes.currentBtn.value = "pan";
                $(e.currentTarget.children[0]).removeAttr('class');
                $(e.currentTarget.children[0]).attr('class', 'fa fa-arrows-alt fa-lg');
                canvas.style.cursor = "move";
                var policy = new draw2d.policy.canvas.PanningSelectionPolicy;
                this.view.installEditPolicy(policy);

                $('#typer').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_pan_string"]);
                $('#typer').children().attr('class', 'fa fa-arrows-alt fa-3x typing-icon');
                $('#typer').fadeIn("slow");
                setTimeout(function() {
                    $('#typer').fadeOut("slow");
                }, 1000);
            }
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the UNDO Button and the callbacks
        //
        this.undoButton = $("<button class='gray'><i class='fa fa-mail-reply fa-lg'></i></button>");
        this.html.append(this.undoButton);
        this.undoButton.click($.proxy(function() {
            this.view.getCommandStack().undo();
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the REDO Button and the callback
        //
        this.redoButton = $("<button class='gray'><i class='fa fa-mail-forward fa-lg'></i></button>");
        this.html.append(this.redoButton);
        this.redoButton.click($.proxy(function() {
            this.view.getCommandStack().redo();
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the DELETE Button
        //
        this.deleteButton = $("<button class='gray'><i class='fa fa-close fa-lg'></i></button>");
        this.html.append(this.deleteButton);
        this.deleteButton.click($.proxy(function() {
            var node = this.view.getCurrentSelection();
            var command = new draw2d.command.CommandDelete(node);
            this.view.getCommandStack().execute(command);
        }, this));

        this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
        this.html.append(this.delimiter);

        // Inject the Save Button
        //
        this.saveButton = $("<button class='gray'><i class='fa fa-check fa-lg'></i></button>");
        this.html.append(this.saveButton);
        this.saveButton.click($.proxy(function() {

            //console.log(this.view.figures.data);
            var currentView = this.view;

            var writer = new draw2d.io.json.Writer();
            writer.marshal(this.view, function(json) {

                // simply data
                for (item in json) {
                    if (json[item].type == "Base") {
                        delete json[item].width;
                        delete json[item].height;
                        delete json[item].name;
                        delete json[item].alpha;
                        delete json[item].userData;
                        delete json[item].cssClass;
                        delete json[item].bgColor;
                        delete json[item].color;
                        delete json[item].stroke;
                        delete json[item].radius;
                        delete json[item].ports;
                    }
                    if (json[item].type == "MyConnection") {
                        delete json[item].outlineStroke;
                        delete json[item].alpha;
                        delete json[item].userData;
                        delete json[item].cssClass;
                        delete json[item].color;
                        delete json[item].stroke;
                        delete json[item].outlineColor;
                        delete json[item].radius;
                        delete json[item].policy;
                        delete json[item].router;
                        delete json[item].target.decoration;
                    }
                }

                if (jQuery.isEmptyObject(json)) {
                    $('#emptier').fadeIn("slow");
                    $('#emptier').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_empty_string"]);
                    setTimeout(function() {
                        $('#emptier').fadeOut("slow");
                    }, 5000);
                } else {
                    $.ajax({
                        url: "/nethvoice/admin/nethvplan/create.php?",
                        type: "POST",
                        data: "jsonData=" + window.btoa(unescape(encodeURIComponent(JSON.stringify(json)))),
                        beforeSend: function(xhr) {
                            $('#loader').show();
                        }
                    }).done(function(c) {
                        $('#loader').hide();

                        try {
                            var resp = JSON.parse(c);
                        } catch (e) {
                            var resp = c;
                        }

                        if (resp.success) {
                            $('#saver').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_save_string"]);
                            $('#saver').fadeIn("slow");
                            setTimeout(function() {
                                $('#saver').fadeOut("slow");
                            }, 3000);
                            highlight($('#save_button'));

                            for (elem in resp.success) {
                                for (widget in currentView.figures.data) {
                                    if (currentView.figures.data[widget].id === resp.success[elem].idElem) {
                                        var cWid = currentView.figures.data[widget];
                                        var newId = resp.success[elem].idObj;
                                        var nameComplete = cWid.children.data[1].figure.text;
                                        var name = nameComplete.split('-')[0].trim();

                                        // set new name
                                        cWid.children.data[1].figure.text = name + " - " + newId;
                                    }
                                }
                            }
                        } else {
                            $('#errorer').children().eq(0).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_string"]);
                            $('#errorer').children().eq(1).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_log_string"]);
                            $('#errorer').fadeIn("slow");
                            console.clear();
                            console.log(c);
                            setTimeout(function() {
                                $('#errorer').fadeOut("slow");
                            }, 5000);
                        }
                    });
                }
            });
        }, this));

        this.delimiter = $("<button id=\"save_button\" class='save_button'><i class='fa fa-circle fa-lg'></i></button>");
        this.html.append(this.delimiter);

        this.disableButton(this.undoButton, true);
        this.disableButton(this.redoButton, true);
        this.disableButton(this.deleteButton, true);

        this.html.append($("<div id='toolbar_hint'></div>"));

        function highlight(obj) {
            obj.fadeIn("slow");
            obj.css("color", "#87D37C");
            setTimeout(function() {
                obj.fadeOut("slow");
            }, 3000);
        }
    },

    /**
     * @method
     * Called if the selection in the cnavas has been changed. You must register this
     * class on the canvas to receive this event.
     * 
     * @param {draw2d.Figure} figure
     */
    onSelectionChanged: function(emitter, figure) {
        this.disableButton(this.deleteButton, figure === null);
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
    stackChanged: function(event) {
        this.disableButton(this.undoButton, !event.getStack().canUndo());
        this.disableButton(this.redoButton, !event.getStack().canRedo());
    },

    disableButton: function(button, flag) {
        button.prop("disabled", flag);
        if (flag) {
            button.addClass("disabled");
        } else {
            button.removeClass("disabled");
        }
    }
});