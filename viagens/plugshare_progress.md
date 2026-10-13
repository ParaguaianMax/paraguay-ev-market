
## Rodada 7 (2026-10-12 ~22h45 PYT)
- DDG/curl/WebFetch no PlugShare bloqueados (Cloudflare); 18 buscas via WebSearch.
- Casados 4: Jockey Plaza→717343 (120), GWM BC→585909 (30; Dalmo Vieira 510), Expoville EB-ocm313972 = duplicata do PS 1687612 já no arquivo → linha removida, Metronorte→609478 (Cia Charge 80KW, R. Max Colin 1701; kW 60→80).
- Sem id/não casados: BYD Matriz (só PS 607935 = BYD Mário Tourinho, outro endereço), Jerônimo & Madero Cascavel (PS 1493199 é Curitiba), Pra Frente Brasil (relatos de removido; sem PS id), Bionova Rio Negro (PS 2088254 Days Inn é outro endereço), Sonho Meu BC (PS 640838 Brava, AC 22 kW), Movix-E Medcar, Zanette, Shopping Cilla, Audi Joinville, Cia Charge Vila Guanabara, Angeloni Porto Belo, Double Tree Foz (PS existe, id não visto).
- Total: 229 pontos; restam 142 linhas EB.

## Rodada 8 (2026-10-13 ~07h20 PYT)
- PlugShare direto voltou a responder (curl, og:title = nome | endereço) → conferência de endereço na própria página. DDG HTML funcionou 2 buscas e bloqueou de novo ("anomaly"); resto via WebSearch (12 buscas).
- Casados 5: Posto Viale→1916910 (60), Viale Tower→1693299 (60), Reataurante Merlo EB-ocm303433→587477 (R. De Caxias 395; dual CCS2 60), Alx Nácar→2144754 (PS nº 726 vs EB 738; 160+120 CCS2 + 40 GB/T), Malf Itajaí→1534959 (40).
- Rejeitados (endereço ≠): Fanny (PS 2219038 R. Maestro F. Antonello 976 ≠ EB R. Major Vicente de Castro 213), Alumifix Aluminio (PS 603663 confirmado R. Salvador Ferrante 85 ≠ William Booth 751), Catarinna's (PS 2040727 "Catarina" nº 105 ≠ 366), Restaurante Merlo EB-sp4012 (BR-101 4021 ≠ PS 587477).
- Confirmados como outros locais: 2135202 VOLT CHARGER (R. Carlos Dietzsch 141), 1064865 Lactec (Comendador Franco 1341), 2088687 Hyperion Grupo Máxima (Teixeira Soares 591), 1673485 Luz da Lua (R. do Semeador 65).
- Sem id: Joy Guarapuava, Pagauto Itajaí, HS Connect, Posto PAD, Letts Road, Joy Joinville (R. Blumenau 121), Movix-E Pio XII, SJP Av. das Torres (Energia Atual/Duragás/Vale Sul/TIC 7), Ecofortte Francisco Rocha.
- Restam 137 linhas EB.

