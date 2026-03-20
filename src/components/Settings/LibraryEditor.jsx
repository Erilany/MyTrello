import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  FolderOpen,
  Upload,
  FileText,
  List,
  CheckSquare,
  Folder,
} from 'lucide-react';
import { libraryTemplates } from '../../data/libraryData';
import { loadTagsData } from '../../data/TagsData';
import { parseMSProjectXml } from '../../utils/xmlParser';

const STORAGE_KEY = 'mytrello_library_editor';

function formatDuration(days) {
  const hours = days * 24;
  return `PT${hours}H0M0S`;
}

function convertTreeToLibraryItems(treeData) {
  const libraryItems = [];
  const cardMap = new Map();
  let itemId = 1;

  const processNode = (node, chapitre = '', carte = '', categorie = '') => {
    let currentChapitre = chapitre;
    let currentCarte = carte;
    let currentCategorie = categorie;

    if (node.type === 'chapitre') {
      currentChapitre = node.data.chapitre || node.titre;
    } else if (node.type === 'carte') {
      currentCarte = node.data.carte || node.titre;
    } else if (node.type === 'categorie') {
      currentCategorie = node.data.categorie || node.titre;
    }

    if (node.type === 'carte' || node.type === 'categorie' || node.type === 'souscategorie') {
      const tags = [node.data.categorieTag || '', node.data.domaineTag || '']
        .filter(Boolean)
        .join(',');

      let cardItem = cardMap.get(currentCarte);
      if (!cardItem) {
        cardItem = {
          id: itemId++,
          title: currentCarte,
          type: 'card',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            card: {
              title: currentCarte,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
            },
            categories: [],
          }),
        };
        cardMap.set(currentCarte, cardItem);
        libraryItems.push(cardItem);
      }

      if (node.type === 'categorie' || node.type === 'souscategorie') {
        const content = JSON.parse(cardItem.content_json);
        let category = content.categories.find(c => c.title === currentCategorie);
        if (!category) {
          category = {
            title: currentCategorie,
            description: '',
            priority: 'normal',
            duration_days: node.data.temps || 0,
            tag: node.data.systemTag || null,
            subcategories: [],
          };
          content.categories.push(category);
        } else if (node.data.systemTag) {
          category.tag = node.data.systemTag;
        }

        libraryItems.push({
          id: itemId++,
          title: currentCategorie,
          type: 'category',
          tags: tags,
          duration: node.data.temps || 0,
          content_json: JSON.stringify({
            category: {
              title: currentCategorie,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              tag: node.data.systemTag || null,
            },
          }),
        });

        if (node.type === 'souscategorie' && node.data.sousCat1) {
          if (!category.subcategories.find(s => s.title === node.data.sousCat1)) {
            category.subcategories.push({
              title: node.data.sousCat1,
              description: '',
              priority: 'normal',
              duration_days: node.data.temps || 0,
              tag: node.data.systemTag || null,
            });
          }

          libraryItems.push({
            id: itemId++,
            title: node.data.sousCat1,
            type: 'subcategory',
            tags: tags,
            duration: node.data.temps || 0,
            content_json: JSON.stringify({
              subcategory: {
                title: node.data.sousCat1,
                description: '',
                priority: 'normal',
                duration_days: node.data.temps || 0,
                tag: node.data.systemTag || null,
              },
            }),
          });
        }

        cardItem.content_json = JSON.stringify(content);
      }
    }

    if (node.children) {
      node.children.forEach(child =>
        processNode(child, currentChapitre, currentCarte, currentCategorie)
      );
    }
  };

  treeData.forEach(node => processNode(node));
  return libraryItems;
}

