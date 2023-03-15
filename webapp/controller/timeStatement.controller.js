sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox) {
        "use strict";

        return Controller.extend("nmsp.timest.controller.timeStatement", {
           
            onInit: async function () {
                try {
                    this.getView().byId("btn").detachPress(this.OnSubmit);
                    
                    var oView = this.getView("timeStatement");    //Instance of view
                    var oModel = new sap.ui.model.json.JSONModel(); //This model  will contain the data for the view
                    var dataModel = this.getOwnerComponent().getModel("data");//Will contain data mapped from the ODATA services
                    //Date Format
                    var DateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
                    var Today = DateFormat.format(new Date());
                    sap.ui.core.BusyIndicator.show();
                    const oUserInfo = await this.getUserInfoService();//To get user info
                    const sUserId = oUserInfo.getId();

                    //#region Set parameters
                    dataModel.setProperty("/ValDate", Today);
                    dataModel.setProperty("/ValMonth", new Date().getMonth() + 1);
                    if (dataModel.oData.ValMonth.toString().length === 1) {
                        dataModel.oData.ValMonth = "0" + dataModel.oData.ValMonth;
                    }
                    dataModel.setProperty("/ValYear", new Date().getFullYear());
                    //#endregion Set parameters

                    //#region Service Get Data
                    var serviceUrl = "/sap/opu/odata/sap/ZODATA_TIME_STATEMENT_SRV/";
                    var TimeStatSrv = "";
                    var IndResSrv = "";
                    var TotOvrvSrv = "";
                    var TimeTransfSrv = "";
                    var AbsQtsSrv = "";
                    //Instance of ODATA service ZODATA_TIME_STATEMENT
                    var OdataServiceData = new sap.ui.model.odata.ODataModel(serviceUrl, true);


                    TimeStatSrv = await this.getHeader(OdataServiceData, dataModel);
                    if (TimeStatSrv[0].result === "ERROR") {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error((TimeStatSrv[0].data));
                    }
                    else {
                        if (TimeStatSrv[0].data.results.length === 0) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageBox.warning("No data found.");
                        }
                        else {
                            //#region Individual results Service

                            //var OdataServiceIndRes = new sap.ui.model.odata.ODataModel(serviceUrl, true);
                            IndResSrv = await this.getIndRes(OdataServiceData, dataModel);
                            if (IndResSrv[0].result === "ERROR") {
                                sap.ui.core.BusyIndicator.hide();
                                MessageBox.error((IndResSrv[0].data));
                            }
                            else {
                                //#region Total Overview Service
                                //var OdataServiceTotOvrv = new sap.ui.model.odata.ODataModel(serviceUrl, true);
                                TotOvrvSrv = await this.getTotOvrv(OdataServiceData, dataModel);
                                if (TotOvrvSrv[0].result === "ERROR") {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageBox.error((TotOvrvSrv[0].data));
                                }
                                else {
                                    //#region Time Transfer Service
                                    TimeTransfSrv = await this.getTimeTransf(OdataServiceData, dataModel);
                                    if (TimeTransfSrv[0].result === "ERROR") {
                                        sap.ui.core.BusyIndicator.hide();
                                        MessageBox.error((TimeTransfSrv[0].data));
                                    }
                                    else {
                                        //#region Abscense Quotas Service
                                        AbsQtsSrv = await this.getAbsQuts(OdataServiceData, dataModel);
                                        if (AbsQtsSrv[0].result === "ERROR") {
                                            sap.ui.core.BusyIndicator.hide();
                                            MessageBox.error((AbsQtsSrv[0].data));
                                        }
                                        else {

                                            dataModel = this.SetData(oView, dataModel, TimeStatSrv[0].data.results, IndResSrv[0].data.results, TotOvrvSrv[0].data.results, TimeTransfSrv[0].data.results, AbsQtsSrv[0].data.results)
                                            oModel = dataModel;
                                            oView.setModel(oModel);
                                            sap.ui.core.BusyIndicator.hide();
                                            //this.onAfterRendering();
                                            //#region On Focus Out event for input validations
                                            var object; //Input object to validate
                                            object = oView.byId("PrmYear");
                                            var decAll = 0;             //Number of decimals allowed for input object
                                            decAll = this.getDecAll(object) //Function to get the value of decimals allowed from the object field(parameter specified in view)
                                            this.addEvent(object, "PrmYear", "ValYear", decAll);//Function to add onfocusout event to Input object

                                            object = oView.byId("PrmMonth");
                                            var decAll = 0;             //Number of decimals allowed for input object
                                            decAll = this.getDecAll(object) //Function to get the value of decimals allowed from the object field(parameter specified in view)
                                            this.addEvent(object, "PrmMonth", "ValMonth", decAll);//Function to add onfocusout event to Input object
                                            //#endregionOn Focus Out event for input validations

                                            this.onAfterRendering();
                                        }
                                    }
                                }
                            }

                        }
                    }

                }
                catch (Ex) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(Ex.stack);
                }
                //#endregion End Service Get Data

                //dataModel = this.SetData(oView, dataModel, TrainHisSrv[0].data.results)
                //oModel = dataModel;
                //oView.setModel(oModel);
                //sap.ui.core.BusyIndicator.hide();

            },
            OnSubmit: async function (evt) {
                try {
                
                    sap.ui.core.BusyIndicator.show();
                    var oView = this.getView("timeStatement");    //Instance of view
                    var oModel = new sap.ui.model.json.JSONModel(); //This model  will contain the data for the view
                    var dataModel = this.getOwnerComponent().getModel("data");//Will contain data mapped from the ODATA services

                    if (dataModel.oData.ValMonth === "") {
                        MessageBox.error("Error, value must be a valid month between 1 and 12 (MM).");
                        sap.ui.core.BusyIndicator.hide();
                    }
                    else {
                        if (dataModel.oData.ValYear === "") {
                            MessageBox.error("Error, value must be a valid Year (YYYY).")
                            sap.ui.core.BusyIndicator.hide();
                            this.onAfterRendering();
                        }
                        else {
                            var serviceUrl = "/sap/opu/odata/sap/ZODATA_TIME_STATEMENT_SRV/";
                            var OdataServiceData = new sap.ui.model.odata.ODataModel(serviceUrl, true);
                            var TimeStatSrv = await this.getHeader(OdataServiceData, dataModel);
                            if (TimeStatSrv[0].result === "ERROR") {
                                sap.ui.core.BusyIndicator.hide();
                                MessageBox.error((TimeStatSrv[0].data));
                                this.onAfterRendering();
                                
                            }
                            else {
                                if (TimeStatSrv[0].data.results.length === 0) {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageBox.warning("No data found.");
                                    this.onAfterRendering();
                                }
                                else {
                                    //#region Individual results Service

                                    //var OdataServiceIndRes = new sap.ui.model.odata.ODataModel(serviceUrl, true);
                                    var IndResSrv = await this.getIndRes(OdataServiceData, dataModel);
                                    if (IndResSrv[0].result === "ERROR") {
                                        sap.ui.core.BusyIndicator.hide();
                                        MessageBox.error((IndResSrv[0].data));
                                        this.onAfterRendering();
                                    }
                                    else {
                                        //#region Total Overview Service
                                        //var OdataServiceTotOvrv = new sap.ui.model.odata.ODataModel(serviceUrl, true);
                                        var TotOvrvSrv = await this.getTotOvrv(OdataServiceData, dataModel);
                                        if (TotOvrvSrv[0].result === "ERROR") {
                                            sap.ui.core.BusyIndicator.hide();
                                            MessageBox.error((TotOvrvSrv[0].data));
                                            this.onAfterRendering();
                                        }
                                        else {
                                            //#region Time Transfer Service
                                            var TimeTransfSrv = await this.getTimeTransf(OdataServiceData, dataModel);
                                            if (TimeTransfSrv[0].result === "ERROR") {
                                                sap.ui.core.BusyIndicator.hide();
                                                MessageBox.error((TimeTransfSrv[0].data));
                                            }
                                            else {
                                                //#region Abscense Quotas Service
                                                var AbsQtsSrv = await this.getAbsQuts(OdataServiceData, dataModel);
                                                if (AbsQtsSrv[0].result === "ERROR") {
                                                    sap.ui.core.BusyIndicator.hide();
                                                    MessageBox.error((AbsQtsSrv[0].data));
                                                }
                                                else {

                                                    dataModel = this.SetData(oView, dataModel, TimeStatSrv[0].data.results, IndResSrv[0].data.results, TotOvrvSrv[0].data.results, TimeTransfSrv[0].data.results, AbsQtsSrv[0].data.results)
                                                    oModel = dataModel;
                                                    oView.setModel(oModel);
                                                    sap.ui.core.BusyIndicator.hide();
                                                    this.onAfterRendering();
                                                    this.byId("sc").scrollTo(0,0,500);

                                                }
                                            }
                                        }
                                    }

                                }
                            }
                        }
                    } 
                } catch (Ex) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(Ex.stack);
                    this.onAfterRendering();
                }
                this.onAfterRendering();
            },

            getUserInfoService: function () {
                return new Promise(resolve => sap.ui.require([
                    "sap/ushell/library"
                ], oSapUshellLib => {
                    const oContainer = oSapUshellLib.Container;
                    const pService = oContainer.getServiceAsync("UserInfo"); // .getService is deprecated!
                    resolve(pService);
                }));
            },
            OnLiveChgEvt: function (evt) {

                //Para obtener los parámetros enviados en el eventhandler(evt), esto nos servirá para
                //Crear el objeto formateador
                var dig = evt.getSource().data("digitsallowed");     //Número de dígitos permitidos
                var id = evt.getSource().data("error");              //Texto identificador del mensaje de error
                var decAllwd = evt.getSource().data("decAllwd");     //Número de decimales permitidos
                var obj_name = evt.getSource().data("name");         //Nombre del objeto que dispara el evento
                var obj_valId = evt.getSource().data("val");         //Nombre de la variable que contiene el valor
                var sign_allwd = evt.getSource().data("sign");       //Indica que el campo acepta signos + o -
                var flag_dec = "";                                   //Flag para saber si contiene decimales
                var sign = "";                                       //Para considerar signos.
                //#region Variables para calculo de diferencia
                var prevDaySchAllaf = 0;
                var prevday = 0;
                var dif = 0;
                var dif_val = 0;
                var netValInt = 0;
                var netValDec = 0;
                var flag = "";
                var values;
                //#endregion
                //------------------------------------

                //Se crea un objeto de tipo formateador, el cual sirve para aplicar el formato requerido al objeto
                var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                    //Número de decimales permitidos, en este caso solo queremos números enteros
                    maxFractionDigits: decAllwd,
                    //Se agrupan los números, en este caso de 3 en 3
                    groupingEnabled: true,
                    //Separados de grupos
                    groupingSeparator: ",",
                    //Separador para decimales
                    decimalSeparator: ".",
                    //Número máximo de dígitos permitidos
                    maxIntegerDigits: dig
                });

                //-------------------------------------------

                //Se crea el modelo json que nos servirá para recuperar y mandar valores a los objetos de la vista
                //Se obtiene la vista, lo cual nos da acceso a todos los componentes en ella.
                var vistaOnChange = this.getView("timeStatement");
                //var oJSONModel = new sap.ui.model.json.JSONModel();
                var Modelo_vista = vistaOnChange.getModel();
                var json_datos = Modelo_vista.getData();

                //Se obtiene la fuente (objeto) que disparó el evento y a continuación el valor de dicho objeto
                var value = evt.getSource().getValue();
                Modelo_vista.setData(null);

                //if (typeof IntDec === "undefined") {
                //Esto sirve para saber si una variables ya esta definida
                //}

                //----------------------------
                if ((value.substring(0, 1).includes("+") || value.substring(0, 1).includes("-")) && sign_allwd === "X") {
                    switch (value.substring(0, 1)) {
                        //case "+":
                        //  sign = "+";
                        //break;
                        case "-":
                            sign = "-";
                            break;
                        default:
                            break;
                    }

                }
                //Verificamos si el valor contiene . decimal
                if (value.includes(".")) {
                    //Si se encontró el . decimal entonces separamos enteros de decimales en un array
                    var IntDec = value.split('.');

                    //Nos aseguramos de que solo existan dígitos tanto en los enteros como en los decimales
                    var netvalueint = IntDec[0].replace(/[^\d]/g, "");//Regex muy simple si encuentra "," en cualquier parte del valor, lo reemplaza o en este caso lo elimina.
                    // if(decAllwd !=""){
                    var netvaluedec = IntDec[1].replace(/[^\d]/g, "");
                    flag_dec = "X";
                    //}
                    //else{

                }
                //Si no se encuentra . decimale entonces tomamos el valor enviado por el usuario
                else {
                    //Nos aseguramos de que solo existan dígitos
                    var value = value.replace(/[^\d]/g, "");//Regex muy simple si encuentra "," en cualquier parte del valor, lo reemplaza o en este caso lo elimina.
                    flag_dec = "";
                }
                if ((flag_dec === "X" && decAllwd != "") || flag_dec === "") {

                    //---------------------------------

                    //Verificamos que los enteros no excedan el valor indicado de digitos permitidos ()
                    //Se verifica si la variante netvaluint esta definida(se encontró . decimal y se realizó el split)
                    if (typeof netvalueint !== "undefined") {
                        // Si esta definida hay punto decimal y por l tanto usamos el valor recuperado de la vista
                        if (netvalueint.length > dig) {
                            //Si se sobrepaso el número de dígitos permitidos se lanza msg de error.
                            if (decAllwd > 0) {
                                if (decAllwd === "1") {
                                    var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                        " digit number with " + decAllwd + " decimal place." + "\n\r Please enter a proper value.";
                                    json_datos[obj_valId] = "";

                                    format_value = "";
                                }
                                else {
                                    var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                        " digit number with " + decAllwd + " decimal places." + "\n\r Please enter a proper value.";
                                    json_datos[obj_valId] = "";

                                    format_value = "";
                                }

                            }
                            else {
                                var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                    " digit number." + "\n\r Please enter a proper value.";
                                json_datos[obj_valId] = "";
                                format_value = "";
                            }
                            sap.m.MessageBox.error(msgerror);
                        }
                        else {
                            //Verificamos que la variable contenga valores, en este punto deberian ser dígitos o null o podría ser "" por q se ingresó
                            //un . decimal como primer caracter
                            if (netvalueint !== null & netvalueint !== "") {

                                //Verificamos si existen valores en la parte decimal
                                if ((netvaluedec !== null && netvaluedec !== "" && netvaluedec !== undefined)) {
                                    //Si hay decimales se concatenan a los enteros y se formatea
                                    value = netvalueint + '.' + netvaluedec;
                                    var format_value = sign + oNumberFormat.format(value);
                                }
                                else {
                                    //Si no hay decimales se formatean solo los enteros

                                    var format_value = oNumberFormat.format(netvalueint);
                                    //Se agrega el punto decimal 
                                    if (decAllwd != "") {
                                        format_value = sign + format_value + ".";
                                    }
                                    else {
                                        format_value = sign + format_value;
                                    }

                                }
                            }
                            else {
                                //No se encontraron valores enteros
                                //Se verifica si hay valores decimales
                                if (netvaluedec !== null & netvaluedec !== "") {
                                    value = '.' + netvaluedec;
                                    //var format_value = sign + oNumberFormat.format(value);
                                    var format_value = sign + value;
                                }
                                else {
                                    // no hay decimales, se devuelve el punto decimal.
                                    var format_value = sign + '.';
                                }
                            }
                        }
                    }
                    //Si no se realizó el split se usa el valor recuperado de la vista (value)
                    else {
                        if (value.length > dig) {
                            //Si se sobrepaso el número de dígitos permitidos se lanza msg de error.
                            if (decAllwd > 0) {
                                if (decAllwd === "1") {
                                    var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                        " digit number with " + decAllwd + " decimal place." + "\n\r Please enter a proper value.";
                                    json_datos[obj_valId] = "";

                                    format_value = "";
                                }
                                else {
                                    var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                        " digit number with " + decAllwd + " decimal places." + "\n\r Please enter a proper value.";
                                    json_datos[obj_valId] = "";

                                    format_value = "";
                                }

                            }
                            else {
                                var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                                    " digit number. " + "\n\r Please enter a proper value.";
                                json_datos[obj_valId] = "";
                                format_value = "";
                            }
                            sap.m.MessageBox.error(msgerror);
                        }
                        else {
                            if (value !== "") {
                                var format_value = sign + oNumberFormat.format(value);
                                //var format_value = sign + this.format(value).toString();



                                //var format_value = sign + this.format(value);


                                //var format_value = sign + value;
                            }
                            else {
                                var format_value = sign + "";
                            }

                        }
                    }
                }
                else {
                    var msgerror = "The maximum allowed limit for " + id + " is a " + dig +
                        " digit number." + "\n\r Please enter a proper value.";
                    json_datos[obj_valId] = "";
                    format_value = ""; //oNumberFormat.format(netvalueint);
                    sap.m.MessageBox.error(msgerror);
                }

                json_datos[obj_valId] = format_value;

                if (obj_name === "PrmMonth") {

                    if (!(Number(format_value) >= 0 && Number(format_value) <= 12 && format_value !== "") && format_value !== "") {
                        MessageBox.error("Error, value must be a valid month between 1 and 12 (MM).");
                        json_datos[obj_valId] = "";
                        json_datos["FlagMonthError"] = "X";
                    }
                    else {
                        json_datos["FlagMonthError"] = "";
                    }
                }
                if (obj_name === "PrmYear") {
                    format_value = format_value.replace(/[^\d]/g, "")
                    json_datos[obj_valId] = format_value;
                    if (!(Number(format_value) >= 1900 && Number(format_value) <= 9999) && (format_value !== "" && format_value.length === 4)) {
                        MessageBox.error("Error, value must be a valid Year(YYYY).");
                        json_datos[obj_valId] = "";

                    }
                    else {
                        //json_datos[FlagMonthError] = "";
                    }
                }
                //Cuando se modifique el valor del campo Prev. Day Scheduled Allotment, se calcula el valor del campo
                //Prev. Day Scheduled AllotmentAF






                // }


                //oJSON.obj_valId = format_value;
                //oJSONModel.setProperty(obj_valId, format_value);
                Modelo_vista.setData(json_datos);//se envía el objeto json al modelo json creado previamente
                Modelo_vista.updateBindings(true);
                vistaOnChange.setModel(Modelo_vista);//Se modifican los datos de la vista por medio del modelo json.
                this.onAfterRendering();
                //jQuery.sap.delayedCall(500, this, function () { this.byId("iptLpppFbyElv").focus(); });
                //jQuery.sap.delayedCall(500, this, function () { this.byId(obj_name).focus(); });

            },

            addEvent: function (ObName, ObId, Oval, dec) {
                var oJSONModel = new sap.ui.model.json.JSONModel();
                var oView = this.getView("timeStatement");
                var oModel = oView.getModel();
                var oData = oModel.getData();
                oModel.setData(null);

                ObName.addEventDelegate({
                    onfocusout: $.proxy(function (oEvent) {
                        if (dec !== "0") {
                            var idx = 0;
                            var val;
                            var obj = this.byId(ObId);
                            var value = obj.getValue();
                            var last_ch = value.substring((value.length - 1));
                            if (last_ch === '.') {
                                //obj.setValue(value.substring((value.length - 1), 0));
                                while (idx < dec) {
                                    oData[Oval] = value + "0";
                                    value = oData[Oval];
                                    idx++;
                                }
                                //var error = "The maximum allowed limit for 'Alameda Country' is a 4 digit number with a single decimal place. \n\r Please enter a proper value. ";
                                //sap.m.MessageBox.error(error);
                            }
                            else {
                                if (value.includes(".")) {
                                    var values = value.split(".")
                                    val = (values[1].length);
                                    idx = val;
                                }

                                while (idx < dec) {
                                    if (idx === 0) {
                                        oData[Oval] = value + ".0";
                                    }
                                    else {
                                        oData[Oval] = value + "0";
                                    }

                                    value = oData[Oval];
                                    idx++;
                                }
                            }

                        }
                        if (ObId === "PrmMonth") {
                            if (value.length === 1) {
                                if (value !== "0") {
                                    oData[Oval] = "0" + oData[Oval];
                                }
                                else {
                                    MessageBox.error("Error, value must be a valid Month(MM).");
                                }

                            }
                            //else{
                            //    if (value == "" && oData.FlagMonthError === "") {
                            //        MessageBox.error("Error, value must be a valid Month(MM).");
                            //    }
                            //}

                        }
                        if (ObId === "PrmYear") {


                            if (value.length !== 4) {
                                MessageBox.error("Error, value must be a valid Year(YYYY).");
                                oData[Oval] = "";
                            }
                        }
                        //Delete leading Zero
                        //    if (value.length > 1) {

                        ////      var firstchr = value.toString().substring(0, 1);
                        //  if (firstchr === "0" && value.toString().substring(1, 2) !== ".") {
                        //    oData[Oval] = value.toString().substring(1, (value.length));
                        //}


                        //if (firstchr === ".") {
                        //  oData[Oval] = "0" + oData[Oval];
                        //}


                        //    }
                        //End delete leading Zero

                        oModel.setData(oData);
                        oView.setModel(oModel);

                    }, this)
                });
                oModel.setData(oData);
                oView.setModel(oModel);
            },
            getDecAll: function (Object) {
                var param = Object.getCustomData();
                var decAll = 0;
                for (let index = 0; index < param.length; index++) {
                    const element = param[index];
                    if (element.getProperty("key") === "decAllwd") {
                        decAll = Number(element.getProperty("value"));
                        break;
                    }
                }
                return decAll;
            },
            onAfterRendering: function () {
                var obj = this.byId("lbl_hdstate");

                

                var oTable = this.getView().byId("tblIndRes");
                var aItems = oTable.getItems();
                var columns = oTable.getColumns();
                var flag = "X"
                var DomRef = "";

                for (let index = 0; index < columns.length; index++) {
                    DomRef = columns[index].getDomRef();
                    if(index === 1){
                        DomRef.style.textAlign="Center"
                    }
                    //DomRef.style.backgroundColor = "red";
                    //var X ="red"
                }

                //oTable.onAfterRendering = function () {

                //  if (sap.m.Table.onAfterRendering) {
                //    sap.m.Table.onAfterRendering.apply(this, arguments);
                //}

                // different column headers have differnt colors



                var hdr = oTable.$().find('tr')[0];
                var i = 0;
                $(hdr).find('th').each(function (i, o) {
                    $(o).addClass('columnStyle1');
                    
                    
                    //$(o).addClass('underline');
                });

                $(hdr).find('bdi').each(function (i, o) {
                    //$(o).addClass('underline');
                });

                // }


                if (aItems && aItems.length > 0) {

                    for (let i = 0; i < aItems.length; i++) {
                        var aCells = aItems[i].getCells();
                        if (flag === "X") {
                            aItems[i].addStyleClass("cyan");
                            flag = ""
                        }
                        else {
                            aItems[i].addStyleClass("blue");
                            flag = "X"
                        }


                    }
                }
                oTable._headerHidden = true;

                var oTableTot = this.getView().byId("tblTotOvrv");
                var aItemsTot = oTableTot.getItems();
                var columnsTot = oTableTot.getColumns();
                var flagTot = "X"
                if (aItemsTot && aItemsTot.length > 0) {

                    for (let i = 0; i < aItemsTot.length; i++) {
                        var aCells = aItemsTot[i].getCells();
                        if (flagTot === "X") {
                            aItemsTot[i].addStyleClass("cyan");
                            flagTot = ""
                        }
                        else {
                            aItemsTot[i].addStyleClass("blue");
                            flagTot = "X"
                        }


                    }
                }


                var oTableTime = this.getView().byId("tblTimeTransf");
                var aItemsTime = oTableTime.getItems();
                var columnsTime = oTableTime.getColumns();
                var flagTime = "X"
                if (aItemsTime && aItemsTime.length > 0) {

                    for (let i = 0; i < aItemsTime.length; i++) {
                        var aCells = aItemsTime[i].getCells();
                        if (flagTime === "X") {
                            aItemsTime[i].addStyleClass("cyan");
                            flagTime = ""
                        }
                        else {
                            aItemsTime[i].addStyleClass("blue");
                            flagTime = "X"
                        }


                    }
                }

                var oTableAbs = this.getView().byId("tblAbsQts");
                var aItemsAbs = oTableAbs.getItems();
                var columnsAbs = oTableAbs.getColumns();
                var flagAbs = "X"
                if (aItemsAbs && aItemsAbs.length > 0) {

                    for (let i = 0; i < aItemsAbs.length; i++) {
                        var aCells = aItemsAbs[i].getCells();
                        if (flagAbs === "X") {
                            aItemsAbs[i].addStyleClass("cyan");
                            flagAbs = ""
                        }
                        else {
                            aItemsAbs[i].addStyleClass("blue");
                            flagAbs = "X"
                        }
                        if (i === 4) {
                            aItemsAbs[i].addStyleClass("right");
                        }


                    }
                }
            jQuery.sap.delayedCall(500, this, function () { obj.focus(); });
            
            
            },
            getHeader: async function (UsrModel, dataModel) {
                const oPromise = await new Promise(function (resolve, reject) {
                    UsrModel.read("/Zpersonal", {
                        urlParameters: {
                            "Month": "'" + dataModel.oData.ValMonth + "'",
                            //"Month": "'10'",
                            "Year":  "'" + dataModel.oData.ValYear + "'",
                            //"Year": "'2018'",
                            "Set": "'ZPERSONAL'"
                        },
                        success: (oData) => {
                            resolve({ result: "SUCCESS", data: oData });
                        },

                        error: (oData) => {
                            var usrError = ("Conection Error\n\r" + "URL: " + oData.response.requestUri.valueOf(Text) + "\n\rStatus: " + oData.response.statusCode.valueOf(Text) + "\n\rBody:" + oData.response.body.valueOf(Text));
                            resolve({ result: "ERROR", data: usrError });
                            reject(oData);
                        },
                    });
                });
                return [oPromise];
            },
            getIndRes: async function (UsrModel, dataModel) {
                const oPromise = await new Promise(function (resolve, reject) {
                    UsrModel.read("/Zdaily", {
                        urlParameters: {
                           "Month": "'" + dataModel.oData.ValMonth + "'",
                            //"Month": "'10'",
                            "Year":  "'" + dataModel.oData.ValYear + "'",
                            //"Year": "'2018'",
                            "Set": "'ZDAILY'"
                        },
                        success: (oData) => {
                            resolve({ result: "SUCCESS", data: oData });
                        },

                        error: (oData) => {
                            var usrError = ("Conection Error\n\r" + "URL: " + oData.response.requestUri.valueOf(Text) + "\n\rStatus: " + oData.response.statusCode.valueOf(Text) + "\n\rBody:" + oData.response.body.valueOf(Text));
                            resolve({ result: "ERROR", data: usrError });
                            reject(oData);
                        },
                    });
                });
                return [oPromise];
            },
            getTotOvrv: async function (UsrModel, dataModel) {
                const oPromise = await new Promise(function (resolve, reject) {
                    UsrModel.read("/Ztotals", {
                        urlParameters: {
                            "Month": "'" + dataModel.oData.ValMonth + "'",
                            //"Month": "'10'",
                            "Year":  "'" + dataModel.oData.ValYear + "'",
                            //"Year": "'2018'",
                            "Set": "'ZTOTALS'"
                        },
                        success: (oData) => {
                            resolve({ result: "SUCCESS", data: oData });
                        },

                        error: (oData) => {
                            var usrError = ("Conection Error\n\r" + "URL: " + oData.response.requestUri.valueOf(Text) + "\n\rStatus: " + oData.response.statusCode.valueOf(Text) + "\n\rBody:" + oData.response.body.valueOf(Text));
                            resolve({ result: "ERROR", data: usrError });
                            reject(oData);
                        },
                    });
                });
                return [oPromise];
            },
            getTimeTransf: async function (UsrModel, dataModel) {
                const oPromise = await new Promise(function (resolve, reject) {
                    UsrModel.read("/Ztimetransfer", {
                        urlParameters: {
                            "Month": "'" + dataModel.oData.ValMonth + "'",
                            //"Month": "'10'",
                            "Year":  "'" + dataModel.oData.ValYear + "'",
                            //"Year": "'2018'",
                            "Set": "'ZTIMETRANSFER'"
                        },
                        success: (oData) => {
                            resolve({ result: "SUCCESS", data: oData });
                        },

                        error: (oData) => {
                            var usrError = ("Conection Error\n\r" + "URL: " + oData.response.requestUri.valueOf(Text) + "\n\rStatus: " + oData.response.statusCode.valueOf(Text) + "\n\rBody:" + oData.response.body.valueOf(Text));
                            resolve({ result: "ERROR", data: usrError });
                            reject(oData);
                        },
                    });
                });
                return [oPromise];
            },
            getAbsQuts: async function (UsrModel, dataModel) {
                const oPromise = await new Promise(function (resolve, reject) {
                    UsrModel.read("/Zabsence", {
                        urlParameters: {
                            "Month": "'" + dataModel.oData.ValMonth + "'",
                            //"Month": "'10'",
                            "Year":  "'" + dataModel.oData.ValYear + "'",
                            //"Year": "'2018'",
                            "Set": "'ZABSENCE'"
                        },
                        success: (oData) => {
                            resolve({ result: "SUCCESS", data: oData });
                        },

                        error: (oData) => {
                            var usrError = ("Conection Error\n\r" + "URL: " + oData.response.requestUri.valueOf(Text) + "\n\rStatus: " + oData.response.statusCode.valueOf(Text) + "\n\rBody:" + oData.response.body.valueOf(Text));
                            resolve({ result: "ERROR", data: usrError });
                            reject(oData);
                        },
                    });
                });
                return [oPromise];
            },

            SetData: function (P_oview, P_dataModel, P_Hdrdata, P_Indres, P_TotOvrvw, P_TimeTrfr, P_AbsQuts) {
                //#region HEADER
                
                P_dataModel.oData.ValPrMonth = P_dataModel.oData.ValMonth;                      //Payroll Period Month
                P_dataModel.oData.ValPrYear = P_dataModel.oData.ValYear;                        //Payroll Period Month
                P_dataModel.setProperty("/ValHdrPernr", P_Hdrdata[0].Pernr);                    //Personnel no.
                P_dataModel.setProperty("/ValHdrEmpGrp", P_Hdrdata[0].Ptext);                   //Employee group.
                P_dataModel.setProperty("/ValHdrEmpSgrp", P_Hdrdata[0].Persk);                  //Employee Subgroup.
                P_dataModel.setProperty("/ValHdrPerArea", P_Hdrdata[0].Werks);                  //Personnel area.
                P_dataModel.setProperty("/ValHdrName", P_Hdrdata[0].Ename);                     //Personnel area.
                P_dataModel.setProperty("/ValHdrCompcode", P_Hdrdata[0].Bukrs);                 //Company Code.
                P_dataModel.setProperty("/ValHdrCostCntr", P_Hdrdata[0].Kostl);                 //Coost Center.
                P_dataModel.setProperty("/ValHdrWsRule", P_Hdrdata[0].Schkz);                   //WS Rule.
                P_dataModel.setProperty("/ValTblIndRes", P_Indres);                             //Table Individual Results.
                P_dataModel.setProperty("/ValTblTotOvrvw", P_TotOvrvw);                         //Table Total Overview.
                P_dataModel.setProperty("/ValTblTimeTransf", P_TimeTrfr);                       //Table Time Transfer.
                P_dataModel.setProperty("/ValTblAbsQts", P_AbsQuts);                            //Table Abscense Quotas.
                return P_dataModel;
            },
             onPrint: function (evt) {

                var DateFormat2 = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
                var Today2 = DateFormat2.format(new Date());
                var i;
                //this.getView().byId("LblPersAreaName").mProperties.text = 'ARMANDO CANTO ECHEVERRIA'
                var user_name_length = this.getView().byId("LblPersAreaName").mProperties.text.length;  //string length of the user name

                var space_length = 535 - user_name_length;

                var selection = '<html> <hr>' +
                    //Selection
                    '<Label for="lblTitlePar" width="25px"' +
                    'style="margin-left: 25px; ' +
                    'margin-right: 4px;' +
                    'margin-top: 7.5px;' +
                    'font-size: 1.5rem;' +
                    'width: 135px;' +
                    'font-weight: bolder;' +
                    'font-family: calibri;' +
                    '">SELECTION</Label>' +
                    '<br>' +

                    //Personnel Number
                    '<Label for="lblPernr" width="25px" ' +
                    'style="margin-left: 25px;' +
                    'margin-right: 4px;' +
                    'margin-top: 7.5px;' +
                    'font-size: 0.975rem;' +
                    'width: 135px;' +
                    'font-family: calibri;' +
                    '">Personnel Number:</Label>' +
                    '&nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId('ipt').getValue() +
                    '</label>' +

                    //Month
                    '&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp ' +
                    '<Label for="lblPernr" width="25px" ' +
                    'style="margin-left: 4px;' +
                    'margin-right: 4px;' +
                    'margin-top: 7.5px;' +
                    'font-size: 0.975rem;' +
                    'width: 40px;' +
                    'font-family: calibri;' +
                    '">Month:</Label>' +
                    '&nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId('PrmMonth').getValue() +
                    '</label>' +

                    //Year
                    '&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp' +
                    '<Label for="lblPernr" width="25px" ' +
                    'style="margin-left: 4px;' +
                    'margin-right: 4px;' +
                    'margin-top: 7.5px;' +
                    'font-size: 0.975rem;' +
                    'width: 40px;' +
                    'font-family: calibri;' +
                    '">Year:</Label>' +
                    '&nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId('PrmYear').getValue() +
                    '</label>' +
                    '<hr>';

                //Header
                var header = '<br> <br>' +
                    '<div class="lbl_hd1" v-if="activeStage == 3" style="display:flex;' +
                    'justify-content:space-between;' +
                    ';">' +
                    '<div style="font-size: 0.975rem;' +
                    'margin-left: 30px;' +
                    'font-family: calibri;' +
                    'margin-top: 2px;"><label for="lbl_hdstate">State of California</label></div>' +
                    '<div style="font-size: 0.995rem; font-family: calibri;' +
                    'margin-top: 2px"><label for="lbl_hddept">DEPARTMENT OF WATER RESOURCES</label></div>' +
                    '<div style="text-align: right;' +
                    'font-size: 0.975rem;' +
                    'margin-right: 40px;' +
                    'font-family: calibri;' +
                    'margin-top: 2px;"><label for="lbl_hdresage">California Natural</label></div>' +
                    '</div>' +
                    '<div class="lbl_hd2" v-if="activeStage == 3" style="display:flex;' +
                    'justify-content:space-between;' +
                    'align-items:center;' +
                    'width:100%;' +
                    ';">' +
                    '<div><label for="name"> </label></div>' +
                    '<div style="font-size: 0.975rem; font-family: calibri;' +
                    'margin-left: 2px; margin-left: 120px;"><label for="lbl_hdflddiv">HUMAN RESOURCES</label></div>' +
                    '<div style="text-align: right;' +
                    'font-size: 0.975rem; font-family: calibri;' +
                    'margin-right: 40px;"><label for="lbl_hdfResAg">Resources Agency</label></div>' +
                    '</div>';

                var Title_date = '<div style="margin-top: 15px;"><center><Label for="lbl_TimeStatement" width="1140px" ' +
                    'style="font-size: 1.5rem; font-weight: bolder; font-family: calibri;' +
                    '">TIME STATEMENT</Label></center></div>' +
                    '<center>' +
                    '<Label for="lbl_Date" width="1140px" style="' +
                    'font-family: calibri;">' +
                    Today2 +
                    '</Label></center>';

                var period_info = '<br> <br>' +
                    //Pay Period
                    '<Label for="lblPayPeriod" width="25px" ' +
                    'style="margin-left: 30px;' +
                    'margin-top: 2px;' +
                    'font-family: calibri;' +
                    'font-weight: bolder;">Pay Period:</Label>' +
                    '&nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId('PrmMonth').getValue() +
                    '</label>' +

                    '&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp' +
                    '&nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId('PrmYear').getValue() +
                    '</label>';
                               //#region  Employee Info
                var empl_info = '<br>' +
                "<style type=text/css>" +
                    ".princip{" +
                        "width:659px ;" +
                        "display:inline-flex;"+
                        "margin-left: 30px;" + 
                        "font-family: calibri;"+
                        "font-weight: bolder;" +
                    "}" +
                    ".lblPernrInfoTxt{" +
                        "width:110px ;" +
                        "display:inline-flex;"+
                        "margin-left: 5px;" + 
                        "text-align: right;"+
                        "font-family: calibri;"+
                        
                    "}" +
                "</style>"+
                
                    '<label for="LblPrnrInfoQstions" style="font-weight: bolder;' +
                    'margin-left: 30px; margin-top: 20px; ' +
                    'font-family: calibri;">' +
                    'For Questions: Contact your Administrative Officer/Timekeeper</label>' +

                    '<span style="padding-left: 240px"></span>' +

                   // '<Label for="LblPrnrInfoPernr" width="50px" ' +
                    //'style="margin-left: 25px;' +
                    //'margin-top: 2px;' +
                    //'font-family: calibri;' +
                    //'">Personnel no.:</Label>' +

                   // '<Label for="LblPrnrInfoPernr" width="150px" ' +
                    //'style="margin-left: 25px;' +
                    //'margin-top: 2px;' +
                    //'font-family: calibri;' +
                    
                    ' &nbsp &nbsp <Label for="LblPrnrInfoPernr"' +
                    "class='lblPernrInfoTxt';" +

                    '">Personnel no.:</Label>' +

                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValPernr").mProperties.text +
                    '</label>' +

                    '<br>' +
                    '<span style="padding-left: 690px"></span>' +


                    ' &nbsp &nbsp &nbsp<Label for="LblValEmplyGrp"' +
                    "class='lblPernrInfoTxt';" +

                   // '<Label for="LblValEmplyGrp"  width="150px" ' +
                    //'style="margin-left: 25px;' +
                    //'margin-top: 2px;' +
                    //'font-family: calibri;' +


                    '">Employee group:</Label>' +
                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValEmplyGrp").mProperties.text +
                    '</label>' +

                    '<br>' +
                    '<span style="padding-left: 690px"></span>' +

                    ' &nbsp &nbsp &nbsp<Label for="LblValEmplySGrp"' +
                    "class='lblPernrInfoTxt';" +



                    //'<Label for="LblValEmplySGrp"  width="150px" ' +
                    //'style="margin-left: 25px;' +
                    //'margin-top: 2px;' +
                   // 'font-family: calibri;' +
                    '">Empl. subgroup:</Label>' +
                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValEmplySGrp").mProperties.text +
                    '</label>' +

                    '<br>' +
                    
                    '<label for="lbl_username" ' +
                    "class='princip';>"  +
                    this.getView().byId("LblPersAreaName").mProperties.text +
                    '</label>' +
                  
                ' &nbsp &nbsp <Label for="LblValPersArea"' +
                "class='lblPernrInfoTxt';" +


                    '">Personnel area:</Label>' +
                    '&nbsp &nbsp &nbsp' +

                


                    '<label for="LblValPersArea1" width="50px" '+
                    
                     'style="font-family: calibri">' +
                    this.getView().byId("LblValPersArea").mProperties.text +
                    '</label>' +

                    '<br>' +
                    '<span style="padding-left: 690px"></span>' +

                    ' &nbsp &nbsp&nbsp <Label for="LblValCompCode"' +
                    "class='lblPernrInfoTxt';" +

                    '">Company code:</Label>' +
                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValCompCode").mProperties.text +
                    '</label>' +

                    '<br>' +
                    '<span style="padding-left: 690px"></span>' +

                    ' &nbsp &nbsp&nbsp <Label for="LblValCostCntr"' +
                    "class='lblPernrInfoTxt';" +


                    '">Cost center:</Label>' +
                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValCostCntr").mProperties.text +
                    '</label>' +

                    '<br>' +
                    '<span style="padding-left: 690px"></span>' +

                    ' &nbsp &nbsp&nbsp <Label for="LblValWsRuleTxt"' +
                    "class='lblPernrInfoTxt';" +

                    '">WS rule:</Label>' +
                    '&nbsp &nbsp &nbsp' +
                    '<label style="font-family: calibri">' +
                    this.getView().byId("LblValWsRuleTxt").mProperties.text +
                    '</label>';
                //#endregion  Employee Info

                //#region  Individual Results Table
                var IndRes = '<br>' +
                    "<center>" +
                    "<Label for='LblIndResTxt' width='1140px' style='font-size: 1.5rem; font-weight: bolder; text-decoration-line: underline;'>Individual Results</Label>" +
                    "</center> <br>" +
                    "<div>" +

                    "<table class='table' style='border-collapse: collapse; width: 1140px;' backgroundDesign='Solid';>" +
                    "<tr>" +
                    "<th style='text-align: left; width:3%; font-size: 18px; font-family: calibri;  text-align: left;  '></th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '>Day</th>" +
                    "<th style='text-align: rigth; width:25%; font-size: 18px; font-family: calibri;  text-align: left; '>Abs/Att</th>" +
                    "<th style='text-align: left; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '> Attend</th>" +
                    "<th style='text-align: left; width:7.5%; font-size: 18px; font-family: calibri;  text-align: left; '>ABS</th>" +
                    "<th style='text-align: rigth; width:7.5%; font-size: 18px; font-family: calibri;  text-align: left; '>HFP</th>" +
                    "<th style='text-align: rigth; width:7.5%; font-size: 18px; font-family: calibri;  text-align: left; '>OT(1.5)</th>" +
                    "<th style='text-align: rigth; width:7.5%; font-size: 18px; font-family: calibri;  text-align: left; '>OT(1.0)</th>" +
                    "<th style='text-align: rigth; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>DWS</th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "</tr> </div>"

                var oTableIndRes = this.getView().byId("tblIndRes");
                var aItemsIndRes = oTableIndRes.getItems();

                for (let index = 0; index < aItemsIndRes.length; index++) {
                    const element = aItemsIndRes[index];
                    var aCells = element.getCells();
                    var aValue = aCells[0].mProperties.text;
                    IndRes += "<tr>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"

                    aValue = aCells[1].mProperties.text;
                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"

                    aValue = aCells[2].mProperties.text;
                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[3].mProperties.text;

                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[4].mProperties.text;

                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[5].mProperties.text;

                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[6].mProperties.text;

                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;'>" + aValue + "</th>"
                    aValue = aCells[7].mProperties.text;

                    IndRes += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "</tr>"

                    aValue = "";

                }
                IndRes += "</table>"
                //#endregion  Individual Results Table            


                //#region  Total Overview Table
                //Total Overview Table
                var TotOvrvw = "<br>"

                TotOvrvw += "<table class='table' style='border-collapse: collapse; width: 1140px;' backgroundDesign='Solid'>"
                TotOvrvw += "<center>" +
                    "<Label for='LblTotOvrvwTxt' width='1140px' style='font-size: 1.5rem; font-weight: bolder; text-decoration-line: underline;'>Total Overview</Label>" +
                    "</center> <br>" +

                    "<table class='table' style='border-collapse: collapse; width: 1140px;' backgroundDesign='Solid'>" +
                    "<tr>" +
                    "<th style='text-align: left; width:3%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: left; width:35%; font-size: 18px; font-family: calibri;  text-align: left; '>Type</th>" +
                    "<th style='text-align: rigth; width:6%; font-size: 18px; font-family: calibri;  text-align: left; '>Hours</th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: left; width:32%; font-size: 18px; font-family: calibri;  text-align: left; '>Type</th>" +
                    "<th style='text-align: rigth; width:12%; font-size: 18px; font-family: calibri;  text-align: left; '>Hours</th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "</tr>"
                var oTableTot = this.getView().byId("tblTotOvrv");
                var aItemsTot = oTableTot.getItems();

                for (let index = 0; index < aItemsTot.length; index++) {
                    const element = aItemsTot[index];
                    var aCells = element.getCells();
                    var aValue = aCells[0].mProperties.text;
                    TotOvrvw += "<tr style=''>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"

                    aValue = aCells[1].mProperties.text;
                    TotOvrvw += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"

                    TotOvrvw += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + "</th>"
                    aValue = aCells[3].mProperties.text;
                    TotOvrvw += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[4].mProperties.text;

                    TotOvrvw += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>" +

                        "</tr>"

                    aValue = "";

                }
                TotOvrvw += "</table>"


                //#endregion  Total Overview Table


                //#region  Time TransferTable
                //Time Transfers Table
                var TimeTransf = '<br>' +
                    '<center><Label for="LblTimeTransfTxt" width="1140px" style="font-size: 1.5rem; font-weight: bolder; ' +
                    'text-decoration-line: underline;">Time Transfers</Label></center>' +

                    "<table class='table' style='border-collapse: collapse; width: 1140px;' backgroundDesign='Solid'>" +
                    "<tr>" +
                    "<th style='text-align: left; width:3%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: left; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>From</th>" +
                    "<th style='text-align: rigth; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: rigth; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>To</th>" +
                    "<th style='text-align: left; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>Time</th>" +
                    "<th style='text-align: rigth; width:30%; font-size: 18px; font-family: calibri;  text-align: left; '>Balance Revision</th>" +
                    "<th style='text-align: rigth; width:25%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "</tr>"

                var oTableTimeTransf = this.getView().byId("tblTimeTransf");
                var aItemsTimeTransf = oTableTimeTransf.getItems();

                for (let index = 0; index < aItemsTimeTransf.length; index++) {
                    const element = aItemsTimeTransf[index];
                    var aCells = element.getCells();

                    var aValue = aCells[0].mProperties.text;
                    TimeTransf += "<tr style=''>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    TimeTransf += "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>"
                    aValue = aCells[1].mProperties.text;
                    TimeTransf += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"


                    aValue = aCells[2].mProperties.text;
                    TimeTransf += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[4].mProperties.text;

                    TimeTransf += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"

                    aValue = aCells[5].mProperties.text;

                    TimeTransf += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "</tr>"

                    aValue = "";

                }
                TimeTransf += "</table>"
                //#endregion  Total Overview Table

                //#region  Absence Quotas Table
                //Absence Quotas Table              
                var AbsQts = '<br>' +
                    '<center><Label for="LblAbsQtsTxt" width="1140px" style="font-size: 1.5rem; font-weight: bolder; ' +
                    'text-decoration-line: underline;">Absence Quotas</Label></center>' +
                    "<table class='table' style='border-collapse: collapse; width: 1140px;' backgroundDesign='Solid'>" +
                    "<tr>" +
                    "<th style='text-align: left;  width:3%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: left;  width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>From</th>" +
                    "<th style='text-align: rigth; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "<th style='text-align: rigth; width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>To</th>" +
                    "<th style='text-align: left;  width:10%; font-size: 18px; font-family: calibri;  text-align: left; '>Quota</th>" +
                    "<th style='text-align: rigth; width:27%; font-size: 18px; font-family: calibri;  text-align: left; '>Quota Text</th>" +
                    "<th style='text-align: rigth; width:15%; font-size: 18px; font-family: calibri;  text-align: left; '>Remaining</th>" +
                    "<th style='text-align: rigth; width:13%; font-size: 18px; font-family: calibri;  text-align: left; '>Units</th>" +
                    "<th style='text-align: left; width:5%; font-size: 18px; font-family: calibri;  text-align: left; '></th>" +
                    "</tr>"
                var oTableAbs = this.getView().byId("tblAbsQts");
                var aItemsAbs = oTableAbs.getItems();

                for (let index = 0; index < aItemsAbs.length; index++) {
                    const element = aItemsAbs[index];
                    var aCells = element.getCells();
                    var aValue = aCells[0].mProperties.text;
                    AbsQts += "<tr style=''>" +
                        "<th style='text-align: rigth; font-size: 14px; font-family: calibri;'></th>" +

                        "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"+
                        "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'> </th>"
                        


                    aValue = aCells[1].mProperties.text;
                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"


                    aValue = aCells[2].mProperties.text;
                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[3].mProperties.text;

                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[4].mProperties.text;

                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"
                    aValue = aCells[5].mProperties.text;
                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + aValue + "</th>"


                    AbsQts += "<th style='text-align: left; font-size: 14px; font-family: calibri;font-weight: normal;'>" + "</th>" +

                        "</tr>"

                    aValue = "";

                }
                AbsQts += "</table>"


                //#endregion  Absence Quotas Table
                var closeContent = '</html>';

                var win = window.open("", "PrintWindow");

                win.document.write(selection + header + Title_date + period_info + empl_info + IndRes + TotOvrvw + TimeTransf + AbsQts + closeContent);
                win.print();
                win.stop();
                win.close();
            },


        });
    });
