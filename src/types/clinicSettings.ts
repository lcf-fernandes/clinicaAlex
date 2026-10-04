import type { Weekday } from "./professional";

export type RoomsPerWeekday = Record<Weekday, number>;

export interface ClinicSettings {
  roomsPerWeekday: RoomsPerWeekday;
}

/**
 * Espelha o que a especificação original diz (seção 2): 8 salas na
 * maioria dos dias, 9 às quartas. É só o valor inicial — editável em
 * Configurações.
 */
export const DEFAULT_ROOMS_PER_WEEKDAY: RoomsPerWeekday = {
  mon: 8,
  tue: 8,
  wed: 9,
  thu: 8,
  fri: 8,
  sat: 0,
  sun: 0,
};
