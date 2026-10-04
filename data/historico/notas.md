# Histórico de carregadores DC no Paraguai

Cortes 2024-01 a 2025-03 saem dos PDFs Paraguay EV Report (camada de texto e, quando a URL vem cortada na página, o link completo da anotação do PDF). O corte 2026-10 sai de `desduplicados.csv` (id = `location_id principal`), levantamento de 2026-10-02. Não houve OCR.

## O que cada relatório tem

- **2024-01** (4 páginas, `Paraguay EV Charger Repport 01:2024 V2`): só gráficos. Nenhuma URL. Gráfico de redes: Automotor 5, EverGo 16, Diesa 4, PTI 2, Enex 1, Petrobras 1, Shell 1. Soma **30**.
- **2024-02** (7 páginas, `02:2024 V2`): só gráficos. Automotor 5, EverGo 16, Diesa 5, PTI 2, Enex 1, Petrobras 1, Shell 1, Timbo 1. Soma **32**. Há a nota *1 cargador fuera de servicio; no gráfico de conectores o marcador fica em Petrobras.
- **2024-03** (10 páginas): gráficos, tabela Punto de Carga e anexo com **35** locais. Os três fecham: EverGo 20, Automotor 5, Diesa 4, PTI 2, Enex 1, Petrobras 1, Shell 1, Timbo 1. Fora de serviço no anexo: Petrobras 496785 (sem nome, comentário *roto) e Timbo 247410 (Shell Madame Lynch - BAIC).
- **2024-05**: anexo com **36** linhas. Gráfico soma **34** (EverGo 18, Diesa 5, e Petrobras e Timbo ainda como 1). Tabela Punto de Carga soma **32** porque põe EverGo 18 (-2), Petrobras 0 (-1) e Timbo 0 (-1). O anexo não acompanhou: seguem 20 EverGo e as duas linhas fora de serviço.
- **2024-08**: anexo **40** = gráfico **40**. Tabela soma **38** (Petrobras 0 (-1), Timbo 0 (-1); EverGo 23 (+5), Diesa 6 (+1)). Uma linha do anexo, 640967 Petropar San Ignacio - EverGo (Misiones, 50/50 kW), ficou sem operadora e sem estado: essas células não estão na camada de texto. O local 561818 só tem o departamento Central; em março e maio o nome impresso era Biggie Genaro Romero - Evergo.
- **2024-11**: anexo **41**. Gráfico soma **40** e não desenha Petrobras (EverGo 24, Diesa 6, Shell 1, Timbo 1). Tabela soma **40**, mas com EverGo 23 (+1) e Diesa 7, diferente do gráfico e do anexo (EverGo 24, Diesa 6). Petrobras continua no anexo como Fuera de Servicio; a tabela marca 0.
- **2025-03** (11 páginas): gráfico e tabela somam **44** (Automotor 7 (+1), Diesa 7 (+1), PTI 3 (+1), EverGo 24, Enex 1, Shell 1, Timbo 1). Petrobras não entra no gráfico e a célula da tabela ficou vazia. O anexo tem **42** links: 41 linhas com texto (EverGo 24, Automotor 5, Diesa 6, PTI 2, Enex 1, Shell 1, Timbo 1 e Petrobras 1 fora de serviço) e o link 712478 sem texto nenhum na página. Esses pontos a mais do resumo não foram inventados aqui.
- **2026-10**: 73 locais no levantamento, soma de `nº plugs DC` = **143**. Dois são residencial/privado (854324 e 717062) e ficam na série, com `residencial` = sim. Dois locais de 2026 estão sem kW máx (melhor estimativa): 854324 (residencial) e 2162141 (Parque de la Victoria).

## Linha do tempo (só números lidos)

Soma do gráfico de redes, que é o que o relatório desenha: 30 (jan/2024), 32 (fev), 35 (mar), 34 (mai), 40 (ago), 40 (nov, sem Petrobras), 44 (mar/2025). O anexo de locais, quando existe: 35, 36, 40, 41 e 42 links. Em outubro de 2026 o levantamento tem 73 locais.

