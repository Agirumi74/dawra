import { useState, useCallback, useMemo } from 'react';

export interface FuzzySearchOptions {
  threshold?: number; // Seuil de correspondance (0-1)
  includeScore?: boolean;
  keys?: string[]; // Clés à rechercher dans les objets
  ignoreCase?: boolean;
  ignoreAccents?: boolean;
  wordOrder?: boolean; // Respecter l'ordre des mots
  abbreviations?: boolean; // Support des abréviations
}

export interface FuzzySearchResult<T> {
  item: T;
  score: number;
  matches?: Array<{
    key: string;
    value: string;
    score: number;
  }>;
}

export interface UseFuzzySearchReturn<T> {
  search: (query: string, items: T[]) => FuzzySearchResult<T>[];
  isSearching: boolean;
  lastQuery: string;
}

// Abréviations communes pour les adresses françaises
const COMMON_ABBREVIATIONS: { [key: string]: string[] } = {
  'av': ['avenue'],
  'ave': ['avenue'],
  'bd': ['boulevard'],
  'boul': ['boulevard'],
  'pl': ['place'],
  'r': ['rue'],
  'imp': ['impasse'],
  'all': ['allee', 'allée'],
  'ch': ['chemin'],
  'sq': ['square'],
  'crs': ['cours'],
  'qua': ['quartier'],
  'res': ['residence', 'résidence'],
  'lot': ['lotissement'],
  'rte': ['route'],
  'chem': ['chemin'],
  'pass': ['passage'],
  'gal': ['galerie'],
  'esp': ['esplanade'],
  'prom': ['promenade'],
  'rond': ['rond-point', 'rond point'],
  'cit': ['cite', 'cité'],
  'ham': ['hameau'],
  'lieu': ['lieu-dit', 'lieu dit']
};

export const useFuzzySearch = <T>(options: FuzzySearchOptions = {}): UseFuzzySearchReturn<T> => {
  const {
    threshold = 0.3,
    includeScore = true,
    keys = [],
    ignoreCase = true,
    ignoreAccents = true,
    wordOrder = false,
    abbreviations = true
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Fonction pour normaliser le texte
  const normalizeText = useCallback((text: string): string => {
    let normalized = text;
    
    if (ignoreCase) {
      normalized = normalized.toLowerCase();
    }
    
    if (ignoreAccents) {
      normalized = normalized
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Supprimer les accents
    }
    
    // Nettoyer la ponctuation et les espaces multiples
    normalized = normalized
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return normalized;
  }, [ignoreCase, ignoreAccents]);

  // Fonction pour calculer la distance de Levenshtein
  const levenshteinDistance = useCallback((a: string, b: string): number => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  }, []);

  // Fonction pour vérifier les abréviations
  const isAbbreviationMatch = useCallback((abbrev: string, full: string): boolean => {
    if (!abbreviations) return false;
    
    const abbrevLower = abbrev.toLowerCase();
    const fullLower = full.toLowerCase();
    
    // Vérifier les abréviations communes
    if (COMMON_ABBREVIATIONS[abbrevLower]) {
      return COMMON_ABBREVIATIONS[abbrevLower].includes(fullLower);
    }
    
    // Vérifier si l'abréviation est le début du mot complet
    return fullLower.startsWith(abbrevLower) && abbrev.length >= 2;
  }, [abbreviations]);

  // Fonction pour calculer le score de correspondance entre deux textes
  const calculateTextScore = useCallback((query: string, text: string): number => {
    const normalizedQuery = normalizeText(query);
    const normalizedText = normalizeText(text);
    
    if (normalizedQuery === normalizedText) return 1.0;
    if (normalizedText.includes(normalizedQuery)) return 0.9;
    if (normalizedText.startsWith(normalizedQuery)) return 0.8;
    
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
    const textWords = normalizedText.split(' ').filter(word => word.length > 0);
    
    if (queryWords.length === 0) return 0;
    
    let matchedWords = 0;
    let totalScore = 0;
    let lastMatchIndex = -1;
    
    for (const queryWord of queryWords) {
      let bestMatch = 0;
      let bestMatchIndex = -1;
      
      for (let i = 0; i < textWords.length; i++) {
        const textWord = textWords[i];
        
        // Respecter l'ordre des mots si demandé
        if (wordOrder && i <= lastMatchIndex) continue;
        
        let wordScore = 0;
        
        // Correspondance exacte
        if (textWord === queryWord) {
          wordScore = 1.0;
        }
        // Correspondance au début
        else if (textWord.startsWith(queryWord)) {
          wordScore = 0.9;
        }
        // Correspondance avec abréviation
        else if (isAbbreviationMatch(queryWord, textWord) || isAbbreviationMatch(textWord, queryWord)) {
          wordScore = 0.8;
        }
        // Correspondance partielle
        else if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
          wordScore = 0.7;
        }
        // Distance de Levenshtein
        else {
          const distance = levenshteinDistance(queryWord, textWord);
          const maxLength = Math.max(queryWord.length, textWord.length);
          wordScore = 1 - (distance / maxLength);
        }
        
        if (wordScore > bestMatch && wordScore >= threshold) {
          bestMatch = wordScore;
          bestMatchIndex = i;
        }
      }
      
      if (bestMatch > 0) {
        matchedWords++;
        totalScore += bestMatch;
        lastMatchIndex = bestMatchIndex;
      }
    }
    
    if (matchedWords === 0) return 0;
    
    // Score basé sur la proportion de mots correspondants et leur qualité
    const wordMatchRatio = matchedWords / queryWords.length;
    const avgWordScore = totalScore / matchedWords;
    
    return wordMatchRatio * avgWordScore;
  }, [normalizeText, wordOrder, isAbbreviationMatch, levenshteinDistance, threshold]);

  // Fonction pour extraire la valeur d'une clé dans un objet
  const getValue = useCallback((item: T, key: string): string => {
    const keys = key.split('.');
    let value: any = item;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) return '';
    }
    
    return String(value);
  }, []);

  // Fonction principale de recherche
  const search = useCallback((query: string, items: T[]): FuzzySearchResult<T>[] => {
    setIsSearching(true);
    setLastQuery(query);
    
    if (!query.trim()) {
      setIsSearching(false);
      return [];
    }
    
    const results: FuzzySearchResult<T>[] = [];
    
    for (const item of items) {
      let bestScore = 0;
      const matches: Array<{ key: string; value: string; score: number }> = [];
      
      if (keys.length === 0) {
        // Recherche sur l'objet entier (converti en string)
        const itemText = String(item);
        const score = calculateTextScore(query, itemText);
        
        if (score >= threshold) {
          bestScore = score;
          if (includeScore) {
            matches.push({ key: 'item', value: itemText, score });
          }
        }
      } else {
        // Recherche sur les clés spécifiées
        for (const key of keys) {
          const value = getValue(item, key);
          const score = calculateTextScore(query, value);
          
          if (score >= threshold) {
            bestScore = Math.max(bestScore, score);
            if (includeScore) {
              matches.push({ key, value, score });
            }
          }
        }
      }
      
      if (bestScore >= threshold) {
        const result: FuzzySearchResult<T> = {
          item,
          score: bestScore
        };
        
        if (includeScore && matches.length > 0) {
          result.matches = matches.sort((a, b) => b.score - a.score);
        }
        
        results.push(result);
      }
    }
    
    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);
    
    setIsSearching(false);
    return results;
  }, [keys, threshold, includeScore, calculateTextScore, getValue]);

  return {
    search,
    isSearching,
    lastQuery
  };
};

export default useFuzzySearch;