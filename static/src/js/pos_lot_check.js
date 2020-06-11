odoo.define('pos_lot_check.pos_lot_check', function (require) {
"use strict";

var screens = require('point_of_sale.screens');
var models = require('point_of_sale.models');
var rpc = require('web.rpc');
var gui = require('point_of_sale.gui');
var PopupWidget = require('point_of_sale.popups');
var _t  = require('web.core')._t;

screens.NumpadWidget.include({
    clickSwitchSign: function() {
        return true;
    },
});


screens.ActionpadWidget.include({
    renderElement: function(){
        var self = this;
        var gui = this.pos.gui;

        this._super();
        this.$('.pay').click(function(){
            self.gui.back();

            var orden = self.pos.get_order();
            var no_serie = []; //listado de las lineas que deben de tener serie y se dejaron en blanco o no lo agregó
            orden.get_orderlines().forEach(function (orderline) {
                // si existe algun producto que requiere serie y mo se ingresó la serie, agrega la lista no_serie
                if (orderline['has_product_lot'] == true && orderline['pack_lot_lines']['length'] == 0){
                    no_serie.push(orderline);
                }
            });


            if (no_serie.length == 0){
                self.gui.show_screen('payment');
            }else{
                self.gui.back();
            }

        });

    },
});

var PackLotLinePopupWidget = PopupWidget.extend({
    template: 'PackLotLinePopupWidget',
    events: _.extend({}, PopupWidget.prototype.events, {
        'click .remove-lot': 'remove_lot',
        'keydown': 'add_lot',
        'blur .packlot-line-input': 'lose_input_focus'
    }),

    show: function(options){
        this._super(options);
        this.focus();
    },
    click_confirm: function(){
        if (this.pos.config.opcion_serie_bodega){
            var pack_lot_lines = this.options.pack_lot_lines;
            var gui = this.pos.gui;
            var this_gui = this.gui;
            var options_order = this.options.order;
            var options_order_line = this.options.order_line;
            var self = this;
            var producto_lote = [];

            this.$('.packlot-line-input').each(function(index, el){
                var cid = $(el).attr('cid'),
                    lot_name = $(el).val();
                var pack_line = pack_lot_lines.get({cid: cid});
                rpc.query({
                    model: 'stock.picking.type',
                    method: 'search_read',
                    args: [[['id', '=', self.pos.config.picking_type_id[0]]], ['id','default_location_src_id']],
                    })
                    .then(function (tipo_albaran){
                        rpc.query({
                                model: 'stock.quant',
                                method: 'search_read',
                                args: [[['lot_id.name', '=', lot_name],['location_id','=',tipo_albaran[0]['default_location_src_id'][0]],['product_id','=',options_order_line.product.id],['quantity','>=',1]], ['id']],
                            })
                            .then(function (producto){
                                var lotes_no_existentes = [];
                                producto_lote = producto
                                if (producto.length == 0){
                                    var lot_model = pack_lot_lines.get({cid: cid});
                                    lot_model.remove();
                                    pack_lot_lines.set_quantity_by_lot();
                                    options_order.remove_orderline(options_order_line);
                                    gui.show_popup('error',_t('Número de serie inválido '+lot_name));
                                }else{
                                    if (options_order.orderlines.length > 0 && options_order.orderlines.models.length > 0){
                                        options_order.orderlines.models.forEach(function (orderline) {
                                            if (orderline.pack_lot_lines.length > 0  && orderline.pack_lot_lines.models.length > 0){
                                                orderline.pack_lot_lines.models.forEach(function (series) {
                                                    if (orderline['id'] == options_order_line['id'] && cid != series['cid'] && lot_name == series['attributes']['lot_name'] && self.pos.config.opcion_numero_serie == true){
                                                        var lot_model = pack_lot_lines.get({cid: cid});
                                                        lot_model.remove();
                                                        pack_lot_lines.set_quantity_by_lot();
                                                        options_order.remove_orderline(options_order_line);
                                                    }else if (orderline['id'] != options_order_line['id'] && lot_name == series['attributes']['lot_name'] && self.pos.config.opcion_numero_serie == true ){
                                                        var lot_model = pack_lot_lines.get({cid: cid});
                                                        lot_model.remove();
                                                        pack_lot_lines.set_quantity_by_lot();
                                                        options_order.remove_orderline(options_order_line);
                                                    }

                                                });
                                            }
                                        });
                                    }
                                    pack_line.set_lot_name(lot_name);
                                    pack_lot_lines.remove_empty_model();
                                    pack_lot_lines.set_quantity_by_lot();
                                    options_order.save_to_db();
                                    options_order_line.trigger('change', options_order_line);
                                    this_gui.close_popup();
                                }
                            });


                        });


            });

        }else{
            var pack_lot_lines = this.options.pack_lot_lines;
            this.$('.packlot-line-input').each(function(index, el){
                var cid = $(el).attr('cid'),
                    lot_name = $(el).val();
                var pack_line = pack_lot_lines.get({cid: cid});
                pack_line.set_lot_name(lot_name);
            });
            pack_lot_lines.remove_empty_model();
            pack_lot_lines.set_quantity_by_lot();
            this.options.order.save_to_db();
            this.options.order_line.trigger('change', this.options.order_line);
            this.gui.close_popup();

        }
    },
    add_lot: function(ev) {
        if (this.pos.config.opcion_serie_bodega){
            var gui = this.pos.gui;
            var self = this;
            var options_order_line = this.options.order_line;
            var options_order = this.options.order;
            if (ev.keyCode === $.ui.keyCode.ENTER && this.options.order_line.product.tracking == 'serial'){
                var pack_lot_lines = this.options.pack_lot_lines,
                $input = $(ev.target),
                cid = $input.attr('cid')
                lot_name = $input.val();
                rpc.query({
                    model: 'stock.picking.type',
                    method: 'search_read',
                    args: [[['id', '=', self.pos.config.picking_type_id[0]]], ['id','default_location_src_id']],
                    })
                    .then(function (tipo_albaran){

                    rpc.query({
                                    model: 'stock.quant',
                                    method: 'search_read',
                                    args: [[['lot_id.name', '=', lot_name],['location_id','=',tipo_albaran[0]['default_location_src_id'][0]],['product_id','=',options_order_line.product.id],['quantity','>=',1]], ['id']],
                                })
                                .then(function (producto){
                                    var lotes_no_existentes = [];
                                    if (producto.length == 0){
                                        var lot_model = pack_lot_lines.get({cid: cid});
                                        lot_model.remove();
                                        pack_lot_lines.set_quantity_by_lot();
                                        gui.show_popup('error',_t('Número de serie inválido ' + lot_name));
                                        options_order.remove_orderline(options_order_line);
                                    }else{
                                        var lot_model = pack_lot_lines.get({cid: cid});
                                        lot_model.set_lot_name(lot_name);  // First set current model then add new one
                                        if(!pack_lot_lines.get_empty_model()){
                                            var new_lot_model = lot_model.add();
                                            self.focus_model = new_lot_model;
                                        }
                                        pack_lot_lines.set_quantity_by_lot();
                                        self.renderElement();
                                        self.focus();
                                    }
                            });

                });
            }

        }else{
            if (ev.keyCode === $.ui.keyCode.ENTER && this.options.order_line.product.tracking == 'serial'){
                var pack_lot_lines = this.options.pack_lot_lines,
                    $input = $(ev.target),
                    cid = $input.attr('cid'),
                    lot_name = $input.val();

                var lot_model = pack_lot_lines.get({cid: cid});
                lot_model.set_lot_name(lot_name);  // First set current model then add new one
                if(!pack_lot_lines.get_empty_model()){
                    var new_lot_model = lot_model.add();
                    this.focus_model = new_lot_model;
                }
                pack_lot_lines.set_quantity_by_lot();
                this.renderElement();
                this.focus();
            }
        }
    },

    remove_lot: function(ev){
        var pack_lot_lines = this.options.pack_lot_lines,
            $input = $(ev.target).prev(),
            cid = $input.attr('cid');
        var lot_model = pack_lot_lines.get({cid: cid});
        lot_model.remove();
        pack_lot_lines.set_quantity_by_lot();
        this.renderElement();
    },

    lose_input_focus: function(ev){
        var $input = $(ev.target),
            cid = $input.attr('cid');
        var lot_model = this.options.pack_lot_lines.get({cid: cid});
        if (lot_model != undefined){
            lot_model.set_lot_name($input.val());
        }
    },

    focus: function(){
        this.$("input[autofocus]").focus();
        this.focus_model = false;
    },
    // Al cancelar eliminar linea
    click_cancel: function(){
        var pack_lot_lines = this.options.pack_lot_lines;
        var options_order = this.options.order;
        var options_order_line = this.options.order_line;

        this.$('.packlot-line-input').each(function(index, el){
            var cid = $(el).attr('cid'),
                lot_name = $(el).val();
            var pack_line = pack_lot_lines.get({cid: cid});
            var lot_model = pack_lot_lines.get({cid: cid});
            lot_model.remove();
            pack_lot_lines.set_quantity_by_lot();
            options_order.remove_orderline(options_order_line);

        });
        this.gui.close_popup();
    },

});
gui.define_popup({name:'packlotline', widget:PackLotLinePopupWidget});

});
