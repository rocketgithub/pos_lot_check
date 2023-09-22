# -*- encoding: utf-8 -*-

from odoo import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    opcion_serie_bodega = fields.Boolean('Verificar numero serie por bodega')
    opcion_numero_serie = fields.Boolean('Verificar único número de serie por pedido')

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # pos.config fields
    pos_opcion_serie_bodega = fields.Boolean(related='pos_config_id.opcion_serie_bodega', readonly=False)
    pos_opcion_numero_serie = fields.Boolean(related='pos_config_id.opcion_numero_serie', readonly=False)
