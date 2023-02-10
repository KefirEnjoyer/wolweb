$(document).ready(function () {

    jQuery.showSnackBar = function (data) {

        $('#snackbar').text(data.message);
        if (data.error != null) {
            $('#snackbar').addClass('alert-danger');
            $('#snackbar').removeClass('alert-success')
        } else {
            $('#snackbar').removeClass('alert-danger')
            $('#snackbar').addClass('alert-success')
        }
        $('#snackbar').show();

        // After 2 seconds, hide the Div Again
        setTimeout(function () {
            $('#snackbar').hide();
        }, 2000);
    };

    jQuery.wakeUpDeviceByName = function (deviceName) {
        $.ajax({
            type: "GET",
            url: (vDir == "/" ? "" : vDir) + "/wake/" + deviceName,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                $.showSnackBar(data);
            },
            error: function (data, err) {
                $.showSnackBar(data);
                console.error(data);
            }
        })
    };

    getAppData();

});

function getAppData() {

    $.getJSON((vDir == "/" ? "" : vDir) + "/data/get", function (data) {
        window.appData = data;
        if (!appData.devices) {
            appData.devices = [];
        }
        renderData();
    }).fail(function (data) {
        alert("Error: Problem with getting data from the service.");
    });

}

function renderData() {

    var BSControl = function (config) {
        jsGrid.ControlField.call(this, config);
    };

    BSControl.prototype = new jsGrid.ControlField({

        _createInsertButton: function () {
            var grid = this._grid;
            return $("<button>").addClass("btn btn-success btn-sm")
                .attr({ type: "button", title: "Add this device to the list." })
                .html("<i class=\"fa-solid fa-pen-to-square\" style=\"color: white;\"></i> Save")
                .on("click", function () {
                    grid.insertItem().done(function () {
                        grid.clearInsert();
                    });
                });
        },

        _createEditButton: function (item) {
            var grid = this._grid;
            return $("<button class=\"btn btn-sm btn-success m-0 p-1\" title=\"" + this.editButtonTooltip + "\">").append("<i class=\"fas fa-edit bs-grid-button text-light m-0 p-0\">").click(function (e) {
                grid.editItem(item);
                e.stopPropagation();
            });
        },

        _createDeleteButton: function (item) {
            var grid = this._grid;
            return $("<button class=\"btn btn-sm btn-danger m-0 ml-1 p-1\" title=\"" + this.deleteButtonTooltip + "\">").append("<i class=\"fas fa-trash-alt bs-grid-button text-light m-0 p-0\" style=\"color: #70ff73;\">").click(function (e) {
                grid.deleteItem(item);
                e.stopPropagation();
            });
        },
        _createUpdateButton: function () {
            var grid = this._grid;
            return $("<button class=\"btn btn-sm btn-success m-0 ml-1 p-1\" title=\"" + this.updateButtonTooltip + "\" ></button").append("<i class=\"fas fa-save bs-grid-button text-light m-0 p-0\">").click(function (e) {
                grid.updateItem();
                e.stopPropagation();
            });
        },

        _createCancelEditButton: function () {
            var grid = this._grid;
            return $("<button class=\"btn btn-sm btn-danger m-0 ml-1 p-1\" title=\"" + this.cancelEditButtonTooltip + "\">").append("<i class=\"fas fa-window-close bs-grid-button text-light m-0 p-0\">").click(function (e) {
                grid.cancelEdit();
                e.stopPropagation();
            });
        },


    });

    jsGrid.fields.bscontrol = BSControl;

    var gridFields = [];
    var gridWidth = "970px";
    gridFields.push({
        name: "connection", title: "ON/OFF", type: "text", width: 120, align: "center", sorting: false,
        headerTemplate: function () {
            var grid = this._grid;
            var isInserting = grid.inserting;
            var $button = $("<button>").addClass("btn btn-dark btn-sm device-refresh-button")
                .attr({ type: "button", title: "Add new Device" })
                .html("<i class=\"fa-solid fa-arrows-rotate\" style=\"color: #ffffff;\"></i> Refresh").css({ "color": "ffffff" })
                .on("click", function () {
                    updateConnectionData()
                    $button.html("<i class=\"fa-solid fa-arrows-rotate fa-spin fa-spin-reverse\"></i>")
                    $(".fa-solid fa-power-off fa-xl").css("color", "orange");
                });
            return $button;
        }, itemTemplate: function (value, item) {
            if (value == "on") {
                return "<i class=\"fa-solid fa-power-off fa-xl\" style=\"color: #43c77c;\"></i>"
            }
            else {
                return "<i class=\"fa-solid fa-power-off fa-xl\" style=\"color: #f03e24;\"></i>"
            }
        }
    });
    gridFields.push({
        name: "address", title: "IP address ", type: "text", width: 150, validate: { validator: "required", message: "address IP is a required field." }, sortable: true, sorter: function (a, b) {
           
            const aComponents = a.split(".").map(function (component) { return parseInt(component, 10); });
            const bComponents = b.split(".").map(function (component) { return parseInt(component, 10); });

            // Compare each component of the IP addresses numerically
            for (var i = 0; i < 4; i++) {
                if (aComponents[i] < bComponents[i]) {
                    return -1;
                } else if (aComponents[i] > bComponents[i]) {
                    return 1;
                }
            }
            // If all components are equal, the IP addresses are equal
            return 0;
        }
    });
    gridFields.push({ name: "name", title: "Device Name", type: "text", width: 150 });
    gridFields.push({ name: "mac", title: "MAC Address", type: "text", width: 150, validate: { validator: "pattern", param: /^[0-9a-f]{1,2}([\.:-])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/gmi, message: "MAC Address is a required field." } });
    gridFields.push({
        name: "ip", title: "Broadcast IP", type: "text", width: 150, validate: { validator: "required", message: "Broadcast IP Address is a required field." },
        insertTemplate: function () {
            var $result = jsGrid.fields.text.prototype.insertTemplate.call(this); // original input
            // $result.attr("disabled", true).css("background", "lightgray").val(bCastIP);
            $result.val(bCastIP);
            return $result;
        },
        // editing: false
    });
    gridFields.push({
        name: "command", type: "control", width: 125, modeSwitchButton: false,
        itemTemplate: function (value, item) {
            return $("<button>").addClass("btn btn-warning btn-sm")
                .attr({ type: "button", title: "Send magic packet" })
                .html("<i class=\"fas fa-bolt\"></i>WAKE-UP")
                .on("click", function () {
                    $.wakeUpDeviceByName(item.name)
                    
                });
        },
        editTemplate: function (value, item) { return "" },
        insertTemplate: function () { return "" }
    });
    gridFields.push({
        name: "control", type: "bscontrol", width: 100, editButton: true, deleteButton: true, modeSwitchButton: true,
        headerTemplate: function () {
            var grid = this._grid;
            var isInserting = grid.inserting;
            var $button = $("<button>").addClass("btn btn-dark btn-sm device-insert-button")
                .attr({ type: "button", title: "Add new Device" })
                .html("<i class=\"fa-solid fa-plus\" style=\"color: #ffffff;\"></i> New")
                .on("click", function () {
                    isInserting = !isInserting;
                    grid.option("inserting", isInserting);
                });
            return $button;
        }
    });

    $("#GridDevices").jsGrid({
        width: "970px",
        height: "auto",
        updateOnResize: true,
        editing: true,
        inserting: false,
        sorting: true,
        confirmDeleting: true,
        deleteConfirm: "Are you sure you want to delete this Device?",
        data: appData.devices,
        fields: gridFields,
        rowClick: function (args) {
            args.cancel = true;
        },
        onItemInserted: saveInsertedData,
        onItemDeleted: saveAppData,
        onItemUpdated: saveAppData,

    });
    $("#GridDevices").jsGrid("sort", { field: "address", order: "asc" });
}

function saveAppData() {

    $.ajax({
        type: "POST",
        url: (vDir == "/" ? "" : vDir) + "/data/save",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(appData),
        success: function (data) {
            $.showSnackBar(data);
        },
        error: function (data, err) {
            $.showSnackBar(data);
            console.error(data);
        }
    });

}

function updateConnectionData() {
    $.ajax({
        type: "GET",
        url: (vDir == "/" ? "" : vDir) + "/data/update",
        success: function (data) {
            getAppData()
        },
        error: function () {
            console.log("Error something went wrong.");
        }
    })

}
function saveInsertedData() {

    saveAppData();
    $(".device-insert-button").click();

}
