# Histórico de carregadores DC no Paraguai

Fonte dos cortes 2024-01 a 2025-03: texto extraído (`pdftotext -layout`) dos relatórios Paraguay EV Report. O corte 2026-10 vem de `desduplicados.csv` (coluna `location_id principal`), não de um PDF. Os PDFs não foram reprocessados.

## Cortes sem tabela de locais

- **2024-01** e **2024-02** só têm gráficos de rede. Não há URL PlugShare. `locais_parseados` = 0. As contagens de rede foram copiadas do gráfico; o relatório não imprime um total de plugs, então `plugs_ou_vazio` ficou vazio.
- De 2024-03 em diante há a tabela "Recompilación de Datos", uma linha por URL.

## Como o id foi lido

- 2024-08, 2024-11 e 2025-03 trazem a URL inteira (`https://www.plugshare.com/location/` + 6 dígitos).
- Em 2024-03 e 2024-05 o layout cortou a URL em 1 ou 2 dígitos. O id foi completado **somente** quando esse prefixo era o começo do id da **mesma posição** na tabela de 2024-08. Bateu nas 35 linhas de março e nas 36 de maio; não sobrou id curto. Não há URL repetida dentro do mesmo corte depois disso.

## O que foi contado (não é número inventado)

Linhas parseadas da tabela de locais:

| corte | linhas |
| --- | ---: |
| 2024-03 | 35 |
| 2024-05 | 36 |
| 2024-08 | 40 |
| 2024-11 | 41 |
| 2025-03 | 41 |
| 2026-10 | 73 |

Ids novos de um corte para o seguinte (tabela de locais):

- 2024-05: 620840 (Parador Piringo - Diesa)
- 2024-08: 630617 (Petropar Ayolas - EverGo), 630753 (Petropar Cnel. Bogado - EverGo), 630794 (Diesa Encarnación), 640967 (Petropar San Ignacio - EverGo)
- 2024-11: 657526 (Petromax San José - EverGo)
- 2025-03: nenhum id entrou nem saiu

Série (`serie_locais.csv`): **75** ids únicos. **73** estão no corte 2026-10. **2** só no histórico: 556244 (AGRIESA - EverGo) e 496785 (Petrobras, sem nome no relatório, estado Fuera de Servicio). **34** ids de 2026-10 não estão na tabela de 2025-03. **39** ids de 2025-03 continuam em 2026-10.

Soma da coluna `nº plugs DC` em 2026-10: **143**. Os relatórios antigos não imprimem um total de plugs; essa coluna ficou vazia neles.

Soma das fatias do gráfico (cálculo nosso, o PDF não imprime esse total): 2024-01 = 30; 2024-02 = 32; 2024-03 = 35. Em agosto e novembro o bloco Petrobras/Shell ou a discordância entre gráfico e tabela impede fechar uma soma única sem escolher um dos números.

## Onde o relatório não fecha

- **2024-05:** o gráfico e a tabela dizem EverGo 18, mas a lista de locais ainda tem 20 linhas EverGo. Petrobras e Timbo aparecem como 1 no gráfico e como 0 na tabela, e continuam na lista como Fuera de Servicio.
- **2024-08:** a tabela-resumo diz EverGo 23. Nas linhas, a operadora EverGo aparece 22 vezes; a linha 640967 está com a coluna Empresa vazia (o nome é Petropar San Ignacio - EverGo). 561818 está sem nome (em março/maio o nome impresso era Biggie Genaro Romero - Evergo).
- **2024-11:** o gráfico diz EverGo 24 e Diesa 6; a tabela-resumo diz EverGo 23 (+1) e Diesa 7. As 41 linhas batem com o gráfico (EverGo 24, Diesa 6), não com a tabela-resumo.
- **2025-03:** gráfico e tabela falam em Automotor 7 (+1), Diesa 7 (+1) e PTI 3 (+1), mas o anexo de locais é o mesmo conjunto de 41 URLs de novembro (Automotor 5, Diesa 6, PTI 2). Esses três locais a mais **não** foram criados aqui.
- Estado impresso que muda: 247410 (Timbo / Shell Madame Lynch) e 620840 (Piringo) saem de Fuera de Servicio / Por Inaugurar em agosto para En Funcionamiento em novembro. Em maio, Piringo já estava impresso como En Funcionamiento e em agosto como Por Inaugurar.
- 630794 (Diesa Encarnación) está impresso com kW nominal 60 e kW real 80. Foi mantido como no texto.

## Troca de rótulo (2024-08 contra a operadora consolidada de 2026)

Comparação pelo mesmo `plugshare_id`, ignorando só maiúsculas. EverGo no relatório e Evergo em 2026 (21 locais) não foi tratado como troca de rede.

| id | nome em 2024-08 | operadora em 2024-08 | operadora em 2026-10 | nome em 2026-10 |
| --- | --- | --- | --- | --- |
| 541237 | D Shopping Coronel Oviedo | Diesa | não informado | D Shopping Coronel Oviedo |
| 354126 | Parador Del Touring | Diesa | não informado | Parador Del Touring |
| 222978 | Estacion de servicio Enex | PTI | Petropar | Estacion de servicio Petropar |
| 223276 | Petropar San Jose 2 | PTI | Petropar | Petropar San Jose 2 |
| 247410 | Shell Madame Lynch - BAIC | Timbo | Shell Recharge | Shell Madame Lynch - BAIC |
| 485055 | Shell Recharge \| Estación Shell Bahia Aviadores - ASU | Shell | Shell Recharge | Estación Shell Bahia Aviadores - ASU |

Os dois PTI de 2026 (Itaipu KM 3,5 e Terminal de Ómnibus de Hernandarias) **não** estão na tabela de 2025-03. Os dois locais que agosto chamava de PTI são Petropar em 2026. O PTI “2” dos dois cortes não é o mesmo par de postos.

640967 só tem a coluna Empresa vazia em 2024-08; em 2024-11 e 2025-03 a operadora impressa é EverGo, e em 2026 é Evergo.

Saíram do levantamento de 2026, estando no histórico: 556244 AGRIESA - EverGo e 496785 Petrobras (fora de serviço, sem nome).
