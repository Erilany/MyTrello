function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const days = Math.floor(hours / 24);
  return days;
}

const csvData = `N°;Niveau 1;Niveau 2;Niveau 3;Niveau 4;Niveau 5;Niveau 6;Durée;Catégorie;Domaine
5;Jalons;Jalons SIEPR;;;;;PT10955H0M0S;;
6;Jalons;Jalons SIEPR;Jalons projet;;;;PT10955H0M0S;;
7;Jalons;Jalons SIEPR;Jalons projet;Signature de la DO;;;PT0H0M0S;Projet;Projet
8;Jalons;Jalons SIEPR;Jalons projet;Lancement projet;;;PT0H0M0S;Projet;Projet
9;Jalons;Jalons SIEPR;Jalons projet;Signature de la DCT;;;PT0H0M0S;Projet;Projet
10;Jalons;Jalons SIEPR;Jalons projet;Signature de la DI;;;PT0H0M0S;Projet;Projet
11;Jalons;Jalons SIEPR;Jalons projet;PV de fin de concertation;;;PT0H0M0S;Projet;Projet
12;Jalons;Jalons SIEPR;Jalons projet;Dépôt de la DUP;;;PT0H0M0S;Projet;Projet
13;Jalons;Jalons SIEPR;Jalons projet;Signature de la DUP;;;PT0H0M0S;Projet;Projet
14;Jalons;Jalons SIEPR;Jalons projet;Sécurisation du foncier;;;PT0H0M0S;Projet;Projet
15;Jalons;Jalons SIEPR;Jalons projet;Obtention de la dernière autorisation;;;PT0H0M0S;Projet;Projet
16;Jalons;Jalons SIEPR;Jalons projet;Clôture;;;PT0H0M0S;Travaux;Projet
17;Jalons;Jalons SIEPR;Jalons OP poste;;;;PT9779H0M0S;;
18;Jalons;Jalons SIEPR;Jalons OP poste;CTF Poste validée;;;PT0H0M0S;Processus Décisionnel;Poste
19;Jalons;Jalons SIEPR;Jalons OP poste;Commande MCPO;;;PT0H0M0S;;Poste
20;Jalons;Jalons SIEPR;Jalons OP poste;Ouverture de chantier poste;;;PT0H0M0S;Travaux;Poste
21;Jalons;Jalons SIEPR;Jalons OP poste;Première mise en service poste;;;PT0H0M0S;Travaux;Poste
22;Jalons;Jalons SIEPR;Jalons OP poste;Dernière mise en service poste;;;PT0H0M0S;Travaux;Poste
23;Jalons;Jalons SIEPR;Jalons OP poste;Fin des travaux poste;;;PT0H0M0S;Travaux;Poste
24;Jalons;Jalons SIEPR;Jalons OP LA;;;;PT10360H0M0S;;
25;Jalons;Jalons SIEPR;Jalons OP LA;CTF LA validée;;;PT0H0M0S;Processus Décisionnel;LA
26;Jalons;Jalons SIEPR;Jalons OP LA;APO;;;PT0H0M0S;Procédures Administratives;LA
27;Jalons;Jalons SIEPR;Jalons OP LA;Commande études MCEL LA;;;PT0H0M0S;Etudes;LA
28;Jalons;Jalons SIEPR;Jalons OP LA;Commandes travaux MCLA;;;PT0H0M0S;Travaux;LA
29;Jalons;Jalons SIEPR;Jalons OP LA;Ouverture de chantier LA;;;PT0H0M0S;Travaux;LA
30;Jalons;Jalons SIEPR;Jalons OP LA;Première mise en service LA;;;PT0H0M0S;Travaux;LA
31;Jalons;Jalons SIEPR;Jalons OP LA;Dernière mise en service LA;;;PT0H0M0S;Travaux;LA
32;Jalons;Jalons SIEPR;Jalons OP LA;Fin des travaux LA;;;PT0H0M0S;Travaux;LA
33;Jalons;Jalons SIEPR;Jalons OP LS;;;;PT8141H0M0S;;
34;Jalons;Jalons SIEPR;Jalons OP LS;CTF LS validée;;;PT0H0M0S;Processus Décisionnel;LS
35;Jalons;Jalons SIEPR;Jalons OP LS;Commande études MCEL LS;;;PT0H0M0S;Etudes;LS
36;Jalons;Jalons SIEPR;Jalons OP LS;Commandes travaux MCLS;;;PT0H0M0S;Travaux;LS
37;Jalons;Jalons SIEPR;Jalons OP LS;Ouverture de chantier LS;;;PT0H0M0S;Travaux;LS
38;Jalons;Jalons SIEPR;Jalons OP LS;Première mise en service LS;;;PT0H0M0S;Travaux;LS
39;Jalons;Jalons SIEPR;Jalons OP LS;Dernière mise en service LS;;;PT0H0M0S;Travaux;LS
40;Jalons;Jalons SIEPR;Jalons OP LS;Fin des travaux LS;;;PT0H0M0S;Travaux;LS
41;Jalons;Jalons d'interface;;;;;PT0H0M0S;;
42;Jalons;Jalons d'interface;<Nouvelle tâche>;;;;PT0H0M0S;;
43;Processus décisionnels;;;;;;PT5474H0M0S;Processus Décisionnel;
44;Processus décisionnels;Processus DO;;;;;PT35H0M0S;Processus Décisionnel;
45;Processus décisionnels;Processus DO;DO - Validation et signature de la DO (dir D&I);;;;PT0H0M0S;Processus Décisionnel;Projet
46;Processus décisionnels;Processus DO;Nomination du manager de projet;;;;PT0H0M0S;;
47;Processus décisionnels;Processus DCT;;;;;PT1022H0M0S;Processus Décisionnel;
48;Processus décisionnels;Processus DCT;Réalisation CTF;;;;PT700H0M0S;Etudes;
49;Processus décisionnels;Processus DCT;Réalisation CTF;Mise à jour du CCF;;;PT140H0M0S;Etudes;Projet
50;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Postes;;;PT280H0M0S;Etudes;Poste
51;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie BT / telecom Postes et encadrants;;;PT280H0M0S;Etudes;BT
52;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Liaisons aériennes;;;PT280H0M0S;Etudes;LA
53;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Liaisons souterraines;;;PT280H0M0S;Etudes;LS
54;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Concertation/autorisation;;;PT280H0M0S;Etudes;Projet
55;Processus décisionnels;Processus DCT;Réalisation CTF;Finalisation CTF de synthèse;;;PT140H0M0S;Etudes;Projet
56;Processus décisionnels;Processus DCT;Projet < 10 M€ (Facultative);;;;PT35H0M0S;Processus Décisionnel;
57;Processus décisionnels;Processus DCT;Projet < 10 M€ (Facultative);DCT - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;PT35H0M0S;Processus Décisionnel;Projet
58;Processus décisionnels;Processus DCT;Projet < 20 M€;;;;PT252H0M0S;Processus Décisionnel;
59;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - RRR (Revue des Référents Régionaux);;;PT35H0M0S;Processus Décisionnel;Projet
60;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
61;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
62;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
63;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
64;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
65;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
66;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CRP (Comité Régional des Projets);;;PT35H0M0S;Processus Décisionnel;Projet
67;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Validation directeur D&I;;;PT35H0M0S;Processus Décisionnel;Projet
68;Processus décisionnels;Processus DCT;Projet > 20 M€;;;;PT322H0M0S;Processus Décisionnel;
69;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - RRR (Revue des Référents Régionaux);;;PT35H0M0S;Processus Décisionnel;Projet
70;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Point d'arrêt SPC;;;PT0H0M0S;Processus Décisionnel;Projet
71;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
72;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
73;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
74;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
75;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
76;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
77;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CRP Paris;;;PT35H0M0S;Processus Décisionnel;Projet
78;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CNI (Comité National d'Investissement);;;PT35H0M0S;Processus Décisionnel;Projet
79;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Présentation en directoire;;;PT35H0M0S;Processus Décisionnel;Projet
80;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Délibération directoire;;;PT35H0M0S;Processus Décisionnel;Projet
81;Processus décisionnels;Processus DCT;DCT - Validation et signature de la DCT;;;;PT0H0M0S;Processus Décisionnel;Projet
82;Processus décisionnels;Processus DI;;;;;PT1414H0M0S;Processus Décisionnel;
83;Processus décisionnels;Processus DI;APD;;;;PT175H0M0S;Etudes;Projet
84;Processus décisionnels;Processus DI;APD;APD - Finalisation du dossier;;;PT70H0M0S;Etudes;Projet
85;Processus décisionnels;Processus DI;APD;APD - Envoi dossier;;;PT0H0M0S;Etudes;Projet
86;Processus décisionnels;Processus DI;APD;APD - Avis;;;PT105H0M0S;Etudes;Projet
87;Processus décisionnels;Processus DI;APD;APD - Validation du dossier;;;PT0H0M0S;Etudes;Projet
88;Processus décisionnels;Processus DI;Projet < 10 M€;;;;PT105H0M0S;Processus Décisionnel;
89;Processus décisionnels;Processus DI;Projet < 10 M€;DI - Finalisation du dossier;;;PT70H0M0S;Processus Décisionnel;Projet
90;Processus décisionnels;Processus DI;Projet < 10 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;PT35H0M0S;Processus Décisionnel;Projet
91;Processus décisionnels;Processus DI;Projet < 20 M€;;;;PT392H0M0S;Processus Décisionnel;
92;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Finalisation du dossier;;;PT140H0M0S;Processus Décisionnel;Projet
93;Processus décisionnels;Processus DI;Projet < 20 M€;DI - RRR (Revue des Référents Régionaux);;;PT35H0M0S;Processus Décisionnel;Projet
94;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Point d'arrêt SPC;;;PT0H0M0S;Processus Décisionnel;Projet
95;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
96;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
97;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
98;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
99;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
100;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
101;Processus décisionnels;Processus DI;Projet < 20 M€;DI - CRP (Comité Régional des Projets) Paris;;;PT35H0M0S;Processus Décisionnel;Projet
102;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Validation directeur D&I;;;PT35H0M0S;Processus Décisionnel;Projet
103;Processus décisionnels;Processus DI;Projet > 20 M€;;;;PT462H0M0S;Processus Décisionnel;
104;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Finalisation du dossier;;;PT140H0M0S;Processus Décisionnel;Projet
105;Processus décisionnels;Processus DI;Projet > 20 M€;DI - RRR (Revue des Référents Régionaux);;;PT35H0M0S;Processus Décisionnel;Projet
106;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Point d'arrêt SPC;;;PT0H0M0S;Processus Décisionnel;Projet
107;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
108;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
109;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
110;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
111;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
112;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
113;Processus décisionnels;Processus DI;Projet > 20 M€;DI - CRP Paris;;;PT35H0M0S;Processus Décisionnel;Projet
114;Processus décisionnels;Processus DI;Projet > 20 M€;DI - CNI (Comité National d'Investissement);;;PT35H0M0S;Processus Décisionnel;Projet
115;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Présentation en directoire;;;PT35H0M0S;Processus Décisionnel;Projet
116;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Délibération directoire;;;PT35H0M0S;Processus Décisionnel;Projet
117;Processus décisionnels;Processus DI;Projet > 30 M€;;;;PT462H0M0S;Processus Décisionnel;
118;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Finalisation du dossier;;;PT140H0M0S;Processus Décisionnel;Projet
119;Processus décisionnels;Processus DI;Projet > 30 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;PT35H0M0S;Processus Décisionnel;Projet
120;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Point d'arrêt SPC;;;PT0H0M0S;Processus Décisionnel;Projet
121;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
122;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
123;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
124;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
125;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
126;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
127;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CRP Paris;;;PT35H0M0S;Processus Décisionnel;Projet
128;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CNI (Comité National d'Investissement);;;PT35H0M0S;Processus Décisionnel;Projet
129;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Présentation en directoire;;;PT35H0M0S;Processus Décisionnel;Projet
130;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Délibération directoire;;;PT35H0M0S;Processus Décisionnel;Projet
131;Processus décisionnels;Processus DI;Projet > 50 M€;;;;PT924H0M0S;Processus Décisionnel;
132;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Finalisation du dossier;;;PT140H0M0S;Processus Décisionnel;Projet
133;Processus décisionnels;Processus DI;Projet > 50 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;PT35H0M0S;Processus Décisionnel;Projet
134;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Point d'arrêt SPC;;;PT0H0M0S;Processus Décisionnel;Projet
135;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Mise à jour des documents pour le CCE;;;PT70H0M0S;Processus Décisionnel;Projet
136;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Dépôt du dossier CCE;;;PT0H0M0S;Processus Décisionnel;Projet
137;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Remarques et questions;;;PT35H0M0S;Processus Décisionnel;Projet
138;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Réponses et amendements;;;PT35H0M0S;Processus Décisionnel;Projet
139;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Avis;;;PT14H0M0S;Processus Décisionnel;Projet
140;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Séance plénière;;;PT7H0M0S;Processus Décisionnel;Projet
141;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CRP Paris;;;PT35H0M0S;Processus Décisionnel;Projet
142;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CNI (Comité National d'Investissement);;;PT35H0M0S;Processus Décisionnel;Projet
143;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Audit CRE;;;PT462H0M0S;Processus Décisionnel;Projet
144;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Présentation en directoire;;;PT35H0M0S;Processus Décisionnel;Projet
145;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Délibération directoire;;;PT35H0M0S;Processus Décisionnel;Projet
146;Processus décisionnels;Processus DI;DI - Validation et signature de la DI;;;;PT0H0M0S;Processus Décisionnel;Projet
147;Procédures administratives;;;;;;PT5999H0M0S;Procédures Administratives;
148;Procédures administratives;Rédaction Note d'Organisation Stratégique pour la Concertation;;;;;PT280H0M0S;Etudes;Projet
149;Procédures administratives;Lag - Validation de la NOS pour sortie à l'extérieur;;;;;PT140H0M0S;Etudes;
150;Procédures administratives;Autorisation de sortie à l'externe (si lancement concertation avant DCT);;;;;PT0H0M0S;Etudes;
151;Procédures administratives;Concertation FERRACCI;;;;;PT1309H0M0S;Procédures Administratives;
152;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);;;;PT455H0M0S;Procédures Administratives;
153;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Rédaction note d'information synthétique;;;PT35H0M0S;Procédures Administratives;
154;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Envoi note d'information à la DREAL;;;PT0H0M0S;Procédures Administratives;
155;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information du préfet par la DREAL;;;PT35H0M0S;Procédures Administratives;
156;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Rencontre des parties prenantes + synthèse avis (durée variable);;;PT140H0M0S;Procédures Administratives;
157;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Elaboration DPP (Dossier de Présentation du projet);;;PT210H0M0S;Procédures Administratives;
158;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Transmission du DPP à la DREAL;;;PT0H0M0S;Procédures Administratives;
159;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Accusé de réception DREAL;;;PT140H0M0S;Procédures Administratives;
160;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);RISQUE : Remise en cause du DPP;;;PT0H0M0S;Risques;
161;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information des parties prenantes;;;PT105H0M0S;Procédures Administratives;
162;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information par RTE du FMI/EMI retenu à la DREAL;;;PT0H0M0S;Procédures Administratives;
163;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;;;;PT805H0M0S;Procédures Administratives;
164;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Rédaction note d'information synthétique;;;PT35H0M0S;Procédures Administratives;
165;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Envoi note d'information à la DREAL;;;PT0H0M0S;Procédures Administratives;
166;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Information du préfet par la DREAL;;;PT35H0M0S;Procédures Administratives;
167;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Rencontre des parties prenantes + synthèse avis (durée variable);;;PT140H0M0S;Procédures Administratives;
168;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Elaboratoin DPP (Dossier de Présentation du Projet) V1;;;PT140H0M0S;Procédures Administratives;
169;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Envoi du DPP V1;;;PT0H0M0S;Procédures Administratives;
170;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;lag - Validation dossier par le préfet;;;PT140H0M0S;Procédures Administratives;
171;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Concertation ou consultation;;;PT280H0M0S;Procédures Administratives;
172;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Validation du FMI/EMI;;;PT0H0M0S;Procédures Administratives;
173;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;"Signature du FMI/EMI par le préfet ""dans les meilleurs délais""";;;PT35H0M0S;Procédures Administratives;
174;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);;;;PT1309H0M0S;Procédures Administratives;
175;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Rédaction note d'information synthétique;;;PT35H0M0S;Procédures Administratives;
176;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi note d'information à la DGEC;;;PT0H0M0S;Procédures Administratives;
177;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Information du préfet/ministre (?) par la DGEC;;;PT35H0M0S;Procédures Administratives;
178;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Rencontre des parties prenantes + synthèse avis (Durée variable);;;PT280H0M0S;Procédures Administratives;
179;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Elaboration DPP (Dossier de Présentation du Projet) V0 (=DPPAE);;;PT140H0M0S;Procédures Administratives;
180;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi du DPP V0;;;PT0H0M0S;Procédures Administratives;
181;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);lag - Validation dossier par le ministre;;;PT140H0M0S;Procédures Administratives;
182;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;;;PT574H0M0S;Procédures Administratives;
183;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Préparation IC1;;PT140H0M0S;Procédures Administratives;
184;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Instance de concertation 1;;PT7H0M0S;Procédures Administratives;
185;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Concertation CNDP;;PT140H0M0S;Procédures Administratives;
186;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Elaboration DPP (Dossier de Présentation du Projet) V1;;PT140H0M0S;Procédures Administratives;
187;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Préparation IC2;;PT140H0M0S;Procédures Administratives;
188;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Instance de concertation 2;;PT7H0M0S;Procédures Administratives;
189;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Bilan et proposition FMI/EMI par le préfet;;;PT35H0M0S;Procédures Administratives;
190;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Validation du FMI/EMI par le ministre;;;PT70H0M0S;Procédures Administratives;
191;Procédures administratives;Concertation FERRACCI;Validation du FMI/EMI;;;;PT0H0M0S;Procédures Administratives;
192;Procédures administratives;DUP (Déclaration d'Utilité Publique) et AE (Autorisation Environnementale);;;;;PT3164H0M0S;Procédures Administratives;
193;Procédures administratives;DUP et AE;Examen au cas par cas;;;;PT840H0M0S;Procédures Administratives;
194;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Etudes et préparation;;;PT560H0M0S;Procédures Administratives;
195;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Soumission du formulaire;;;PT0H0M0S;Procédures Administratives;
196;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Réponse de l'autorité environnementale;;;PT280H0M0S;Procédures Administratives;
197;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;;;;PT588H0M0S;Procédures Administratives;
198;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Etude d'incidence environnementale;;;PT147H0M0S;Procédures Administratives;
199;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Dépôt du dossier de DUP+AE;;;PT0H0M0S;Procédures Administratives;
200;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Consultation art. L.181-10-1;;;PT441H0M0S;Procédures Administratives;
201;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;;;;PT2429H0M0S;Procédures Administratives;
202;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Etude 4 saisons;;;PT1400H0M0S;Procédures Administratives;
203;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Etude d'impact;;;PT588H0M0S;Procédures Administratives;
204;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Dépôt du dossier de DUP+AE;;;PT0H0M0S;Procédures Administratives;
205;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Avis de l'Autorité environnementale;;;PT294H0M0S;Procédures Administratives;
206;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Enquête publique unique art. L123-6;;;PT147H0M0S;Procédures Administratives;
207;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;;;;PT588H0M0S;Procédures Administratives;
208;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Dépôt du dossier de DUP;;;PT0H0M0S;Procédures Administratives;
209;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Consultation du public en mairie art. L.323-3 Ou Enquête public art. L.110-1 si expro;;;PT105H0M0S;Procédures Administratives;
210;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Etude d'incidence environnementale;;;PT147H0M0S;Procédures Administratives;
211;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Dépôt du dossier d'Autorisation Environnementale;;;PT0H0M0S;Procédures Administratives;
212;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Consultation art. L.181-10-1;;;PT441H0M0S;Procédures Administratives;
213;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;;;;PT3164H0M0S;Procédures Administratives;
214;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Etude 4 saisons;;;PT1400H0M0S;Procédures Administratives;
215;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Etude d'impact;;;PT588H0M0S;Procédures Administratives;
216;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Dépôt du dossier de DUP;;;PT0H0M0S;Procédures Administratives;
217;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Avis de l'Autorité environnementale;;;PT294H0M0S;Procédures Administratives;
218;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Enquête publique unique art. L123-2;;;PT147H0M0S;Procédures Administratives;
219;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;;;PT735H0M0S;Procédures Administratives;
220;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Actualisation de l'Etude d'Impact;;PT294H0M0S;Procédures Administratives;
221;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Dépôt du dossier d'Autorisation Environnementale;;PT0H0M0S;Procédures Administratives;
222;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Nouvel avis de l'Autorité Environnementale;;PT294H0M0S;Procédures Administratives;
223;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;PPVE art. L.123-19;;PT147H0M0S;Procédures Administratives;
224;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;;;PT441H0M0S;Procédures Administratives;
225;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;Dépôt du dossier d'Autorisation Environnementale;;PT0H0M0S;Procédures Administratives;
226;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;Consultation art. L.181-10-1;;PT441H0M0S;Procédures Administratives;
227;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;;;;PT693H0M0S;Procédures Administratives;
228;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Etude d'incidence environnementale;;;PT147H0M0S;Procédures Administratives;
229;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Dépôt du dossier d'Autorisation Environnementale;;;PT0H0M0S;Procédures Administratives;
230;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Consultation art. L.181-10-1;;;PT441H0M0S;Procédures Administratives;
231;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Dépôt du dossier de DUP;;;PT0H0M0S;Procédures Administratives;
232;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Consultation du public en mairie art. L.323-3 Ou Enquête public art. L.110-1 si expro;;;PT105H0M0S;Procédures Administratives;
233;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;;;;PT3164H0M0S;Procédures Administratives;
234;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Etude 4 saisons;;;PT1400H0M0S;Procédures Administratives;
235;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Etude d'impact;;;PT588H0M0S;Procédures Administratives;
236;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Dépôt du dossier d'Autorisation Environnementale;;;PT0H0M0S;Procédures Administratives;
237;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Consultation art. L.181-10-1 (+Avis AE);;;PT441H0M0S;Procédures Administratives;
238;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;;;PT735H0M0S;Procédures Administratives;
239;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Actualisation de l'Etude d'Impact;;PT294H0M0S;Procédures Administratives;
240;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Dépôt du dossier de DUP;;PT0H0M0S;Procédures Administratives;
241;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Nouvel avis de l'Autorité Environnementale;;PT294H0M0S;Procédures Administratives;
242;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;PPVE art. L.123-19;;PT147H0M0S;Procédures Administratives;
243;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;;;PT441H0M0S;Procédures Administratives;
244;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;Dépôt du dossier de DUP;;PT0H0M0S;Procédures Administratives;
245;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;Consultation du public en mairie art. L.323-3;;PT441H0M0S;Procédures Administratives;
246;Procédures administratives;DUP et AE;Obtention DUP;;;;PT0H0M0S;Procédures Administratives;
247;Procédures administratives;DUP et AE;Obtention AE;;;;PT0H0M0S;Procédures Administratives;
248;Procédures administratives;Conventionnement LS;;;;;PT1169H0M0S;Procédures Administratives;
249;Procédures administratives;Conventionnement LS;Conventionnement LS - Sollicitation de l'entreprise titulaire du marché "études liaisons";;;;PT210H0M0S;Procédures Administratives;
250;Procédures administratives;Conventionnement LS;Conventionnement LS - Tracé de détail et identification des propriétaires;;;;PT70H0M0S;Procédures Administratives;
251;Procédures administratives;Conventionnement LS;Conventionnement LS - Recensement et identification des propriétaires;;;;PT0H0M0S;Procédures Administratives;
252;Procédures administratives;Conventionnement LS;Conventionnement LS - Recherche via infoter;;;;PT49H0M0S;Procédures Administratives;
253;Procédures administratives;Conventionnement LS;Conventionnement LS - Sollicitations externes (notaires, impôts,…);;;;PT140H0M0S;Procédures Administratives;
254;Procédures administratives;Conventionnement LS;Conventionnement LS - Rencontres physiques;;;;PT420H0M0S;Procédures Administratives;
255;Procédures administratives;Conventionnement LS;Conventionnement LS - Envoi LRAR des conventions pour signature ou déplacement;;;;PT560H0M0S;Procédures Administratives;
256;Procédures administratives;Conventionnement LS;Conventionnement LS - Autorisation d'exercer les servitudes;;;;PT0H0M0S;Procédures Administratives;
257;Procédures administratives;Conventionnement LA;;;;;PT1540H0M0S;Procédures Administratives;
258;Procédures administratives;Conventionnement LA;Conventionnement LA - Visite terrain pour définir l'implantation projetée;;;;PT700H0M0S;Procédures Administratives;
259;Procédures administratives;Conventionnement LA;Conventionnement LA - Obtention des avis favorables;;;;PT700H0M0S;Procédures Administratives;
260;Procédures administratives;Conventionnement LA;Conventionnement LA - Conventionnement;;;;PT700H0M0S;Procédures Administratives;
261;Procédures administratives;RISQUE - Mise en servitude;;;;;PT504H0M0S;Procédures Administratives;
262;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Dépôt de la requête (si désaccord);;;;PT0H0M0S;Procédures Administratives;
263;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Prescription enquête et designación commissaire enquêteur;;;;PT105H0M0S;Procédures Administratives;
264;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Notification de l'arrêté et transmission aux maires;;;;PT105H0M0S;Procédures Administratives;
265;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Annonce de l'ouverture de l'enquête (affichage);;;;PT21H0M0S;Procédures Administratives;
266;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Enquête parcellaire;;;;PT56H0M0S;Procédures Administratives;
267;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Clôture, signature registre (maires) et transmission au CE;;;PT7H0M0S;Procédures Administratives;
268;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Avis CE, procès verbal et transmission au préfet;;;PT21H0M0S;Procédures Administratives;
269;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Transmission du préfet vers le pétionnaire;;;;PT35H0M0S;Procédures Administratives;
270;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Observation RTE et modification possible du projet;;;;PT49H0M0S;Procédures Administratives;
271;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Etablissement des servitudes et notifications;;;;PT105H0M0S;Procédures Administratives;
272;Procédures administratives;RISQUE - Mise en servitude;MeServitude - Arrêté de servitude (a relier au début des travaux concernés par la DUP);;;;PT0H0M0S;Procédures Administratives;
273;Procédures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);;;;;PT665H0M0S;Procédures Administratives;
274;Procédures administratives;APO;APO - Disponibilité des études de détail LA;;;;PT0H0M0S;Procédures Administratives;
275;Procédures administratives;APO;APO - Dossier de demande d'APO;;;;PT280H0M0S;Procédures Administratives;
276;Procédures administratives;APO;APO - Envoi du dossier à la DREAL;;;;PT0H0M0S;Procédures Administratives;
277;Procédures administratives;APO;APO - Consultation des maires et gestionnaires de DP;;;;PT70H0M0S;Procédures Administratives;
278;Procédures administratives;APO;APO - Avis des maireset gestionnaires;;;;PT140H0M0S;Procédures Administratives;
279;Procédures administratives;APO;APO - Réponse RTE aux avis;;;;PT140H0M0S;Procédures Administratives;
280;Procédures administratives;APO;APO - Transmission au préfet;;;;PT35H0M0S;Procédures Administratives;
281;Procédures administratives;APO;APO - Délivrance de l'APO;;;;PT0H0M0S;Procédures Administratives;
282;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);;;;;PT630H0M0S;Procédures Administratives;
283;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);CMG - Disponibilité des études de détail LS et Postes;;;;PT0H0M0S;Procédures Administratives;
284;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);CMG - Dossier de CMG directe par RTE;;;;PT280H0M0S;Procédures Administratives;
285;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);CMG - CMG des maireset gestionnaires de DP et services publics;;;;PT70H0M0S;Procédures Administratives;
286;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);CMG - Avis des maireset gestionnaires de DP et services publics;;;;PT140H0M0S;Procédures Administratives;
287;Procédures administratives;Consultation des maireset gestionnaires par RTE (LS et Postes);CMG - Réponse de RTE aux avis;;;;PT140H0M0S;Procédures Administratives;
288;Procédures administratives;PC (Permis de Construire) (Postes);;;;;PT735H0M0S;Procédures Administratives;
289;Procédures administratives;PC (Permis de Construire) (Postes);PC - Disponibilité des études de détail Postes;;;;PT0H0M0S;Procédures Administratives;
290;Procédures administratives;PC (Permis de Construire) (Postes);PC - Dossier de demande de PC;;;;PT280H0M0S;Procédures Administratives;
291;Procédures administratives;PC (Permis de Construire) (Postes);PC - Dépôt du dossier;;;;PT0H0M0S;Procédures Administratives;
292;Procédures administratives;PC (Permis de Construire) (Postes);PC - Instruction par la DDT;;;;PT140H0M0S;Procédures Administratives;
293;Procédures administratives;PC (Permis de Construire) (Postes);PC - Consultation des maireset autres;;;;PT140H0M0S;Procédures Administratives;
294;Procédures administratives;PC (Permis de Construire) (Postes);PC - Avis des maireset autres;;;;PT140H0M0S;Procédures Administratives;
295;Procédures administratives;PC (Permis de Construire) (Postes);PC - Transmission du PC au préfet (DDT);;;;PT35H0M0S;Procédures Administratives;
296;Procédures administratives;PC (Permis de Construire) (Postes);PC - Délivrance du permis de construire;;;;PT0H0M0S;Procédures Administratives;
297;Etudes;;;;;;PT4025H0M0S;Etudes;
298;Etudes;Etudes préliminaires;;;;;PT280H0M0S;Etudes;
299;Etudes;Etudes préliminaires;Rédaction Note d'Organisation Projet et stratégie achats;;;;PT280H0M0S;Etudes;Projet
300;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;;;;PT280H0M0S;Etudes;
301;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires postes;;;PT280H0M0S;Etudes;Poste
302;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires BT/telecom;;;PT280H0M0S;Etudes;BT
303;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires LA;;;PT280H0M0S;Etudes;LA
304;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires LS;;;PT280H0M0S;Etudes;LS
305;Etudes;Etudes détaillées;;;;;PT3003H0M0S;Etudes;
306;Etudes;Etudes détaillées;Etudes Postes;;;;PT2765H0M0S;Etudes;`;