function parsePTDuration(ptStr) {
  if (!ptStr || !ptStr.startsWith('PT')) return 0;
  const match = ptStr.match(/PT(\d+)H(\d+)M(\d+)S/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  return Math.floor(hours / 24);
}

function convertLibraryDataToTree(libraryItems) {
  const tree = [];
  const chapterMap = new Map();
  const carteMap = new Map();

  libraryItems.forEach(item => {
    try {
      const content = item.content_json
        ? JSON.parse(item.content_json)
        : { card: {}, categories: [] };
      const cardTitle = content.card?.title || item.title;

      const tagsStr = item.tags || '';
      const tags = tagsStr.split(',');
      const chapterTitle = tags[0] || 'Autre';
      const categorieTag = tags[1] || '';
      const domaineTag = tags[2] || '';

      let chapter = chapterMap.get(chapterTitle);
      if (!chapter) {
        chapter = {
          id: `chap_${chapterTitle}`,
          type: 'chapitre',
          titre: chapterTitle,
          data: {
            chapitre: chapterTitle,
            carte: '',
            categorie: '',
            sousCat1: '',
            sousCat2: '',
            sousCat3: '',
            temps: 0,
            categorieTag: '',
            domaineTag: '',
          },
          children: [],
          expanded: true,
        };
        chapterMap.set(chapterTitle, chapter);
        tree.push(chapter);
      }

      let carte = carteMap.get(`${chapterTitle}_${cardTitle}`);
      if (!carte) {
        carte = {
          id: `carte_${chapterTitle}_${cardTitle}`,
          type: 'carte',
          titre: cardTitle,
          data: {
            chapitre: chapterTitle,
            carte: cardTitle,
            categorie: '',
            sousCat1: '',
            sousCat2: '',
            sousCat3: '',
            temps: item.duration || 0,
            categorieTag: categorieTag,
            domaineTag: domaineTag,
          },
          children: [],
          expanded: true,
        };
        carteMap.set(`${chapterTitle}_${cardTitle}`, carte);
        chapter.children.push(carte);
      }

      if (content.categories) {
        content.categories.forEach(cat => {
          const catId = `${chapterTitle}_${cardTitle}_${cat.title}`;
          const categoryNode = {
            id: `cat_${catId}`,
            type: 'categorie',
            titre: cat.title,
            data: {
              chapitre: chapterTitle,
              carte: cardTitle,
              categorie: cat.title,
              sousCat1: '',
              sousCat2: '',
              sousCat3: '',
              temps: cat.duration_days || 0,
              categorieTag: categorieTag,
              domaineTag: domaineTag,
            },
            children: [],
            expanded: true,
          };

          if (cat.subcategories) {
            cat.subcategories.forEach(subcat => {
              const subcatNode = {
                id: `subcat_${catId}_${subcat.title}`,
                type: 'souscategorie',
                titre: subcat.title,
                data: {
                  chapitre: chapterTitle,
                  carte: cardTitle,
                  categorie: cat.title,
                  sousCat1: subcat.title,
                  sousCat2: '',
                  sousCat3: '',
                  temps: subcat.duration_days || 0,
                  categorieTag: categorieTag,
                  domaineTag: domaineTag,
                },
                children: [],
              };
              categoryNode.children.push(subcatNode);
            });
          }
          carte.children.push(categoryNode);
        });
      }
    } catch (e) {
      console.error('Error processing item:', item, e);
    }
  });

  return tree;
}

const defaultCsvData = `N°;Chapitre;Carte;Action;Tâche;Temps;Tags 1;Tags 2;Tag Revue d'activité
5;Jalons;Jalons SIEPR;;;;;;PT10955H0M0S;;;
6;Jalons;Jalons SIEPR;Jalons projet;;;;;PT10955H0M0S;;;
7;Jalons;Jalons SIEPR;Jalons projet;Signature de la DO;;;;PT0H0M0S;Projet;Projet
8;Jalons;Jalons SIEPR;Jalons projet;Lancement projet;;;;PT0H0M0S;Projet;Projet
9;Jalons;Jalons SIEPR;Jalons projet;Signature de la DCT;;;;PT0H0M0S;Projet;Projet
10;Jalons;Jalons SIEPR;Jalons projet;Signature de la DI;;;;PT0H0M0S;Projet;Projet
11;Jalons;Jalons SIEPR;Jalons projet;PV de fin de concertation;;;;PT0H0M0S;Projet;Projet
12;Jalons;Jalons SIEPR;Jalons projet;Dépôt de la DUP;;;;PT0H0M0S;Projet;Projet
13;Jalons;Jalons SIEPR;Jalons projet;Signature de la DUP;;;;PT0H0M0S;Projet;Projet
14;Jalons;Jalons SIEPR;Jalons projet;Sécurisation du foncier;;;;PT0H0M0S;Projet;Projet
15;Jalons;Jalons SIEPR;Jalons projet;Obtention de la dernière autorisation;;;;PT0H0M0S;Projet;Projet
16;Jalons;Jalons SIEPR;Jalons projet;Clôture;;;;PT0H0M0S;Travaux;Projet
17;Jalons;Jalons SIEPR;Jalons OP poste;;;;;;PT9779H0M0S;;;
18;Jalons;Jalons SIEPR;Jalons OP poste;CTF Poste validée;;;;PT0H0M0S;Processus Décisionnel;Poste
19;Jalons;Jalons SIEPR;Jalons OP poste;Commande MCPO;;;;PT0H0M0S;;Poste
20;Jalons;Jalons SIEPR;Jalons OP poste;Ouverture de chantier poste;;;;PT0H0M0S;Travaux;Poste
21;Jalons;Jalons SIEPR;Jalons OP poste;Première mise en service poste;;;;PT0H0M0S;Travaux;Poste
22;Jalons;Jalons SIEPR;Jalons OP poste;Dernière mise en service poste;;;;PT0H0M0S;Travaux;Poste
23;Jalons;Jalons SIEPR;Jalons OP poste;Fin des travaux poste;;;;PT0H0M0S;Travaux;Poste
24;Jalons;Jalons SIEPR;Jalons OP LA;;;;;;PT10360H0M0S;;;
25;Jalons;Jalons SIEPR;Jalons OP LA;CTF LA validée;;;;PT0H0M0S;Processus Décisionnel;LA
26;Jalons;Jalons SIEPR;Jalons OP LA;APO;;;;PT0H0M0S;Procédures Administratives;LA
27;Jalons;Jalons SIEPR;Jalons OP LA;Commande études MCEL LA;;;;PT0H0M0S;Etudes;LA
28;Jalons;Jalons SIEPR;Jalons OP LA;Commandes travaux MCLA;;;;PT0H0M0S;Travaux;LA
29;Jalons;Jalons SIEPR;Jalons OP LA;Ouverture de chantier LA;;;;PT0H0M0S;Travaux;LA
30;Jalons;Jalons SIEPR;Jalons OP LA;Première mise en service LA;;;;PT0H0M0S;Travaux;LA
31;Jalons;Jalons SIEPR;Jalons OP LA;Dernière mise en service LA;;;;PT0H0M0S;Travaux;LA
32;Jalons;Jalons SIEPR;Jalons OP LA;Fin des travaux LA;;;;PT0H0M0S;Travaux;LA
33;Jalons;Jalons SIEPR;Jalons OP LS;;;;;;PT8141H0M0S;;;
34;Jalons;Jalons SIEPR;Jalons OP LS;CTF LS validée;;;;PT0H0M0S;Processus Décisionnel;LS
35;Jalons;Jalons SIEPR;Jalons OP LS;Commande études MCEL LS;;;;PT0H0M0S;Etudes;LS
36;Jalons;Jalons SIEPR;Jalons OP LS;Commandes travaux MCLS;;;;PT0H0M0S;Travaux;LS
37;Jalons;Jalons SIEPR;Jalons OP LS;Ouverture de chantier LS;;;;PT0H0M0S;Travaux;LS
38;Jalons;Jalons SIEPR;Jalons OP LS;Première mise en service LS;;;;PT0H0M0S;Travaux;LS
39;Jalons;Jalons SIEPR;Jalons OP LS;Dernière mise en service LS;;;;PT0H0M0S;Travaux;LS
40;Jalons;Jalons SIEPR;Jalons OP LS;Fin des travaux LS;;;;PT0H0M0S;Travaux;LS
41;Jalons;Jalons d'interface;;;;;;;PT0H0M0S;;;
42;Jalons;Jalons d'interface;<Nouvelle tâche>;;;;;;PT0H0M0S;;;
43;Processus décisionnels;Processus décisionnels;;;;;;PT5474H0M0S;Processus Décisionnel;
44;Processus décisionnels;Processus DO;;;;;;PT35H0M0S;Processus Décisionnel;
45;Processus décisionnels;Processus DO;DO - Validation et signature de la DO (dir D&I);;;;;PT0H0M0S;Processus Décisionnel;Projet
46;Processus décisionnels;Processus DO;Nomination du manager de projet;;;;;PT0H0M0S;;;
47;Processus décisionnels;Processus DCT;;;;;;PT1022H0M0S;Processus Décisionnel;
48;Processus décisionnels;Processus DCT;Réalisation CTF;;;;;PT700H0M0S;Etudes;
49;Processus décisionnels;Processus DCT;Réalisation CTF;Mise à jour du CCF;;;;PT140H0M0S;Etudes;Projet
50;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Postes;;;;PT280H0M0S;Etudes;Poste
51;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie BT / telecom Postes et encadrants;;;;PT280H0M0S;Etudes;BT
52;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Liaisons aériennes;;;;PT280H0M0S;Etudes;LA
53;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Liaisons souterraines;;;;PT280H0M0S;Etudes;LS
54;Processus décisionnels;Processus DCT;Réalisation CTF;CTF partie Concertation/autorisation;;;;PT280H0M0S;Etudes;Projet
55;Processus décisionnels;Processus DCT;Réalisation CTF;Finalisation CTF de synthèse;;;;PT140H0M0S;Etudes;Projet
56;Processus décisionnels;Processus DCT;Projet < 10 M€ (Facultative);;;;;PT35H0M0S;Processus Décisionnel;
57;Processus décisionnels;Processus DCT;Projet < 10 M€ (Facultative);DCT - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;;PT35H0M0S;Processus Décisionnel;Projet
58;Processus décisionnels;Processus DCT;Projet < 20 M€;;;;;;PT252H0M0S;Processus Décisionnel;
59;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - RRR (Revue des Référents Régionaux);;;;PT35H0M0S;Processus Décisionnel;Projet
60;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
61;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
62;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
63;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
64;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
65;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CCE - Séance plénière;;;;;PT7H0M0S;Processus Décisionnel;Projet
66;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - CRP (Comité Régional des Projets);;;;PT35H0M0S;Processus Décisionnel;Projet
67;Processus décisionnels;Processus DCT;Projet < 20 M€;DCT - Validation directeur D&I;;;;PT35H0M0S;Processus Décisionnel;Projet
68;Processus décisionnels;Processus DCT;Projet > 20 M€;;;;;;PT322H0M0S;Processus Décisionnel;
69;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - RRR (Revue des Référents Régionaux);;;;PT35H0M0S;Processus Décisionnel;Projet
70;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Point d'arrêt SPC;;;;;PT0H0M0S;Processus Décisionnel;Projet
71;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
72;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
73;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
74;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
75;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
76;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CCE - Séance plénière;;;;;PT7H0M0S;Processus Décisionnel;Projet
77;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CRP Paris;;;;;PT35H0M0S;Processus Décisionnel;Projet
78;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - CNI (Comité National d'Investissement);;;;PT35H0M0S;Processus Décisionnel;Projet
79;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Présentation en directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
80;Processus décisionnels;Processus DCT;Projet > 20 M€;DCT - Délibération directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
81;Processus décisionnels;Processus DCT;DCT - Validation et signature de la DCT;;;;;PT0H0M0S;Processus Décisionnel;Projet
82;Processus décisionnels;Processus DI;;;;;;PT1414H0M0S;Processus Décisionnel;
83;Processus décisionnels;Processus DI;APD;;;;;;PT175H0M0S;Etudes;Projet
84;Processus décisionnels;Processus DI;APD;APD - Finalisation du dossier;;;;;PT70H0M0S;Etudes;Projet
85;Processus décisionnels;Processus DI;APD;APD - Envoi dossier;;;;;PT0H0M0S;Etudes;Projet
86;Processus décisionnels;Processus DI;APD;APD - Avis;;;;;;PT105H0M0S;Etudes;Projet
87;Processus décisionnels;Processus DI;APD;APD - Validation du dossier;;;;;PT0H0M0S;Etudes;Projet
88;Processus décisionnels;Processus DI;Projet < 10 M€;;;;;;PT105H0M0S;Processus Décisionnel;
89;Processus décisionnels;Processus DI;Projet < 10 M€;DI - Finalisation du dossier;;;;;PT70H0M0S;Processus Décisionnel;Projet
90;Processus décisionnels;Processus DI;Projet < 10 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;;PT35H0M0S;Processus Décisionnel;Projet
91;Processus décisionnels;Processus DI;Projet < 20 M€;;;;;;PT392H0M0S;Processus Décisionnel;
92;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Finalisation du dossier;;;;;PT140H0M0S;Processus Décisionnel;Projet
93;Processus décisionnels;Processus DI;Projet < 20 M€;DI - RRR (Revue des Référents Régionaux);;;;PT35H0M0S;Processus Décisionnel;Projet
94;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Point d'arrêt SPC;;;;;PT0H0M0S;Processus Décisionnel;Projet
95;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
96;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
97;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
98;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
99;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
100;Processus décisionnels;Processus DI;Projet < 20 M€;DCT - CCE - Séance plénière;;;;;PT7H0M0S;Processus Décisionnel;Projet
101;Processus décisionnels;Processus DI;Projet < 20 M€;DI - CRP (Comité Régional des Projets) Paris;;;;PT35H0M0S;Processus Décisionnel;Projet
102;Processus décisionnels;Processus DI;Projet < 20 M€;DI - Validation directeur D&I;;;;PT35H0M0S;Processus Décisionnel;Projet
103;Processus décisionnels;Processus DI;Projet > 20 M€;;;;;;PT462H0M0S;Processus Décisionnel;
104;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Finalisation du dossier;;;;;PT140H0M0S;Processus Décisionnel;Projet
105;Processus décisionnels;Processus DI;Projet > 20 M€;DI - RRR (Revue des Référents Régionaux);;;;PT35H0M0S;Processus Décisionnel;Projet
106;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Point d'arrêt SPC;;;;;PT0H0M0S;Processus Décisionnel;Projet
107;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
108;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
109;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
110;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
111;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
112;Processus décisionnels;Processus DI;Projet > 20 M€;DCT - CCE - Séance plénière;;;;;PT7H0M0S;Processus Décisionnel;Projet
113;Processus décisionnels;Processus DI;Projet > 20 M€;DI - CRP Paris;;;;;PT35H0M0S;Processus Décisionnel;Projet
114;Processus décisionnels;Processus DI;Projet > 20 M€;DI - CNI (Comité National d'Investissement);;;;PT35H0M0S;Processus Décisionnel;Projet
115;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Présentation en directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
116;Processus décisionnels;Processus DI;Projet > 20 M€;DI - Délibération directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
117;Processus décisionnels;Processus DI;Projet > 30 M€;;;;;;PT462H0M0S;Processus Décisionnel;
118;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Finalisation du dossier;;;;;PT140H0M0S;Processus Décisionnel;Projet
119;Processus décisionnels;Processus DI;Projet > 30 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;;PT35H0M0S;Processus Décisionnel;Projet
120;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Point d'arrêt SPC;;;;;PT0H0M0S;Processus Décisionnel;Projet
121;Processus décisionnels;Processus DI;Projet > 30 M€;DI - mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
122;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
123;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
124;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
125;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
126;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CCE - Séance plénière;;;;;PT7H0M0S;Processus Décisionnel;Projet
127;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CRP Paris;;;;;PT35H0M0S;Processus Décisionnel;Projet
128;Processus décisionnels;Processus DI;Projet > 30 M€;DI - CNI (Comité National d'Investissement);;;;PT35H0M0S;Processus Décisionnel;Projet
129;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Présentation en directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
130;Processus décisionnels;Processus DI;Projet > 30 M€;DI - Délibération directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
131;Processus décisionnels;Processus DI;Projet > 50 M€;;;;;;PT924H0M0S;Processus Décisionnel;
132;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Finalisation du dossier;;;;;PT140H0M0S;Processus Décisionnel;Projet
133;Processus décisionnels;Processus DI;Projet > 50 M€;DI - RRR/CRP (Revue des Référents Régionaux / Comité Régional des Projets);;;;PT35H0M0S;Processus Décisionnel;Projet
134;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Point d'arrêt SPC;;;;;PT0H0M0S;Processus Décisionnel;Projet
135;Processus décisionnels;Processus DI;Projet > 50 M€;DI - mise à jour des documents pour le CCE;;;;PT70H0M0S;Processus Décisionnel;Projet
136;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Dépôt du dossier CCE;;;;PT0H0M0S;Processus Décisionnel;Projet
137;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Remarques et questions;;;;PT35H0M0S;Processus Décisionnel;Projet
138;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Réponses et amendements;;;;PT35H0M0S;Processus Décisionnel;Projet
139;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Avis;;;;;PT14H0M0S;Processus Décisionnel;Projet
140;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CCE - Séanceplinière;;;;;PT7H0M0S;Processus Décisionnel;Projet
141;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CRP Paris;;;;;PT35H0M0S;Processus Décisionnel;Projet
142;Processus décisionnels;Processus DI;Projet > 50 M€;DI - CNI (Comité National d'Investissement);;;;PT35H0M0S;Processus Décisionnel;Projet
143;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Audit CRE;;;;PT462H0M0S;Processus Décisionnel;Projet
144;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Présentation en directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
145;Processus décisionnels;Processus DI;Projet > 50 M€;DI - Délibération directoire;;;;PT35H0M0S;Processus Décisionnel;Projet
146;Processus décisionnels;Processus DI;DI - Validation et signature de la DI;;;;;PT0H0M0S;Processus Décisionnel;Projet
147;Procédures administratives;Procédures administratives;;;;;;PT5999H0M0S;Procédures Administratives;
148;Procédures administratives;Procédures administratives;Rédaction Note d'Organisation Stratégique pour la Concertation;;;;;;PT280H0M0S;Etudes;Projet
149;Procédures administratives;Procédures administratives;Lag - Validation de la NOS pour sortie à l'extérieur;;;;;;PT140H0M0S;Etudes;
150;Procédures administratives;Procédures administratives;Autorisation de sortie à l'externe (si lancement concertation avant DCT);;;;;;PT0H0M0S;Etudes;
151;Procédures administratives;Procédures administratives;Concertation FERRACCI;;;;;;PT1309H0M0S;Procédures Administratives;
152;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);;;;;PT455H0M0S;Procédures Administratives;
153;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Rédaction note d'information synthétique;;;;;PT35H0M0S;Procédures Administratives;
154;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Envoi note d'information à la DREAL;;;;;PT0H0M0S;Procédures Administratives;
155;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information du préfet par la DREAL;;;;;PT35H0M0S;Procédures Administratives;
156;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Rencontre des parties prenantes + synthèse avis (durée variable);;;;;PT140H0M0S;Procédures Administratives;
157;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Elaboration DPP (Dossier de Présentation du projet);;;;;PT210H0M0S;Procédures Administratives;
158;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);transmission du DPP à la DREAL;;;;;PT0H0M0S;Procédures Administratives;
159;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Accusé de réception DREAL;;;;;PT140H0M0S;Procédures Administratives;
160;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);RISQUE : Remise en cause du DPP;;;;;PT0H0M0S;Risques;
161;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information des parties prenantes;;;;;PT105H0M0S;Procédures Administratives;
162;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet simple (pas de DUP, LA<1 km, LS<3km);Information par RTE du FMI/EMI retenu à la DREAL;;;;;PT0H0M0S;Procédures Administratives;
163;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;;;;;;PT805H0M0S;Procédures Administratives;
164;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Rédaction note d'information synthétique;;;;;PT35H0M0S;Procédures Administratives;
165;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Envoi note d'information à la DREAL;;;;;PT0H0M0S;Procédures Administratives;
166;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Information du préfet par la DREAL;;;;;PT35H0M0S;Procédures Administratives;
167;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Rencontre des parties prenantes + synthèse avis (durée variable);;;;;PT140H0M0S;Procédures Administratives;
168;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Elaboratoin DPP (Dossier de Présentation du Projet) V1;;;;;PT140H0M0S;Procédures Administratives;
169;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Envoi du DPP V1;;;;;PT0H0M0S;Procédures Administratives;
170;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;lag - Validation dossier par le préfet;;;;;PT140H0M0S;Procédures Administratives;
171;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Concertation ou consultation;;;;;PT280H0M0S;Procédures Administratives;
172;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;Validation du FMI/EMI;;;;;PT0H0M0S;Procédures Administratives;
173;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet intermédiaire;"Signature du FMI/EMI par le préfet ""dans les meilleurs délais""";;;;PT35H0M0S;Procédures Administratives;
174;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);;;;;PT1309H0M0S;Procédures Administratives;
175;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Rédaction note d'information synthétique;;;;;PT35H0M0S;Procédures Administratives;
176;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi note d'information à la DGEC;;;;;PT0H0M0S;Procédures Administratives;
177;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Information du préfet/ministre (?) par la DGEC;;;;;PT35H0M0S;Procédures Administratives;
178;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Rencontre des parties prenantes + synthèse avis (Durée variable);;;;;PT280H0M0S;Procédures Administratives;
179;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Elaboration DPP (Dossier de Présentation du Projet) V0 (=DPPAE);;;;;PT140H0M0S;Procédures Administratives;
180;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Envoi du DPP V0;;;;;PT0H0M0S;Procédures Administratives;
181;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);lag - Validation dossier par le ministre;;;;;PT140H0M0S;Procédures Administratives;
182;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;;;;;;PT574H0M0S;Procédures Administratives;
183;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Préparation IC1;;;;;PT140H0M0S;Procédures Administratives;
184;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Instance de concertation 1;;;;;PT7H0M0S;Procédures Administratives;
185;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Concertation CNDP;;;;;PT140H0M0S;Procédures Administratives;
186;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Elaboration DPP (Dossier de Présentation du Projet) V1;;;;;PT140H0M0S;Procédures Administratives;
187;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Préparation IC2;;;;;PT140H0M0S;Procédures Administratives;
188;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Concertation;Instance de concertation 2;;;;;PT7H0M0S;Procédures Administratives;
189;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Bilan et proposition FMI/EMI par le préfet;;;;;PT35H0M0S;Procédures Administratives;
190;Procédures administratives;Procédures administratives;Concertation FERRACCI;Projet important (400 kV, offshore, intercos);Validation du FMI/EMI par le ministre;;;;;PT70H0M0S;Procédures Administratives;
191;Procédures administratives;Procédures administratives;Concertation FERRACCI;Validation du FMI/EMI;;;;;;PT0H0M0S;Procédures Administratives;
192;Procédures administratives;Procédures administratives;DUP (Déclaration d'Utilité Publique) et AE (Autorisation Environnementale);;;;;;PT3164H0M0S;Procédures Administratives;
193;Procédures administratives;Procédures administratives;DUP et AE;Examen au cas par cas;;;;;;PT840H0M0S;Procédures Administratives;
194;Procédures administratives;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Etudes et préparation;;;;;PT560H0M0S;Procédures Administratives;
195;Procédures administratives;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Soumission du formulaire;;;;;PT0H0M0S;Procédures Administratives;
196;Procédures administratives;Procédures administratives;DUP et AE;Examen au cas par cas;Cas par cas - Réponse de l'autorité environnementale;;;;;PT280H0M0S;Procédures Administratives;
197;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;;;;;;PT588H0M0S;Procédures Administratives;
198;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Etude d'incidence environnementale;;;;;PT147H0M0S;Procédures Administratives;
199;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Dépôt du dossier de DUP+AE;;;;;PT0H0M0S;Procédures Administratives;
200;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé sans Etude d'Impact;Consultation art. L.181-10-1;;;;;PT441H0M0S;Procédures Administratives;
201;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;;;;;;PT2429H0M0S;Procédures Administratives;
202;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Etude 4 saisons;;;;;;PT1400H0M0S;Procédures Administratives;
203;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Etude d'impact;;;;;;PT588H0M0S;Procédures Administratives;
204;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Dépôt du dossier de DUP+AE;;;;;PT0H0M0S;Procédures Administratives;
205;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Avis de l'Autorité environnementale;;;;;PT294H0M0S;Procédures Administratives;
206;Procédures administratives;Procédures administratives;DUP et AE;DUP et AE synchronisé avec Etude d'Impact;Enquête publique unique art. L123-6;;;;;PT147H0M0S;Procédures Administratives;
207;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;;;;;;PT588H0M0S;Procédures Administratives;
208;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Dépôt du dossier de DUP;;;;;PT0H0M0S;Procédures Administratives;
209;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Consultation du public en mairie art. L.323-3 Ou Enquête public art. L.110-1 si expro;;;;;PT105H0M0S;Procédures Administratives;
210;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Etude d'incidence environnementale;;;;;PT147H0M0S;Procédures Administratives;
211;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Dépôt du dossier d'Autorisation Environnementale;;;;;PT0H0M0S;Procédures Administratives;
212;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé sans Etude d'Impact;Consultation art. L.181-10-1;;;;;PT441H0M0S;Procédures Administratives;
213;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;;;;;;PT3164H0M0S;Procédures Administratives;
214;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Etude 4 saisons;;;;;;PT1400H0M0S;Procédures Administratives;
215;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Etude d'impact;;;;;;PT588H0M0S;Procédures Administratives;
216;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Dépôt du dossier de DUP;;;;;PT0H0M0S;Procédures Administratives;
217;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Avis de l'Autorité environnementale;;;;;PT294H0M0S;Procédures Administratives;
218;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Enquête publique unique art. L123-2;;;;;PT147H0M0S;Procédures Administratives;
219;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;;;;;;PT735H0M0S;Procédures Administratives;
220;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Actualisation de l'Etude d'Impact;;;;;PT294H0M0S;Procédures Administratives;
221;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Dépôt du dossier d'Autorisation Environnementale;;;;;PT0H0M0S;Procédures Administratives;
222;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;Nouvel avis de l'Autorité Environnementale;;;;;PT294H0M0S;Procédures Administratives;
223;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si actualisation de l'Etude d'Impact;PPVE art. L.123-19;;;;;PT147H0M0S;Procédures Administratives;
224;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;;;;;;PT441H0M0S;Procédures Administratives;
225;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;Dépôt du dossier d'Autorisation Environnementale;;;;;PT0H0M0S;Procédures Administratives;
226;Procédures administratives;Procédures administratives;DUP et AE;DUP puis AE désynchronisé avec Etude d'Impact;Si pas d'actualisation de l'Étude d'impact;Consultation art. L.181-10-1;;;;;PT441H0M0S;Procédures Administratives;
227;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;;;;;;PT693H0M0S;Procédures Administratives;
228;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Etude d'incidence environnementale;;;;;PT147H0M0S;Procédures Administratives;
229;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Dépôt du dossier d'Autorisation Environnementale;;;;;PT0H0M0S;Procédures Administratives;
230;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Consultation art. L.181-10-1;;;;;PT441H0M0S;Procédures Administratives;
231;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Dépôt du dossier de DUP;;;;;PT0H0M0S;Procédures Administratives;
232;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé sans Etude d'impact;Consultation du public en mairie art. L.323-3 Ou Enquête public art. L.110-1 si expro;;;;;PT105H0M0S;Procédures Administratives;
233;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;;;;;;PT3164H0M0S;Procédures Administratives;
234;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Etude 4 saisons;;;;;;PT1400H0M0S;Procédures Administratives;
235;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Etude d'impact;;;;;;PT588H0M0S;Procédures Administratives;
236;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Dépôt du dossier d'Autorisation Environnementale;;;;;PT0H0M0S;Procédures Administratives;
237;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Consultation art. L.181-10-1 (+Avis AE);;;;PT441H0M0S;Procédures Administratives;
238;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;;;;;;PT735H0M0S;Procédures Administratives;
239;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Actualisation de l'Etude d'Impact;;;;;PT294H0M0S;Procédures Administratives;
240;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Dépôt du dossier de DUP;;;;;PT0H0M0S;Procédures Administratives;
241;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;Nouvel avis de l'Autorité Environnementale;;;;;PT294H0M0S;Procédures Administratives;
242;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si actualisation de l'Etude d'Impact;PPVE art. L.123-19;;;;;PT147H0M0S;Procédures Administratives;
243;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;;;;;;PT441H0M0S;Procédures Administratives;
244;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;Dépôt du dossier de DUP;;;;;PT0H0M0S;Procédures Administratives;
245;Procédures administratives;Procédures administratives;DUP et AE;AE puis DUP désynchronisé avec Etude d'impact;Si pas d'actualisation de l'Étude d'impact;Consultation du public en mairie art. L.323-3;;;;;PT441H0M0S;Procédures Administratives;
246;Procédures administratives;Procédures administratives;DUP et AE;Obtention DUP;;;;;;PT0H0M0S;Procédures Administratives;
247;Procédures administratives;Procédures administratives;DUP et AE;Obtention AE;;;;;;PT0H0M0S;Procédures Administratives;
248;Procédures administratives;Procédures administratives;Conventionnement LS;;;;;;PT1169H0M0S;Procédures Administratives;
249;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Sollicitation de l'entreprise titulaire du marché "études liaisons";;;;;;PT210H0M0S;Procédures Administratives;
250;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Tracé de détail et identification des propriétaires;;;;;PT70H0M0S;Procédures Administratives;
251;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Recensement et identification des propriétaires;;;;;PT0H0M0S;Procédures Administratives;
252;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Recherche via infoter;;;;;PT49H0M0S;Procédures Administratives;
253;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Sollicitations externes (notaires, impôts,…);;;;;PT140H0M0S;Procédures Administratives;
254;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Rencontres physiques;;;;;PT420H0M0S;Procédures Administratives;
255;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Envoi LRAR des conventions pour signature ou déplacement;;;;;PT560H0M0S;Procédures Administratives;
256;Procédures administratives;Procédures administratives;Conventionnement LS;Conventionnement LS - Autorisation d'exercer les servitudes;;;;;PT0H0M0S;Procédures Administratives;
257;Procédures administratives;Procédures administratives;Conventionnement LA;;;;;;PT1540H0M0S;Procédures Administratives;
258;Procédures administratives;Procédures administratives;Conventionnement LA;Conventionnement LA - Visite terrain pour définir l'implantation projetée;;;;;PT700H0M0S;Procédures Administratives;
259;Procédures administratives;Procédures administratives;Conventionnement LA;Conventionnement LA - Obtention des avis favorables;;;;;PT700H0M0S;Procédures Administratives;
260;Procédures administratives;Procédures administratives;Conventionnement LA;Conventionnement LA - Conventionnement;;;;;PT700H0M0S;Procédures Administratives;
261;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;;;;;;PT504H0M0S;Procédures Administratives;
262;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Dépôt de la requête (si désaccord);;;;;;PT0H0M0S;Procédures Administratives;
263;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Prescription enquête et designation commissaire enquêteur;;;;;PT105H0M0S;Procédures Administratives;
264;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Notification de l'arrêté et transmission aux maires;;;;;PT105H0M0S;Procédures Administratives;
265;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Annonce de l'ouverture de l'enquête (affichage);;;;;;PT21H0M0S;Procédures Administratives;
266;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Enquête parcellaire;;;;;PT56H0M0S;Procédures Administratives;
267;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Clôture, signature registre (maires) et transmission au CE;;;;;PT7H0M0S;Procédures Administratives;
268;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Avis CE, procès verbal et transmission au préfet;;;;;PT21H0M0S;Procédures Administratives;
269;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Transmission du préfet vers le pétionnaire;;;;;PT35H0M0S;Procédures Administratives;
270;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Observation RTE et modification possible du projet;;;;;PT49H0M0S;Procédures Administratives;
271;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Etablissement des servitudes et notifications;;;;;PT105H0M0S;Procédures Administratives;
272;Procédures administratives;Procédures administratives;RISQUE - mise en servitude;MeServitude - Arrêté de servitude (a relier au début des travaux concernés par la DUP);;;;;;PT0H0M0S;Procédures Administratives;
273;Procédures administratives;Procédures administratives;APO (Autorisation du Projet d'Ouvrage) (LA uniquement);;;;;;PT665H0M0S;Procédures Administratives;
274;Procédures administratives;Procédures administratives;APO;APO - Disponibilité des études de détail LA;;;;;PT0H0M0S;Procédures Administratives;
275;Procédures administratives;Procédures administratives;APO;APO - Dossier de demande d'APO;;;;;PT280H0M0S;Procédures Administratives;
276;Procédures administratives;Procédures administratives;APO;APO - Envoi du dossier à la DREAL;;;;;PT0H0M0S;Procédures Administratives;
277;Procédures administratives;Procédures administratives;APO;APO - Consultation des maires et gestionnaires de DP;;;;;PT70H0M0S;Procédures Administratives;
278;Procédures administratives;Procédures administratives;APO;APO - Avis des mayorset gestionnaires;;;;;PT140H0M0S;Procédures Administratives;
279;Procédures administratives;Procédures administratives;APO;APO - Réponse RTE aux avis;;;;;PT140H0M0S;Procédures Administratives;
280;Procédures administratives;Procédures administratives;APO;APO - Transmission au préfet;;;;;PT35H0M0S;Procédures Administratives;
281;Procédures administratives;Procédures administratives;APO;APO - Délivrance de l'APO;;;;;PT0H0M0S;Procédures Administratives;
282;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);;;;;;PT630H0M0S;Procédures Administratives;
283;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);CMG - Disponibilité des études de détail LS et Postes;;;;;PT0H0M0S;Procédures Administratives;
284;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);CMG - Dossier de CMG directe par RTE;;;;;PT280H0M0S;Procédures Administratives;
285;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);CMG - CMG des mayorset gestionnaires de DP et services publics;;;;;PT70H0M0S;Procédures Administratives;
286;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);CMG - Avis des mayorset gestionnaires de DP et services publics;;;;;PT140H0M0S;Procédures Administratives;
287;Procédures administratives;Procédures administratives;Consultation des mayorset gestionnaires par RTE (LS et Postes);CMG - Réponse de RTE aux avis;;;;;PT140H0M0S;Procédures Administratives;
288;Procédures administratives;Procédures administratives;PC (Permis de Construire) (Postes);;;;;;PT735H0M0S;Procédures Administratives;
289;Procédures administratives;Procédures administratives;PC (Permis de Construire) (Postes);PC - Disponibilité des études de détail Postes;;;;;PT0H0M0S;Procédures Administratives;
290;Procédures administratives;Procédures administratives;Procédures administratives;PC (Permis de Construire) (Postes);PC - Dossier de demande de PC;;;;;PT280H0M0S;Procédures Administratives;
291;Etudes;Etudes;;;;;;PT4025H0M0S;Etudes;
292;Etudes;Etudes;Etudes préliminaires;;;;;;PT280H0M0S;Etudes;
293;Etudes;Etudes;Etudes préliminaires;Rédaction Note d'Organisation Projet et stratégie achats;;;;;PT280H0M0S;Etudes;Projet
294;Etudes;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;;;;;PT280H0M0S;Etudes;
295;Etudes;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires postes;;;;;PT280H0M0S;Etudes;Poste
296;Etudes;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires BT/telecom;;;;;PT280H0M0S;Etudes;BT
297;Etudes;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires LA;;;;;PT280H0M0S;Etudes;LA
298;Etudes;Etudes;Etudes préliminaires;Etudes sur la consistance de la solution retenue;Etudes préliminaires LS;;;;;PT280H0M0S;Etudes;LS
299;Etudes;Etudes;Etudes détaillées;;;;;;PT3003H0M0S;Etudes;
300;Etudes;Etudes;Etudes détaillées;Etudes Postes;;;;;;PT2765H0M0S;Etudes;`;

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length < 2) continue;

    const isOldFormat = values.length >= 10;

    const item = {
      id: i,
      numero: values[0] || '',
      chapitre: values[1] || '',
      carte: values[2] || '',
      categorie: values[3] || '',
      sousCat1: values[4] || '',
      sousCat2: isOldFormat ? values[5] || '' : '',
      sousCat3: isOldFormat ? values[6] || '' : '',
      temps: parsePTDuration(isOldFormat ? values[7] : values[5]),
      categorieTag: isOldFormat ? values[8] || '' : values[6] || '',
      domaineTag: isOldFormat ? values[9] || '' : values[7] || '',
      systemTag: isOldFormat ? values[10] || '' : values[8] || '',
    };
    items.push(item);
  }
  return items;
}

