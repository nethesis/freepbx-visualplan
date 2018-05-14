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
        var thisApp = this;
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
                dialogNewIvr(elem.id);
                break;

            case "cqr":
                dialogNewCqr(elem.id);
                break;

            case "app-announcement":
                dialogNewAnn(elem.id);
                break;

            case "timeconditions":
                function dialogNewTimeCond(selTimeGroup, condName) {
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
                        var htmlSelectHours = "<option value='-'>-</option>";
                        var htmlSelectMin = "<option value='-'>-</option>";
                        var htmlSelectWeekDays = "<option value='-'>-</option>";
                        var htmlSelectMonths = "<option value='-'>-</option>";
                        var htmlSelectMonthDay = "<option value='-'>-</option>";
                        var weekdays = {
                            "view_monday_string": "mon",
                            "view_tuesday_string": "tue",
                            "view_wednesday_string": "wed",
                            "view_thursday_string": "thu",
                            "view_friday_string": "fri",
                            "view_saturday_string": "sat",
                            "view_sunday_string": "sun"
                        };
                        var months = {
                            "view_january_string": "jan",
                            "view_february_string": "feb",
                            "view_march_string": "mar",
                            "view_april_string": "apr",
                            "view_may_string": "may",
                            "view_june_string": "jun",
                            "view_july_string": "jul",
                            "view_august_string": "aug",
                            "view_september_string": "sep",
                            "view_octombre_string": "oct",
                            "view_november_string": "nov",
                            "view_december_string": "dec"
                        };

                        for (e in data) {
                            if ((data[e].description === values[1]) || (selTimeGroup == data[e].description)) {
                                selectedOption = "selected";
                            } else {
                                selectedOption = "";
                            }

                            htmlSelect += '<option ' + selectedOption + ' value="' + data[e].description + ' ( ' + e + ' )">' + data[e].description + '</option>';
                        }
                        for (var k = 0; k < 24; k++) {
                            htmlSelectHours += '<option value="' + k + '">' + (k < 10 ? '0' + k : k) + '</option>';
                        }
                        for (var k = 0; k < 60; k++) {
                            htmlSelectMin += '<option value="' + k + '">' + (k < 10 ? '0' + k : k) + '</option>';
                        }
                        for (var k in weekdays) {
                            htmlSelectWeekDays += '<option value="' + weekdays[k] + '">' + languages[browserLang][k] + '</option>';
                        }
                        for (var k in months) {
                            htmlSelectMonths += '<option value="' + months[k] + '">' + languages[browserLang][k] + '</option>';
                        }
                        for (var k = 0; k <= 31; k++) {
                            if (k > 0) {
                                htmlSelectMonthDay += '<option value="' + k + '">' + (k < 10 ? '0' + k : k) + '</option>';
                            }
                        }

                        html = '';
                        //html += '<div id="addCondTemp">';
                        html += '<label id="' + elem.id + '-namelabel" class="label-creation on-action-disabled">' + languages[browserLang]["view_timeconditionname_string"] + ': </label>';
                        html += '<input autofocus value="' + values[0] + '" usable id="' + elem.id + '-name" class="input-creation on-action-disabled"></input>';
                        html += '<label id="' + elem.id + '-timegrouplabel" class="label-creation on-action-disabled">' + languages[browserLang]["view_timegroup_string"] + ': </label>';
                        html += '<select usable id="' + elem.id + '-timegroup" class="input-creation on-action-disabled">' + htmlSelect + '</select>';
                        html += '<button id="modifyTimeGroupButton" class="addButtons on-action-disabled" title="' + languages[browserLang]["view_modifytimegrouptitle_string"] + '" class="listRecordingSection"><i class="fa fa-pencil"></i></button>';
                        html += '<button id="addTimeGroupButton" class="addButtons on-action-disabled" title="' + languages[browserLang]["view_addtimegrouptitle_string"] + '" class="listRecordingSection"><i class="fa fa-plus"></i></button>';
                        //html += '</div>';

                        //time group creation
                        html += '<div id="addTimeGroups" class="hide">';
                        html += '<hr class="hr-form"><br>';
                        html += '<label id="' + elem.id + '-titleString" class="label-creation label-title"><b>' + languages[browserLang]["view_newtemporalgroup_string"] + ': </b></label>';
                        html += '<label id="' + elem.id + '-titleStringModify" class="label-creation label-title hide"><b>' + languages[browserLang]["view_modifytemporalgroup_string"] + ': </b></label>';
                        html += '<span id="' + elem.id + '-title" class="input-creation"></span>';

                        html += '<label class="label-creation">' + languages[browserLang]["view_timegroupname_string"] + ': </label>';
                        html += '<input autofocus value="' + values[0] + '" id="' + elem.id + '-timegroupname" class="input-creation"></input>';
                        
                        html += '<div id="time-1" class="times-forms">';
                        
                        // time to start
                        html += '<label class="label-creation">' + languages[browserLang]["view_timetostart_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-timetostart-hours" class="input-creation tg-select">' + htmlSelectHours + '</select>';
                        html += '<select id="' + elem.id + '-timetostart-min" class="input-creation tg-select">' + htmlSelectMin + '</select>';
                        html += '<button id="removeTimeGroupForm" title="' + languages[browserLang]["view_removetimetimegroup_string"] + '" class="addButtons hide"><i class="fa fa-minus"></i></button>';
                        // time to finish
                        html += '<label class="label-creation">' + languages[browserLang]["view_timetofinish_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-timetofinish-hours" class="input-creation tg-select">' + htmlSelectHours + '</select>';
                        html += '<select id="' + elem.id + '-timetofinish-min" class="input-creation tg-select">' + htmlSelectMin + '</select>';
                        // week day start
                        html += '<label class="label-creation">' + languages[browserLang]["view_weekdaystart_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-weekdaystart" class="input-creation">' + htmlSelectWeekDays + '</select>';
                        // week day finish
                        html += '<label class="label-creation">' + languages[browserLang]["view_weekdayfinish_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-weekdayfinish" class="input-creation">' + htmlSelectWeekDays + '</select>';
                        // month day start
                        html += '<label class="label-creation">' + languages[browserLang]["view_monthsdaytart_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-monthsdaystart" class="input-creation">' + htmlSelectMonthDay + '</select>';
                        // month day finish
                        html += '<label class="label-creation">' + languages[browserLang]["view_monthdayfinish_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-monthsdayfinish" class="input-creation">' + htmlSelectMonthDay + '</select>';
                        // month start
                        html += '<label class="label-creation">' + languages[browserLang]["view_monthstart_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-monthstart" class="input-creation">' + htmlSelectMonths + '</select>';
                        // month finish
                        html += '<label class="label-creation">' + languages[browserLang]["view_monthfinish_string"] + ': </label>';
                        html += '<select id="' + elem.id + '-monthfinish" class="input-creation">' + htmlSelectMonths + '</select>';
                        html += '</div>';
                        html += '<div id="times-form-append"><div id="times-form-last"></div></div>';
                        // error div
                        html += '<p class="error-message"></p>';
                        // save button
                        html += '<label class="label-creation"></label>';
                        html += '<span id="' + elem.id + '-title" class="input-creation"><button id="newAddTimeGroupsForm" title="' + languages[browserLang]["view_addtimetimegroup_string"] + '" class="addButtons no-margins" title=""><i class="fa fa-plus"></i></button><button id="updateAddTimeGroups" class="addButtons right_floated saveSecElements hide" title="' + languages[browserLang]["view_savegrouptimegroup_string"] + '"><i class="fa fa-check"></i></button><button id="saveAddTimeGroups" class="addButtons right_floated saveSecElements" title="' + languages[browserLang]["view_savenewtimegroup_string"] + '"><i class="fa fa-check"></i></button><button id="cancelTempGroup" class="addButtons right_floated" title="' + languages[browserLang]["view_cancelnewtimegroup_string"] + '"><i class="fa fa-times"></i></button></span>';
                        html += '</div>';

                        $("#modalCreation").html(html);

                        function clearValues(elem) {
                            $("#" + elem.id + "-timegroupname").val("");
                            $("#" + elem.id + "-timetostart-hours").val("-");
                            $("#" + elem.id + "-timetostart-min").val("-");
                            $("#" + elem.id + "-timetofinish-hours").val("-");
                            $("#" + elem.id + "-timetofinish-min").val("-");
                            $("#" + elem.id + "-weekdaystart").val("-");
                            $("#" + elem.id + "-weekdayfinish").val("-");
                            $("#" + elem.id + "-monthsdaystart").val("-");
                            $("#" + elem.id + "-monthsdayfinish").val("-");
                            $("#" + elem.id + "-monthstart").val("-");
                            $("#" + elem.id + "-monthfinish").val("-");
                        }

                        function getValues(elem) {

                            var json = {};
                            json.times = {};
                            var n = 0;
                            $( ".times-forms" ).each(function() {
                                json.times[n] = {};
                                json.times[n].name = $("#" + elem.id + "-timegroupname").val();
                                json.times[n].hour_start = $( this ).find("#" + elem.id + "-timetostart-hours").val();
                                json.times[n].minute_start = $( this ).find("#" + elem.id + "-timetostart-min").val();
                                json.times[n].hour_finish = $( this ).find("#" + elem.id + "-timetofinish-hours").val();
                                json.times[n].minute_finish = $( this ).find("#" + elem.id + "-timetofinish-min").val();
                                json.times[n].wday_start = $( this ).find("#" + elem.id + "-weekdaystart").val();
                                json.times[n].wday_finish = $( this ).find("#" + elem.id + "-weekdayfinish").val();
                                json.times[n].mday_start = $( this ).find("#" + elem.id + "-monthsdaystart").val();
                                json.times[n].mday_finish = $( this ).find("#" + elem.id + "-monthsdayfinish").val();
                                json.times[n].month_start = $( this ).find("#" + elem.id + "-monthstart").val();
                                json.times[n].month_finish = $( this ).find("#" + elem.id + "-monthfinish").val();
                                n++;
                            });
                            return json;
                        }

                        function resetReload(json, elem) {
                            $("#" + elem.id + "-timegroupname").removeClass("error-input");
                            $(".error-message").text("");
                            $(".error-message").css("margin-bottom", "0px");
                            var condName = $("#" + elem.id + "-name").val();
                            console.log(name);
                            dialogNewTimeCond(json.times[0].name, condName);
                            $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('enable');
                        }

                        function cloneForm() {
                            $("#time-1").clone().appendTo("#times-form-last");
                            $( ".times-forms" ).each(function(i) {
                                if (i != 0) {
                                    $( this ).find("#removeTimeGroupForm").unbind();
                                    $( this ).find("#removeTimeGroupForm").removeClass("hide").click(function () {
                                        $( this ).parents().eq(0).remove();
                                    });
                                }
                            });
                        }

                        $("#newAddTimeGroupsForm").click(function () {
                            cloneForm();
                        });

                        $("#cancelTempGroup").click(function () {
                            $(".on-action-disabled").removeAttr('disabled').removeClass('disabled');
                            $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('enable');
                            $("#" + elem.id + "-timegroupname").removeClass("error-input");
                            $(".error-message").text("");
                            $(".error-message").css("margin-bottom", "0px");
                            $("#updateAddTimeGroups").addClass("hide");
                            $("#saveAddTimeGroups").removeClass("hide");
                            $("#" + elem.id + "-titleStringModify").addClass("hide");
                            $("#" + elem.id + "-titleString").removeClass("hide");
                            $("#times-form-append").html("");
                            $("#times-form-append").html('<div id="times-form-last"></div>');
                            clearValues(elem);
                            $("#addTimeGroups").hide();
                        });

                        $("#addTimeGroupButton").click(function () {
                            $(".on-action-disabled").attr('disabled', 'disabled').addClass('disabled');
                            $(this).attr('disabled', 'disabled').addClass('disabled');
                            $("#addTimeGroups").show();
                            $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('disable');
                            $("#" + elem.id + "-timegroupname").focus();
                        });

                        $("#modifyTimeGroupButton").click(function () {
                            $(".on-action-disabled").attr('disabled', 'disabled').addClass('disabled');
                            $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('disable');
                            $("#" + elem.id + "-titleStringModify").removeClass("hide");
                            $("#" + elem.id + "-titleString").addClass("hide");
                            $("#updateAddTimeGroups").removeClass("hide");
                            $("#saveAddTimeGroups").addClass("hide");

                            var selected = $("#" + elem.id + "-timegroup").val();
                            var selectedId = selected.split("(")[1].split(")")[0].trim();
                            var selectedText = $("#" + elem.id + "-timegroup").val().split("(")[0].trim();
                            $("#" + elem.id + "-timegroupname").val(selectedText);

                            var json = {
                                type: "timegroup",
                                rest: "get",
                                id: selectedId
                            };

                            $.ajax({
                                method: "POST",
                                url: "./plugins.php?",
                                data: "jsonData=" + window.btoa(unescape(encodeURIComponent(JSON.stringify(json))))
                            }).done(function (d) {
                                var time = JSON.parse(d);
                                var l = time.length;

                                if (time) {
                                    for (var i = 1; i < time.length; i++) {
                                        cloneForm();
                                    }
                                    var n = 0;
                                    $( ".times-forms" ).each(function() {
                                        $( this ).find("#" + elem.id + "-timetostart-hours").val(time[n].hour_start != "*" && time[n].hour_start != "" ? time[n].hour_start : "-");
                                        $( this ).find("#" + elem.id + "-timetostart-min").val(time[n].minute_start != "*" && time[n].minute_start != "" ? time[n].minute_start : "-");
                                        $( this ).find("#" + elem.id + "-timetofinish-hours").val(time[n].hour_finish != "*" && time[n].hour_finish != "" ? time[n].hour_finish : "-");
                                        $( this ).find("#" + elem.id + "-timetofinish-min").val(time[n].minute_finish != "*" && time[n].minute_finish != "" ? time[n].minute_finish : "-");
                                        $( this ).find("#" + elem.id + "-weekdaystart").val(time[n].wday_start != "*" && time[n].wday_start != "" ? time[n].wday_start : "-");
                                        $( this ).find("#" + elem.id + "-weekdayfinish").val(time[n].wday_finish != "*" && time[n].wday_finish != "" ? time[n].wday_finish : "-");
                                        $( this ).find("#" + elem.id + "-monthsdaystart").val(time[n].mday_start != "*" && time[n].mday_start != "" ? time[n].mday_start : "-");
                                        $( this ).find("#" + elem.id + "-monthsdayfinish").val(time[n].mday_finish != "*" && time[n].mday_finish != "" ? time[n].mday_finish : "-");
                                        $( this ).find("#" + elem.id + "-monthstart").val(time[n].month_start != "*" && time[n].month_start != "" ? time[n].month_start : "-");
                                        $( this ).find("#" + elem.id + "-monthfinish").val(time[n].month_finish != "*" && time[n].month_finish != "" ? time[n].month_finish : "-");
                                        n++;
                                    });
                                }
                            });
                            $("#addTimeGroups").show();

                        });

                        $("#updateAddTimeGroups").click(function () {

                            var selected = $("#" + elem.id + "-timegroup").val();
                            var selectedId = selected.split("(")[1].split(")")[0].trim();

                            var json = getValues(elem);
                            json.type = "timegroup";
                            json.rest = "update";
                            json.id = selectedId;

                            if (json.times[0].name != "") {
                                $.ajax({
                                    method: "POST",
                                    url: "./plugins.php?",
                                    data: "jsonData=" + window.btoa(unescape(encodeURIComponent(JSON.stringify(json))))
                                }).done(function (d) {
                                    resetReload(json, elem);
                                });
                            } else {
                                $("#" + elem.id + "-timegroupname").addClass("error-input");
                                $(".error-message").css("margin-bottom", "15px");
                                $(".error-message").text(languages[browserLang]["view_error_required_string"]);
                            }
                        });

                        $("#saveAddTimeGroups").click(function () {

                            var json = getValues(elem);
                            json.type = "timegroup";
                            json.rest = "set";

                            if (json.times[0].name != "") {
                                $.ajax({
                                    method: "POST",
                                    url: "./plugins.php?",
                                    data: "jsonData=" + window.btoa(unescape(encodeURIComponent(JSON.stringify(json))))
                                }).done(function (d) {
                                    resetReload(json, elem);
                                });
                            } else {
                                $("#" + elem.id + "-timegroupname").addClass("error-input");
                                $(".error-message").css("margin-bottom", "15px");
                                $(".error-message").text(languages[browserLang]["view_error_required_string"]);
                            }
                        });

                        if (condName) {
                            $("#" + elem.id + "-name").val(condName);
                        }
                    });
                }
                dialogNewTimeCond();
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

function getHtmlRecordings (elemId) {
  var html = '<button class="addRecordingBtn addButtons"><i class="fa fa-plus"></i></button>';
  html += '<div id="addRecordingSection" class="hide">';
  html += '<hr class="hr-form"><br>';
  html += '<label id="' + elemId + '-titleString" class="label-creation label-title"><b>' + languages[browserLang]["view_newrecording_string"] + ': </b></label>';
  html += '<div class="rowSectionAnn">';
  html += '<form enctype="multipart/form-data" id="form1" method="post">';
  html += '<label for="fileupload" class="label-creation">' + languages[browserLang]["view_upload_recording_string"] + ': </label>';
  html += '<input type="file" name="file1" accept=".mp3,.wav" required="required"/>';
  html += '<button title="Upload" name="submit" id="submitFileUpload" class="hide"><i class="fa fa-upload"></i></button>';
  html += '</form>';
  html += '<div id="newRecordingNameSection" class="hide">';
  html += '<label class="label-creation">' + languages[browserLang]["view_language_string"] + ': </label>';
  html += '<select id="newRecordingLangSelect">';
  html += '<option value="it" selected>Italian</option>';
  html += '<option value="en">English</option>';
  html += '</select>';
  html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_string"] + ': </label>';
  html += '<input id="newRecordingName" type="input">';
  html += '<button id="saveNewRecordingBtn" attr-elemid="' + elemId + '" class="addButtonsRecording saveSecElements"><i class="fa fa-check"></i></button>';
  html += '</div>';
  html += '</div>';
  html += '<div class="rowSectionAnn">';
  html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_in_browser_string"] + ': </label>';
  html += '<i id="checkRecordingBtn" title="' + languages[browserLang]["view_start_recording_string"] + '" class="pointer fa fa-circle red fa-2x vmiddle"></i>';
  html += '<audio controls class="vmiddle"></audio>';
  html += '<div id="newRecordingFilenameSection" class="hide rowSectionAnn">';
  html += '<label class="label-creation">' + languages[browserLang]["view_filename_string"] + ': </label>';
  html += '<input type="text" id="recFilename">';
  html += '<button title="Upload" name="submit" id="submitFileUpload2"><i class="fa fa-upload"></i></button>';
  html += '</div>';
  html += '<div id="newRecordingNameSection2" class="hide rowSectionAnn">';
  html += '<label class="label-creation">' + languages[browserLang]["view_language_string"] + ': </label>';
  html += '<select id="newRecordingLangSelect2">';
  html += '<option value="it" selected>Italian</option>';
  html += '<option value="en">English</option>';
  html += '</select>';
  html += '<label class="label-creation">' + languages[browserLang]["view_name_recording_string"] + ': </label>';
  html += '<input id="newRecordingName2" type="input">';
  html += '<button id="saveNewRecordingBtn2" attr-elemid="' + elemId + '" class="addButtonsRecording saveSecElements"><i class="fa fa-check"></i></button>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

var recorder;
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
  $('#newRecordingFilenameSection').show();
  recorder.exportWAV(function (s) {
    var audio = document.querySelector('audio');
    audio.src = window.URL.createObjectURL(s);
  });
}

function dialogNewAnn(elemId) {
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
      var html = '<label class="label-creation listRecordingSection">' + languages[browserLang]["view_name_string"] + ': </label>';
      html += '<input autofocus value="' + values[0] + '" usable id="' + elemId + '-name" class="input-creation listRecordingSection"></input><div></div>';
      html += '<label class="listRecordingSection label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
      html += '<select usable id="' + elemId + '-recording" class="listRecordingSection input-creation">' + htmlSelect + '</select>';
      html += getHtmlRecordings(elemId);
      $("#modalCreation").html(html);
      initRecordingListeners();
  });
}

function dialogNewCqr(elemId) {
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
    var html = '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
    html += '<input autofocus value="' + values[0] + '" usable id="' + elemId + '-name" class="input-creation"></input>';
    html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
    html += '<input usable value="' + values[1] + '" id="' + elemId + '-description" class="input-creation"></input>';
    html += '<label class="label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
    html += '<select usable id="' + elemId + '-recording" class="input-creation">' + htmlSelect + '</select>';
    html += getHtmlRecordings(elemId);
    $("#modalCreation").html(html);
    initRecordingListeners();
  });
}

function dialogNewIvr(elemId) {
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
    var html = '<label class="label-creation">' + languages[browserLang]["view_name_string"] + ': </label>';
    html += '<input autofocus value="' + values[0] + '" usable id="' + elemId + '-name" class="input-creation"></input>';
    html += '<label class="label-creation">' + languages[browserLang]["view_description_string"] + ': </label>';
    html += '<input usable value="' + values[1] + '" id="' + elemId + '-description" class="input-creation"></input>';
    html += '<label class="label-creation">' + languages[browserLang]["view_recording_string"] + ': </label>';
    html += '<select usable id="' + elemId + '-recording" class="input-creation">' + htmlSelect + '</select>';
    html += getHtmlRecordings(elemId);
    $("#modalCreation").html(html);
    initRecordingListeners();
  });
}