function buildLibraryData(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const dataLines = lines.slice(1);
  const libraryItems = [];
  const cardMap = new Map();

  dataLines.forEach(line => {
    const columns = line.split(';');
    if (columns.length < 2) return;

    const colB = (columns[1] || '').trim();
    const colC = (columns[2] || '').trim();
    const colD = (columns[3] || '').trim();
    const colE = (columns[4] || '').trim();
    const colF = (columns[5] || '').trim();
    const colG = (columns[6] || '').trim();
    const colI = (columns[8] || '').trim();
    const colJ = (columns[9] || '').trim();
    const duration = parsePTDuration(columns[7] || '');

    if (!colC) return;

    const tags = [colB, colI, colJ].filter(t => t).join(',');

    let subcategoriesList = [];
    if (colE) subcategoriesList.push(colE);
    if (colF)
      subcategoriesList = subcategoriesList.concat(colF.split(/[\s\/]+/).filter(p => p.trim()));
    if (colG)
      subcategoriesList = subcategoriesList.concat(colG.split(/[\s\/]+/).filter(p => p.trim()));

    if (!cardMap.has(colC)) {
      const cardItem = {
        id: cardMap.size + 1,
        title: colC,
        type: 'card',
        tags: tags,
        duration: duration,
        content_json: JSON.stringify({
          card: {
            title: colC,
            description: '',
            priority: 'normal',
            duration_days: duration,
          },
          categories: [],
        }),
      };
      cardMap.set(colC, cardItem);
      libraryItems.push(cardItem);
    }

    if (colD) {
      const cardItem = cardMap.get(colC);
      const content = JSON.parse(cardItem.content_json);

      let category = content.categories.find(c => c.title === colD);
      if (!category) {
        category = {
          title: colD,
          description: '',
          priority: 'normal',
          subcategories: [],
        };
        content.categories.push(category);
      }

      if (subcategoriesList.length > 0) {
        subcategoriesList.forEach(subcatTitle => {
          if (subcatTitle && !category.subcategories.find(s => s.title === subcatTitle)) {
            category.subcategories.push({
              title: subcatTitle,
              description: '',
              priority: 'normal',
            });
          }
        });
      }

      cardItem.content_json = JSON.stringify(content);
    }
  });

  return libraryItems;
}

const libraryTemplates = buildLibraryData(csvData);

export { libraryTemplates };
export default libraryTemplates;
