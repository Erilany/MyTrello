function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const days = Math.floor(hours / 24);
  return days;
}

function buildLibraryData(csv) {
  const libraryItems = [];
  const cardMap = new Map();
  let itemId = 1;

  const lines = csv.split('\n').filter(line => line.trim());
  const header = lines[0].split(';');
  const chapterIdx = header.indexOf('Chapitre');
  const cardIdx = header.indexOf('Carte');
  const categoryIdx = header.indexOf('Action');
  const subcategoryIdx = header.indexOf('Tâches');
  const durationIdx = header.indexOf('Temps repères');
  const tag1Idx = header.indexOf('Tag 1');
  const tag2Idx = header.indexOf('Tag 2');

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const chapter = (cols[chapterIdx] || '').trim();
    const cardTitle = (cols[cardIdx] || '').trim();
    const categoryTitle = (cols[categoryIdx] || '').trim();
    const subcategoryTitle = (cols[subcategoryIdx] || '').trim();
    const duration = parsePTDuration(cols[durationIdx] || '');
    const tag1 = (cols[tag1Idx] || '').trim();
    const tag2 = (cols[tag2Idx] || '').trim();

    if (!chapter || !cardTitle) continue;

    const tags = [chapter, tag1, tag2].filter(Boolean).join(',');

    let cardItem = cardMap.get(cardTitle);
    if (!cardItem) {
      cardItem = {
        id: itemId++,
        title: cardTitle,
        type: 'card',
        tags: tags,
        duration: duration,
        content_json: JSON.stringify({
          card: { title: cardTitle, description: '', priority: 'normal', duration_days: duration },
          categories: [],
        }),
      };
      cardMap.set(cardTitle, cardItem);
      libraryItems.push(cardItem);
    }

    if (categoryTitle) {
      const content = JSON.parse(cardItem.content_json);
      let category = content.categories.find(c => c.title === categoryTitle);
      if (!category) {
        category = {
          title: categoryTitle,
          description: '',
          priority: 'normal',
          duration_days: duration,
          subcategories: [],
        };
        content.categories.push(category);
      }

      if (subcategoryTitle) {
        if (!category.subcategories.find(s => s.title === subcategoryTitle)) {
          category.subcategories.push({
            title: subcategoryTitle,
            description: '',
            priority: 'normal',
            duration_days: duration,
          });
        }
      }

      cardItem.content_json = JSON.stringify(content);
    }
  }

  return libraryItems;
}