function buildTree(items) {
  const root = [];
  const chapitreMap = new Map();
  const carteMap = new Map();

  items.forEach(item => {
    if (!item.chapitre) return;

    let chapitre = chapitreMap.get(item.chapitre);
    if (!chapitre) {
      chapitre = {
        id: `chap_${item.chapitre}`,
        type: 'chapitre',
        titre: item.chapitre,
        data: { ...item, carte: '', categorie: '', sousCat1: '', sousCat2: '', sousCat3: '' },
        children: [],
        expanded: true,
      };
      chapitreMap.set(item.chapitre, chapitre);
      root.push(chapitre);
    }

    if (item.carte) {
      let carte = carteMap.get(`${item.chapitre}_${item.carte}`);
      if (!carte) {
        carte = {
          id: `carte_${item.chapitre}_${item.carte}`,
          type: 'carte',
          titre: item.carte,
          data: { ...item, sousCat1: '', sousCat2: '', sousCat3: '' },
          children: [],
          expanded: true,
        };
        carteMap.set(`${item.chapitre}_${item.carte}`, carte);
        chapitre.children.push(carte);
      }

      if (item.categorie || item.sousCat1) {
        const catId = `cat_${item.chapitre}_${item.carte}_${item.categorie || 'nocategory'}_${item.sousCat1 || 'nosouscat'}`;

        let existingCat = null;
        for (const child of carte.children) {
          if (child.id === catId) {
            existingCat = child;
            break;
          }
        }

        if (!existingCat) {
          const cat = {
            id: catId,
            type: 'categorie',
            titre: item.categorie || item.sousCat1 || '(Sans catégorie)',
            data: { ...item },
            children: [],
            expanded: true,
          };
          carte.children.push(cat);

          if (item.sousCat1) {
            cat.children.push({
              id: `${catId}_sc1_${item.sousCat1}`,
              type: 'souscategorie',
              titre: item.sousCat1,
              data: { ...item, sousCat2: '', sousCat3: '' },
              children: [],
              expanded: true,
            });
          }
          if (item.sousCat2) {
            cat.children.push({
              id: `${catId}_sc2_${item.sousCat2}`,
              type: 'souscategorie',
              titre: item.sousCat2,
              data: { ...item, sousCat3: '' },
              children: [],
              expanded: true,
            });
          }
          if (item.sousCat3) {
            cat.children.push({
              id: `${catId}_sc3_${item.sousCat3}`,
              type: 'souscategorie',
              titre: item.sousCat3,
              data: { ...item },
              children: [],
              expanded: true,
            });
          }
        }
      }
    }
  });

  return root;
}

