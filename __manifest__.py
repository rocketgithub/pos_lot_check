# -*- coding: utf-8 -*-
{
    'name': "Post lot check",
    'summary': """Post lot check""",
    'description': """
        Módulo para verificar que el lote del producto exista al hacer una venta en el POS
    """,
    'author': "aquíH",
    'website': "http://www.aquih.com",
    'category': 'Uncategorized',
    'version': '1.0',
    'depends': ['point_of_sale','stock'],
    'data': [
        'views/pos_config_view.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            'pos_lot_check/static/src/js/**/*',
        ],
    },
    'license': 'Other OSI approved licence',
}