const csvData = `N\u00B0;Chapitre;Carte;Action;T\u00E2ches;Niveau 5;Niveau 6;Temps rep\u00E8res;Tag 1;Tag 2
5;Jalons;Jalons SIEPR;;;;;PT10955H0M0S;;
6;Jalons;Jalons SIEPR;Jalons projet;;;;PT10955H0M0S;;
7;Jalons;Jalons SIEPR;Jalons projet;Signature de la DO;;;PT0H0M0S;Projet;
8;Jalons;Jalons SIEPR;Jalons projet;Lancement projet;;;PT0H0M0S;Projet;
9;Jalons;Jalons SIEPR;Jalons projet;Signature de la DCT;;;PT0H0M0S;Projet;
10;Jalons;Jalons SIEPR;Jalons projet;Signature de la DI;;;PT0H0M0S;Projet;
11;Jalons;Jalons SIEPR;Jalons projet;PV de fin de concertation;;;PT0H0M0S;Projet;
12;Jalons;Jalons SIEPR;Jalons projet;D\u00E9p\u00F4t de la DUP;;;PT0H0M0S;Projet;
13;Jalons;Jalons SIEPR;Jalons projet;Signature de la DUP;;;PT0H0M0S;Projet;
14;Jalons;Jalons SIEPR;Jalons projet;S\u00E9curisation du foncier;;;PT0H0M0S;Projet;
15;Jalons;Jalons SIEPR;Jalons projet;Obtention de la derni\u00E8re autorisation;;;PT0H0M0S;Projet;
16;Jalons;Jalons SIEPR;Jalons projet;Cl\u00F4ture;;;PT0H0M0S;Travaux;Projet
17;Jalons;Jalons SIEPR;Jalons OP poste;;;;PT9779H0M0S;;
18;Jalons;Jalons SIEPR;Jalons OP poste;CTF Poste valid\u00E9e;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Poste
19;Jalons;Jalons SIEPR;Jalons OP poste;Commande MCPO;;;PT0H0M0S;;Poste
20;Jalons;Jalons SIEPR;Jalons OP poste;Ouverture de chantier poste;;;PT0H0M0S;Travaux;Poste
21;Jalons;Jalons SIEPR;Jalons OP poste;Premi\u00E8re mise en service poste;;;PT0H0M0S;Travaux;Poste
22;Jalons;Jalons SIEPR;Jalons OP poste;Derni\u00E8re mise en service poste;;;PT0H0M0S;Travaux;Poste
23;Jalons;Jalons SIEPR;Jalons OP poste;Fin des travaux poste;;;PT0H0M0S;Travaux;Poste
24;Jalons;Jalons SIEPR;Jalons OP LA;;;;PT10360H0M0S;;
25;Jalons;Jalons SIEPR;Jalons OP LA;CTF LA valid\u00E9e;;;PT0H0M0S;Proccessus D\u00E9cisionnel;LA
26;Jalons;Jalons SIEPR;Jalons OP LA;APO;;;PT0H0M0S;Proc\u00E9dures Administratives;LA
27;Jalons;Jalons SIEPR;Jalons OP LA;Commande \u00E9tudes MCEL LA;;;PT0H0M0S;Etudes;LA
28;Jalons;Jalons SIEPR;Jalons OP LA;Commandes travaux MCLA;;;PT0H0M0S;Travaux;LA
29;Jalons;Jalons SIEPR;Jalons OP LA;Ouverture de chantier LA;;;PT0H0M0S;Travaux;LA
30;Jalons;Jalons SIEPR;Jalons OP LA;Premi\u00E8re mise en service LA;;;PT0H0M0S;Travaux;LA
31;Jalons;Jalons SIEPR;Jalons OP LA;Derni\u00E8re mise en service LA;;;PT0H0M0S;Travaux;LA
32;Jalons;Jalons SIEPR;Jalons OP LA;Fin des travaux LA;;;PT0H0M0S;Travaux;LA
33;Jalons;Jalons SIEPR;Jalons OP LS;;;;PT8141H0M0S;;
34;Jalons;Jalons SIEPR;Jalons OP LS;CTF LS valid\u00E9e;;;PT0H0M0S;Proccessus D\u00E9cisionnel;LS
35;Jalons;Jalons SIEPR;Jalons OP LS;Commande \u00E9tudes MCEL LS;;;PT0H0M0S;Etudes;LS
36;Jalons;Jalons SIEPR;Jalons OP LS;Commandes travaux MCLS;;;PT0H0M0S;Travaux;LS
37;Jalons;Jalons SIEPR;Jalons OP LS;Ouverture de chantier LS;;;PT0H0M0S;Travaux;LS
38;Jalons;Jalons SIEPR;Jalons OP LS;Premi\u00E8re mise en service LS;;;PT0H0M0S;Travaux;LS
39;Jalons;Jalons SIEPR;Jalons OP LS;Derni\u00E8re mise en service LS;;;PT0H0M0S;Travaux;LS
40;Jalons;Jalons SIEPR;Jalons OP LS;Fin des travaux LS;;;PT0H0M0S;Travaux;LS
41;Jalons;Jalons d'interface;;;;;PT0H0M0S;;
42;Jalons;Jalons d'interface;<Nouvelle t\u00E2che>;;;;PT0H0M0S;;
43;Processus d\u00E9cisionnels;;;;;;PT5474H0M0S;Proccessus D\u00E9cisionnel;
44;Processus d\u00E9cisionnels;Processus DO;;;;;PT35H0M0S;Proccessus D\u00E9cisionnel;
45;Processus d\u00E9cisionnels;Processus DO;DO - Validation et signature de la DO (dir D&I);;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
46;Processus d\u00E9cisionnels;Processus DO;Nomination du manager de projet;;;;PT0H0M0S;;
47;Processus d\u00E9cisionnels;Processus DCT ;;;;;PT1022H0M0S;Proccessus D\u00E9cisionnel;
48;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;;;;PT700H0M0S;Etudes;
49;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;Mise \u00E0 jour du CCF;;;PT140H0M0S;Etudes;Projet
50;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;CTF partie Postes;;;PT280H0M0S;Etudes;Poste
51;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;CTF partie BT / telecom Postes et encadrants;;;PT280H0M0S;Etudes;BT
52;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;CTF partie Liaisons a\u00E9riennes;;;PT280H0M0S;Etudes;LA
53;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;CTF partie Liaisons souterraines;;;PT280H0M0S;Etudes;LS
54;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;CTF partie Concertation/autorisation;;;PT280H0M0S;Etudes;Projet
55;Processus d\u00E9cisionnels;Processus DCT ;R\u00E9alisation CTF;Finalisation CTF de synth\u00E8se;;;PT140H0M0S;Etudes;Projet
56;Processus d\u00E9cisionnels;Processus DCT ;Projet < 10 M\u20AC (Facultative);;;;PT35H0M0S;Proccessus D\u00E9cisionnel;
57;Processus d\u00E9cisionnels;Processus DCT ;Projet < 10 M\u20AC (Facultative);DCT - RRR/CRP (Revue des R\u00E9f\u00E9rents R\u00E9gionaux / Comit\u00E9 R\u00E9gional des Projets);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
58;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;;;;PT252H0M0S;Proccessus D\u00E9cisionnel;
59;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - RRR (Revue des R\u00E9f\u00E9rents R\u00E9gionaux);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
60;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
61;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
62;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
63;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
64;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
65;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
66;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - CRP (Comit\u00E9 R\u00E9gional des Projets);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
67;Processus d\u00E9cisionnels;Processus DCT ;Projet < 20 M\u20AC;DCT - Validation directeur D&I;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
68;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;;;;PT322H0M0S;Proccessus D\u00E9cisionnel;
69;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - RRR (Revue des R\u00E9f\u00E9rents R\u00E9gionaux);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
70;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - Point d'arr\u00EAt SPC;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
71;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
72;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
73;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
74;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
75;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
76;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
77;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CRP Paris;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
78;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - CNI (Comit\u00E9 National d'Investissement);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
79;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - Pr\u00E9sentation en directoire (si montant engag\u00E9 entre DCT et DI > 20 M\u20AC);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
80;Processus d\u00E9cisionnels;Processus DCT ;Projet > 20 M\u20AC;DCT - D\u00E9lib\u00E9ration directoire (si montant engag\u00E9 entre DCT et DI > 20 M\u20AC);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
81;Processus d\u00E9cisionnels;Processus DCT ;DCT - Validation et signature de la DCT;;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
82;Processus d\u00E9cisionnels;Processus DI;;;;;PT1414H0M0S;Proccessus D\u00E9cisionnel;
83;Processus d\u00E9cisionnels;Processus DI;APD;;;;PT175H0M0S;Etudes;Projet
84;Processus d\u00E9cisionnels;Processus DI;APD;APD - Finalisation du dossier;;;PT70H0M0S;Etudes;Projet
85;Processus d\u00E9cisionnels;Processus DI;APD;APD - Envoi dossier;;;PT0H0M0S;Etudes;Projet
86;Processus d\u00E9cisionnels;Processus DI;APD;APD - Avis;;;PT105H0M0S;Etudes;Projet
87;Processus d\u00E9cisionnels;Processus DI;APD;APD - Validation du dossier;;;PT0H0M0S;Etudes;Projet
88;Processus d\u00E9cisionnels;Processus DI;Projet < 10 M\u20AC;;;;PT105H0M0S;Proccessus D\u00E9cisionnel;
89;Processus d\u00E9cisionnels;Processus DI;Projet < 10 M\u20AC;DI - Finalisation du dossier;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
90;Processus d\u00E9cisionnels;Processus DI;Projet < 10 M\u20AC;DI - RRR/CRP (Revue des R\u00E9f\u00E9rents R\u00E9gionaux / Comit\u00E9 R\u00E9gional des Projets);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
91;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;;;;PT392H0M0S;Proccessus D\u00E9cisionnel;
92;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DI - Finalisation du dossier;;;PT140H0M0S;Proccessus D\u00E9cisionnel;Projet
93;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DI - RRR (Revue des R\u00E9f\u00E9rents R\u00E9gionaux);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
94;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DI - Point d'arr\u00EAt SPC;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
95;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
96;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
97;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
98;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
99;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
100;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DCT - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
101;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DI - CRP (Comit\u00E9 R\u00E9gional des Projets) Paris;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
102;Processus d\u00E9cisionnels;Processus DI;Projet < 20 M\u20AC;DI - Validation directeur D&I;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
103;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;;;;PT462H0M0S;Proccessus D\u00E9cisionnel;
104;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - Finalisation du dossier;;;PT140H0M0S;Proccessus D\u00E9cisionnel;Projet
105;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - RRR (Revue des R\u00E9f\u00E9rents R\u00E9gionaux);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
106;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - Point d'arr\u00EAt SPC;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
107;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
108;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
109;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
110;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
111;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
112;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DCT - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
113;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - CRP Paris;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
114;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - CNI (Comit\u00E9 National d'Investissement);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
115;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - Pr\u00E9sentation en directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
116;Processus d\u00E9cisionnels;Processus DI;Projet > 20 M\u20AC;DI - D\u00E9lib\u00E9ration directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
117;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;;;;PT462H0M0S;Proccessus D\u00E9cisionnel;
118;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - Finalisation du dossier;;;PT140H0M0S;Proccessus D\u00E9cisionnel;Projet
119;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - RRR/CRP (Revue des R\u00E9f\u00E9rents R\u00E9gionaux / Comit\u00E9 R\u00E9gional des Projets);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
120;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - Point d'arr\u00EAt SPC;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
121;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
122;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
123;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
124;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
125;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
126;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
127;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CRP Paris;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
128;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - CNI (Comit\u00E9 National d'Investissement);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
129;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - Pr\u00E9sentation en directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
130;Processus d\u00E9cisionnels;Processus DI;Projet > 30 M\u20AC;DI - D\u00E9lib\u00E9ration directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
131;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;;;;PT924H0M0S;Proccessus D\u00E9cisionnel;
132;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - Finalisation du dossier;;;PT140H0M0S;Proccessus D\u00E9cisionnel;Projet
133;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - RRR/CRP (Revue des R\u00E9f\u00E9rents R\u00E9gionaux / Comit\u00E9 R\u00E9gional des Projets);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
134;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - Point d'arr\u00EAt SPC;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
135;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - Mise \u00E0 jour des documents pour le CCE;;;PT70H0M0S;Proccessus D\u00E9cisionnel;Projet
136;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - D\u00E9p\u00F4t du dossier CCE;;;PT0H0M0S;Proccessus D\u00E9cisionnel;Projet
137;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CCE - Remarques et questions;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
138;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CCE - R\u00E9ponses et amendements;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
139;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CCE - Avis;;;PT14H0M0S;Proccessus D\u00E9cisionnel;Projet
140;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CCE - S\u00E9ance pl\u00E9ni\u00E8re;;;PT7H0M0S;Proccessus D\u00E9cisionnel;Projet
141;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CRP Paris;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
142;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - CNI (Comit\u00E9 National d'Investissement);;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
143;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - Audit CRE;;;PT462H0M0S;Proccessus D\u00E9cisionnel;Projet
144;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - Pr\u00E9sentation en directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
145;Processus d\u00E9cisionnels;Processus DI;Projet > 50 M\u20AC;DI - D\u00E9lib\u00E9ration directoire;;;PT35H0M0S;Proccessus D\u00E9cisionnel;Projet
146;Processus d\u00E9cisionnels;Processus DI;DI - Validation et signature de la DI;;;;PT0H0M0S;Proccessus D\u00E9cisionnel;
147;Proc\u00E9dures administratives;;;;;;PT5999H0M0S;Proc\u00E9dures Administratives;
148;Proc\u00E9dures administratives;R\u00E9daction Note d'Organisation Strat\u00E9gique pour la Concertation;;;;;PT280H0M0S;Etudes;Projet
149;Proc\u00E9dures administratives;Lag - Validation de la NOS pour sortie \u00E0 l'externe;;;;;PT140H0M0S;Etudes;
150;Proc\u00E9dures administratives;Autorisation de sortie \u00E0 l'externe (si lancement concertation avant DCT);;;;;PT0H0M0S;Etudes;
151;Proc\u00E9dures administratives;Concertation FERRACCI;;;;;PT1309H0M0S;Proc\u00E9dures Administratives;
152;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);;;;PT455H0M0S;Proc\u00E9dures Administratives;
153;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);R\u00E9daction note d'information synth\u00E8tique;;;PT35H0M0S;Proc\u00E9dures Administratives;
154;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Envoi note d'information \u00E0 la DREAL;;;PT0H0M0S;Proc\u00E9dures Administratives;
155;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information du pr\u00E9fet par la DREAL;;;PT35H0M0S;Proc\u00E9dures Administratives;
156;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Rencontre des parties prenantes + synth\u00E8se avis (dur\u00E9e variable);;;PT140H0M0S;Proc\u00E9dures Administratives;
157;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Elaboration DPP (Dossier de Pr\u00E9sentation du projet);;;PT210H0M0S;Proc\u00E9dures Administratives;
158;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Transmission du DPP \u00E0 la DREAL;;;PT0H0M0S;Proc\u00E9dures Administratives;
159;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Accus\u00E9 de r\u00E9ception DREAL;;;PT140H0M0S;Proc\u00E9dures Administratives;
160;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);RISQUE : Remise en cause du DPP;;;PT0H0M0S;Risques;
161;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information des parties prenantes;;;PT105H0M0S;Proc\u00E9dures Administratives;
162;Proc\u00E9dures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information par RTE du FMI/EMI retenu \u00E0 la DREAL;;;PT0H0M0S;Proc\u00E9dures Administratives;
163;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);;;;PT805H0M0S;Proc\u00E9dures Administratives;
164;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);R\u00E9daction note d'information synth\u00E8tique;;;PT35H0M0S;Proc\u00E9dures Administratives;
165;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Envoi note d'information \u00E0 la DREAL;;;PT0H0M0S;Proc\u00E9dures Administratives;
166;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Information du pr\u00E9fet par la DREAL;;;PT35H0M0S;Proc\u00E9dures Administratives;
167;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Rencontre des parties prenantes + synth\u00E8se avis (dur\u00E9e variable);;;PT140H0M0S;Proc\u00E9dures Administratives;
168;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Elaboratoin DPP (Dossier de Pr\u00E9sentation du Projet) V1;;;PT140H0M0S;Proc\u00E9dures Administratives;
169;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Envoi du DPP V1;;;PT0H0M0S;Proc\u00E9dures Administratives;
170;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);lag - Validation dossier par le pr\u00E9fet;;;PT140H0M0S;Proc\u00E9dures Administratives;
171;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Concertation ou consultation;;;PT280H0M0S;Proc\u00E9dures Administratives;
172;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);Validation du FMI/EMI;;;PT0H0M0S;Proc\u00E9dures Administratives;
173;Proc\u00E9dures administratives;Concertation FERRACCI;Projet interm\u00E9diaire (S3rENR, raccordement, LS>3km, LA>1km ou avec DUP);"Signature du FMI/EMI par le pr\u00E9fet ""dans les meilleurs d\u00E9lais""";;;PT35H0M0S;Proc\u00E9dures Administratives;
174;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);;;;PT1309H0M0S;Proc\u00E9dures Administratives;
175;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);R\u00E9daction note d'information synth\u00E8tique;;;PT35H0M0S;Proc\u00E9dures Administratives;
176;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi note d'information \u00E0 la DGEC;;;PT0H0M0S;Proc\u00E9dures Administratives;
177;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Information du pr\u00E9fet/ministre (?) par la DGEC;;;PT35H0M0S;Proc\u00E9dures Administratives;
178;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Rencontre des parties prenantes + synth\u00E8se avis (Dur\u00E9e variable);;;PT280H0M0S;Proc\u00E9dures Administratives;
179;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Elaboration DPP (Dossier de Pr\u00E9sentation du Projet) V0 (=DPPAE);;;PT140H0M0S;Proc\u00E9dures Administratives;
180;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi du DPP V0;;;PT0H0M0S;Proc\u00E9dures Administratives;
181;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);lag - Validation dossier par le ministre;;;PT140H0M0S;Proc\u00E9dures Administratives;
182;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;;;PT574H0M0S;Proc\u00E9dures Administratives;
183;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation - Pr\u00E9paration IC1;;;PT140H0M0S;Proc\u00E9dures Administratives;
184;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation - Instance de concertation 1;;;PT7H0M0S;Proc\u00E9dures Administratives;
185;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation CNDP;;;PT140H0M0S;Proc\u00E9dures Administratives;
186;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation - Elaboration DPP (Dossier de Pr\u00E9sentation du Projet) V1;;;PT140H0M0S;Proc\u00E9dures Administratives;
187;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation - Pr\u00E9paration IC2;;;PT140H0M0S;Proc\u00E9dures Administratives;
188;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation - Instance de concertation 2;;;PT7H0M0S;Proc\u00E9dures Administratives;
189;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Bilan et proposition FMI/EMI par le pr\u00E9fet;;;PT35H0M0S;Proc\u00E9dures Administratives;
190;Proc\u00E9dures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Validation du FMI/EMI par le ministre;;;PT70H0M0S;Proc\u00E9dures Administratives;
191;Proc\u00E9dures administratives;Concertation FERRACCI;Validation du FMI/EMI;;;;PT0H0M0S;Proc\u00E9dures Administratives;
192;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);;;;;PT3164H0M0S;Proc\u00E9dures Administratives;
193;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Examen au cas par cas (LA<15km ou <90kV, et postes) (!! Peut d\u00E9boucher sur une demande d'AE);;;;PT840H0M0S;Proc\u00E9dures Administratives;
194;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Examen au cas par cas (LA<15km ou <90kV, et postes) (!! Peut d\u00E9boucher sur une demande d'AE);Cas par cas - Etudes et pr\u00E9paration;;;PT560H0M0S;Proc\u00E9dures Administratives;
195;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Examen au cas par cas (LA<15km ou <90kV, et postes) (!! Peut d\u00E9boucher sur une demande d'AE);Cas par cas - Soumission du formulaire;;;PT0H0M0S;Proc\u00E9dures Administratives;
196;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Examen au cas par cas (LA<15km ou <90kV, et postes) (!! Peut d\u00E9boucher sur une demande d'AE);Cas par cas - R\u00E9ponse de l'autorit\u00E9 environnementale (!! Peut d\u00E9boucher sur une demande d'AE);;;PT280H0M0S;Proc\u00E9dures Administratives;
197;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 sans Etude d'Impact;;;;PT588H0M0S;Proc\u00E9dures Administratives;
198;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 sans Etude d'Impact;Etude d'incidence environnementale;;;PT147H0M0S;Proc\u00E9dures Administratives;
199;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 sans Etude d'Impact;D\u00E9p\u00F4t du dossier de DUP+AE;;;PT0H0M0S;Proc\u00E9dures Administratives;
200;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 sans Etude d'Impact;Consultation art. L.181-10-1;;;PT441H0M0S;Proc\u00E9dures Administratives;
201;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;;;;PT2429H0M0S;Proc\u00E9dures Administratives;
202;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;Etude 4 saisons;;;PT1400H0M0S;Proc\u00E9dures Administratives;
203;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;Etude d'impact;;;PT588H0M0S;Proc\u00E9dures Administratives;
204;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;D\u00E9p\u00F4t du dossier de DUP+AE;;;PT0H0M0S;Proc\u00E9dures Administratives;
205;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;Avis de l'Autorit\u00E9 environnementale;;;PT294H0M0S;Proc\u00E9dures Administratives;
206;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP et AE synchronis\u00E9 avec Etude d'Impact;Enqu\u00EAte publique unique art. L123-6;;;PT147H0M0S;Proc\u00E9dures Administratives;
207;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;;;;PT588H0M0S;Proc\u00E9dures Administratives;
208;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;D\u00E9p\u00F4t du dossier de DUP;;;PT0H0M0S;Proc\u00E9dures Administratives;
209;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;Consultation du public en mairie art. L.323-3 Ou Enqu\u00EAte public art. L.110-1 si expro;;;PT105H0M0S;Proc\u00E9dures Administratives;
210;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;Etude d'incidence environnementale;;;PT147H0M0S;Proc\u00E9dures Administratives;
211;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;D\u00E9p\u00F4t du dossier d'Autorisation Environnementale;;;PT0H0M0S;Proc\u00E9dures Administratives;
212;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 sans Etude d'Impact;Consultation art. L.181-10-1;;;PT441H0M0S;Proc\u00E9dures Administratives;
213;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;;;;PT3164H0M0S;Proc\u00E9dures Administratives;
214;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Etude 4 saisons;;;PT1400H0M0S;Proc\u00E9dures Administratives;
215;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Etude d'impact;;;PT588H0M0S;Proc\u00E9dures Administratives;
216;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;D\u00E9p\u00F4t du dossier de DUP;;;PT0H0M0S;Proc\u00E9dures Administratives;
217;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Avis de l'Autorit\u00E9 environnementale;;;PT294H0M0S;Proc\u00E9dures Administratives;
218;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Enqu\u00EAte publique unique art. L123-2;;;PT147H0M0S;Proc\u00E9dures Administratives;
219;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si actualisation de l'Etude d'Impact;;;PT735H0M0S;Proc\u00E9dures Administratives;
220;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si actualisation de l'Etude d'Impact - Actualisation de l'Etude d'Impact;;;PT294H0M0S;Proc\u00E9dures Administratives;
221;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si actualisation de l'Etude d'Impact - D\u00E9p\u00F4t du dossier d'Autorisation Environnementale;;;PT0H0M0S;Proc\u00E9dures Administratives;
222;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si actualisation de l'Etude d'Impact - Nouvel avis de l'Autorit\u00E9 Environnementale;;;PT294H0M0S;Proc\u00E9dures Administratives;
223;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si actualisation de l'Etude d'Impact - PPVE art. L.123-19;;;PT147H0M0S;Proc\u00E9dures Administratives;
224;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si pas d'actualisation de l'\u00E9tude d'impact;;;PT441H0M0S;Proc\u00E9dures Administratives;
225;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si pas d'actualisation de l'\u00E9tude d'impact - D\u00E9p\u00F4t du dossier d'Autorisation Environnementale;;;PT0H0M0S;Proc\u00E9dures Administratives;
226;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);DUP puis AE d\u00E9synchronis\u00E9 avec Etude d'Impact;Si pas d'actualisation de l'\u00E9tude d'impact - Consultation art. L.181-10-1;;;PT441H0M0S;Proc\u00E9dures Administratives;
227;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;;;;PT693H0M0S;Proc\u00E9dures Administratives;
228;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;Etude d'incidence environnementale;;;PT147H0M0S;Proc\u00E9dures Administratives;
229;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;D\u00E9p\u00F4t du dossier d'Autorisation Environnementale;;;PT0H0M0S;Proc\u00E9dures Administratives;
230;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;Consultation art. L.181-10-1;;;PT441H0M0S;Proc\u00E9dures Administratives;
231;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;D\u00E9p\u00F4t du dossier de DUP;;;PT0H0M0S;Proc\u00E9dures Administratives;
232;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 sans Etude d'impact;Consultation du public en mairie art. L.323-3 Ou Enqu\u00EAte public art. L.110-1 si expro;;;PT105H0M0S;Proc\u00E9dures Administratives;
233;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;;;;PT3164H0M0S;Proc\u00E9dures Administratives;
234;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Etude 4 saisons;;;PT1400H0M0S;Proc\u00E9dures Administratives;
235;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Etude d'impact;;;PT588H0M0S;Proc\u00E9dures Administratives;
236;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;D\u00E9p\u00F4t du dossier d'Autorisation Environnementale;;;PT0H0M0S;Proc\u00E9dures Administratives;
237;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Consultation art. L.181-10-1 (+Avis AE);;;PT441H0M0S;Proc\u00E9dures Administratives;
238;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si actualisation de l'Etude d'Impact;;;PT735H0M0S;Proc\u00E9dures Administratives;
239;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si actualisation de l'Etude d'Impact - Actualisation de l'Etude d'Impact;;;PT294H0M0S;Proc\u00E9dures Administratives;
240;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si actualisation de l'Etude d'Impact - D\u00E9p\u00F4t du dossier de DUP;;;PT0H0M0S;Proc\u00E9dures Administratives;
241;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si actualisation de l'Etude d'Impact - Nouvel avis de l'Autorit\u00E9 Environnementale;;;PT294H0M0S;Proc\u00E9dures Administratives;
242;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si actualisation de l'Etude d'Impact - PPVE art. L.123-19;;;PT147H0M0S;Proc\u00E9dures Administratives;
243;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si pas d'actualisation de l'\u00E9tude d'impact;;;PT441H0M0S;Proc\u00E9dures Administratives;
244;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si pas d'actualisation de l'\u00E9tude d'impact - D\u00E9p\u00F4t du dossier de DUP;;;PT0H0M0S;Proc\u00E9dures Administratives;
245;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);AE puis DUP d\u00E9synchronis\u00E9 avec Etude d'impact;Si pas d'actualisation de l'\u00E9tude d'impact - Consultation du public en mairie art. L.323-3;;;PT441H0M0S;Proc\u00E9dures Administratives;
246;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Obtention DUP;;;;PT0H0M0S;Proc\u00E9dures Administratives;
247;Proc\u00E9dures administratives;DUP (D\u00E9claration d'Utilit\u00E9 Publique) et AE (Autorisation Environnementale);Obtention AE;;;;PT0H0M0S;Proc\u00E9dures Administratives;
248;Proc\u00E9dures administratives;Conventionnement LS;;;;;PT1169H0M0S;Proc\u00E9dures Administratives;
249;Proc\u00E9dures administratives;Conventionnement LS;"Conventionnement LS - Sollicitation de l'entreprise titulaire du march\u00E9 ""\u00E9tudes liaisons""";;;;PT210H0M0S;Proc\u00E9dures Administratives;
250;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Trac\u00E9 de d\u00E9tail et identification des propri\u00E9taires;;;;PT70H0M0S;Proc\u00E9dures Administratives;
251;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Recensement et identification des propri\u00E9taires;;;;PT0H0M0S;Proc\u00E9dures Administratives;
252;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Recherche via infoter;;;;PT49H0M0S;Proc\u00E9dures Administratives;
253;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Sollicitations externes (notaires, imp\u00F4ts,\u0085);;;;PT140H0M0S;Proc\u00E9dures Administratives;
254;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Rencontres physiques;;;;PT420H0M0S;Proc\u00E9dures Administratives;
255;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Envoi LRAR des conventions pour signature ou d\u00E9placement;;;;PT560H0M0S;Proc\u00E9dures Administratives;
256;Proc\u00E9dures administratives;Conventionnement LS;Conventionnement LS - Autorisation d'exercer les servitudes;;;;PT0H0M0S;Proc\u00E9dures Administratives;
257;Proc\u00E9dures administratives;Conventionnement LA;;;;;PT1540H0M0S;Proc\u00E9dures Administratives;
258;Proc\u00E9dures administratives;Conventionnement LA;Conventionnement LA - Visite terrain pour d\u00E9finir l'implantation projet\u00E9e;;;;PT700H0M0S;Proc\u00E9dures Administratives;
259;Proc\u00E9dures administratives;Conventionnement LA;Conventionnement LA - Obtention des avis favorables;;;;PT700H0M0S;Proc\u00E9dures Administratives;
260;Proc\u00E9dures administratives;Conventionnement LA;Conventionnement LA - Conventionnement;;;;PT700H0M0S;Proc\u00E9dures Administratives;
261;Proc\u00E9dures administratives;RISQUE - Mise en servitude;;;;;PT504H0M0S;Proc\u00E9dures Administratives;
262;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - D\u00E9p\u00F4t de la requ\u00EAte (si d\u00E9saccord);;;;PT0H0M0S;Proc\u00E9dures Administratives;
263;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Prescription enqu\u00EAte et d\u00E9signation commissaire enqu\u00EAteur;;;;PT105H0M0S;Proc\u00E9dures Administratives;
264;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Notification de l'arr\u00EAt\u00E9 et transmission aux maires;;;;PT105H0M0S;Proc\u00E9dures Administratives;
265;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Annonce de l'ouverture de l'enqu\u00EAte (affichage);;;;PT21H0M0S;Proc\u00E9dures Administratives;
266;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Enqu\u00EAte parcellaire;;;;PT56H0M0S;Proc\u00E9dures Administratives;
267;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Cl\u00F4ture, signature registre (maires) et transmission au CE;;;;PT7H0M0S;Proc\u00E9dures Administratives;
268;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Avis CE, proc\u00E8s verbal et transmission au pr\u00E9fet;;;;PT21H0M0S;Proc\u00E9dures Administratives;
269;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Transmission du pr\u00E9fet vers le p\u00E9titionnaire;;;;PT35H0M0S;Proc\u00E9dures Administratives;
270;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Observation RTE et modification possible du projet;;;;PT49H0M0S;Proc\u00E9dures Administratives;
271;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Etablissement des servitudes et notifications;;;;PT105H0M0S;Proc\u00E9dures Administratives;
272;Proc\u00E9dures administratives;RISQUE - Mise en servitude;MeServitude - Arr\u00EAt\u00E9 de servitude (a relier au d\u00E9but des travaux concern\u00E9s par la DUP);;;;PT0H0M0S;Proc\u00E9dures Administratives;
273;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);;;;;PT665H0M0S;Proc\u00E9dures Administratives;
274;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Disponibilit\u00E9 des \u00E9tudes de d\u00E9tail LA;;;;PT0H0M0S;Proc\u00E9dures Administratives;
275;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Dossier de demande d'APO;;;;PT280H0M0S;Proc\u00E9dures Administratives;
276;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Envoi du dossier \u00E0 la DREAL;;;;PT0H0M0S;Proc\u00E9dures Administratives;
277;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Consultation des maires et gestionnaires de DP;;;;PT70H0M0S;Proc\u00E9dures Administratives;
278;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Avis des maires et gestionnaires;;;;PT140H0M0S;Proc\u00E9dures Administratives;
279;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - R\u00E9ponse RTE aux avis;;;;PT140H0M0S;Proc\u00E9dures Administratives;
280;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - Transmission au pr\u00E9fet;;;;PT35H0M0S;Proc\u00E9dures Administratives;
281;Proc\u00E9dures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);APO - D\u00E9livrance de l'APO;;;;PT0H0M0S;Proc\u00E9dures Administratives;
282;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);;;;;PT630H0M0S;Proc\u00E9dures Administratives;
283;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);CMG - Disponibilit\u00E9 des \u00E9tudes de d\u00E9tail LS et Postes;;;;PT0H0M0S;Proc\u00E9dures Administratives;
284;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);CMG - Dossier de CMG directe par RTE;;;;PT280H0M0S;Proc\u00E9dures Administratives;
285;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);CMG - CMG des maires et gestionnaires de DP et services publics;;;;PT70H0M0S;Proc\u00E9dures Administratives;
286;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);CMG - Avis des maires et gestionnaires de DP et services publics;;;;PT140H0M0S;Proc\u00E9dures Administratives;
287;Proc\u00E9dures administratives;Consultation des maires et gestionnaires par RTE (LS et Postes);CMG - R\u00E9ponse de RTE aux avis;;;;PT140H0M0S;Proc\u00E9dures Administratives;
288;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);;;;;PT735H0M0S;Proc\u00E9dures Administratives;
289;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Disponibilit\u00E9 des \u00E9tudes de d\u00E9tail Postes;;;;PT0H0M0S;Proc\u00E9dures Administratives;
290;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Dossier de demande de PC;;;;PT280H0M0S;Proc\u00E9dures Administratives;
291;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - D\u00E9p\u00F4t du dossier;;;;PT0H0M0S;Proc\u00E9dures Administratives;
292;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Instruction par la DDT;;;;PT140H0M0S;Proc\u00E9dures Administratives;
293;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Consultation des maires et autres;;;;PT140H0M0S;Proc\u00E9dures Administratives;
294;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Avis des maires et autres;;;;PT140H0M0S;Proc\u00E9dures Administratives;
295;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - Transmission du PC au pr\u00E9fet (DDT);;;;PT35H0M0S;Proc\u00E9dures Administratives;
296;Proc\u00E9dures administratives;PC (Permis de Construire) (Postes);PC - D\u00E9livrance du permis de construire;;;;PT0H0M0S;Proc\u00E9dures Administratives;
297;Etudes;;;;;;PT4025H0M0S;Etudes;
298;Etudes;Etudes pr\u00E9liminaires;;;;;PT280H0M0S;Etudes;
299;Etudes;Etudes pr\u00E9liminaires;R\u00E9daction Note d'Organisation Projet et strat\u00E9gie achats;;;;PT280H0M0S;Etudes;Projet
300;Etudes;Etudes pr\u00E9liminaires;Etudes sur la consistance de la solution retenue;;;;PT280H0M0S;Etudes;
301;Etudes;Etudes pr\u00E9liminaires;Etudes sur la consistance de la solution retenue;Etudes pr\u00E9liminaires postes;;;PT280H0M0S;Etudes;Poste
302;Etudes;Etudes pr\u00E9liminaires;Etudes sur la consistance de la solution retenue;Etudes pr\u00E9liminaires BT/telecom;;;PT280H0M0S;Etudes;BT
303;Etudes;Etudes pr\u00E9liminaires;Etudes sur la consistance de la solution retenue;Etudes pr\u00E9liminaires LA;;;PT280H0M0S;Etudes;LA
304;Etudes;Etudes pr\u00E9liminaires;Etudes sur la consistance de la solution retenue;Etudes pr\u00E9liminaires LS;;;PT280H0M0S;Etudes;LS
305;Etudes;Etudes d\u00E9taill\u00E9es;;;;;PT3003H0M0S;Etudes;
306;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;;;;PT2765H0M0S;Etudes;
307;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes Hors March\u00E9 Cadre;;;PT364H0M0S;Etudes;
308;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes Hors March\u00E9 Cadre - CCTP;;;PT70H0M0S;Etudes;Poste
309;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes Hors March\u00E9 Cadre - Consultation;;;PT14H0M0S;Achats;Poste
310;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes Hors March\u00E9 Cadre - Commande;;;PT0H0M0S;Achats;Poste
311;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes Hors March\u00E9 Cadre - Livrable \u00E9tude;;;PT280H0M0S;Etudes;Poste
312;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol;;;PT2597H0M0S;Etudes;
313;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - CCTP;;;PT70H0M0S;Etudes;Poste
314;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Processus Achat ;;;PT70H0M0S;Etudes;
315;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Processus Achat  - Consultation;;;PT70H0M0S;Achats;Poste
316;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Processus Achat - Commande;;;PT0H0M0S;Achats;Poste
317;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes;;;PT2457H0M0S;Etudes;
318;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes - Intervention sur site;;;PT315H0M0S;Etudes;Poste
319;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes - Livrables \u00E9tudes hydro-g\u00E9otechniques;;;PT140H0M0S;Etudes;Poste
320;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes - Livrable \u00E9tudes G1-G2AVP;;;PT420H0M0S;Etudes;Poste
321;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes -  Livrable \u00E9tudes DCE;;;PT140H0M0S;Etudes;Poste
322;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes de sol - Etudes - Livrable \u00E9tudes G4 (MCPO);;;PT70H0M0S;Etudes;Poste
323;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM;;;PT2058H0M0S;Etudes;Poste
324;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Demande de r\u00E9alisation du March\u00E9;;;PT7H0M0S;Etudes;Poste
325;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Envoi du CDP au CNER;;;PT140H0M0S;Etudes;Poste
326;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Validation du CDP par CNER;;;PT70H0M0S;Etudes;Poste
327;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat;;;PT483H0M0S;Achats;Poste
328;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat - R\u00E9daction et validation de la NSPA strat\u00E9gie;;;PT98H0M0S;Achats;Poste
329;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat - Consultation;;;PT147H0M0S;Achats;Poste
330;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat - N\u00E9gociation;;;PT147H0M0S;Achats;Poste
331;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat - R\u00E9daction et validation de la NSPA attribution;;;PT49H0M0S;Achats;Poste
332;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Processus achat - Envoi de la commande d'\u00E9tudes au fournisseur;;;PT42H0M0S;Achats;Poste
333;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Etudes;;;PT1358H0M0S;Etudes;Poste
334;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Etudes - R\u00E9alisation plan guide GC;;;PT280H0M0S;Etudes;Poste
335;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Etudes - R\u00E9alisation des \u00E9tudes;;;PT980H0M0S;Etudes;Poste
336;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;March\u00E9 PSEM - Etudes - Valildation des \u00E9tudes;;;PT98H0M0S;Etudes;Poste
337;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;Etudes MOE (architecte);;;PT1785H0M0S;Etudes;
338;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - CCTP;;;PT140H0M0S;Etudes;Poste
339;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Processus achat;;;PT385H0M0S;Etudes;
340;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Processus achat - Consultation;;;PT280H0M0S;Achats;Poste
341;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Processus achat - Attribution;;;PT105H0M0S;Achats;Poste
342;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Etudes;;;PT1260H0M0S;Etudes;
343;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Etudes - Livrables APS;;;PT420H0M0S;Etudes;Poste
344;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Etudes - Livrables APD;;;PT630H0M0S;Etudes;Poste
345;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MOE - Etudes - Livrables DCE;;;PT210H0M0S;Etudes;Poste
346;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO;;;PT2597H0M0S;Etudes;
347;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - CCTP;;;PT280H0M0S;Etudes;Poste
348;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat;;;PT630H0M0S;Achats;Poste
349;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat - Demande attribution entreprise;;;PT35H0M0S;Achats;Poste
350;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat - Remise du CCTP au GIE + visite terrain;;;PT140H0M0S;Achats;Poste
351;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat - Chiffrage march\u00E9 poste;;;PT105H0M0S;Achats;Poste
352;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat - Remise des prix et n\u00E9gociation;;;PT70H0M0S;Achats;Poste
353;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Processus achat - Commande marche MCPO + commande travaux sous condition CR;;;PT35H0M0S;Achats;Poste
354;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes;;;PT1967H0M0S;Etudes;
355;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes - lag - D\u00E9lai entre signature de la commande et r\u00E9union de lancement;;;PT70H0M0S;;
356;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes - R\u00E9union de lancement des \u00E9tudes;;;PT7H0M0S;Etudes;Poste
357;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes - livrable V1;;;PT840H0M0S;Etudes;Poste
358;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes - livrable V2;;;PT700H0M0S;Etudes;Poste
359;Etudes;Etudes d\u00E9taill\u00E9es;Etudes Postes;MCPO - Etudes - livraison DTT;;;PT70H0M0S;Achats;Poste
360;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;;;;PT3003H0M0S;Etudes;
361;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA;;;PT3003H0M0S;Etudes;
362;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - R\u00E9daction du CCTP;;;PT140H0M0S;Etudes;LA
363;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat;;;PT1666H0M0S;Achats;
364;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat - Fiche attribution;;;PT7H0M0S;Etudes;
365;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat - Envoi consultation;;;PT7H0M0S;Achats;
366;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat - Remise de l'offre;;;PT140H0M0S;Achats;LA
367;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat - N\u00E9gociation;;;PT70H0M0S;Achats;
368;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Proc\u00E9dure achat - Signature de la NAC et de la commande;;;PT0H0M0S;Achats;LA
369;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Etudes;;;PT1337H0M0S;Etudes;
370;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Etudes - lag - D\u00E9lai entre signature commande et r\u00E9union de lancement;;;PT70H0M0S;;
371;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Etudes - R\u00E9union de lancement des \u00E9tudes;;;PT7H0M0S;Etudes;LS
372;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Etudes - Etudes V1;;;PT560H0M0S;Etudes;LA
373;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LA;MCEL LA - Etudes - Etudes V2;;;PT700H0M0S;Etudes;LA
374;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;;;;PT2793H0M0S;Etudes;
375;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;;;PT2758H0M0S;Etudes;
376;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - R\u00E9daction du CCTP;;PT140H0M0S;Etudes;LS
377;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT1701H0M0S;Achats;LS
378;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT0H0M0S;Achats;LS
379;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT175H0M0S;Achats;LS
380;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT7H0M0S;Achats;LS
381;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT35H0M0S;Achats;LS
382;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT35H0M0S;Achats;LS
383;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Processus achat;;PT0H0M0S;Achats;LS
384;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Etudes;;PT1057H0M0S;Etudes;LS
385;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Etudes;;PT70H0M0S;;
386;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Etudes;;PT7H0M0S;Etudes;LS
387;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Etudes;;PT560H0M0S;Etudes;LS
388;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;MCEL LS;MCEL LS - Etudes;;PT420H0M0S;Etudes;LS
389;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;;;PT1484H0M0S;Etudes;LS
390;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - R\u00E9daction du CCTP;;PT154H0M0S;Etudes;LS
391;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Processus achat;;PT203H0M0S;Achats;LS
392;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Processus achat - Consultation;;PT98H0M0S;Achats;LS
393;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Processus achat - Analyse et contractualisation;;PT105H0M0S;Achats;LS
394;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes;;PT1127H0M0S;Etudes;LS
395;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes - lag - D\u00E9lai entre signature et r\u00E9union de lancement;;PT140H0M0S;;
396;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes - R\u00E9union de lancement des \u00E9tudes;;PT0H0M0S;Etudes;LS
397;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes - Etudes pr\u00E9liminaires G1;;PT280H0M0S;Etudes;LS
398;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes - Etudes avant-projet G2;;PT175H0M0S;Etudes;LS
399;Etudes;Etudes d\u00E9taill\u00E9es;Etudes LS;Etudes PSO;PSO - Etudes - Etudes projet;;PT280H0M0S;Etudes;LS
400;Achats;;;;;;PT7896H0M0S;Achats;
401;Achats;Consultations march\u00E9s travaux;;;;;PT1925H0M0S;Achats;
402;Achats;Consultations march\u00E9s travaux;Consultations Poste;;;;PT1820H0M0S;Achats;
403;Achats;Consultations march\u00E9s travaux;Consultations Poste;Plateforme;;;PT1820H0M0S;Achats;
404;Achats;Consultations march\u00E9s travaux;Consultations Poste;Plateforme - CCTP;;;PT70H0M0S;Achats;Poste
405;Achats;Consultations march\u00E9s travaux;Consultations Poste;Plateforme - Consultation;;;PT280H0M0S;Achats;Poste
406;Achats;Consultations march\u00E9s travaux;Consultations Poste;Plateforme - N\u00E9gociation;;;PT140H0M0S;Achats;Poste
407;Achats;Consultations march\u00E9s travaux;Consultations Poste;Plateforme - Commande;;;PT0H0M0S;Achats;Poste
408;Achats;Consultations march\u00E9s travaux;Consultations Poste;B\u00E2timent;;;PT1652H0M0S;Achats;
409;Achats;Consultations march\u00E9s travaux;Consultations Poste;B\u00E2timent - CCTP;;;PT70H0M0S;Achats;Poste
410;Achats;Consultations march\u00E9s travaux;Consultations Poste;B\u00E2timent - Consultation;;;PT280H0M0S;Achats;Poste
411;Achats;Consultations march\u00E9s travaux;Consultations Poste;B\u00E2timent - N\u00E9gociation;;;PT140H0M0S;Achats;Poste
412;Achats;Consultations march\u00E9s travaux;Consultations Poste;B\u00E2timent - Commande;;;PT0H0M0S;Achats;Poste
413;Achats;Consultations march\u00E9s travaux;Consultation LA;;;;PT1414H0M0S;Achats;
414;Achats;Consultations march\u00E9s travaux;Consultation LA;MCFS;;;PT1414H0M0S;Achats;
415;Achats;Consultations march\u00E9s travaux;Consultation LA;MCFS - CCTP;;;PT70H0M0S;Achats;LA
416;Achats;Consultations march\u00E9s travaux;Consultation LA;MCFS - Consultation;;;PT280H0M0S;Achats;LA
417;Achats;Consultations march\u00E9s travaux;Consultation LA;MCFS - N\u00E9gociations;;;PT140H0M0S;Achats;LA
418;Achats;Consultations march\u00E9s travaux;Consultation LA;MCFS - Commande;;;PT0H0M0S;Achats;LA
419;Achats;Consultations march\u00E9s travaux;Consultation LA;MCLA;;;PT1414H0M0S;Achats;
420;Achats;Consultations march\u00E9s travaux;Consultation LA;MCLA - CCTP;;;PT70H0M0S;Achats;LA
421;Achats;Consultations march\u00E9s travaux;Consultation LA;MCLA - Consultation;;;PT280H0M0S;Achats;LA
422;Achats;Consultations march\u00E9s travaux;Consultation LA;MCLA - N\u00E9gociation;;;PT140H0M0S;Achats;LA
423;Achats;Consultations march\u00E9s travaux;Consultation LA;MCLA - Commande;;;PT0H0M0S;Achats;LA
424;Achats;Consultations march\u00E9s travaux;Consultations LS;;;;PT1764H0M0S;Achats;
425;Achats;Consultations march\u00E9s travaux;Consultations LS;MCLS;;;PT1659H0M0S;Achats;
426;Achats;Consultations march\u00E9s travaux;Consultations LS;MCLS - CCTP;;;PT70H0M0S;Achats;LS
427;Achats;Consultations march\u00E9s travaux;Consultations LS;MCLS - Consultation;;;PT280H0M0S;Achats;LS
428;Achats;Consultations march\u00E9s travaux;Consultations LS;MCLS - N\u00E9gociation;;;PT140H0M0S;Achats;LS
429;Achats;Consultations march\u00E9s travaux;Consultations LS;MCLS - Commande;;;PT0H0M0S;Achats;LS
430;Achats;Consultations march\u00E9s travaux;Consultations LS;FMLS;;;PT1764H0M0S;Achats;
431;Achats;Consultations march\u00E9s travaux;Consultations LS;FMLS - CCTP;;;PT105H0M0S;Achats;
432;Achats;Consultations march\u00E9s travaux;Consultations LS;FMLS - consultation;;;PT105H0M0S;Achats;
433;Achats;Consultations march\u00E9s travaux;Consultations LS;FMLS - n\u00E9gociation;;;PT7H0M0S;Achats;
434;Achats;Consultations march\u00E9s travaux;Consultations LS;FMLS - R\u00E9daction commande + signature;;;PT105H0M0S;Achats;
435;Achats;Consultations march\u00E9s travaux;Consultations LS;March\u00E9 PSO;;;PT1694H0M0S;Achats;
436;Achats;Consultations march\u00E9s travaux;Consultations LS;March\u00E9 PSO - CCTP;;;PT35H0M0S;Achats;LS
437;Achats;Consultations march\u00E9s travaux;Consultations LS;March\u00E9 PSO - Consultation;;;PT175H0M0S;Achats;LS
438;Achats;Consultations march\u00E9s travaux;Consultations LS;March\u00E9 PSO - N\u00E9gociation;;;PT35H0M0S;Achats;LS
439;Achats;Consultations march\u00E9s travaux;Consultations LS;March\u00E9 PSO - R\u00E9daction commande travaux + signature;;;PT70H0M0S;Achats;LS
440;Achats;Consultations march\u00E9s travaux;Ensemble des BPU disponibles;;;;PT0H0M0S;Achats;Projet
441;Achats;Commandes fournitures;;;;;PT7896H0M0S;Achats;
442;Achats;Commandes fournitures;Fournitures Poste;;;;PT7896H0M0S;Achats;
443;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur;;;PT7336H0M0S;Achats;
444;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
445;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT7056H0M0S;;
446;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur - Engagement fournisseur (Besoin mandat!);;;PT0H0M0S;Achats;Poste
447;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT6174H0M0S;;
448;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur - EB;;;PT0H0M0S;Achats;Poste
449;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT5586H0M0S;;
450;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur - MADU;;;PT0H0M0S;Achats;Poste
451;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT280H0M0S;;
452;Achats;Commandes fournitures;Fournitures Poste;Poste - Transformateur - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
453;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile;;;PT7196H0M0S;Achats;
454;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
455;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT7056H0M0S;;
456;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile - Engagement fournisseur (Besoin mandat!);;;PT0H0M0S;Achats;Poste
457;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT6174H0M0S;;
458;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile - EB;;;PT0H0M0S;Achats;Poste
459;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT5586H0M0S;;
460;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile - MADU;;;PT0H0M0S;Achats;Poste
461;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT140H0M0S;;
462;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS huile - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
463;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che;;;PT7196H0M0S;Achats;
464;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
465;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT7056H0M0S;;
466;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che - Engagement fournisseur (Besoin mandat!);;;PT0H0M0S;Achats;Poste
467;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT6174H0M0S;;
468;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che - EB;;;PT0H0M0S;Achats;Poste
469;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT5880H0M0S;;
470;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che - MADU;;;PT0H0M0S;Achats;Poste
471;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT140H0M0S;;
472;Achats;Commandes fournitures;Fournitures Poste;Poste - BIS s\u00E8che - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
473;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400;;;PT3668H0M0S;Achats;
474;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400 - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
475;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT3528H0M0S;;
476;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400 - Engagement fournisseur;;;PT0H0M0S;Achats;Poste
477;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT2646H0M0S;;
478;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400 - EB;;;PT0H0M0S;Achats;Poste
479;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT1764H0M0S;;
480;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400 - MADU;;;PT0H0M0S;Achats;Poste
481;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT140H0M0S;;
482;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 400 - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
483;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245;;;PT3598H0M0S;Achats;
484;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245 - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
485;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT3528H0M0S;;
486;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245 - Engagement fournisseur;;;PT0H0M0S;Achats;Poste
487;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT2940H0M0S;;
488;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245 - EB;;;PT0H0M0S;Achats;Poste
489;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT1764H0M0S;;
490;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245 - MADU;;;PT0H0M0S;Achats;Poste
491;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT70H0M0S;;
492;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur 245 - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
493;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1;;;PT3598H0M0S;Achats;
494;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1 - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
495;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT3528H0M0S;;
496;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1 - Engagement fournisseur;;;PT0H0M0S;Achats;Poste
497;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT1764H0M0S;;
498;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1 - EB;;;PT0H0M0S;Achats;Poste
499;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT1470H0M0S;;
500;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1 - MADU;;;PT0H0M0S;Achats;Poste
501;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT70H0M0S;;
502;Achats;Commandes fournitures;Fournitures Poste;Poste - Disjoncteur HTB1 - Livraison (relier avec installation lien DF);;;PT0H0M0S;Achats;Poste
503;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT;;;PT2716H0M0S;Achats;
504;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT - Formalisation besoin ATP;;;PT0H0M0S;Achats;Poste
505;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT2646H0M0S;;
506;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT - Engagement fournisseur;;;PT0H0M0S;Achats;Poste
507;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT1764H0M0S;;
508;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT - EB;;;PT0H0M0S;Achats;Poste
509;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de service;;;PT735H0M0S;;
510;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT - MADU;;;PT0H0M0S;Achats;Poste
511;Achats;Commandes fournitures;Fournitures Poste;Lag - D\u00E9lai de livraison;;;PT70H0M0S;;
512;Achats;Commandes fournitures;Fournitures Poste;Poste - C\u00E2bles BT - Livraison;;;PT0H0M0S;Achats;Poste
513;Achats;Commandes fournitures;Fournitures LA;;;;PT7238H0M0S;Achats;
514;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes;;;PT3668H0M0S;Achats;
515;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes - Formalisation besoin ATP;;;PT0H0M0S;Achats;LA
516;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT3528H0M0S;;
517;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes - Engagement fournisseur;;;PT0H0M0S;Achats;LA
518;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT2646H0M0S;;
519;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes - EB;;;PT0H0M0S;Achats;LA
520;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai de service;;;PT1176H0M0S;;
521;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes - MADU;;;PT0H0M0S;Achats;LA
522;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai de livraison;;;PT140H0M0S;;
523;Achats;Commandes fournitures;Fournitures LA;LA - Pyl\u00F4nes - Livraison;;;PT0H0M0S;Achats;LA
524;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles conducteurs et c\u00E2bles de garde;;;PT2716H0M0S;Achats;
525;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles - Formalisation besoin ATP;;;PT0H0M0S;Achats;LA
526;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai entre formalisation ATP et MADU;;;PT2646H0M0S;;
527;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles - Engagement fournisseur;;;PT0H0M0S;Achats;LA
528;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai entre engagement fournisseur et MADU;;;PT1764H0M0S;;
529;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles - EB;;;PT0H0M0S;Achats;LA
530;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai de service;;;PT1470H0M0S;;
531;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles - MADU;;;PT0H0M0S;Achats;LA
532;Achats;Commandes fournitures;Fournitures LA;Lag - D\u00E9lai de livraison;;;PT70H0M0S;;
533;Achats;Commandes fournitures;Fournitures LA;LA - C\u00E2bles - Livraison;;;PT0H0M0S;Achats;LA
534;Achats;Commandes fournitures;Fournitures LS;;;;PT3598H0M0S;Achats;
535;Achats;Commandes fournitures;Fournitures LS;LS - C\u00E2bles de puissance;;;PT3598H0M0S;Achats;
536;Achats;Commandes fournitures;Fournitures LS;LS - C\u00E2bles - Engagement trimestrielle engageante pour besoins MADU;;;PT0H0M0S;Achats;LS
537;Achats;Commandes fournitures;Fournitures LS;Lag - D\u00E9lai entre enqu\u00EAte trimestrielle et MADU;;;PT3528H0M0S;;
538;Achats;Commandes fournitures;Fournitures LS;LS - m\u00E9tr\u00E9 du c\u00E2ble par FMLS;;;PT210H0M0S;Achats;
539;Achats;Commandes fournitures;Fournitures LS;LS - C\u00E2bles - EB;;;PT0H0M0S;Achats;LS
540;Achats;Commandes fournitures;Fournitures LS;Lag - D\u00E9lai de service;;;PT1323H0M0S;;
541;Achats;Commandes fournitures;Fournitures LS;LS - C\u00E2bles - MADU;;;PT0H0M0S;Achats;LS
542;Achats;Commandes fournitures;Fournitures LS;Lag - D\u00E9lai de livraison;;;PT70H0M0S;;
543;Achats;Commandes fournitures;Fournitures LS;LS - C\u00E2bles - Livraison;;;PT0H0M0S;Achats;LS
544;Consignations;;;;;;PT0H0M0S;Consignations;
545;Consignations;Consignation liaison XX-YY / poste;;;;;PT0H0M0S;Consignations;
546;Consignations;Consignation liaison XX-YY / poste;D\u00E9but de consignation (lier en DD avec t\u00E2ches sous consignation, jusqu'\u00E0 validation par planif long terme);;;;PT0H0M0S;Consignations;
547;Consignations;Consignation liaison XX-YY / poste;Fin de consignation;;;;PT0H0M0S;Consignations;
548;Travaux;;;;;;PT5481H0M0S;Travaux;
549;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);;;;;PT4900H0M0S;Travaux;
550;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Ouverture de chantier;;;;PT0H0M0S;Travaux;Poste
551;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - PLATEFORME;;;;PT1960H0M0S;Travaux;
552;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - BI/BR;;;;PT560H0M0S;Travaux;
553;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - BI/BR;Poste - BI/BR - R\u00E9alisation du BI;;;PT560H0M0S;Travaux;Poste
554;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - BI/BR;Poste - BI/BR - R\u00E9alisation du b\u00E2timent UA;;;PT420H0M0S;Travaux;Poste
555;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - BI/BR;Poste - BI/BR - R\u00E9alisation des 4 BR;;;PT420H0M0S;Travaux;Poste
556;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;;;;PT2940H0M0S;Travaux;
557;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN;;;PT2380H0M0S;Travaux;
558;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN - Cloture;;;PT420H0M0S;Travaux;Poste
559;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN - Bassin de r\u00E9tention et drainage;;;PT280H0M0S;Travaux;Poste
560;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN - R\u00E9alisation des fondations sp\u00E9ciales;;;PT560H0M0S;Travaux;Poste
561;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN - RGT;;;PT280H0M0S;Travaux;Poste
562;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX COMMUN - R\u00E9alisation des canivaux BT;;;PT560H0M0S;Travaux;Poste
563;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT;;;PT1260H0M0S;Travaux;
564;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Equipement BI;;;PT140H0M0S;Travaux;Poste
565;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Installation et raccordement des \u00E9quipements UA;;;PT280H0M0S;Travaux;Poste
566;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Installation et raccordement des armoires CC;;;PT210H0M0S;Travaux;Poste
567;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Diff\u00E9rencielle de barres et CC fond de poste;;;PT560H0M0S;Travaux;Poste
568;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Tirage c\u00E2bles;;;PT140H0M0S;Travaux;Poste
569;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX BT - Equipement Telecom;;;PT420H0M0S;Travaux;Poste
570;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;MCPO - TX BT - Equipement des BR et raccordement groupe \u00E9lectrog\u00E8ne;;;PT140H0M0S;Travaux;Poste
571;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT;;;PT1470H0M0S;Travaux;
572;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - Pose des charpentes;;;PT280H0M0S;Travaux;Poste
573;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - R\u00E9alisation du circuit de terre du couplage et c\u00E2bles de garde;;;PT280H0M0S;Travaux;Poste
574;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - Montage des \u00E9quipements HT;;;PT280H0M0S;Travaux;Poste
575;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - Raccordement HT;;;PT280H0M0S;Travaux;Poste
576;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - Raccordement BT;;;PT280H0M0S;Travaux;Poste
577;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - MCPO;Poste - MCPO - TX HT - R\u00E9glages;;;PT70H0M0S;Travaux;Poste
578;Travaux;Travaux Poste (ex nouveau poste a\u00E9rien);Poste - Mise en service du poste;;;;PT0H0M0S;Travaux;Poste
579;Travaux;Travaux LA;;;;;PT5425H0M0S;Travaux;
580;Travaux;Travaux LA;Ouvertude de chantier LA;;;;PT0H0M0S;Travaux;LA
581;Travaux;Travaux LA;LA - Travaux MCFS;;;;PT3430H0M0S;Travaux;
582;Travaux;Travaux LA;LA - Travaux MCFS;LA - MCFS - Installation base-vie;;;PT70H0M0S;Travaux;LA
583;Travaux;Travaux LA;LA - Travaux MCFS;LA - MCFS - Am\u00E9nagement des pistes (150m de pistes et 300 m\u00B2 PF/pyl\u00F4ne, 2j/pyl);;;PT560H0M0S;Travaux;LA
584;Travaux;Travaux LA;LA - Travaux MCFS;LA - MCFS - R\u00E9alisation des fondations (10j/pyl);;;PT2800H0M0S;Travaux;LA
585;Travaux;Travaux LA;LA - Travaux MCLA;;;;PT5390H0M0S;Travaux;
586;Travaux;Travaux LA;LA - Travaux MCLA;LA - MCLA - Installation base-vie;;;PT140H0M0S;Travaux;LA
587;Travaux;Travaux LA;LA - Travaux MCLA;LA - MCLA - Assemblage des pyl\u00F4nes (4T/j, 50T/pyl = 12,5j/pyl);;;PT3500H0M0S;Travaux;LA
588;Travaux;Travaux LA;LA - Travaux MCLA;LA - MCLA - Levage des pyl\u00F4nes (10j/pyl);;;PT2800H0M0S;Travaux;LA
589;Travaux;Travaux LA;LA - Travaux MCLA;LA - MCLA - D\u00E9roulage des c\u00E2bles conducteurs et cdg (20j entre 4 pyl\u00F4nes);;;PT1680H0M0S;Travaux;LA
590;Travaux;Travaux LA;LA - Mise en conduite LA;;;;PT35H0M0S;Travaux;LA
591;Travaux;Travaux LS;;;;;PT3206H0M0S;Travaux;
592;Travaux;Travaux LS;Ouverture de chantier LS;;;;PT0H0M0S;Travaux;LS
593;Travaux;Travaux LS;LS - Installation de base-vie;;;;PT70H0M0S;Travaux;LS
594;Travaux;Travaux LS;MCLS - Genie civil dont PSO;;;;PT1400H0M0S;Travaux;LS
595;Travaux;Travaux LS;MCLS/FMLS - D\u00E9roulage c\u00E2bles et montage jonctions;;;;PT1400H0M0S;Travaux;LS
596;Travaux;Travaux LS;FMLS - Montage extr\u00E9mit\u00E9s;;;;PT210H0M0S;Travaux;LS
597;Travaux;Travaux LS;FMLS - Essais;;;;PT70H0M0S;Travaux;LS
598;Travaux;Travaux LS;DPI travaux - Contr\u00F4le avant r\u00E9ception des travaux LS;;;;PT7H0M0S;Travaux;
599;Travaux;Travaux LS;LS - Mise en conduite LS;;;;PT35H0M0S;Travaux;LS
`;

const libraryTemplates = buildLibraryData(csvData);

export { libraryTemplates };