function refreshDialog (elemId) {
  if (elemId === 'app-announcement') {
    dialogNewAnn(elemId);
  } else if (elemId === 'ivr') {
    dialogNewIvr(elemId);
  } else if (elemId === 'cqr') {
    dialogNewCqr(elemId);
  }
}

function initRecordingListeners() {

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

  $('#submitFileUpload2').click(function (e) {
    if ($('#recFilename').val() === '') {
      $('#recFilename').focus();
      return;
    }
    recorder.exportWAV(function (s) {
      var audio = document.querySelector('audio');
      audio.src = window.URL.createObjectURL(s);
      var data = new FormData();
      var fname = $('#recFilename').val().replace(/[.]/g,'-');
      audioFileName = fname + '.wav';
      data.append("file1", s, audioFileName);
      $.ajax({
        url: "plugins.php",
        type: "POST",
        data: data,
        processData: false,
        contentType: false
      }).done(function (c) {
        tempFilename = c;
        $('#newRecordingFilenameSection').hide();
        $('#newRecordingNameSection2').show();
      }).fail(function (err) {
        console.error(err);
      });
    });
  });

  $('#startRecordingBtn').click(function (e) {
      startRecording();
  });

  $('#stopRecordingBtn').click(function (e) {
      stopRecording();
  });

  $('.addRecordingBtn').click(function (e) {
      $('#addRecordingSection').toggle();
      if ($('.addRecordingBtn i').hasClass("fa-plus")) {
          $('.addRecordingBtn i').removeClass("fa-plus").addClass("fa-times");
          $('.listRecordingSection').attr('disabled', 'disabled').addClass('disabled');
          $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('disable');
      } else {
          $('.addRecordingBtn i').addClass("fa-plus").removeClass("fa-times");
          $('.listRecordingSection').removeAttr('disabled').removeClass('disabled');
          $($(".ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix button")[1]).button('enable');
      }
  });

  $('#saveNewRecordingBtn2').click(function (e) {
      if ($('#newRecordingName2').val() === '') {
          $('#newRecordingName2').focus();
          return;
      }
      var elemId = $(this).attr('attr-elemid');
      var filename = audioFileName.substring(0, audioFileName.lastIndexOf("."));
      $.ajax({
          url: "/freepbx/admin/ajax.php",
          type: "POST",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          data: "file=" + tempFilename + "&name=custom/" + filename +
              "&codec=wav&lang=" + $('#newRecordingLangSelect2').val() +
              "&temporary=1&command=convert&module=recordings"
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
              $('.addRecordingBtn i').addClass("fa-plus").removeClass("fa-times");
              refreshDialog(elemId)
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
      var lang = $('#newRecordingLangSelect').val();
      var elemId = $(this).attr('attr-elemid');
      $.ajax({
          url: "/freepbx/admin/ajax.php",
          type: "POST",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          data: "file=" + tempFilename + "&name=custom/" + filename +
              "&codec=wav&lang=" + lang + "&temporary=1&command=convert&module=recordings"
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
              $('.addRecordingBtn i').addClass("fa-plus").removeClass("fa-times");
              refreshDialog(elemId)
          }).fail(function (err) {
              console.error(err);
          });
      }).fail(function (err) {
          console.error(err);
      });
  });

  $('input[name="file1"]').change(function (e) {
    audioFileName = e.target.files[0].name;
    $('#submitFileUpload').removeClass('hide');
  });

  $("form#form1").submit(function(e) {
    try{
      var formData = new FormData($(this)[0]);
      $.ajax({
        url: "plugins.php",
        type: "POST",
        data: new FormData( this ),
        processData: false,
        contentType: false
      }).done(function (c) {
        tempFilename = c;
        $('#newRecordingNameSection').show();
      }).fail(function (err) {
        console.error(err);
      });
      e.preventDefault();
    } catch(err) {
      console.log(err);
    }
  });
}

