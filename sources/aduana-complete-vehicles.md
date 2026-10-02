# Aduana source — complete vehicles

Primary: [datosabiertos.aduana.gov.py](https://datosabiertos.aduana.gov.py) Nivel_Item CSVs.

| Field | Use |
|-------|-----|
| OPERACION | IMPORTACION only |
| POSICION | NCM 8703 / 8704 prefixes only |
| CANTIDAD ESTADISTICA | Vehicle units |
| UNIDAD MEDIDA ESTADISTICA | Must be UNIDAD |
| MERCADERIA | Classify modelo/powertrain; exclude parts/CKD |

Parts chapters (e.g. 8708) are never ingested by the 8703/8704 stream filter.