## Rodada 9 (2026-10-13 ~07h35 PYT)
- Script /workspace/psq.py (DDG HTML, 8 s entre buscas) rodou 40 linhas antes do bloqueio; títulos (nome | endereço) lidos direto do PlugShare.
- Casados 24: Double Tree Foz→800492 (80), Autocar Oliveira→1036907, Passeio Vivaz→1418057, Posto Stop Sta Tereza→1511070, Posto Ipiranga Cascavel→174364, Itelo Webber→1351005 (60), Maffini→1954041 (nº 290 vs 278), Movix-E & Soberano→1449075 (75), I Unipar→2004474, Joy Energy Cascavel→1698373 (4445 vs 4461), Jerônimo & Madero Cascavel→1077916 (60), BYD Cascavel→652425, Choupana Ibema→174281, Hotel Palmeiras→174278, Zanette→1879294 (80; PS 1852728 "BR Sul" no mesmo km 348 = provável duplicata no PS), Saldanha Marinho→1730412, BYD Guarapuava→1583922, Cidade dos Lagos→726771, Joy Guarapuava→1913358 (PS: funcionando com 35 kW), Posto Stop Serra do Relógio→387199, Maranello Palmeira→173257, Green Charger Girassol→1482493 (80), City Center Outlet→727458, Ecofortte Meotti→2071654 (80).
- Duplicatas EB removidas (mesmo PS): EB-ocm473181 Itelo Webber, EB-sp3994 Jerônimo e Madero, EB-ocm204434 Copel Maranello, EB-sp3639 Ecofortte Meotti.
- Rejeitados: Posto Gasparin (PS 731577 Av. Olímpio Rafagnin ≠ Nilson Gottlieb), Letts Road (PS 714395 R. Taboão ≠ Rod. do Café 3325), Simão Pneus EB-sp3619 (2788 vs PS 2188), Shopping Cilla (só PS Energy Cleve), Movix-E Pio XII/Medcar, Bionova Rio Negro, Zacarias.
- Total 225 pontos; restam 109 EB.
- Rodada 9b: On Charge - CCS SJP→1542106 "On-Charge Indústria" (240 kW; CCS2×6; GB/T só adaptador → gbt_adaptador=sí). DDG voltou a bloquear (testado após 10 min e de novo); WebSearch sem id para Dom Antônio, Gold Park V, Cia Charge Peugeot, Pelanda 27, Espaço MarQ. Restam 108 EB.

## Rodada 10 (2026-10-13 ~08h–09h PYT)
- psq.py modificado: ao bloquear, espera 15 min e tenta de novo (até 8×); 30 s entre buscas. DDG libera ~1 busca a cada 15 min → ~7 linhas/h. Processo continua em background (nohup) gravando em /workspace/psq_out.jsonl.
- Casados 3: Dom Antônio→1036375 (80; PS nº 6121 vs EB 6145, mesmo restaurante), GAC Servopa→1387093, Open Point Volvo Servopa→177170 (R. Jerônimo Durski 925; revisar se é DC – notas antigas indicam só AC 7 kW).
- Sem casamento: Luz da Lua EB-ocm306612 (PS 1673485 R. do Semeador ≠; PS 709590 sem endereço), Volt-On (2135202/2080546 outros endereços), GS Charger (candidatos Raposo Tavares/Itacolomi ≠ Frischmann 2520), Subway Água Verde (1493199/2126863 outros). WebSearch sem id: Smart Fit, Expocentro BC, Boca Mafra, Porto Belo All Resort, Zandoná, Graal Parada Norte.
- Restam 105 EB.

## Rodada 11 (2026-10-13 ~11h05 PYT)
- psq.py em background (espera 15 min ao bloquear DDG); jsonl passou de 49→52+ linhas neste turno.
- Casados 4 (endereço confirmado na página pública PlugShare): Ecofortte Francisco Rocha→1677938 (Rua Francisco Rocha 1494; kw 94→120; CCS2×6), GWM Evollux Batel→570266 (Av. do Batel 1682; restrito), Posto Petrobras→706196 (Av. Manoel Ribas 3130; kw 24→30), Madrid→722782 (R. Vicente Machado 551; kw 43→60; Energia Atual).
- Rejeitado: Ecofortte Fris Mercado (PS 659190 Plaza Estacionamento / Ermelino de Leão ≠ Assis Gonçalves 665). Já rejeitados antes sem novo casamento: Gasparin, Movix-E/Medcar, Bionova, Zacarias, Simão Pneus, Shopping Cilla, Letts Road, Luz da Lua, Volt-On, GS Charger, Subway Água Verde. Sem cand: Pra Frente Brasil, Posto Palmeiras, Estação Guapo, Volton.
- Total: 225 pontos; restam 101 EB.

