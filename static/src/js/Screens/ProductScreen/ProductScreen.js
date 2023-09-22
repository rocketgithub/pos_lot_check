odoo.define('pos_fel.ProductScreen', function (require) {
    'use strict';
    
    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');

    const PosLotCheckProductScreen = (ProductScreen) => class PosLotCheckProductScreen extends ProductScreen {
        async _onClickPay() {
            let error = false;

            let lineas = this.env.pos.get_order().orderlines.filter(line => line.get_product().tracking !== 'none');
            
            if (this.env.pos.config.opcion_serie_bodega) {
                let lotes = [];
                
                for (const l of lineas) {
                    lotes = lotes.concat(l.pack_lot_lines.map(p => p.lot_name));
                }
                
                let encontrados = await this.rpc({
                    model: 'pos.session',
                    method: 'buscar_lotes',
                    args: [[], this.env.pos.picking_type.id, lotes],
                }, {
                    timeout: 3000,
                    shadow: true,
                });
                
                for (const l of lineas) {
                    for (const lote of l.pack_lot_lines) {
                        if (!encontrados[l.product.id].includes(lote.lot_name)) {
                            this.showPopup("ErrorPopup", {
                                title: "Lote/Serie no encontrado",
                                body: `El Lote/Serie ${lote.lot_name} del producto ${l.product.display_name} no fue encontrado.`,
                            });
                            error = true;
                        }
                    }
                }
            }
            
            if (this.env.pos.config.opcion_numero_serie) {
                let existentes = {};
                
                for (const l of lineas) {
                    if (!(l.product.id in existentes)) {
                        existentes[l.product.id] = [];
                    }
                    
                    for (const lote of l.pack_lot_lines) {
                        if (existentes[l.product.id].includes(lote.lot_name)) {
                            this.showPopup("ErrorPopup", {
                                title: "Lote/Serie no duplicado",
                                body: `El Lote/Serie ${lote.lot_name} del producto ${l.product.display_name} es duplicado.`,
                            });
                            error = true;
                        } else {
                            existentes[l.product.id].push(lote.lot_name)
                        }
                    }
                }
            }
            
            if (!error) {
                await super._onClickPay();
            }
        }
    };
    Registries.Component.extend(ProductScreen, PosLotCheckProductScreen);
    
    return PosLotCheckProductScreen;
});