function treeToCSV(nodes) {
  let csv = "N°;Chapitre;Carte;Action;Tâche;Temps;Tags 1;Tags 2;Tag Revue d'activité\n";
  let counter = 1;

  const processNode = (node, chapitre = '', carte = '', categorie = '') => {
    let currentChapitre = chapitre;
    let currentCarte = carte;
    let currentCategorie = categorie;

    if (node.type === 'chapitre') {
      currentChapitre = node.data.chapitre || node.titre;
    } else if (node.type === 'carte') {
      currentCarte = node.data.carte || node.titre;
    } else if (node.type === 'categorie') {
      currentCategorie = node.data.categorie || node.titre;
    }

    if (node.type === 'categorie' || node.type === 'souscategorie') {
      const row = [
        counter++,
        currentChapitre,
        currentCarte,
        currentCategorie,
        node.data.sousCat1 || '',
        formatDuration(node.data.temps || 0),
        node.data.categorieTag || '',
        node.data.domaineTag || '',
        node.data.systemTag || '',
      ];
      csv += row.join(';') + '\n';
    }

    if (node.children) {
      node.children.forEach(child =>
        processNode(child, currentChapitre, currentCarte, currentCategorie)
      );
    }
  };

  nodes.forEach(node => processNode(node));
  return csv;
}