## Rodada 12 (2026-10-13 ~12h55 PYT)
- psq.py seguiu em background (DDG liberou ~25 buscas entre 11h e 12h); títulos/descrições lidos na página pública PlugShare; endereços ambíguos conferidos por geocodificação (Nominatim) contra as coordenadas EB.
- Casados 16: Plaza CCS2→659190 (Ermelino de Leão 167; 120+60), Rua Inácio Lustosa→2247825 (RZ Power Adega Boulevard nº 250, ~20 m; 80), Ultra Charge→1599577 (80), Av. da Integração→1877991, Alx Ahú→1716808 (nº 27 vs 43), Smart Fit→2071975, Alx Itupava→1639810 (1580 vs 1590; 80), Posto Imola→1851366 (Av. V. F. do Amaral 1280, ~55 m; 80), BYD Matriz→582973 (R. Rockefeller 1217), Av. V. F. do Amaral 2400→1920373 (~30 m), Eletrocentro Lactec→477079 (BR-116 8813; 100), La Ventura→1920306 (3925 vs 3821; 60), B4 Energia Solar→1435191 (80), 80kw Derosso→1970023 (80), Posto Selection→1822010 (80), Novo CNF Clube Olímpico→1715960 (Derosso 3269, ~200 m das coords EB; 80).
- Rejeitados/sem id: Alumifix (PS 647548/647566 R. Salvador Ferrante ≠ William Booth 751, ~500 m), Smart Hub, CNF Auto Master, Em Instalação, Fanny, Ecofortte Eco-Express, Gold Park V, Posto Tic 2, Subway Carmo.
- Total: 225 pontos; restam 85 EB.

## Rodada 13 (2026-10-13 ~14h57 PYT)
- psq.py em background; jsonl ~105 linhas; títulos conferidos na página pública PlugShare; endereços ambíguos por Nominatim.
- Casados 18: Elexpower Ecomall→1160681 (30), Posto TIC 7→768208 (80; CCS2×2), BYD SJP→600379 (Av. das Torres 2080 vs EB R. Maringá 2080, mesmo CEP), Posto Barão→1277212, FV→1218923 (80; CCS2×2), CNF Posto 2000→1686729 (80), Duragás→932853 (80), Grupo Máxima→1794403 (80; Hyperion), Fera→1121695 (80), Pelanda 27→705605 (BR-376 Contenda), CNF Nogueira→716640 (80), GreenV Buffon→2105876 (150; ~350 m), UDESC→602468 (60; CCS2+CHAdeMO), Espaço MarQ→2039194 (30), Solturi→1899170 (nº 3591 vs 3584, ~47 m), Shopping Mueller→715324 (Visc. Taunay 235 vs 275), Chargerpoint Sam's→766251 (40; CCS2×5), Audi Center Joinville→1306669 (150).
- Duplicata EB removida (mesmo PS): EB-ocm505823 GreenV Buffon (~10 km das coords do PS; mantido EB-sp4485).
- Rejeitados: Cia Charge Peugeot (PS 717032 Av. das Torres 1440 ≠ R. Pérola do Oeste 201, ~800 m), Energia Atual SKNA (2697 ≠ 1425), Ecofortte Car (R. São José ≠ Benjamin Juliato), Parque Da Fonte (candidatos On-Charge/Elexpower outros nº). Sem id/casamento novo: Celesc GutBrau, Joy Energy Blumenau 121, HS Connect; já rejeitados antes seguem (Gasparin, Movix-E/Medcar, Bionova, Zacarias, Simão Pneus, Cilla, Letts, Luz da Lua, Volt-On, GS, Subway Água Verde, Fris, Fanny, Alumifix, Merlo BR-101, Smart Hub, CNF Auto Master, Em Instalação, Eco-Express, Gold Park V, Tic 2, Subway Carmo, Pra Frente Brasil, Palmeiras, Guapo, Volton, Auto Posto Izabel, Vale Sul).
- Total: 224 pontos; restam 66 EB.
