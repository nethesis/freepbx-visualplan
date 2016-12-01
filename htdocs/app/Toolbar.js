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

    this.zoomInButton = $("<button  class='mainmenu_btns right_floated'><i class='fa fa-search-plus fa-lg'></i></button>");
    this.html.append(this.zoomInButton);
    this.zoomInButton.button().click($.proxy(function() {
      if (app.view.getZoom() > 1)
        this.view.setZoom(this.view.getZoom() * 0.75, true);
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
    this.html.append(this.delimiter);

    // Inject the DELETE Button
    //
    this.resetButton = $("<button  class='mainmenu_btns right_floated'>1:1</button>");
    this.html.append(this.resetButton);
    this.resetButton.button().click($.proxy(function() {
      this.view.setZoom(1.2, true);
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
    this.html.append(this.delimiter);

    // Inject the REDO Button and the callback
    //
    this.zoomOutButton = $("<button  class='mainmenu_btns right_floated'><i class='fa fa-search-minus fa-lg'></i></button>");
    this.html.append(this.zoomOutButton);
    this.zoomOutButton.button().click($.proxy(function() {
      this.view.setZoom(this.view.getZoom() * 1.25, true);
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>");
    this.html.append(this.delimiter);

    this.panButton = $("<button id='canvasPolicy' currentBtn='pan' class='mainmenu_btns'><i class='fa fa-arrows-alt fa-lg'></i></button>");
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
    this.undoButton = $("<button class='mainmenu_btns'><i class='fa fa-mail-reply fa-lg'></i></button>");
    this.html.append(this.undoButton);
    this.undoButton.click($.proxy(function() {
      this.view.getCommandStack().undo();
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
    this.html.append(this.delimiter);

    // Inject the REDO Button and the callback
    //
    this.redoButton = $("<button class='mainmenu_btns'><i class='fa fa-mail-forward fa-lg'></i></button>");
    this.html.append(this.redoButton);
    this.redoButton.click($.proxy(function() {
      this.view.getCommandStack().redo();
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;&nbsp;&nbsp;</span>");
    this.html.append(this.delimiter);

    // Inject the MODIFY Button
    //
    this.modifyButton = $("<button class='mainmenu_btns'><i class='fa fa-pencil fa-lg'></i></button>");
    this.html.append(this.modifyButton);
    this.modifyButton.click($.proxy(function() {
      var node = this.view.getCurrentSelection();
      try {
        var idExt = node.children.data[1].figure.text.split('-')[1].trim();
      } catch (e) {
        var idExt = "";
      }
      var typeObj = node.id.split('%')[0].trim();
      var nodeObj = {
        id: typeObj,
        idObj: idExt,
        title: node.children.data[0].figure.text,
        color: node.bgColor.hashString,
        data: node.children.data,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        context: node.canvas,
        shape: node.cssClass
      };
      if (typeObj !== 'ext-local' && typeObj !== 'app-blackhole') {
        this.createDialog(nodeObj, node);
      }
      // var command = new draw2d.command.CommandDelete(node);
      // this.view.getCommandStack().execute(command);
    }, this));

    this.delimiter = $("<span class='toolbar_delimiter'>&nbsp;</span>");
    this.html.append(this.delimiter);

    // Inject the DELETE Button
    //
    this.deleteButton = $("<button class='mainmenu_btns'><i class='fa fa-close fa-lg'></i></button>");
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
    this.saveButton = $("<button class='mainmenu_btns'><i class='fa fa-check fa-lg'></i></button>");
    this.html.append(this.saveButton);
    this.saveButton.click($.proxy(function() {

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
            url: "./create.php?",
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
              resp = resp.substring(resp.indexOf("{"));
              resp = JSON.parse(resp);
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
                    cWid.children.data[1].figure.setText(name + " - " + newId);
                  }
                }
              }
            } else { //TODO: maybe never executed?
              $('#loader').hide();
              $('#errorer').children().eq(0).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_string"]);
              $('#errorer').children().eq(1).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_log_string"]);
              $('#errorer').fadeIn("slow");
              console.clear();
              console.log(c);
              setTimeout(function() {
                $('#errorer').fadeOut("slow");
              }, 5000);
            }
          }).fail(function(err) {
            $('#loader').hide();
            $('#errorer').children().eq(0).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_string"]);
            $('#errorer').children().eq(1).html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_not_save_log_string"]);
            $('#errorer').fadeIn("slow");
            setTimeout(function() {
              $('#errorer').fadeOut("slow");
            }, 5000);
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
  },

  createDialog: function(obj, node) {
    var thisApp = this;
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
            // update values
            var usableElems = obj.context.getElemByAttr("usable");
            thisApp.updateValues(usableElems, node, obj);

            $('#modalCreation').dialog('destroy').remove();
          }
        },
        title: obj.title + " " + languages[browserLang]["view_modification_string"]
      });
    $(".ui-dialog-titlebar").css("background", obj.color);

    // inject html
    dialog.html(obj.context.modalCreate(obj, true));

    // show dialog
    dialog.dialog("open");
    $('.ui-widget-overlay').bind('click', function() {
      dialog.dialog('destroy').remove();
    });
  },

  updateValues: function(elems, node, obj) {
    switch (obj.id) {
      case "incoming":
        node.children.data[1].figure.setText(elems[0].value + ' / ' + elems[1].value + ' ( ' + elems[2].value + ' )');
        break;
      case "night":
        var id = node.children.data[1].figure.text.split('-')[1];
        if (id) {
          id = id.trim();
          node.children.data[1].figure.setText(elems[0].value + ' - ' + id);
        } else {
          node.children.data[1].figure.setText(elems[0].value);
        }
        if (elems[1].value === '1')
          node.children.data[2].figure.setText(languages[browserLang]["base_active_string"]);
        if (elems[1].value === '0')
          node.children.data[2].figure.setText(languages[browserLang]["base_not_active_string"]);
        if (elems[1].value === 'period')
          node.children.data[2].figure.setText(elems[2].children[1].value + ' - ' + elems[2].children[3].value);
        break;
      case "from-did-direct":
        node.children.data[1].figure.setText(elems[1].value + ' ( ' + elems[0].value + ' )');
        break;
      case "ext-group":
        node.children.data[1].figure.setText(elems[1].value + ' ( ' + elems[0].value + ' )');
        node.children.data[3].figure.setText(elems[2].value);
        break;
      case "ext-queues":
        node.children.data[1].figure.setText(elems[1].value + ' ( ' + elems[0].value + ' )');
        node.children.data[3].figure.setText(elems[2].value);
        node.children.data[5].figure.setText(elems[3].value);
        break;
      case "ivr":
        var id = node.children.data[1].figure.text.split('-')[1];
        if (id) {
          id = id.trim();
          node.children.data[1].figure.setText(elems[0].value + ' ( ' + elems[1].value + ' )' + ' - ' + id);
        } else {
          node.children.data[1].figure.setText(elems[0].value + ' ( ' + elems[1].value + ' )');
        }
        node.children.data[2].figure.setText(languages[browserLang]["base_app_announcement_string"] + ': ' + elems[2].value);
        break;
      case "app-announcement":
        var id = node.children.data[1].figure.text.split('-')[1];
        if (id) {
          id = id.trim();
          node.children.data[1].figure.setText(elems[0].value + ' - ' + id);
        } else {
          node.children.data[1].figure.setText(elems[0].value);
        }
        node.children.data[2].figure.setText(languages[browserLang]["view_recording_string"] + ': ' + elems[1].value);
        break;
      case "timeconditions":
        var id = node.children.data[1].figure.text.split('-')[1];
        if (id) {
          id = id.trim();
          node.children.data[1].figure.setText(elems[0].value + ' - ' + id);
        } else {
          node.children.data[1].figure.setText(elems[0].value);
        }
        node.children.data[2].figure.setText(languages[browserLang]["view_timegroup_string"] + ': ' + elems[1].value);
        break;
      case "app-daynight":
        node.children.data[1].figure.setText(elems[0].value + ' ( *28' + elems[1].value + ' )');
        break;
      case "ext-meetme":
        node.children.data[1].figure.setText(elems[1].value + ' ( ' + elems[0].value + ' )');
        break;
    }
  }
});

function hideSidenav() {
  console.log("onclick shot");
  var sidenav = document.getElementById("side-nav");
  var droppable = document.getElementsByClassName("palette_node_element");
  var icons = document.getElementsByClassName("icon");
  if (sidenav.style.maxWidth !== "70px") {
    sidenav.style.maxWidth = "70px";
    for (i = 0; i < droppable.length; i++) {
      droppable[i].className += " small";
    }
    $('#incoming').text(" ").fadeIn('slow');
    $('#night').text(" ");
    $('#ext-group').text(" ");
    $('#ext-queues').text(" ");
    $('#ivr').text(" ");
    $('#app-announcement').text(" ");
    $('#timeconditions').text(" ");
    $('#app-daynight').text(" ");

    $('#from-did-direct').text(" ");
    $('#ext-local').text(" ");
    $('#ext-meetme').text(" ");
    $('#app-blackhole').text(" ");
  } else {
    sidenav.style.maxWidth = "300px";
    for (i = 0; i < droppable.length; i++) {
      droppable[i].classList.remove("small");
    }
    // set widget name
    $('#incoming').text(languages[browserLang]["base_incoming_string"]);

    $('#night').text(languages[browserLang]["base_night_service_string"]);
    $('#ext-group').text(languages[browserLang]["base_ext_group_string"]);
    $('#ext-queues').text(languages[browserLang]["base_ext_queues_string"]);
    $('#ivr').text(languages[browserLang]["base_ivr_string"]);
    $('#app-announcement').text(languages[browserLang]["base_app_announcement_string"]);
    $('#timeconditions').text(languages[browserLang]["base_timeconditions_string"]);
    $('#app-daynight').text(languages[browserLang]["base_app_daynight_string"]);

    $('#from-did-direct').text(languages[browserLang]["base_from_did_direct_string"]);
    $('#ext-local').text(languages[browserLang]["base_ext_local_string"]);
    $('#ext-meetme').text(languages[browserLang]["base_ext_meetme_string"]);
    $('#app-blackhole').text(languages[browserLang]["base_hangup_string"]);
  };
};
