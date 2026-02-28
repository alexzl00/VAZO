// holidays.ts
import { getEaster } from 'easter-date';

export interface Holiday {
  name: string;
  date: string;
  type: 'static' | 'dynamic';
}

export const staticHolidays = (year: number): Holiday[] => [
  { name: "Nowy Rok", date: `${year}-01-01`, type: 'static' },
  { name: "Święto Trzech Króli", date: `${year}-01-06`, type: 'static' },
  { name: "Święto Pracy", date: `${year}-05-01`, type: 'static' },
  { name: "Święto Narodowe Trzeciego Maja", date: `${year}-05-03`, type: 'static' },
  { name: "Wniebowzięcie Najświętszej Maryi Panny i Święto Wojska Polskiego", date: `${year}-08-15`, type: 'static' },
  { name: "Wszystkich Świętych", date: `${year}-11-01`, type: 'static' },
  { name: "Narodowe Święto Niepodległości", date: `${year}-11-11`, type: 'static' },
  { name: "Wigilia Bożego Narodzenia", date: `${year}-12-24`, type: 'static' },
  { name: "Boże Narodzenie I dzień", date: `${year}-12-25`, type: 'static' },
  { name: "Boże Narodzenie II dzień", date: `${year}-12-26`, type: 'static' },
];

/**
 * Dynamic (Easter-based) holidays
 */
export const dynamicHolidays = (year: number): Holiday[] => {
  const easter = getEaster(year); // JS Date object

  // Easter Sunday
  const easterSunday = easter;
  // Easter Monday
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  // Pentecost / Zielone Świątki (+49 days)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  // Corpus Christi / Boże Ciało (+60 days)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  const holidays: Holiday[] = [
    { name: "Wielkanoc", date: easterSunday.toISOString().split('T')[0], type: 'dynamic' },
    { name: "Poniedziałek Wielkanocny", date: easterMonday.toISOString().split('T')[0], type: 'dynamic' },
    { name: "Zielone Świątki", date: pentecost.toISOString().split('T')[0], type: 'dynamic' },
    { name: "Boże Ciało", date: corpusChristi.toISOString().split('T')[0], type: 'dynamic' },
  ];

  return holidays;
};

export const getPolishHolidays = (year: number): Holiday[] => [
  ...staticHolidays(year),
  ...dynamicHolidays(year),
];