function TreeNode({ node, onEdit, onDelete, onAddChild }) {
  const [isExpanded, setIsExpanded] = useState(node.expanded !== false);
  const [localData, setLocalData] = useState(node.data);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalData(node.data);
    }
  }, [node.data, isEditing]);

  const handleChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    setIsEditing(true);
    onEdit(node.id, updatedData);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const typeConfig = {
    chapitre: { color: 'text-accent font-bold', bg: 'bg-[var(--accent-soft)]', label: 'Chapitre' },
    carte: {
      color: 'text-[var(--accent)] font-semibold',
      bg: 'bg-[var(--normal-soft)]',
      label: 'Carte',
    },
    categorie: {
      color: 'text-[var(--done)] font-medium',
      bg: 'bg-[var(--done-soft)]',
      label: 'Action',
    },
    souscategorie: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Tâche' },
  };

  const config = typeConfig[node.type] || typeConfig.categorie;
  const hasChildren = node.children && node.children.length > 0;
  const canAddChild =
    node.type === 'categorie' || node.type === 'chapitre' || node.type === 'carte';

  return (
    <div className="ml-4">
      <div
        className={`flex items-center gap-2 py-3 px-3 rounded ${config.bg} hover:bg-[var(--bg-card-hover)] transition-colors`}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-[var(--txt-secondary)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--txt-secondary)]" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <span className={`min-w-[100px] text-xs ${config.color}`}>{config.label}</span>

        {node.type === 'chapitre' && (
          <>
            <input
              type="text"
              value={localData.chapitre || ''}
              onChange={e => handleChange('chapitre', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] font-medium cursor-text"
              placeholder="Titre du chapitre"
            />
          </>
        )}

        {node.type === 'carte' && (
          <>
            <input
              type="text"
              value={localData.carte || ''}
              onChange={e => handleChange('carte', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Nom de la carte"
            />
          </>
        )}

        {node.type === 'categorie' && (
          <>
            <input
              type="text"
              value={localData.categorie || ''}
              onChange={e => handleChange('categorie', e.target.value)}
              onBlur={handleBlur}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Action"
            />
            <div className="flex-[2]"></div>
          </>
        )}

        {node.type === 'souscategorie' && (
          <>
            <input
              type="text"
              value={localData.sousCat1 || ''}
              onChange={e => handleChange('sousCat1', e.target.value)}
              onBlur={handleBlur}
              className="flex-[2] px-3 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
              placeholder="Tâche"
            />
            <button
              onClick={() => onAddChild(node)}
              className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded"
              title="Ajouter une sous-tâche"
            >
              <Plus size={16} />
            </button>
          </>
        )}

        <input
          type="number"
          value={localData.temps || 0}
          onChange={e => handleChange('temps', parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          className="w-20 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] text-center cursor-text"
          placeholder="Temps"
        />

        <input
          type="text"
          value={localData.categorieTag || ''}
          onChange={e => handleChange('categorieTag', e.target.value)}
          onBlur={handleBlur}
          className="w-28 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
          placeholder="Tags 1"
        />

        <input
          type="text"
          value={localData.domaineTag || ''}
          onChange={e => handleChange('domaineTag', e.target.value)}
          onBlur={handleBlur}
          className="w-28 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-text"
          placeholder="Tags 2"
        />

        <select
          value={localData.systemTag || ''}
          onChange={e => handleChange('systemTag', e.target.value)}
          onBlur={handleBlur}
          className="w-32 px-2 py-1.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] cursor-pointer"
        >
          <option value="">Tag Revue d'activité...</option>
          {loadTagsData().map(tag => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>

        {canAddChild && (
          <button
            onClick={() => onAddChild(node)}
            className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded"
            title="Ajouter"
          >
            <Plus size={16} />
          </button>
        )}

        <button
          onClick={() => onDelete(node)}
          className="p-1.5 text-[var(--urgent)] hover:bg-[var(--urgent-soft)] rounded"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l-2 border-[var(--border)] ml-3">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id + idx}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryEditor() {
  const [treeData, setTreeData] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [treeKey, setTreeKey] = useState(0);
  const [showXmlImportModal, setShowXmlImportModal] = useState(false);
  const [xmlItems, setXmlItems] = useState([]);
  const [selectedXmlItems, setSelectedXmlItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTreeData(parsed);
      } catch {
        const tree = convertLibraryDataToTree(libraryTemplates);
        setTreeData(tree);
      }
    } else {
      const tree = convertLibraryDataToTree(libraryTemplates);
      setTreeData(tree);
    }
  }, []);

  const handleEdit = useCallback((nodeId, updatedData) => {
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));

      const findAndUpdate = nodes => {
        for (let n of nodes) {
          if (n.id === nodeId) {
            n.data = updatedData;
            n.titre = updatedData.carte || updatedData.chapitre || updatedData.categorie || n.titre;
            return true;
          }
          if (n.children && findAndUpdate(n.children)) return true;
        }
        return false;
      };

      findAndUpdate(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleDelete = useCallback(node => {
    if (!window.confirm(`Supprimer "${node.titre}" ?`)) return;

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));

      const findAndDelete = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === node.id) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children && findAndDelete(nodes[i].children)) return true;
        }
        return false;
      };

      findAndDelete(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleAddChild = useCallback(parentNode => {
    let newNode;

    if (parentNode.type === 'chapitre') {
      newNode = {
        id: `carte_${Date.now()}`,
        type: 'carte',
        titre: 'Nouvelle carte',
        data: {
          ...parentNode.data,
          carte: 'Nouvelle carte',
          categorie: '',
          sousCat1: '',
          sousCat2: '',
          sousCat3: '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'carte') {
      newNode = {
        id: `cat_${Date.now()}`,
        type: 'categorie',
        titre: 'Nouvelle catégorie',
        data: {
          ...parentNode.data,
          categorie: 'Nouvelle catégorie',
          sousCat1: '',
          sousCat2: '',
          sousCat3: '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'categorie') {
      newNode = {
        id: `sc_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle tâche',
        data: {
          ...parentNode.data,
          sousCat1: 'Nouvelle tâche',
          sousCat2: '',
          sousCat3: '',
        },
        children: [],
        expanded: true,
      };
    } else if (parentNode.type === 'souscategorie') {
      newNode = {
        id: `sst_${Date.now()}`,
        type: 'souscategorie',
        titre: 'Nouvelle sous-tâche',
        data: {
          ...parentNode.data,
          sousCat1: 'Nouvelle sous-tâche',
          sousCat2: '',
          sousCat3: '',
        },
        children: [],
        expanded: true,
      };
    }

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));

      const findAndAdd = nodes => {
        for (let n of nodes) {
          if (n.id === parentNode.id) {
            n.children = n.children || [];
            n.children.push(newNode);
            n.expanded = true;
            return true;
          }
          if (n.children && findAndAdd(n.children)) return true;
        }
        return false;
      };

      findAndAdd(newData);
      return newData;
    });
    setHasChanges(true);
  }, []);

  const handleAddRoot = useCallback(() => {
    const newNode = {
      id: `chap_${Date.now()}`,
      type: 'chapitre',
      titre: 'Nouveau chapitre',
      data: {
        numero: '',
        chapitre: 'Nouveau chapitre',
        carte: '',
        categorie: '',
        sousCat1: '',
        sousCat2: '',
        sousCat3: '',
        temps: 0,
        categorieTag: '',
        domaineTag: '',
        systemTag: '',
      },
      children: [],
      expanded: true,
    };

    setTreeData(prev => [...prev, newNode]);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));

    // Convert tree to library items
    const newLibraryItems = convertTreeToLibraryItems(treeData);

    // Try to update main database, or create it if it doesn't exist
    let mainDb = localStorage.getItem('mytrello_db');

    if (mainDb) {
      try {
        const db = JSON.parse(mainDb);
        db.libraryItems = newLibraryItems;
        localStorage.setItem('mytrello_db', JSON.stringify(db));
      } catch (e) {
        console.error('[LibraryEditor] Error updating main database:', e);
      }
    } else {
      // Create new database structure
      const newDb = {
        boards: [],
        columns: [],
        cards: [],
        categories: [],
        subcategories: [],
        libraryItems: newLibraryItems,
        messages: [],
        nextIds: {
          board: 1,
          column: 1,
          card: 1,
          category: 1,
          subcategory: 1,
          libraryItem: newLibraryItems.length + 1,
          message: 1,
        },
        orders: [],
      };
      localStorage.setItem('mytrello_db', JSON.stringify(newDb));
    }

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('library-updated'));

    setHasChanges(false);
    alert('Modifications enregistrées !');
  }, [treeData]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Réinitialiser toutes les modifications ?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const tree = convertLibraryDataToTree(libraryTemplates);
    setTreeData(tree);
    setHasChanges(false);
  }, []);

  const handleXmlFileSelect = useCallback(event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result;
        const items = parseMSProjectXml(content);
        setXmlItems(items);
        setSelectedXmlItems(items.map(i => i.id));
        setShowXmlImportModal(true);
      } catch (error) {
        alert(`Erreur lors du parsing XML: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const toggleXmlItem = useCallback(itemId => {
    setSelectedXmlItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  }, []);

  const selectAllXmlItems = useCallback(() => {
    setSelectedXmlItems(xmlItems.map(i => i.id));
  }, [xmlItems]);

  const deselectAllXmlItems = useCallback(() => {
    setSelectedXmlItems([]);
  }, []);

  const handleConfirmXmlImport = useCallback(() => {
    const selectedItems = xmlItems.filter(i => selectedXmlItems.includes(i.id));
    if (selectedItems.length === 0) {
      alert('Veuillez sélectionner au moins un élément à importer');
      return;
    }

    const roundToHalf = num => Math.round(num * 2) / 2;

    const convertXmlItemsToNodes = items => {
      const rootNodes = [];
      const stack = [];

      items.forEach(item => {
        while (stack.length > 0 && stack[stack.length - 1].outlineLevel >= item.outlineLevel) {
          stack.pop();
        }

        let chapitre = '';
        let carte = '';
        let categorie = '';

        if (item.outlineLevel === 1) {
          chapitre = item.name;
        } else if (item.outlineLevel === 2) {
          const parent = stack.find(p => p.outlineLevel === 1);
          chapitre = parent ? parent.name : '';
          carte = item.name;
        } else if (item.outlineLevel === 3) {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = item.name;
        } else {
          const parentChap = stack.find(p => p.outlineLevel === 1);
          const parentCart = stack.find(p => p.outlineLevel === 2);
          const parentCat = stack.find(p => p.outlineLevel === 3);
          chapitre = parentChap ? parentChap.name : '';
          carte = parentCart ? parentCart.name : '';
          categorie = parentCat ? parentCat.name : '';
        }

        const node = {
          id: crypto.randomUUID(),
          type:
            item.outlineLevel === 1
              ? 'chapitre'
              : item.outlineLevel === 2
                ? 'carte'
                : item.outlineLevel === 3
                  ? 'categorie'
                  : 'souscategorie',
          titre: item.name,
          expanded: true,
          children: [],
          data: {
            chapitre,
            carte,
            categorie,
            sousCat1: item.outlineLevel >= 4 ? item.name : '',
            temps: roundToHalf(item.duration),
            categorieTag: item.outlineLevel === 1 ? '' : chapitre,
            domaineTag: '',
            tagRevue: '',
          },
        };

        if (stack.length === 0) {
          rootNodes.push(node);
        } else {
          const parent = stack[stack.length - 1];
          if (parent.node && parent.node.children !== undefined) {
            parent.node.children.push(node);
          }
        }

        stack.push({ ...item, node });
      });

      return rootNodes;
    };

    const newNodes = convertXmlItemsToNodes(selectedItems);

    const addNodesToTree = (existingNodes, newNodes) => {
      newNodes.forEach(newNode => {
        existingNodes.push(JSON.parse(JSON.stringify(newNode)));
      });
      return existingNodes;
    };

    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      return addNodesToTree(newData, newNodes);
    });

    setHasChanges(true);
    setShowXmlImportModal(false);
    setXmlItems([]);
    setSelectedXmlItems([]);
    alert(`${selectedItems.length} élément(s) importé(s) avec succès`);
  }, [xmlItems, selectedXmlItems]);

  const expandAll = useCallback(() => {
    const expand = nodes => {
      nodes.forEach(n => {
        n.expanded = true;
        if (n.children) expand(n.children);
      });
    };
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      expand(newData);
      return newData;
    });
    setTreeKey(k => k + 1);
  }, []);

  const collapseAll = useCallback(() => {
    const collapse = nodes => {
      nodes.forEach(n => {
        n.expanded = false;
        if (n.children) collapse(n.children);
      });
    };
    setTreeData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      collapse(newData);
      return newData;
    });
    setTreeKey(k => k + 1);
  }, []);

  const handleExport = useCallback(() => {
    const csv = treeToCSV(treeData);

    // Export CSV directly
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [treeData]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout déplier
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout replier
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRoot}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90"
          >
            <Plus size={16} className="mr-1" /> Ajouter Chapitre
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded"
            title="Réinitialiser"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            <Download size={16} className="mr-1" /> Exporter
          </button>
          <label className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)] cursor-pointer">
            <Upload size={16} className="mr-1" /> Importer XML
            <input type="file" accept=".xml" className="hidden" onChange={handleXmlFileSelect} />
          </label>
          <button
            onClick={handleSave}
            className={`flex items-center px-3 py-1.5 text-sm rounded ${hasChanges ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--border)] text-[var(--txt-muted)] cursor-not-allowed'}`}
            disabled={!hasChanges}
          >
            <Save size={16} className="mr-1" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--txt-secondary)] pb-2 border-b border-[var(--border)]">
        <span className="w-[100px]">Type</span>
        <span className="flex-1">Titre</span>
        <span className="flex-[2]">Tâche</span>
        <span className="w-20 text-center">Temps repères</span>
        <span className="w-28">Tags 1</span>
        <span className="w-28">Tags 2</span>
        <span className="w-32">Tag Revue d'activité</span>
        <span className="w-16"></span>
      </div>

      <div
        className="flex-1 overflow-auto"
        key={treeKey}
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {treeData.map((node, idx) => (
          <TreeNode
            key={node.id + idx}
            node={node}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        ))}
      </div>

      {treeData.length === 0 && (
        <div className="text-center py-8 text-[var(--txt-muted)]">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune donnée. Cliquez sur &quot;Ajouter Chapitre&quot; pour commencer.</p>
        </div>
      )}

      {showXmlImportModal && xmlItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-4xl border border-[var(--border)] p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--txt-primary)]">
                Import XML MS Project - Sélection des éléments
              </h3>
              <button
                onClick={() => {
                  setShowXmlImportModal(false);
                  setXmlItems([]);
                  setSelectedXmlItems([]);
                }}
                className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
              >
                <Trash2 size={20} className="text-[var(--txt-muted)]" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--txt-secondary)]">
                {selectedXmlItems.length} / {xmlItems.length} élément(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-card-hover)] sticky top-0">
                  <tr>
                    <th className="w-12 p-2 text-left"></th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Niveau</th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Nom</th>
                    <th className="w-24 p-2 text-right text-[var(--txt-secondary)]">Durée (j)</th>
                  </tr>
                </thead>
                <tbody>
                  {xmlItems.map(item => {
                    const LevelIcon =
                      item.outlineLevel === 1
                        ? Folder
                        : item.outlineLevel === 2
                          ? FileText
                          : item.outlineLevel === 3
                            ? List
                            : CheckSquare;
                    const levelLabel =
                      item.outlineLevel === 1
                        ? 'Chapitre'
                        : item.outlineLevel === 2
                          ? 'Carte'
                          : item.outlineLevel === 3
                            ? 'Catégorie'
                            : 'Tâche';
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] ${
                          selectedXmlItems.includes(item.id) ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedXmlItems.includes(item.id)}
                            onChange={() => toggleXmlItem(item.id)}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <LevelIcon size={16} className="text-[var(--txt-muted)]" />
                            <span style={{ marginLeft: `${(item.outlineLevel - 1) * 16}px` }}>
                              {levelLabel}
                            </span>
                          </div>
                        </td>
                        <td
                          className="p-2 text-[var(--txt-primary)]"
                          style={{ paddingLeft: `${item.outlineLevel * 16 + 8}px` }}
                        >
                          {item.name}
                        </td>
                        <td className="p-2 text-right text-[var(--txt-secondary)]">
                          {item.duration > 0 ? `${item.duration}j` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowXmlImportModal(false);
                  setXmlItems([]);
                  setSelectedXmlItems([]);
                }}
                className="px-4 py-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmXmlImport}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
              >
                Importer la sélection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryEditor;
