# -*- encoding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

import logging

class PosSession(models.Model):
    _inherit = 'pos.session'

    def buscar_lotes(self, tipo_operacion_id, lotes):
        tipo_operacion = self.env['stock.picking.type'].search([('id','=',tipo_operacion_id)])
        resultados = {}

        if tipo_operacion:
            for q in self.env['stock.quant'].search([('location_id', '=', tipo_operacion.default_location_src_id.id), ('lot_id.name', 'in', lotes)]):
                if q.product_id.id not in resultados:
                    resultados[q.product_id.id] = []
                resultados[q.product_id.id].append(q.lot_id.name)
            
        return resultados