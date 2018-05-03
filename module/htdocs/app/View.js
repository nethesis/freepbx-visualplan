example.View = draw2d.Canvas.extend({

    init: function (id) {
        this._super(id, 5000, 5000);

        var canvas = document.getElementById(id);
        var svgElem = canvas.children[0];

        if (canvas.addEventListener) {
            canvas.addEventListener("mousewheel", this.MouseWheelHandler, false);
            canvas.addEventListener("DOMMouseScroll", this.MouseWheelHandler, false);
        }

        this.setScrollArea("#" + id);
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

    onDoubleClick: function (the, mouseX, mouseY, shiftKey, ctrlKey) {
        var e = document.getElementById('canvasPolicy');
        var currentBtn = e.attributes.currentBtn.value;
        var canvas = document.getElementById("canvas");

        if (currentBtn === "pan") {
            e.attributes.currentBtn.value = "box";
            $(e.children[0]).removeAttr('class');
            $(e.children[0]).attr('class', 'fa fa-chain-broken fa-lg');
            canvas.style.cursor = "cell";
            $('#typer').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_select_string"]);
            $('#typer').children().attr('class', 'fa fa-crosshairs fa-3x typing-icon');
            $('#typer').fadeIn("slow");
            setTimeout(function () {
                $('#typer').fadeOut("slow");
            }, 1000);
            var policy = new draw2d.policy.canvas.BoundingboxSelectionPolicy;
            app.view.installEditPolicy(policy);
        } else {
            e.attributes.currentBtn.value = "pan";
            $(e.children[0]).removeAttr('class');
            $(e.children[0]).attr('class', 'fa fa-arrows-alt fa-lg');
            canvas.style.cursor = "move";
            $('#typer').children().html("&nbsp;&nbsp;" + languages[browserLang]["toolbar_pan_string"]);
            $('#typer').children().attr('class', 'fa fa-arrows-alt fa-3x typing-icon');
            $('#typer').fadeIn("slow");
            setTimeout(function () {
                $('#typer').fadeOut("slow");
            }, 1000);
            var policy = new draw2d.policy.canvas.PanningSelectionPolicy;
            app.view.installEditPolicy(policy);
        }
    },

    MouseWheelHandler: function (e) {
        var e = window.event || e;
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        var canvas = document.getElementById("canvas");
        var svgElem = canvas.children[0];

        if (delta > 0)
            app.view.setZoom(app.view.getZoom() * 0.75, true);
        if (delta < 0)
            app.view.setZoom(app.view.getZoom() * 1.25, true);

        setTimeout(function () {
            if (svgElem.viewBox.baseVal.width < 5000) {
                app.view.setZoom(1, true);
            }
        }, 10);

        return false;
    },

    contextMenu: function () {
        $('#container').on("contextmenu", function (emitter, event) {
            $.contextMenu({
                selector: 'body',
                trigger: 'none',
                events: {
                    hide: function () {
                        $('#container').unbind("contextmenu");
                        $.contextMenu('destroy');
                        $('.context-menu-list').remove();
                    }
                },
                callback: $.proxy(function (key, options) {
                    switch (key) {
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
                                url: "./visualize.php?getAll=" + event.dropped[0].id,
                                context: document.body,
                                beforeSend: function (xhr) {
                                    $('#loader').show();
                                }
                            }).done(function (c) {
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
                                        close: function (ev, ui) {
                                            $(this).dialog('destroy').remove();
                                        },
                                        title: $(event.dropped[0]).text() + " " + languages[browserLang]["view_selection_string"]
                                    });
                                $(".ui-dialog-titlebar").css("background", event.dropped.css("backgroundColor"));

                                // inject html
                                dialog.html(event.context.switchDescription(containerData, event.dropped[0].id));

                                // bind click on buttons
                                $('.button-elem-list').bind('click', function (el) {
                                    var elemId = el.target.attributes.elemId.value;
                                    var getChildId = window.btoa(unescape(encodeURIComponent(containerData[elemId].id)));

                                    var childDestStr = "";
                                    for (ent in containerData[elemId].entities) {
                                        if (containerData[elemId].entities[ent].type === "output") {
                                            childDestStr += containerData[elemId].entities[ent].destination + "|";
                                        }
                                    }
                                    var getChildDest = window.btoa(unescape(encodeURIComponent(childDestStr)));

                                    $.ajax({
                                        url: "./visualize.php?getChild=" + getChildId + "&getChildDest=" + getChildDest,
                                        context: document.body,
                                        beforeSend: function (xhr) {
                                            $('#loader').show();
                                        }
                                    }).done(function (c) {
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
                                        g.setDefaultEdgeLabel(function () {
                                            return {};
                                        });
                                        g.graph().rankdir = "LR";

                                        for (var i in jsonMarshal) {
                                            if (jsonMarshal[i].type === "Base") {
                                                g.setNode(jsonMarshal[i].id, {
                                                    width: 500,
                                                    height: 200
                                                });
                                            }

                                            if (jsonMarshal[i].type === "MyConnection") {
                                                g.setEdge(jsonMarshal[i].source.node, jsonMarshal[i].target.node);
                                            }
                                        };

                                        dagre.layout(g);

                                        g.nodes().forEach(function (v) {
                                            jsonMarshal[v].x = event.x + g.node(v).x;
                                            jsonMarshal[v].y = event.y + g.node(v).y;
                                        });

                                        var reader = new draw2d.io.json.Reader();
                                        reader.unmarshal(app.view, jsonMarshal);
                                        $('#loader').hide();

                                    });
                                });

                                // show dialog
                                dialog.dialog("open");
                                $('.ui-widget-overlay').bind('click', function () {
                                    dialog.dialog('destroy').remove();
                                });
                            }).fail(function (err) {
                                $('#loader').hide();
                                $('#errorer').children().eq(0).html("&nbsp;&nbsp;" + languages[browserLang]["base_no_elements_string"]);
                                $('#errorer').fadeIn("slow");
                                setTimeout(function () {
                                    $('#errorer').fadeOut("slow");
                                }, 5000);
                            })

                            break;
                        default:
                            break;
                    }
                }, this),
                position: function (opt, x, y) {
                    var scrollTopVal = app.view.getScrollArea().scrollTop();
                    var scrollLeftVal = app.view.getScrollArea().scrollLeft();
                    opt.$menu.css({
                        top: event.y / app.view.getZoom() + 25 - scrollTopVal,
                        left: event.x / app.view.getZoom() + 95 - scrollLeftVal
                    });
                },
                items: {
                    "add": {
                        name: languages[browserLang]["view_add_new_string"]
                    },
                    "select": {
                        name: languages[browserLang]["view_select_exis_string"]
                    }
                }
            });
        });
    },

    createDialog: function (event) {
        var dialog = $('<div id="modalCreation"></div>')
            .dialog({
                position: 'center',
                autoOpen: false,
                resizable: false,
                width: 500,
                modal: true,
                close: function (ev, ui) {
                    $(this).dialog('destroy').remove();
                },
                buttons: {
                    Cancel: function () {
                        $(this).dialog('destroy').remove();
                    },
                    Save: function () {
                        var pattern = event.context.getElemByAttr("pattern");
                        var usableElem = event.context.getElemByAttr("usable");
                        var valid = true;
                        for (n in pattern) {
                            var val = pattern[n].value;
                            var patt = pattern[n].pattern;
                            var reg = new RegExp(patt);
                            if (!reg.test(val)) {
                                valid = false;
                                $(pattern[n]).css("border", "1px solid rgb(255, 97, 97)");
                            } else {
                                $(pattern[n]).css("border", "1px solid #a9a9a9");
                            }
                        }
                        if (valid) {
                            $(".error-message").html("");
                            // check existing data
                            var result = event.context.checkData(usableElem, event.dropped[0].id, event);
                        } else {
                            $(".error-message").html("");
                            $('#modalCreation').append('<p class="error-message">' + languages[browserLang]["view_error_empty"] + '</p>');
                        }
                    }
                },
                title: $(event.dropped[0]).text() + " " + languages[browserLang]["view_creation_string"]
            });
        $(".ui-dialog-titlebar").css("background", $(event.dropped[0]).css("backgroundColor"));

        // inject html
        dialog.html(event.context.modalCreate(event.dropped[0], "", event));

        // show dialog
        dialog.dialog("open");

        $(".ui-widget-overlay").bind("click", function () {
            $("textarea").unbind();
            $("select").unbind();
            dialog.dialog("destroy").remove();
        });
    },

    getElemByAttr: function (attr) {
        var matchingElements = [];
        var allElements = $("#modalCreation").children();
        for (var i = 0, n = allElements.length; i < n; i++) {
            if (allElements[i].getAttribute(attr) !== null) {
                matchingElements.push(allElements[i]);
            }
        }
        return matchingElements;
    },

    bindExtSelect: function (obj, htmlSelect, regex) {
        for (n in obj) {
            $.each(obj[n], function (i) {
                $(obj[n][i].selId).bind("change", function () {
                    var select = $(this);
                    $(obj[n][i].textId).val(function () {
                        var res = $(this).val() + "\n" + select.val();
                        return res.match(regex).join("\n");
                    });
                    $(select).find("option:selected").remove();
                });
                $(obj[n][i].textId).bind("input propertychange", function () {
                    if (this.value == "") {
                        $(obj[n][i].selId).html(htmlSelect);
                    }
                });
            })
        }
    },

    checkData: function (elem, type, event) {
        var number = elem[0].value;
        if (type === "incoming") {
            var sufx = elem[1].value;
            if (sufx.slice(-1) !== ".") sufx = sufx + ".";
            number = elem[0].value + " / " + sufx;
        }

        $.ajax({
            url: "./visualize.php?readData=" + type,
            context: document.body,
            beforeSend: function (xhr) {
                $('#loader').show();
            }
        }).done(function (c) {
            $('#loader').hide();
            var data = JSON.parse(c);
            var missing = false;

            if (data) {
                if (type !== "ext-local" && !(number in data)) {
                    missing = true;
                } else {
                    $(".error-message").html("");
                    $(elem[0]).css("border", "1px solid rgb(255, 97, 97)");
                    $('#modalCreation').append('<p class="error-message">' + languages[browserLang]["view_error_inserted_string"] + '</p>');
                }
            } else {
                missing = true;
            }

            if (type === "ext-local") {
                missing = true;
            }
            if (number.length == 0 || number.indexOf('-') > -1) {
                missing = false;
            }

            if (missing) {
                var typeFig = $(event.dropped).data("shape") || event.shape;
                var figure = eval("new " + typeFig + "();");

                figure.onDrop(event.dropped, event.x, event.y, elem);

                var command = new draw2d.command.CommandAdd(event.context, figure, event.x - figure.width - 75, event.y - 25);
                event.context.getCommandStack().execute(command);

                $('#modalCreation').dialog('destroy').remove();
            } else {
                $(".error-message").html("");
                $(elem[0]).css("border", "1px solid rgb(255, 97, 97)");
                $('#modalCreation').append('<p class="error-message">' + languages[browserLang]["view_error_empty"] + '</p>');
            }
        });
    },

    extracInfo: function (data, type) {
        switch (type) {
            case "incoming":
                var v1 = data[1].figure.text.split('/')[0].trim();
                var v2 = data[1].figure.text.split('/')[1].split('(')[0].trim();
                var v3 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                try {
                    if (data[2].figure.text.length > 2) {
                        var v4 = "selected";
                        var v5 = "";
                    } else {
                        var v5 = "selected";
                        var v4 = "";
                    }
                } catch (e) {
                    var v5 = "selected";
                    var v4 = "";
                }
                return [v1, v2, v3, v4, v5];
                break;

            case "night":
                var v1 = data[1].figure.text.split('-')[0].trim();
                var nightType = data[2].figure.text.trim();
                if (nightType === 'Active' || nightType === 'Attivo') {
                    var v2 = "selected";
                    var v3 = "";
                    var v4 = "";
                    var v5 = "";
                    var v6 = "";
                } else if (nightType === 'Not Active' || nightType === 'Non Attivo') {
                    var v2 = "";
                    var v3 = "selected";
                    var v4 = "";
                    var v5 = "";
                    var v6 = "";
                } else {
                    var v2 = "";
                    var v3 = "";
                    var v4 = "selected";
                    var v5 = data[2].figure.text.split('-')[0].trim();
                    var v6 = data[2].figure.text.split('-')[1].trim();
                }
                return [v1, v2, v3, v4, v5, v6];
                break;

            case "from-did-direct":
                var v1 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v2 = data[1].figure.text.split('(')[0].trim();
                return [v1, v2];
                break;

            case "ext-group":
                var v1 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v2 = data[1].figure.text.split('(')[0].trim();
                var v3 = data[3].figure.text;
                var v4 = data[4].figure.text.split('(')[1].split(')')[0].trim();
                var v5 = data[5].figure.text.split('(')[1].split(')')[0].trim();
                return [v1, v2, v3, v4, v5];
                break;

            case "ext-queues":
                var v1 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v2 = data[1].figure.text.split('(')[0].trim();
                var v3 = data[3].figure.text;
                var v4 = data[5].figure.text;
                var v5 = data[6].figure.text.split('(')[1].split(')')[0].trim();
                var v6 = data[7].figure.id.split('|')[1].trim();
                var v7 = data[8].figure.id.split('|')[1].trim();
                return [v1, v2, v3, v4, v5, v6, v7];
                break;

            case "ivr":
                var v1 = data[1].figure.text.split('(')[0].trim();
                var v2 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v3 = data[2].figure.text.split(':')[1].split('(')[0].trim();
                return [v1, v2, v3];
                break;

            case "cqr":
                var v1 = data[1].figure.text.split('(')[0].trim();
                var v2 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v3 = data[2].figure.text.split(':')[1].split('(')[0].trim();
                return [v1, v2, v3];
                break;

            case "app-announcement":
                var v1 = data[1].figure.text.split('-')[0].trim();
                var v2 = data[2].figure.text.split(':')[1].split('(')[0].trim();
                return [v1, v2];
                break;

            case "timeconditions":
                var v1 = data[1].figure.text.split('-')[0].trim();
                var v2 = data[2].figure.text.split(':')[1].split('(')[0].trim();
                return [v1, v2];
                break;

            case "app-daynight":
                var v1 = data[1].figure.text.split('(')[0].trim();
                var v2 = data[1].figure.text.split('*')[1].split(')')[0].trim().slice(-1);
                return [v1, v2];
                break;

            case "ext-meetme":
                var v1 = data[1].figure.text.split('(')[1].split(')')[0].trim();
                var v2 = data[1].figure.text.split('(')[0].trim();
                return [v1, v2];
                break;
        }
    },

    modalCreate: function (elem, mod, event) {
        var html = "";
        var isDisabled = "";
        var strategyList = new Array('ringall', 'ringall-prim', 'hunt', 'hunt-prim', 'memoryhunt', 'memoryhunt-prim', 'firstavailable', 'firstnotonphone', 'random');
        var strategyListQueues = new Array('ringall', 'leastrecent', 'fawestcalls', 'random', 'rrmemory', 'rrordered', 'linear', 'wrandom');

        values = ["", "", "", "", "", "", "", "", ""];
        if (mod) {
            values = this.extracInfo(elem.data || {}, elem.id);
            isDisabled = 'disabled';
        }

        switch (elem.id) {
            case "incoming":
                html += '<label class="label-creation">' + languages[browserLang]["view_number_string_did"] + ': </label>';
                html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" ' + isDisabled + ' autofocus value="' + values[0] + '" usable id="' + elem.id + '-number"></input>';
                html += '<label class="label-creation">' + languages[browserLang]["view_number_string_cid"] + ': </label>';
                html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" placeholder="' + languages[browserLang]["view_any_string"] + '" ' + isDisabled + ' value="' + values[1] + '" usable id="' + elem.id + '-cidnum"></input>';
                html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
                html += '<input value="' + values[2] + '" usable id="' + elem.id + '-description"></input>';
                break;

            case "night":
                html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                html += '<label class="label-creation">' + languages[browserLang]["view_manual_act_string"] + ': </label>';
                html += '<select id="selectNightType" usable onchange="if(this.selectedIndex==2)$(\'#calGroup\').show();else $(\'#calGroup\').hide();" id="' + elem.id + '-activation" class="input-creation"><option ' + values[1] + ' value="1">' + languages[browserLang]["base_active_string"] + '</option><option ' + values[2] + ' value="0">' + languages[browserLang]["base_not_active_string"] + '</option><option ' + values[3] + ' value="period">' + languages[browserLang]["base_period_string"] + '</option></select>';
                html += '<script>if($("#selectNightType").val() === "period")$("#calGroup").show();</script><div usable id="calGroup" style="display:none;"><label class="label-creation">' + languages[browserLang]["base_period_from_string"] + ': </label><input value="' + values[4] + '" placeholder="dd/mm/yyyy" usable id="' + elem.id + '-fromperiod" class="input-creation"></input><label class="label-creation">' + languages[browserLang]["base_period_to_string"] + ': </label><input value="' + values[5] + '" placeholder="dd/mm/yyyy" usable id="' + elem.id + '-toperiod" class="input-creation"></input></div>';
                break;

            case "from-did-direct":
                html += '<label class="label-creation">' + languages[browserLang]["view_number_string"] + ': </label>';
                html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" ' + isDisabled + ' autofocus value="' + values[0] + '" usable id="' + elem.id + '-number" class="input-creation"></input>';
                html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                html += '<input usable value="' + values[1] + '" id="' + elem.id + '-name" class="input-creation"></input>';
                break;

            case "ext-local":
                $.ajax({
                    url: "./visualize.php?readData=from-did-direct",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for (e in data) {
                        if (data[e].voicemail === "novm")
                            htmlSelect += '<option value="' + data[e].name + ' ( ' + e + ' )">' + data[e].name + ' ( ' + e + ' )</option>';
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_enable_voicemail_string"] + ': </label>';
                    html += '<select usable id="' + elem.id + '-voicenum" class="input-creation">' + htmlSelect + '</select>';

                    $("#modalCreation").html(html);
                });
                break;

            case "ext-group":
                var thisApp = this;
                $.ajax({
                    url: "./visualize.php?readData=from-did-direct",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "<option>-</option>";
                    var htmlStrategy = "";
                    if (values[4] == "") {
                        values[4] = 20;
                    }
                    for (e in data) {
                        htmlSelect += '<option value="' + e + '">' + (data[e].name && data[e].name !== '' ? (data[e].name + ' (' + e + ')') : e) + '</option>';
                    }
                    for (s in strategyList) {
                        htmlStrategy += '<option id="opt-' + strategyList[s] + '" value="' + strategyList[s] + '">' + strategyList[s] + '</option>';
                        if (values[3] == strategyList[s]) {
                            var strategy = strategyList[s];
                        }
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_number_string"] + ': </label>';
                    html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" ' + isDisabled + ' autofocus value="' + values[0] + '" usable id="' + elem.id + '-number" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
                    html += '<input usable value="' + values[1] + '" id="' + elem.id + '-description" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["base_ext_list_string"] + ': </label>';
                    html += '<select id="selectExtGroup" class="input-creation">' + htmlSelect + '</select>';
                    html += '<label class="label-creation"></label>';
                    html += '<textarea id="textareaExtGroup" usable id="' + elem.id + '-extensionList" class="input-creation">' + values[2] + '</textarea>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_strategy_string"] + ': </label>';
                    html += '<select usable id="' + elem.id + '-ringstrategy" class="input-creation">' + htmlStrategy + '</select>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_ringtime_string"] + ': </label>';
                    html += '<input pattern="^(([1-2][0-9][0-9])|([1-9][0-9])|([1-9])|(300))$" placeholder="MAX 300 SEC" value="' + values[4] + '" usable id="' + elem.id + '-ringtime" class="input-creation"></input>';

                    $("#modalCreation").html(html);
                    if (strategy) {
                        $('#opt-' + strategy).attr("selected", "selected");
                    } else {
                        $('#opt-ringall').attr("selected", "selected");
                    }

                    thisApp.bindExtSelect({
                        "group": {
                            0: {
                                "selId": "#selectExtGroup",
                                "textId": "#textareaExtGroup"
                            }
                        }
                    }, htmlSelect, /\d+/g);
                });
                break;

            case "ext-queues":
                var thisApp = this;
                $.ajax({
                    url: "./visualize.php?readData=from-did-direct",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlStrategy = "";
                    var strategy = values[4];
                    var timeout = values[5];
                    var maxwait = values[6];
                    var htmlSelect = "<option>-</option>";
                    var htmlMaxWait = "<option value=''>" + languages[browserLang]["view_queuesTimeString_unlimited"] + "</option>";
                    var agentTimeout = "<option value='0'>" + languages[browserLang]["view_queuesTimeString_unlimited"] + "</option>";

                    //members select
                    for (e in data) {
                        htmlSelect += '<option value="' + e + ',0">' + (data[e].name && data[e].name !== '' ? (data[e].name + ' (' + e + ')') : e) + '</option>';
                    }
                    for (var i = 1; i < 30; i++) {
                        if (i == 1) {
                            htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + i + ' ' + languages[browserLang]["view_queuesTimeString_second"] + '</option>';
                        } else {
                            htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + i + ' ' + languages[browserLang]["view_queuesTimeString_seconds"] + '</option>';
                        }
                    }
                    //maxwait select
                    for (var i = 30; i < 60; i += 5) {
                        htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + i + ' ' + languages[browserLang]["view_queuesTimeString_seconds"] + '</option>';
                    }
                    for (var i = 60; i < 300; i += 20) {
                        htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + languages[browserLang]["view_queuesTimeString_minutes_" + i] + '</option>';
                    }
                    for (var i = 300; i < 1200; i += 60) {
                        htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + languages[browserLang]["view_queuesTimeString_minutes_" + i] + '</option>';
                    }
                    for (var i = 1200; i <= 7200; i += 300) {
                        htmlMaxWait += '<option id="qum-' + i + '" value="' + i + '">' + languages[browserLang]["view_queuesTimeString_minutes_" + i] + '</option>';
                    }
                    //agent timeout select
                    for (var i = 1; i < 60; i++) {
                        if (i == 1) {
                            agentTimeout += '<option id="qut-' + i + '" value="' + i + '">' + i + ' ' + languages[browserLang]["view_queuesTimeString_second"] + '</option>';
                        } else {
                            agentTimeout += '<option id="qut-' + i + '" value="' + i + '">' + i + ' ' + languages[browserLang]["view_queuesTimeString_seconds"] + '</option>';
                        }
                    }
                    for (var i = 60; i <= 120; i++) {
                        agentTimeout += '<option id="qut-' + i + '" value="' + i + '">' + languages[browserLang]["view_queuesTimeString_minutes_" + i] + '</option>';
                    }
                    //strategy select
                    for (s in strategyListQueues) {
                        htmlStrategy += '<option id="qus-' + strategyListQueues[s] + '" value="' + strategyListQueues[s] + '">' + strategyListQueues[s] + '</option>';
                    }

                    html += '<label class="label-creation">' + languages[browserLang]["view_number_string"] + ': </label>';
                    html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" ' + isDisabled + ' autofocus value="' + values[0] + '" usable id="' + elem.id + '-number" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                    html += '<input usable value="' + values[1] + '" id="' + elem.id + '-name" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["base_static_memb_string"] + ': </label>';
                    html += '<select id="selectExtQueue1" class="input-creation">' + htmlSelect + '</select>';
                    html += '<label class="label-creation"></label>';
                    html += '<textarea id="textareaExtQueue1" usable id="' + elem.id + '-staticMem" class="input-creation">' + values[2] + '</textarea>';
                    html += '<label class="label-creation">' + languages[browserLang]["base_dyn_memb_string"] + ': </label>';
                    html += '<select id="selectExtQueue2" class="input-creation">' + htmlSelect + '</select>';
                    html += '<label class="label-creation"></label>';
                    html += '<textarea id="textareaExtQueue2" usable id="' + elem.id + '-dynamicMem" class="input-creation">' + values[3] + '</textarea>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_strategy_string"] + ': </label>';
                    html += '<select id="queueStrategy" usable class="input-creation">' + htmlStrategy + '</select>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_agenttimeout_string"] + ': </label>';
                    html += '<select id="selectAgentTimeout" usable class="input-creation">' + agentTimeout + '</select>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_queuesTimeString_maxWait"] + ': </label>';
                    html += '<select id="selectMaxWait" usable class="input-creation">' + htmlMaxWait + '</select>';

                    $("#modalCreation").html(html);
                    //select default
                    if (strategy) {
                        $('#qus-' + strategy).attr("selected", "selected");
                    } else {
                        $('#qus-ringall').attr("selected", "selected");
                    }
                    if (timeout) {
                        $('#qut-' + timeout).attr("selected", "selected");
                    } else {
                        $('#qut-0').attr("selected", "selected");
                    }
                    if (maxwait) {
                        $('#qum-' + maxwait).attr("selected", "selected");
                    } else {
                        $('#qum-15').attr("selected", "selected");
                    }

                    thisApp.bindExtSelect({
                        "queues": {
                            0: {
                                "selId": "#selectExtQueue1",
                                "textId": "#textareaExtQueue1"
                            },
                            1: {
                                "selId": "#selectExtQueue2",
                                "textId": "#textareaExtQueue2"
                            }
                        }
                    }, htmlSelect, /(\d+,\d+)|(\d+)/g);
                });
                break;

            case "ivr":
                $.ajax({
                    url: "./visualize.php?readData=recordings",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    var selectedOption = "";
                    for (e in data) {
                        if (data[e].name === values[2]) {
                            selectedOption = "selected";
                        } else {
                            selectedOption = "";
                        }
                        htmlSelect += '<option ' + selectedOption + ' value="' + data[e].name + ' ( ' + e + ' )">' + data[e].name + '</option>';
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                    html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
                    html += '<input usable value="' + values[1] + '" id="' + elem.id + '-description" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
                    html += '<select usable id="' + elem.id + '-recording" class="input-creation">' + htmlSelect + '</select>';
                    $("#modalCreation").html(html);
                });
                break;

            case "cqr":
                $.ajax({
                    url: "./visualize.php?readData=recordings",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    var selectedOption = "";
                    for (e in data) {
                        if (data[e].name === values[2]) {
                            selectedOption = "selected";
                        } else {
                            selectedOption = "";
                        }
                        htmlSelect += '<option ' + selectedOption + ' value="' + data[e].name + ' ( ' + e + ' )">' + data[e].name + '</option>';
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                    html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
                    html += '<input usable value="' + values[1] + '" id="' + elem.id + '-description" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
                    html += '<select usable id="' + elem.id + '-recording" class="input-creation">' + htmlSelect + '</select>';

                    $("#modalCreation").html(html);
                });
                break;

            case "app-announcement":
                function dialogNewAnn() {
                    $.ajax({
                        url: "./visualize.php?readData=recordings",
                        context: document.body,
                        beforeSend: function (xhr) {
                            $('#loader').show();
                        }
                    }).done(function (c) {
                        $('#loader').hide();
                        var data = JSON.parse(c);
                        var htmlSelect = "";
                        var selectedOption = "";

                        for (e in data) {
                            if (data[e].name === values[1]) {
                                selectedOption = "selected";
                            } else {
                                selectedOption = "";
                            }
                            htmlSelect += '<option ' + selectedOption + ' value="' + data[e].name + ' ( ' + e + ' )">' + data[e].name + '</option>';
                        }
                        html = '';
                        html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                        html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input><div></div>';
                        html += '<label class="listRecordingSection label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
                        html += '<select usable id="' + elem.id + '-recording" class="listRecordingSection input-creation">' + htmlSelect + '</select>';
                        html += '<button id="addRecordingBtn" class="listRecordingSection">+</button>';

                        html += '<div id="addRecordingSection" class="hide">';
                        html += '<hr>';
                        html += '<div class="rowSectionAnn">';
                        html += '<label for="fileupload" class="label-creation">' + languages[browserLang]["view_upload_recording_string"] + ': </label>';
                        html += '<input id="fileupload" type="file" accept="audio/mp3,audio/wav">';
                        html += '<div id="newRecordingNameSection" class="hide">';
                        html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_string"] + ': </label>';
                        html += '<input id="newRecordingName" type="input">';
                        html += '<button id="saveNewRecordingBtn">' + languages[browserLang]["view_add_string"] + '</button>';
                        html += '</div>';
                        html += '</div>';
                        html += '<hr>';
                        html += '<div class="rowSectionAnn">';
                        html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_in_browser_string"] + ': </label>';
                        html += '<i id="checkRecordingBtn" title="' + languages[browserLang]["view_start_recording_string"] + '" class="pointer fa fa-circle red fa-2x vmiddle"></i>';
                        html += '<audio controls class="vmiddle"></audio>';

                        html += '<div id="newRecordingNameSection2" class="hide rowSectionAnn">';
                        html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_string"] + ': </label>';
                        html += '<input id="newRecordingName2" type="input">';
                        html += '<button id="saveNewRecordingBtn2">' + languages[browserLang]["view_add_string"] + '</button>';
                        html += '</div>';
                        html += '</div>';

                        html += '</div>';

                        $("#modalCreation").html(html);
                        $('div:has(#modalCreation)').css('width', '560px');

                        var tempFilename;
                        var audioFileName;
                        var recording = false;

                        var onFail = function (e) {
                            console.log('Rejected!', e);
                        };

                        var onSuccess = function (s) {
                            $('#startRecordingBtn').addClass('blink');
                            var context = new AudioContext();
                            var mediaStreamSource = context.createMediaStreamSource(s);
                            recorder = new Recorder(mediaStreamSource);
                            recorder.record();
                        }

                        var recorder;
                        var audio = document.querySelector('audio');

                        $('#checkRecordingBtn').click(function (e) {
                            if (!recording) {
                                $('#checkRecordingBtn').removeClass('fa-circle').addClass('fa-square blink').attr('title', languages[browserLang]["view_stop_recording_string"]);
                                startRecording();
                            } else {
                                $('#checkRecordingBtn').removeClass('fa-square blink').addClass('fa-circle').attr('title', languages[browserLang]["view_start_recording_string"]);
                                stopRecording();
                            }
                            recording = !recording;
                        });

                        function startRecording() {
                            if (navigator.getUserMedia) {
                                $('#newRecordingNameSection2').hide();
                                navigator.getUserMedia({
                                    audio: true
                                }, onSuccess, onFail);
                            } else {
                                console.log('navigator.getUserMedia not present');
                            }
                        }

                        function stopRecording() {
                            recorder.stop();
                            $('#startRecordingBtn').removeClass('blink');
                            recorder.exportWAV(function (s) {
                                audio.src = window.URL.createObjectURL(s);
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    var base64data = reader.result;
                                    audioFileName = 'recorded.wav';
                                    $.ajax({
                                        url: "./fileupload.php?",
                                        type: "POST",
                                        data: "content=" + base64data + '&name=' + audioFileName,
                                    }).done(function (c) {
                                        tempFilename = c;
                                        $('#newRecordingNameSection2').show();
                                        recorder = null;
                                    }).fail(function (err) {
                                        console.error(err);
                                    });
                                }
                                reader.readAsDataURL(s);
                            });
                        }
                        $('#startRecordingBtn').click(function (e) {
                            startRecording();
                        });
                        $('#stopRecordingBtn').click(function (e) {
                            stopRecording();
                        });

                        $('#addRecordingBtn').click(function (e) {
                            $('#addRecordingSection').toggle();
                            $('.listRecordingSection').toggle();
                            $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('disable');
                        });

                        $('#saveNewRecordingBtn2').click(function (e) {
                            if ($('#newRecordingName2').val() === '') {
                                $('#newRecordingName2').focus();
                                return;
                            }
                            var filename = audioFileName.substring(0, audioFileName.lastIndexOf("."));
                            $.ajax({
                                url: "/freepbx/admin/ajax.php",
                                type: "POST",
                                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                                data: "file=" + tempFilename + "&name=custom/" + filename +
                                    "&codec=wav&lang=en&temporary=1&command=convert&module=recordings"
                            }).done(function (c) {

                                $.ajax({
                                    url: "/freepbx/admin/ajax.php",
                                    type: "POST",
                                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                                    data: "module=recordings&command=save&id=&playback%5B%5D=custom/" + filename + "&name=" +
                                        $('#newRecordingName2').val() + "&description=&fcode=0&fcode_pass=&remove%5B%5D=" + tempFilename
                                }).done(function (c) {
                                    $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('enable');
                                    $('#addRecordingSection').toggle();
                                    $('.listRecordingSection').toggle();
                                    dialogNewAnn();

                                }).fail(function (err) {
                                    console.error(err);
                                });

                            }).fail(function (err) {
                                console.error(err);
                            });
                        });

                        $('#saveNewRecordingBtn').click(function (e) {
                            if ($('#newRecordingName').val() === '') {
                                $('#newRecordingName').focus();
                                return;
                            }
                            var filename = audioFileName.substring(0, audioFileName.lastIndexOf("."));
                            $.ajax({
                                url: "/freepbx/admin/ajax.php",
                                type: "POST",
                                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                                data: "file=" + tempFilename + "&name=custom/" + filename +
                                    "&codec=wav&lang=en&temporary=1&command=convert&module=recordings"
                            }).done(function (c) {

                                $.ajax({
                                    url: "/freepbx/admin/ajax.php",
                                    type: "POST",
                                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                                    data: "module=recordings&command=save&id=&playback%5B%5D=custom/" + filename + "&name=" +
                                        $('#newRecordingName').val() + "&description=&fcode=0&fcode_pass=&remove%5B%5D=" + tempFilename
                                }).done(function (c) {
                                    $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('enable');
                                    $('#addRecordingSection').toggle();
                                    $('.listRecordingSection').toggle();
                                    dialogNewAnn();

                                }).fail(function (err) {
                                    console.error(err);
                                });

                            }).fail(function (err) {
                                console.error(err);
                            });
                        });

                        $('#fileupload').change(function (e) {
                            if (e.target.files[0].name !== undefined) {

                                if (e.target.files[0].size < 10000000) {
                                    audioFileName = e.target.files[0].name;
                                    var reader = new FileReader();
                                    reader.onload = function (ev) {
                                        var file64 = ev.target.result;
                                        $.ajax({
                                            url: "./fileupload.php?",
                                            type: "POST",
                                            data: "content=" + file64 + '&name=' + e.target.files[0].name,
                                        }).done(function (c) {
                                            tempFilename = c;
                                            $('#newRecordingNameSection').toggle();
                                        }).fail(function (err) {
                                            console.error(err);
                                        });
                                    };
                                    reader.readAsDataURL(e.target.files[0]);
                                } else {}
                            } else {
                                $scope.$apply(function () {
                                    $scope.error.file.status = true;
                                });
                            }
                        });
                    });
                }
                dialogNewAnn();
                break;

            case "timeconditions":
                $.ajax({
                    url: "./visualize.php?readData=timegroups",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    var selectedOption = "";
                    for (e in data) {
                        if (data[e].description === values[1]) {
                            selectedOption = "selected";
                        } else {
                            selectedOption = "";
                        }
                        htmlSelect += '<option ' + selectedOption + ' value="' + data[e].description + ' ( ' + e + ' )">' + data[e].description + '</option>';
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                    html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_timegroup_string"] + ': </label>';
                    html += '<select usable id="' + elem.id + '-timegroup" class="input-creation">' + htmlSelect + '</select>';

                    $("#modalCreation").html(html);
                });
                break;

            case "app-daynight":
                $.ajax({
                    url: "./visualize.php?readData=codeavailable",
                    context: document.body,
                    beforeSend: function (xhr) {
                        $('#loader').show();
                    }
                }).done(function (c) {
                    $('#loader').hide();
                    var data = JSON.parse(c);
                    var htmlSelect = "";
                    for (e in data) {
                        htmlSelect += '<option value="' + data[e] + '">' + data[e] + '</option>';
                    }
                    if (mod) {
                        htmlSelect += '<option selected value="' + values[1] + '">' + values[1] + '</option>';
                    }
                    html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                    html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                    html += '<label class="label-creation">' + languages[browserLang]["view_control_code_string"] + ': </label>';
                    html += '<select ' + isDisabled + ' usable id="' + elem.id + '-controlcode" class="input-creation">' + htmlSelect + '</select>';

                    $("#modalCreation").html(html);
                });
                break;

            case "ext-meetme":
                html += '<label class="label-creation">' + languages[browserLang]["view_number_string"] + ': </label>';
                html += '<input pattern="^(_[\\dNXZ\\.\\-\\[\\]]*|[\\d]*)$" ' + isDisabled + ' autofocus value="' + values[0] + '" usable id="' + elem.id + '-number" class="input-creation"></input>';
                html += '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
                html += '<input value="' + values[1] + '" usable id="' + elem.id + '-name" class="input-creation"></input>';
                break;
        }

        return html;
    },

    getDestination: function (destination) {
        var values, dests, dest, id, idlong, ids = null;

        if (destination.match(/ivr-*/)) {
            values = destination.split(",");
            dests = values[0].split("-");
            dest = dests[0];
            id = dests[1];
        } else if (destination.match('/app-announcement-*/')) {
            values = destination.split(",");
            dests = values[0].split("-");
            dest = dests[0] + "-" + dests[1];
            id = dests[2];
        } else if (destination.match('/^night/')) {
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

    switchDescription: function (dataArray, type) {
        var htmlInj = "";
        for (elem in dataArray) {
            var text = dataArray[elem].entities[0].text;
            if (type === "ext-local") {
                text = dataArray[elem].entities[0].text.split("-")[0];
            }
            htmlInj += '<div><button elemDest="' + dataArray[elem].entities[dataArray[elem].entities.length - 1].destination + '" elemId="' + elem + '" class="button-elem-list">' + text + '</button></div>';
        }
        if (htmlInj === "") htmlInj = languages[browserLang]["base_no_elements_string"];
        return htmlInj;
    },

    onDrop: function (droppedDomNode, x, y, shiftKey, ctrlKey) {
        if (droppedDomNode[0].id !== "app-blackhole" && droppedDomNode[0].id !== "incoming") {
            // add context menu
            this.contextMenu();

            $('#container').trigger('contextmenu', {
                x: x,
                y: y,
                context: this,
                dropped: droppedDomNode
            });
        } else {
            if (droppedDomNode[0].id == "incoming") {
                var data = {};
                data.x = x;
                data.y = y;
                data.context = this;
                data.dropped = droppedDomNode;

                this.createDialog(data);
            } else {
                var type = $(droppedDomNode[0]).data("shape");
                var figure = eval("new " + type + "();");

                figure.onDrop(droppedDomNode, x, y, []);

                var command = new draw2d.command.CommandAdd(this, figure, x - figure.width - 75, y - 25);
                this.getCommandStack().execute(command);
            }

        }

    }
});