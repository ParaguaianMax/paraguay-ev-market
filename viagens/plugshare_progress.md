
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
- psq.py ainda rodando (espera 15 min ao bloquear DDG); jsonl com 49 linhas; 87 EB ainda não buscadas.
- Casados 2 (endereço confirmado na página pública PlugShare): Ecofortte Francisco Rocha→1677938 (Rua Francisco Rocha 1494; kw 94→120; 6 plugues CCS2), GWM Evollux Batel→570266 (Av. do Batel 1682; restrito).
- Já rejeitados antes (sem novo casamento): Gasparin, Movix-E/Medcar, Bionova Cascavel, Zacarias, Simão Pneus, Shopping Cilla, Letts Road, Luz da Lua, Volt-On, GS Charger, Subway Água Verde. Sem cand: Pra Frente Brasil, Posto Palmeiras, Estação Guapo, Volton.
- Total: 225 pontos; restam 103 EB.