Ids PlugShare únicos no histórico dos relatórios: **42**. Desses, **40** ainda estão no levantamento de 2026-10 e **2** não estão: 556244 (AGRIESA - EverGo, em funcionamento até 2025-03) e 496785 (Petrobras, Fuera de Servicio, sem nome, desde 2024-03). Nenhum id some entre um relatório e o seguinte; só entram locais novos: 620840 em 2024-05 (Parador Piringo - Diesa); 630617, 630753, 630794 e 640967 em 2024-08; 657526 em 2024-11 (Petromax San José - EverGo); 712478 em 2025-03 (só o link). Ids no levantamento de 2026-10 que não estavam na tabela de 2025-03: **33**. A série junta os dois conjuntos: **75** linhas.

## Como a tabela foi lida

Em 2024-03 e 2024-05 a coluna URL da página corta o id (fica `location/55` etc.). O id gravado é o da anotação de link do PDF, casada pela altura da linha, não o texto cortado. A partir de 2024-08 a URL inteira também está no texto, e bate com a anotação.

Nomes que quebram de linha (Sacramento, Shell Bahia Aviadores, Drei Schritte, Ltda., o EverGo no fim do nome) foram emendados na linha de baixo. O rodapé "Datos de …" que cai em cima da última linha de maio foi descartado.

A operadora é a coluna Empresa impressa naquele corte. Não foi reclassificada. EverGo no relatório e Evergo em 2026 é a mesma rede, só muda a caixa. Onde a coluna Empresa de 2024-08 e a operadora consolidada de 2026 divergem de fato:

| id | nome em 2024-08 | operadora em 2024-08 | operadora em 2026-10 | nome em 2026-10 |
| --- | --- | --- | --- | --- |
| 541237 | D Shopping Coronel Oviedo | Diesa | não informado | D Shopping Coronel Oviedo |
| 222978 | Estacion de servicio Enex | PTI | Petropar | Estacion de servicio Petropar |
| 354126 | Parador Del Touring | Diesa | não informado | Parador Del Touring |
| 223276 | Petropar San Jose 2 | PTI | Petropar | Petropar San Jose 2 |
| 247410 | Shell Madame Lynch - BAIC | Timbo | Shell Recharge | Shell Madame Lynch - BAIC |
| 485055 | Shell Recharge / Estación Shell Bahia Aviadores - ASU | Shell | Shell Recharge | Estación Shell Bahia Aviadores - ASU |
| 640967 | Petropar San Ignacio - EverGo | (vazio) | Evergo | Petropar San Ignacio - EverGo |

Os dois PTI do levantamento de 2026 (Itaipu KM 3,5, 734367, e Terminal de Ómnibus de Hernandarias, 1832661) não estão no anexo de 2025-03. Os dois locais que os relatórios chamavam de PTI (222978 Estacion de servicio Enex e 223276 Petropar San Jose 2) estão como Petropar em 2026. Não é o mesmo par de postos.

Outros cortes do próprio relatório, sem corrigir nada:

- 247410 permanece operadora Timbo o tempo todo (nome Shell Madame Lynch - BAIC). Estado: Fuera de Servicio em 2024-03, 2024-05 e 2024-08; En Funcionamiento em 2024-11 e 2025-03. Em 2026 a operadora consolidada é Shell Recharge.
- 620840 Parador Piringo - Diesa: En Funcionamiento em 2024-05, Por Inaugurar em 2024-08, En Funcionamiento de novo em 2024-11 e 2025-03. kW nominal 120, kW real 80, como impresso.
- 630794 Diesa Encarnación: kW nominal 60 e kW real 80, como impresso.
- 640967 só tem a coluna Empresa vazia em 2024-08; em 2024-11 e 2025-03 a operadora impressa é EverGo.
- D Shopping Coronel Oviedo (541237) e Parador Del Touring (354126) estão como Diesa em todos os relatórios que têm anexo, inclusive agosto de 2024. Em 2026 a operadora consolidada dos dois é "não informado".

O kW da série histórica é o kW real impresso; `kw_nominal` guarda o outro número da mesma linha. Em 2026-10 o kW é o campo kW máx (melhor estimativa) e `n_plugs` é `nº plugs DC`. Nos relatórios, `n_plugs` é a coluna Conectores do anexo (não é a mesma definição).

