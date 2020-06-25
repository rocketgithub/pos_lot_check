# -*- encoding: utf-8 -*-

from odoo import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    opcion_serie_bodega = fields.Boolean('Verificar numero serie por bodega')
    opcion_numero_serie = fields.Boolean('Verificar único número de serie por pedido')
